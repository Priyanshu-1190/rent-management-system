"use client";

import { useEffect, useState } from "react";
import TenantDirectoryModal from "./components/TenantDirectoryModal";
import type { FormEvent, ReactNode } from "react";

type Role = "owner" | "tenant";

type User = {
  id: number;
  email?: string;
  role: Role;
  name?: string;
};

type OwnerDashboard = {
  totals: {
    total_properties: number;
    total_units: number;
    occupied_units: number;
    total_rent: number;
    total_collected: number;
    total_pending: number;
  };
  properties: Array<{
    property_id: number;
    property_name: string;
    total_units: number;
    occupied_units: number;
    total_rent: number;
    total_collected: number;
    total_pending: number;
  }>;
  rent_status: Array<{
    rent_id: number;
    property_name: string;
    unit_name: string;
    tenant_name: string;
    month: number;
    year: number;
    amount: number;
    paid: number;
    pending: number;
    payment_status: string;
    due_in_days: number | null;
    overdue_by_days: number | null;
    payments: Array<{
      payment_id: number;
      amount: number;
      payment_method: string | null;
      payment_date: string;
      transaction_id: string | null;
    }>;
  }>;
};

type TenantDashboard = {
  summary: {
    total_rent: number;
    total_paid: number;
    total_pending: number;
  };
  rent_history: Array<{
    rent_id: number;
    property_name: string;
    unit_name: string;
    month: number;
    year: number;
    amount: number;
    due_date: string | null;
    paid: number;
    pending: number;
    payment_status: string;
    due_in_days: number | null;
    overdue_by_days: number | null;
    payments: Array<{
      payment_id: number;
      amount: number;
      payment_method: string | null;
      payment_date: string;
      transaction_id: string | null;
    }>;
  }>;
};

type Property = {
  id: number;
  name: string;
  address: string | null;
  created_at: string;
};

type Unit = {
  id: number;
  property_id: number;
  name: string;
  rent_amount: number;
  due_day: number;
  late_fee_percentage: number;
  grace_period_days: number;
};

type Invite = {
  id: number;
  unit_id: number;
  unit_name: string;
  rent_amount?: number;
  property_name: string;
  property_address?: string;
  owner_name?: string;
  owner_email?: string;
  tenant_email?: string;
  deposit: number;
  move_in_date: string | null;
  message: string | null;
  status: string;
  created_at: string;
  responded_at: string | null;
};

type AvailableUnit = {
  id: number;
  name: string;
  rent_amount: number;
  property_name: string;
  property_id: number;
};

type UnitDetails = {
  unit_name: string;
  property_name: string;
  rent_amount: number;
  due_day: number;
  late_fee_percentage: number;
  grace_period_days: number;
  tenancy_id: number | null;
  tenant_name: string | null;
  tenant_email: string | null;
  move_in_date: string | null;
  deposit: number;
};

function formatKolkataTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(new Date(timestamp));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatPeriod(month: number, year: number) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function formatDate(value: string | null) {
  if (!value) return "N/A";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

export default function Home() {
  const [apiStatus, setApiStatus] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<Role>("tenant");

  const [user, setUser] = useState<User | null>(null);
  const [ownerDashboard, setOwnerDashboard] = useState<OwnerDashboard | null>(
    null,
  );
  const [tenantDashboard, setTenantDashboard] =
    useState<TenantDashboard | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  // Owner property management state
  const [properties, setProperties] = useState<Property[]>([]);
  const [propName, setPropName] = useState("");
  const [propAddress, setPropAddress] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(
    null,
  );
  const [unitName, setUnitName] = useState("");
  const [unitRent, setUnitRent] = useState("");
  const [unitLateFee, setUnitLateFee] = useState("0");
  const [unitGracePeriod, setUnitGracePeriod] = useState("0");
  const [propertyUnits, setPropertyUnits] = useState<Unit[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [deletingProperty, setDeletingProperty] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editUnitName, setEditUnitName] = useState("");
  const [editUnitRent, setEditUnitRent] = useState("");
  const [editUnitLateFee, setEditUnitLateFee] = useState("0");
  const [editUnitGracePeriod, setEditUnitGracePeriod] = useState("0");
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editPropName, setEditPropName] = useState("");
  const [editPropAddress, setEditPropAddress] = useState("");
  const [viewingUnitDetails, setViewingUnitDetails] =
    useState<UnitDetails | null>(null);

  // Invite state
  const [sentInvites, setSentInvites] = useState<Invite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<Invite[]>([]);
  const [availableUnits, setAvailableUnits] = useState<AvailableUnit[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUnitId, setInviteUnitId] = useState<number | null>(null);
  const [inviteDeposit, setInviteDeposit] = useState("");
  const [inviteMoveIn, setInviteMoveIn] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [showInvitesModal, setShowInvitesModal] = useState(false);
  const [showTenantDirectory, setShowTenantDirectory] = useState(false);

  // Restore session from httpOnly cookie on mount
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then(async (data) => {
        if (data.user) {
          setUser(data.user);
          await loadDashboard(data.user.role);
          if (data.user.role === "owner") {
            await loadProperties();
            await loadSentInvites();
            await loadAvailableUnits();
          }
          if (data.user.role === "tenant") await loadReceivedInvites();
        }
      })
      .catch(() => {});

    fetch("/api/db-test")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Backend request failed");
        return body;
      })
      .then((res) =>
        setApiStatus(`Database online: ${formatKolkataTime(res.data[0].now)}`),
      )
      .catch((err) => {
        console.error(err);
        setApiStatus(
          err.message || "Unable to reach backend database test endpoint.",
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async (role?: Role) => {
    const currentRole = role || user?.role;
    if (!currentRole) {
      setNotice("Login first.");
      return;
    }

    setLoading(true);
    setNotice("");

    try {
      const path =
        currentRole === "owner"
          ? "/api/proxy/dashboard/owner"
          : "/api/proxy/dashboard/tenant";
      const response = await fetch(path);
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "Dashboard request failed");
      }

      if (currentRole === "owner") {
        setOwnerDashboard(body);
        setTenantDashboard(null);
      } else {
        setTenantDashboard(body);
        setOwnerDashboard(null);
      }
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Dashboard request failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setNotice("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "Login failed");
      }

      setUser(body.user);
      await loadDashboard(body.user.role);
      if (body.user.role === "owner") {
        await loadProperties();
        await loadSentInvites();
        await loadAvailableUnits();
      }
      if (body.user.role === "tenant") await loadReceivedInvites();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setNotice("");

    try {
      const regResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole,
        }),
      });
      const regBody = await regResponse.json();

      if (!regResponse.ok) {
        throw new Error(
          regBody.error || regBody.message || "Registration failed",
        );
      }

      // Auto-login after successful registration
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, password: regPassword }),
      });
      const loginBody = await loginResponse.json();

      if (!loginResponse.ok) {
        setNotice("Registered! Please switch to Login to sign in.");
        setAuthMode("login");
        return;
      }

      setUser(loginBody.user);
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setRegRole("tenant");
      await loadDashboard(loginBody.user.role);
      if (loginBody.user.role === "owner") {
        await loadProperties();
        await loadSentInvites();
        await loadAvailableUnits();
      }
      if (loginBody.user.role === "tenant") await loadReceivedInvites();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Owner: load properties ──
  const loadProperties = async () => {
    try {
      const res = await fetch("/api/proxy/properties");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load properties");
      setProperties(body);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Failed to load properties",
      );
    }
  };

  // ── Owner: add property ──
  const handleAddProperty = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch("/api/proxy/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: propName,
          address: propAddress || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to add property");
      setPropName("");
      setPropAddress("");
      await loadProperties();
      await loadDashboard();
      setNotice(`Property "${body.name}" created!`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to add property");
    } finally {
      setLoading(false);
    }
  };

  // ── Owner: edit property ──
  const handleEditProperty = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProperty) return;
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch(`/api/proxy/properties/${editingProperty.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editPropName,
          address: editPropAddress || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to update property");
      setEditingProperty(null);
      await loadProperties();
      await loadDashboard();
      setNotice(`Property "${body.name}" updated!`);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Failed to update property",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Owner: load units for a property ──
  const loadUnits = async (propertyId: number) => {
    try {
      const res = await fetch(`/api/proxy/units/property/${propertyId}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load units");
      setPropertyUnits(body);
    } catch {
      setPropertyUnits([]);
    }
  };

  const handleViewUnitDetails = async (unitId: number) => {
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch(`/api/proxy/units/${unitId}/details`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load unit details");
      setViewingUnitDetails(body);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Failed to load unit details",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Owner: add unit ──
  const handleAddUnit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPropertyId) {
      setNotice("Select a property first");
      return;
    }
    const rent = Number(unitRent);
    const lateFee = Number(unitLateFee);
    const gracePeriod = Number(unitGracePeriod);

    if (
      rent < 0 ||
      lateFee < 0 ||
      lateFee > 100 ||
      gracePeriod < 0 ||
      gracePeriod > 31
    ) {
      setNotice(
        "Please provide valid positive numbers for rent, late fee (0-100%), and grace period (0-31 days).",
      );
      return;
    }

    setLoading(true);
    setNotice("");
    try {
      const res = await fetch(`/api/proxy/units/${selectedPropertyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: unitName,
          rent_amount: rent,
          late_fee_percentage: lateFee,
          grace_period_days: gracePeriod,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to add unit");
      setUnitName("");
      setUnitRent("");
      setUnitLateFee("0");
      setUnitGracePeriod("0");
      await loadUnits(selectedPropertyId);
      await loadDashboard();
      setNotice(
        `Unit "${body.name}" added with rent ${formatMoney(body.rent_amount)}`,
      );
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to add unit");
    } finally {
      setLoading(false);
    }
  };

  // ── Owner: edit unit ──
  const handleEditUnit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUnit) return;
    const rent = Number(editUnitRent);
    const lateFee = Number(editUnitLateFee);
    const gracePeriod = Number(editUnitGracePeriod);

    if (
      rent < 0 ||
      lateFee < 0 ||
      lateFee > 100 ||
      gracePeriod < 0 ||
      gracePeriod > 31
    ) {
      setNotice(
        "Please provide valid positive numbers for rent, late fee (0-100%), and grace period (0-31 days).",
      );
      return;
    }

    setLoading(true);
    setNotice("");
    try {
      const res = await fetch(`/api/proxy/units/${editingUnit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editUnitName,
          rent_amount: rent,
          due_day: editingUnit.due_day,
          late_fee_percentage: lateFee,
          grace_period_days: gracePeriod,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to update unit");
      setEditingUnit(null);
      setEditUnitLateFee("0");
      setEditUnitGracePeriod("0");
      if (selectedPropertyId) await loadUnits(selectedPropertyId);
      await loadDashboard();
      setNotice(`Unit "${body.name}" updated!`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to update unit");
    } finally {
      setLoading(false);
    }
  };

  // ── Owner: delete property ──
  const handleDeleteProperty = async () => {
    if (!deletingProperty) return;
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch(`/api/proxy/properties/${deletingProperty.id}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to delete property");
      if (selectedPropertyId === deletingProperty.id)
        setSelectedPropertyId(null);
      await loadProperties();
      await loadDashboard();
      setNotice(`Property "${deletingProperty.name}" deleted.`);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Failed to delete property",
      );
    } finally {
      setLoading(false);
      setDeletingProperty(null);
    }
  };

  // ── Owner: delete unit ──
  const handleDeleteUnit = async () => {
    if (!deletingUnit) return;
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch(`/api/proxy/units/${deletingUnit.id}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to delete unit");
      setPropertyUnits((prev) => prev.filter((u) => u.id !== deletingUnit.id));
      await loadDashboard();
      setNotice(`Unit "${deletingUnit.name}" deleted.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to delete unit");
    } finally {
      setLoading(false);
      setDeletingUnit(null);
    }
  };

  const downloadReceipt = async (paymentId: number) => {
    setNotice("");

    try {
      const response = await fetch(`/api/proxy/receipts/${paymentId}`);

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Receipt download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `receipt-${paymentId}.pdf`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Receipt download failed");
    }
  };

  // ── Invite functions ──
  const loadSentInvites = async () => {
    try {
      const res = await fetch("/api/proxy/invites/sent");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load sent invites");
      setSentInvites(body);
    } catch {
      setSentInvites([]);
    }
  };

  const loadReceivedInvites = async () => {
    try {
      const res = await fetch("/api/proxy/invites/received");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load invites");
      setReceivedInvites(body);
    } catch {
      setReceivedInvites([]);
    }
  };

  const loadAvailableUnits = async () => {
    try {
      const res = await fetch("/api/proxy/invites/available-units");
      const body = await res.json();
      if (!res.ok)
        throw new Error(body.error || "Failed to load available units");
      setAvailableUnits(body);
    } catch {
      setAvailableUnits([]);
    }
  };

  // Restore session from httpOnly cookie on mount.
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then(async (data) => {
        if (data.user) {
          setUser(data.user);
          await loadDashboard(data.user.role);
          if (data.user.role === "owner") {
            await loadProperties();
            await loadSentInvites();
            await loadAvailableUnits();
          }
          if (data.user.role === "tenant") await loadReceivedInvites();
        }
      })
      .catch(() => {});

    fetch("/api/db-test")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Backend request failed");
        return body;
      })
      .then((res) =>
        setApiStatus(`Database online: ${formatKolkataTime(res.data[0].now)}`),
      )
      .catch((err) => {
        console.error(err);
        setApiStatus(
          err.message || "Unable to reach backend database test endpoint.",
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inviteUnitId) {
      setNotice("Select a unit");
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch("/api/proxy/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_email: inviteEmail,
          unit_id: inviteUnitId,
          deposit: inviteDeposit ? Number(inviteDeposit) : 0,
          move_in_date: inviteMoveIn || null,
          message: inviteMessage || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to send invite");
      setInviteEmail("");
      setInviteUnitId(null);
      setInviteDeposit("");
      setInviteMoveIn("");
      setInviteMessage("");
      await loadSentInvites();
      await loadAvailableUnits();
      setNotice("Invite sent successfully!");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (inviteId: number) => {
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch(`/api/proxy/invites/${inviteId}/accept`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to accept invite");
      await loadReceivedInvites();
      await loadDashboard();
      setNotice("Invite accepted! You are now a tenant.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to accept invite");
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineInvite = async (inviteId: number) => {
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch(`/api/proxy/invites/${inviteId}/decline`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to decline invite");
      await loadReceivedInvites();
      setNotice("Invite declined.");
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Failed to decline invite",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvite = async (inviteId: number) => {
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch(`/api/proxy/invites/${inviteId}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to cancel invite");
      await loadSentInvites();
      await loadAvailableUnits();
      setNotice("Invite cancelled.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to cancel invite");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch("/api/auth/session", { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to delete account");
      setUser(null);
      setOwnerDashboard(null);
      setTenantDashboard(null);
      setProperties([]);
      setPropertyUnits([]);
      setShowDeleteConfirm(false);
      setNotice("Account deleted successfully.");
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Failed to delete account",
      );
    } finally {
      setLoading(false);
    }
  };

  const authPanel = (
    <div
      id="access"
      className="scroll-mt-24 rounded-lg border border-[#d8ded2] bg-white p-5 shadow-sm"
    >
      <div className="flex gap-1 rounded-md bg-[#eef0eb] p-1">
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
            authMode === "login"
              ? "bg-white text-[#1b1f1d] shadow-sm"
              : "text-[#60715f] hover:text-[#435146]"
          }`}
          onClick={() => {
            setAuthMode("login");
            setNotice("");
          }}
        >
          Login
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
            authMode === "register"
              ? "bg-white text-[#1b1f1d] shadow-sm"
              : "text-[#60715f] hover:text-[#435146]"
          }`}
          onClick={() => {
            setAuthMode("register");
            setNotice("");
          }}
        >
          Register
        </button>
      </div>

      {authMode === "login" ? (
        <form onSubmit={handleLogin} className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm font-medium text-[#435146]">
            Email
            <input
              className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[#435146]">
            Password
            <input
              className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button
            className="rounded-md bg-[#2f6f5e] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98aaa1]"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm font-medium text-[#435146]">
            Name
            <input
              className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
              type="text"
              value={regName}
              onChange={(event) => setRegName(event.target.value)}
              required
              minLength={2}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[#435146]">
            Email
            <input
              className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
              type="email"
              value={regEmail}
              onChange={(event) => setRegEmail(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[#435146]">
            Password
            <input
              className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
              type="password"
              value={regPassword}
              onChange={(event) => setRegPassword(event.target.value)}
              required
              minLength={6}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[#435146]">
            Role
            <select
              className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
              value={regRole}
              onChange={(event) => setRegRole(event.target.value as Role)}
            >
              <option value="tenant">Tenant</option>
              <option value="owner">Owner</option>
            </select>
          </label>
          <button
            className="rounded-md bg-[#2f6f5e] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98aaa1]"
            type="submit"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      )}
    </div>
  );

  if (!user) {
    return (
      <main className="min-h-screen w-full bg-[#f7f8f3] text-[#1b1f1d]">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#10231f]/95 text-white shadow-sm backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <a href="#" className="text-lg font-semibold tracking-normal">
              Rent Khata
            </a>
            <nav
              className="flex items-center gap-1 sm:gap-2"
              aria-label="Landing page"
            >
              <a
                className="rounded-md px-3 py-2 text-sm font-semibold text-white/82 transition-colors hover:bg-white/10 hover:text-white"
                href="#features"
              >
                Features
              </a>
              <a
                className="rounded-md px-3 py-2 text-sm font-semibold text-white/82 transition-colors hover:bg-white/10 hover:text-white"
                href="#access"
                onClick={() => setAuthMode("login")}
              >
                Login
              </a>
              <p className="text-white/100 text-2xl font-semibold">|</p>
              <a
                className="rounded-md bg-[#f5b84b] px-3 py-2 text-sm font-semibold text-[#17211e] transition-colors hover:bg-[#ffd074]"
                href="#access"
                onClick={() => setAuthMode("register")}
              >
                Create account
              </a>
            </nav>
          </div>
        </header>

        <section
          className="relative min-h-[92vh] overflow-hidden bg-[#10231f] text-white"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(16,35,31,0.96) 0%, rgba(16,35,31,0.88) 42%, rgba(16,35,31,0.34) 100%), url('/dashboard-mockup.png')",
            backgroundPosition: "center right",
            backgroundSize: "cover",
          }}
        >
          <div className="mx-auto flex min-h-[92vh] max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex flex-1 items-center py-12">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9ee0c0]">
                  Rent Khata
                </p>
                <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl">
                  Rent, tenants, receipts, and dues in one calm workspace.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82">
                  A focused rental management system for owners and tenants,
                  built around property records, rent schedules, payment
                  history, and receipt downloads.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    className="inline-flex justify-center rounded-md bg-[#f5b84b] px-5 py-3 text-sm font-semibold text-[#17211e] transition-colors hover:bg-[#ffd074]"
                    href="#access"
                    onClick={() => setAuthMode("register")}
                  >
                    Start managing
                  </a>
                  <a
                    className="inline-flex justify-center rounded-md border border-white/35 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    href="#features"
                  >
                    View features
                  </a>
                </div>
              </div>
            </div>

            <div className="grid gap-3 pb-5 sm:grid-cols-3">
              {[
                [
                  "Owner dashboard",
                  "Track units, occupancy, collections, and pending rent.",
                ],
                [
                  "Tenant dashboard",
                  "View rent status, payment history, and receipts.",
                ],
                [
                  "Secure access",
                  "Keep owner and tenant views scoped to the right records.",
                ],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-lg border border-white/16 bg-white/10 p-4 backdrop-blur"
                >
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/72">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="features"
          className="scroll-mt-20 border-b border-[#d8ded2] bg-white"
        >
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
            {[
              [
                "Property operations",
                "Create properties and units, assign tenants, and keep rental details clean.",
              ],
              [
                "Financial clarity",
                "Separate rent obligations from payment transactions so pending dues stay accurate.",
              ],
              [
                "Receipt ready",
                "Generate PDF receipts from real payment records when either side needs proof.",
              ],
            ].map(([title, body]) => (
              <article
                key={title}
                className="rounded-lg border border-[#d8ded2] bg-[#f7f8f3] p-5"
              >
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#60715f]">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#eef0eb]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2f6f5e]">
                Access
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-[#1b1f1d] sm:text-4xl">
                Login or create the right account for your role.
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-[#60715f]">
                Owners get property and rent controls. Tenants get a focused
                view of dues, payments, invitations, and receipts.
              </p>
              {apiStatus ? (
                <p className="mt-5 text-sm text-[#60715f]">{apiStatus}</p>
              ) : null}
              {notice ? (
                <div className="mt-5 rounded-md border border-[#e0b15c] bg-[#fff9eb] px-4 py-3 text-sm text-[#6b4c18]">
                  {notice}
                </div>
              ) : null}
            </div>
            {authPanel}
          </div>
        </section>

        <footer className="border-t border-[#d8ded2] bg-[#10231f] text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
            <div>
              <p className="text-lg font-semibold">Rent Management</p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/68">
                A rental operations workspace for properties, tenants, rent
                schedules, payments, and receipts.
              </p>
            </div>
            <nav
              className="flex flex-wrap items-start gap-2 md:justify-end"
              aria-label="Footer"
            >
              <a
                className="rounded-md px-3 py-2 text-sm font-semibold text-white/72 transition-colors hover:bg-white/10 hover:text-white"
                href="#"
              >
                Home
              </a>
              <a
                className="rounded-md px-3 py-2 text-sm font-semibold text-white/72 transition-colors hover:bg-white/10 hover:text-white"
                href="#features"
              >
                Features
              </a>
              <a
                className="rounded-md px-3 py-2 text-sm font-semibold text-white/72 transition-colors hover:bg-white/10 hover:text-white"
                href="#access"
                onClick={() => setAuthMode("login")}
              >
                Login
              </a>
            </nav>
          </div>
        </footer>
      </main>
    );
  }
  //Header Section
  return (
    <main className="min-h-screen w-full bg-[#f7f8f3] text-[#1b1f1d]">
      <header className="border-b border-[#d8ded2] bg-[#f7f8f3]/25 backdrop-blur(16)">
        <div className="mx-auto flex w-full max-w-7xl items-start justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#60715f]">
              Rent Management
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Dashboard</h1>
            {apiStatus ? (
              <p className="mt-1 text-sm text-[#60715f]">{apiStatus}</p>
            ) : null}
            {user ? (
              <p className="text-sm text-[#60715f]">
                Signed in as {user.role} #{user.id}
              </p>
            ) : null}
          </div>
          {user ? (
            <div className="relative">
              <button
                type="button"
                className="rounded-md p-2 text-[#60715f] transition-colors hover:bg-[#eef0eb] hover:text-[#1b1f1d]"
                onClick={() => setShowMenu((v) => !v)}
                aria-label="Menu"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <circle cx="10" cy="4" r="1.5" />
                  <circle cx="10" cy="10" r="1.5" />
                  <circle cx="10" cy="16" r="1.5" />
                </svg>
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                      setShowMenu(false);
                      setShowAccountDetails(false);
                    }}
                  />
                  <div className="absolute right-0 z-50 mt-1 w-56 rounded-lg border border-[#d8ded2] bg-white py-1 shadow-lg">
                    <div className="border-b border-[#e3e8df] px-4 py-2">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-md px-0 py-1 text-left transition-colors hover:text-[#1b1f1d]"
                        onClick={() => setShowAccountDetails((value) => !value)}
                        aria-expanded={showAccountDetails}
                        aria-controls="account-details"
                      >
                        <span className="text-sm font-semibold text-[#1b1f1d]">
                          Account
                        </span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`text-[#60715f] transition-transform ${
                            showAccountDetails ? "rotate-180" : ""
                          }`}
                        >
                          <path d="M5 8l5 5 5-5" />
                        </svg>
                      </button>
                      <div
                        className={`grid transition-[grid-template-rows,opacity,margin-top] duration-300 ease-in-out ${
                          showAccountDetails
                            ? "mt-2 grid-rows-[1fr] opacity-100"
                            : "mt-0 grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <div
                            id="account-details"
                            className="space-y-2 rounded-md bg-[#f7f8f3] p-2.5"
                          >
                            <p className="truncate text-sm font-semibold text-[#1b1f1d]">
                              {user.name || "User"}
                            </p>
                            <p className="truncate text-xs text-[#60715f]">
                              {user.email || "No email"}
                            </p>
                            <button
                              type="button"
                              className="flex w-full justify-center rounded-md border border-[#c44d4d] px-2 py-1.5 text-xs font-medium text-[#c44d4d] transition-colors hover:bg-[#fde8e8]"
                              onClick={() => {
                                setShowDeleteConfirm(true);
                                setShowMenu(false);
                                setShowAccountDetails(false);
                              }}
                            >
                              Delete Account
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {user?.role === "owner" && (
                      <button
                        type="button"
                        className="flex w-full px-4 py-2 text-sm font-medium text-[#435146] text-left transition-colors hover:bg-[#eef0eb]"
                        onClick={() => {
                          setShowTenantDirectory(true);
                          setShowMenu(false);
                        }}
                      >
                        Tenant Directory
                      </button>
                    )}
                    {user?.role && (
                      <button
                        type="button"
                        className="flex w-full px-4 py-2 text-sm font-medium text-[#435146] text-left transition-colors hover:bg-[#eef0eb]"
                        onClick={() => {
                          setShowInvitesModal(true);
                          setShowMenu(false);
                        }}
                      >
                        Invites
                      </button>
                    )}
                    <button
                      type="button"
                      className="flex w-full px-4 py-2 text-sm font-medium text-[#435146] transition-colors hover:bg-[#eef0eb]"
                      onClick={async () => {
                        await fetch("/api/auth/logout", { method: "POST" });
                        setUser(null);
                        setOwnerDashboard(null);
                        setTenantDashboard(null);
                        setProperties([]);
                        setPropertyUnits([]);
                        setShowAccountDetails(false);
                        setShowMenu(false);
                      }}
                    >
                      Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {notice && (
          <div className="rounded-md border border-[#e0b15c] bg-[#fff9eb] px-4 py-3 text-sm text-[#6b4c18] flex items-center justify-between">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              className="ml-4 text-[#6b4c18] hover:text-[#435146]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="2" y1="2" x2="12" y2="12" />
                <line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
          {!user && (
            <div className="rounded-lg border border-[#d8ded2] bg-white p-4 shadow-sm">
              <div className="flex gap-1 rounded-md bg-[#eef0eb] p-1">
                <button
                  type="button"
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                    authMode === "login"
                      ? "bg-white text-[#1b1f1d] shadow-sm"
                      : "text-[#60715f] hover:text-[#435146]"
                  }`}
                  onClick={() => {
                    setAuthMode("login");
                    setNotice("");
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                    authMode === "register"
                      ? "bg-white text-[#1b1f1d] shadow-sm"
                      : "text-[#60715f] hover:text-[#435146]"
                  }`}
                  onClick={() => {
                    setAuthMode("register");
                    setNotice("");
                  }}
                >
                  Register
                </button>
              </div>

              {authMode === "login" ? (
                <form onSubmit={handleLogin} className="mt-4 grid gap-3">
                  <label className="grid gap-1 text-sm font-medium text-[#435146]">
                    Email
                    <input
                      className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-[#435146]">
                    Password
                    <input
                      className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>
                  <button
                    className="rounded-md bg-[#2f6f5e] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98aaa1]"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="mt-4 grid gap-3">
                  <label className="grid gap-1 text-sm font-medium text-[#435146]">
                    Name
                    <input
                      className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                      type="text"
                      value={regName}
                      onChange={(event) => setRegName(event.target.value)}
                      required
                      minLength={2}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-[#435146]">
                    Email
                    <input
                      className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                      type="email"
                      value={regEmail}
                      onChange={(event) => setRegEmail(event.target.value)}
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-[#435146]">
                    Password
                    <input
                      className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                      type="password"
                      value={regPassword}
                      onChange={(event) => setRegPassword(event.target.value)}
                      required
                      minLength={6}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-[#435146]">
                    Role
                    <select
                      className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                      value={regRole}
                      onChange={(event) =>
                        setRegRole(event.target.value as Role)
                      }
                    >
                      <option value="tenant">Tenant</option>
                      <option value="owner">Owner</option>
                    </select>
                  </label>
                  <button
                    className="rounded-md bg-[#2f6f5e] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98aaa1]"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Registering..." : "Register"}
                  </button>
                </form>
              )}
            </div>
          )}
        </section>

        {user?.role === "owner" ? (
          <section className="grid gap-4 lg:grid-cols-2">
            {/* Add Property Card */}
            <div className="rounded-lg border border-[#d8ded2] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Add Property</h2>
              <form onSubmit={handleAddProperty} className="mt-3 grid gap-3">
                <label className="grid gap-1 text-sm font-medium text-[#435146]">
                  Property Name
                  <input
                    className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                    type="text"
                    value={propName}
                    onChange={(e) => setPropName(e.target.value)}
                    required
                    minLength={2}
                    placeholder="e.g. Sunrise Apartments"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-[#435146]">
                  Address{" "}
                  <span className="font-normal text-[#8a9a88]">(optional)</span>
                  <input
                    className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                    type="text"
                    value={propAddress}
                    onChange={(e) => setPropAddress(e.target.value)}
                    placeholder="e.g. 42 MG Road, Kolkata"
                  />
                </label>
                <button
                  className="rounded-md bg-[#2f6f5e] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98aaa1]"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Property"}
                </button>
              </form>

              {properties.length > 0 && (
                <div className="mt-4 border-t border-[#e3e8df] pt-3">
                  <p className="text-sm font-semibold text-[#435146]">
                    Your Properties
                  </p>
                  <ul className="mt-2 grid gap-1">
                    {properties.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between rounded-md border border-[#e3e8df] px-3 py-2 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-medium">{p.name}</span>
                          {p.address && (
                            <span className="ml-2 text-[#60715f]">
                              {p.address}
                            </span>
                          )}
                        </div>
                        <div className="ml-2 flex items-center gap-1">
                          <button
                            type="button"
                            className="flex-shrink-0 rounded p-1 text-[#2f6f5e] transition-colors hover:bg-[#eef0eb]"
                            onClick={() => {
                              setEditingProperty(p);
                              setEditPropName(p.name);
                              setEditPropAddress(p.address || "");
                            }}
                            title={`Edit ${p.name}`}
                            disabled={loading}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="flex-shrink-0 rounded p-1 text-[#c44d4d] transition-colors hover:bg-[#fde8e8]"
                            onClick={() =>
                              setDeletingProperty({ id: p.id, name: p.name })
                            }
                            title={`Delete ${p.name}`}
                            disabled={loading}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            >
                              <line x1="2" y1="2" x2="12" y2="12" />
                              <line x1="12" y1="2" x2="2" y2="12" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Add Unit Card */}
            <div className="rounded-lg border border-[#d8ded2] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Add Unit</h2>
              {properties.length === 0 ? (
                <p className="mt-3 text-sm text-[#60715f]">
                  Add a property first to create units.
                </p>
              ) : (
                <form onSubmit={handleAddUnit} className="mt-3 grid gap-3">
                  <label className="grid gap-1 text-sm font-medium text-[#435146]">
                    Property
                    <select
                      className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                      value={selectedPropertyId ?? ""}
                      onChange={(e) => {
                        const id = Number(e.target.value) || null;
                        setSelectedPropertyId(id);
                        if (id) loadUnits(id);
                        else setPropertyUnits([]);
                      }}
                      required
                    >
                      <option value="">Select property…</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-[#435146]">
                    Unit Name
                    <input
                      className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                      type="text"
                      value={unitName}
                      onChange={(e) => setUnitName(e.target.value)}
                      required
                      placeholder="e.g. Flat 101"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-[#435146]">
                    Monthly Rent (₹)
                    <input
                      className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                      type="number"
                      min="1"
                      step="1"
                      value={unitRent}
                      onChange={(e) => setUnitRent(e.target.value)}
                      required
                      placeholder="e.g. 12000"
                    />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="grid gap-1 text-sm font-medium text-[#435146]">
                      Late Fee (%)
                      <input
                        className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={unitLateFee}
                        onChange={(e) => setUnitLateFee(e.target.value)}
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-[#435146]">
                      Grace Period (Days)
                      <input
                        className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                        type="number"
                        min="0"
                        max="31"
                        step="1"
                        value={unitGracePeriod}
                        onChange={(e) => setUnitGracePeriod(e.target.value)}
                      />
                    </label>
                  </div>
                  <button
                    className="rounded-md bg-[#2f6f5e] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98aaa1]"
                    type="submit"
                    disabled={loading || !selectedPropertyId}
                  >
                    {loading ? "Adding..." : "Add Unit"}
                  </button>
                </form>
              )}

              {propertyUnits.length > 0 && (
                <div className="mt-4 border-t border-[#e3e8df] pt-3">
                  <p className="text-sm font-semibold text-[#435146]">Units</p>
                  <ul className="mt-2 grid gap-1">
                    {propertyUnits.map((u) => (
                      <li
                        key={u.id}
                        className="flex items-center justify-between rounded-md border border-[#e3e8df] px-3 py-2 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-medium">{u.name}</span>
                          <span className="ml-2 text-[#2f6f5e] font-semibold">
                            {formatMoney(u.rent_amount)}/mo
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="flex-shrink-0 rounded p-1 text-[#2f6f5e] transition-colors hover:bg-[#eef0eb]"
                            onClick={() => handleViewUnitDetails(u.id)}
                            title={`View details of ${u.name}`}
                            disabled={loading}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="flex-shrink-0 rounded p-1 text-[#2f6f5e] transition-colors hover:bg-[#eef0eb]"
                            onClick={() => {
                              setEditingUnit(u);
                              setEditUnitName(u.name);
                              setEditUnitRent(u.rent_amount.toString());
                              setEditUnitLateFee(
                                u.late_fee_percentage.toString(),
                              );
                              setEditUnitGracePeriod(
                                u.grace_period_days.toString(),
                              );
                            }}
                            title={`Edit ${u.name}`}
                            disabled={loading}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="flex-shrink-0 rounded p-1 text-[#c44d4d] transition-colors hover:bg-[#fde8e8]"
                            onClick={() =>
                              setDeletingUnit({ id: u.id, name: u.name })
                            }
                            title={`Delete ${u.name}`}
                            disabled={loading}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            >
                              <line x1="2" y1="2" x2="12" y2="12" />
                              <line x1="12" y1="2" x2="2" y2="12" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* ── Owner: Send Invite ── */}
        {user?.role === "owner" && showInvitesModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-[#f7f8f3] p-6 shadow-xl border border-[#d8ded2]">
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  className="rounded-md p-2 -mr-2 -mt-2 text-[#60715f] transition-colors hover:bg-[#eef0eb] hover:text-[#1b1f1d]"
                  onClick={() => setShowInvitesModal(false)}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <section id="invites" className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-[#d8ded2] bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold">
                    Send Invite to Tenant
                  </h2>
                  {availableUnits.length === 0 ? (
                    <p className="mt-3 text-sm text-[#60715f]">
                      No available units. Add units first or wait for existing
                      invites to be resolved.
                    </p>
                  ) : (
                    <form
                      onSubmit={handleSendInvite}
                      className="mt-3 grid gap-3"
                    >
                      <label className="grid gap-1 text-sm font-medium text-[#435146]">
                        Tenant Email
                        <input
                          className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          required
                          placeholder="tenant@example.com"
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium text-[#435146]">
                        Unit
                        <select
                          className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                          value={inviteUnitId ?? ""}
                          onChange={(e) =>
                            setInviteUnitId(Number(e.target.value) || null)
                          }
                          required
                        >
                          <option value="">Select unit…</option>
                          {availableUnits.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.property_name} — {u.name} (
                              {formatMoney(u.rent_amount)}/mo)
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm font-medium text-[#435146]">
                        Deposit (₹){" "}
                        <span className="font-normal text-[#8a9a88]">
                          (optional)
                        </span>
                        <input
                          className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                          type="number"
                          min="0"
                          step="1"
                          value={inviteDeposit}
                          onChange={(e) => setInviteDeposit(e.target.value)}
                          placeholder="e.g. 25000"
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium text-[#435146]">
                        Move-in Date{" "}
                        <span className="font-normal text-[#8a9a88]">
                          (optional)
                        </span>
                        <input
                          className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                          type="date"
                          value={inviteMoveIn}
                          onChange={(e) => setInviteMoveIn(e.target.value)}
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium text-[#435146]">
                        Message{" "}
                        <span className="font-normal text-[#8a9a88]">
                          (optional)
                        </span>
                        <textarea
                          className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65] resize-none"
                          rows={2}
                          value={inviteMessage}
                          onChange={(e) => setInviteMessage(e.target.value)}
                          placeholder="Welcome message…"
                        />
                      </label>
                      <button
                        className="rounded-md bg-[#2f6f5e] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98aaa1]"
                        type="submit"
                        disabled={loading || !inviteUnitId}
                      >
                        {loading ? "Sending..." : "Send Invite"}
                      </button>
                    </form>
                  )}
                </div>

                {/* Sent Invites List */}
                <div className="rounded-lg border border-[#d8ded2] bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold">Sent Invites</h2>
                  {sentInvites.length === 0 ? (
                    <p className="mt-3 text-sm text-[#60715f]">
                      No invites sent yet.
                    </p>
                  ) : (
                    <ul className="mt-3 grid gap-2">
                      {sentInvites.map((inv) => (
                        <li
                          key={inv.id}
                          className="rounded-md border border-[#e3e8df] p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">
                                {inv.tenant_email}
                              </p>
                              <p className="text-xs text-[#60715f]">
                                {inv.property_name} — {inv.unit_name}
                              </p>
                              {inv.move_in_date && (
                                <p className="text-xs text-[#60715f]">
                                  Move-in: {formatDate(inv.move_in_date)}
                                </p>
                              )}
                              {inv.deposit > 0 && (
                                <p className="text-xs text-[#60715f]">
                                  Deposit: {formatMoney(inv.deposit)}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <InviteStatusLabel status={inv.status} />
                              {inv.status === "pending" && (
                                <button
                                  type="button"
                                  className="rounded p-1 text-[#c44d4d] transition-colors hover:bg-[#fde8e8]"
                                  onClick={() => handleCancelInvite(inv.id)}
                                  disabled={loading}
                                  title="Cancel invite"
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                  >
                                    <line x1="2" y1="2" x2="12" y2="12" />
                                    <line x1="12" y1="2" x2="2" y2="12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          </div>
        ) : null}

        {ownerDashboard ? (
          <section className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Total Rent"
                value={formatMoney(ownerDashboard.totals.total_rent)}
              />
              <Metric
                label="Collected"
                value={formatMoney(ownerDashboard.totals.total_collected)}
              />
              <Metric
                label="Pending"
                value={formatMoney(ownerDashboard.totals.total_pending)}
                tone="warn"
              />
              <Metric
                label="Occupancy"
                value={`${ownerDashboard.totals.occupied_units}/${ownerDashboard.totals.total_units}`}
              />
            </div>

            <DataTable title="Property Overview">
              <thead>
                <tr>
                  <Th>Property</Th>
                  <Th>Units</Th>
                  <Th>Occupied</Th>
                  <Th>Total Rent</Th>
                  <Th>Collected</Th>
                  <Th>Pending</Th>
                </tr>
              </thead>
              <tbody>
                {ownerDashboard.properties.length > 0 ? (
                  ownerDashboard.properties.map((property) => (
                    <tr
                      key={property.property_id}
                      className="border-t border-[#e3e8df]"
                    >
                      <Td>{property.property_name}</Td>
                      <Td>{property.total_units}</Td>
                      <Td>{property.occupied_units}</Td>
                      <Td>{formatMoney(property.total_rent)}</Td>
                      <Td>{formatMoney(property.total_collected)}</Td>
                      <Td>{formatMoney(property.total_pending)}</Td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-[#e3e8df]">
                    <td
                      colSpan={6}
                      className="py-4 text-center text-sm text-[#60715f]"
                    >
                      No properties overview information available.
                    </td>
                  </tr>
                )}
              </tbody>
            </DataTable>

            <DataTable title="Payment Status">
              <thead>
                <tr>
                  <Th>Tenant</Th>
                  <Th>Property</Th>
                  <Th>Unit</Th>
                  <Th>Period</Th>
                  <Th>Rent</Th>
                  <Th>Paid</Th>
                  <Th>Pending</Th>
                  <Th>Status</Th>
                  <Th>Receipts</Th>
                </tr>
              </thead>
              <tbody>
                {ownerDashboard.rent_status.length > 0 ? (
                  ownerDashboard.rent_status.map((rent) => (
                    <tr
                      key={rent.rent_id}
                      className="border-t border-[#e3e8df]"
                    >
                      <Td>{rent.tenant_name}</Td>
                      <Td>{rent.property_name}</Td>
                      <Td>{rent.unit_name}</Td>
                      <Td>{formatPeriod(rent.month, rent.year)}</Td>
                      <Td>{formatMoney(rent.amount)}</Td>
                      <Td>{formatMoney(rent.paid)}</Td>
                      <Td>{formatMoney(rent.pending)}</Td>
                      <Td>
                        <StatusLabel
                          status={rent.payment_status}
                          dueInDays={rent.due_in_days}
                          overdueByDays={rent.overdue_by_days}
                        />
                      </Td>
                      <Td>
                        <div className="flex flex-col gap-2">
                          {rent.payments && rent.payments.length ? (
                            rent.payments.map((payment) => (
                              <button
                                key={payment.payment_id}
                                className="w-fit rounded-md border border-[#2f6f5e] px-3 py-1 text-sm font-semibold text-[#2f6f5e]"
                                type="button"
                                onClick={() =>
                                  downloadReceipt(payment.payment_id)
                                }
                              >
                                Receipt #{payment.payment_id}
                              </button>
                            ))
                          ) : (
                            <span className="text-sm text-[#60715f]">
                              No payment
                            </span>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-[#e3e8df]">
                    <td
                      colSpan={9}
                      className="py-4 text-center text-sm text-[#60715f]"
                    >
                      No payment status information available.
                    </td>
                  </tr>
                )}
              </tbody>
            </DataTable>
          </section>
        ) : null}

        {/* ── Tenant: Invites Section ── */}
        {user?.role === "tenant" && showInvitesModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-[#f7f8f3] p-6 shadow-xl border border-[#d8ded2]">
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  className="rounded-md p-2 -mr-2 -mt-2 text-[#60715f] transition-colors hover:bg-[#eef0eb] hover:text-[#1b1f1d]"
                  onClick={() => setShowInvitesModal(false)}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <section id="invites" className="grid gap-4">
                <div className="rounded-lg border border-[#d8ded2] bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="#2f6f5e"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="4" width="16" height="12" rx="2" />
                      <polyline points="2 4 10 11 18 4" />
                    </svg>
                    Property Invites
                    {receivedInvites.filter((i) => i.status === "pending")
                      .length > 0 && (
                      <span className="inline-flex items-center justify-center rounded-full bg-[#2f6f5e] px-2 py-0.5 text-xs font-bold text-white">
                        {
                          receivedInvites.filter((i) => i.status === "pending")
                            .length
                        }
                      </span>
                    )}
                  </h2>
                  {receivedInvites.length === 0 ? (
                    <p className="mt-3 text-sm text-[#60715f]">
                      No invites received yet. Property owners can invite you to
                      their units.
                    </p>
                  ) : (
                    <ul className="mt-3 grid gap-3">
                      {receivedInvites.map((inv) => (
                        <li
                          key={inv.id}
                          className={`rounded-lg border p-4 transition-all ${
                            inv.status === "pending"
                              ? "border-[#2f6f5e]/30 bg-[#f0faf6] shadow-sm"
                              : "border-[#e3e8df] bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-[#1b1f1d]">
                                {inv.property_name} — {inv.unit_name}
                              </p>
                              {inv.property_address && (
                                <p className="text-xs text-[#60715f]">
                                  {inv.property_address}
                                </p>
                              )}
                              <p className="mt-1 text-sm text-[#435146]">
                                From: {inv.owner_name || inv.owner_email}
                              </p>
                              {inv.rent_amount != null && (
                                <p className="text-sm text-[#435146]">
                                  Rent:{" "}
                                  <span className="font-semibold text-[#2f6f5e]">
                                    {formatMoney(inv.rent_amount)}/mo
                                  </span>
                                </p>
                              )}
                              {inv.deposit > 0 && (
                                <p className="text-sm text-[#435146]">
                                  Deposit: {formatMoney(inv.deposit)}
                                </p>
                              )}
                              {inv.move_in_date && (
                                <p className="text-sm text-[#435146]">
                                  Move-in: {formatDate(inv.move_in_date)}
                                </p>
                              )}
                              {inv.message && (
                                <p className="mt-1 rounded-md bg-[#eef0eb] px-3 py-2 text-sm italic text-[#435146]">
                                  &ldquo;{inv.message}&rdquo;
                                </p>
                              )}
                              <p className="mt-1 text-xs text-[#8a9a88]">
                                Received {formatDate(inv.created_at)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <InviteStatusLabel status={inv.status} />
                              {inv.status === "pending" && (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    className="rounded-md bg-[#2f6f5e] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#256652] disabled:opacity-50"
                                    onClick={() => handleAcceptInvite(inv.id)}
                                    disabled={loading}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-md border border-[#c9d0c5] px-3 py-1.5 text-xs font-semibold text-[#c44d4d] transition-colors hover:bg-[#fde8e8] disabled:opacity-50"
                                    onClick={() => handleDeclineInvite(inv.id)}
                                    disabled={loading}
                                  >
                                    Decline
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          </div>
        ) : null}

        {tenantDashboard ? (
          <section className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <Metric
                label="Total Rent"
                value={formatMoney(tenantDashboard.summary.total_rent)}
              />
              <Metric
                label="Paid"
                value={formatMoney(tenantDashboard.summary.total_paid)}
              />
              <Metric
                label="Pending"
                value={formatMoney(tenantDashboard.summary.total_pending)}
                tone="warn"
              />
            </div>

            <DataTable title="Rent History">
              <thead>
                <tr>
                  <Th>Property</Th>
                  <Th>Unit</Th>
                  <Th>Period</Th>
                  <Th>Due Date</Th>
                  <Th>Rent</Th>
                  <Th>Paid</Th>
                  <Th>Pending</Th>
                  <Th>Status</Th>
                  <Th>Receipts</Th>
                </tr>
              </thead>
              <tbody>
                {tenantDashboard.rent_history.length > 0 ? (
                  tenantDashboard.rent_history.map((rent) => (
                    <tr
                      key={rent.rent_id}
                      className="border-t border-[#e3e8df] align-top"
                    >
                      <Td>{rent.property_name}</Td>
                      <Td>{rent.unit_name}</Td>
                      <Td>{formatPeriod(rent.month, rent.year)}</Td>
                      <Td>{formatDate(rent.due_date)}</Td>
                      <Td>{formatMoney(rent.amount)}</Td>
                      <Td>{formatMoney(rent.paid)}</Td>
                      <Td>{formatMoney(rent.pending)}</Td>
                      <Td>
                        <StatusLabel
                          status={rent.payment_status}
                          dueInDays={rent.due_in_days}
                          overdueByDays={rent.overdue_by_days}
                        />
                      </Td>
                      <Td>
                        <div className="flex flex-col gap-2">
                          {rent.payments.length ? (
                            rent.payments.map((payment) => (
                              <button
                                key={payment.payment_id}
                                className="w-fit rounded-md border border-[#2f6f5e] px-3 py-1 text-sm font-semibold text-[#2f6f5e]"
                                type="button"
                                onClick={() =>
                                  downloadReceipt(payment.payment_id)
                                }
                              >
                                Receipt #{payment.payment_id}
                              </button>
                            ))
                          ) : (
                            <span className="text-sm text-[#60715f]">
                              No payment
                            </span>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-[#e3e8df]">
                    <td
                      colSpan={9}
                      className="py-4 text-center text-sm text-[#60715f]"
                    >
                      No rent history available.
                    </td>
                  </tr>
                )}
              </tbody>
            </DataTable>
          </section>
        ) : null}
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-[#d8ded2] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#933232]">
              Delete Account
            </h3>
            <p className="mt-2 text-sm text-[#435146]">
              Are you sure? This will permanently delete your account and all
              associated data. This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                className="rounded-md border border-[#c9d0c5] px-4 py-2 text-sm font-semibold text-[#435146] transition-colors hover:bg-[#eef0eb]"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-[#c44d4d] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#a83a3a] disabled:opacity-50"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Property Confirmation Modal */}
      {deletingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-[#d8ded2] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#933232]">
              Delete Property
            </h3>
            <p className="mt-2 text-sm text-[#435146]">
              Delete <strong>&ldquo;{deletingProperty.name}&rdquo;</strong> and
              all its units? This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                className="rounded-md border border-[#c9d0c5] px-4 py-2 text-sm font-semibold text-[#435146] transition-colors hover:bg-[#eef0eb]"
                onClick={() => setDeletingProperty(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-[#c44d4d] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#a83a3a] disabled:opacity-50"
                onClick={handleDeleteProperty}
                disabled={loading}
              >
                {loading ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Unit Confirmation Modal */}
      {deletingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-[#d8ded2] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#933232]">
              Delete Unit
            </h3>
            <p className="mt-2 text-sm text-[#435146]">
              Delete <strong>&ldquo;{deletingUnit.name}&rdquo;</strong> and all
              its associated data? This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                className="rounded-md border border-[#c9d0c5] px-4 py-2 text-sm font-semibold text-[#435146] transition-colors hover:bg-[#eef0eb]"
                onClick={() => setDeletingUnit(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-[#c44d4d] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#a83a3a] disabled:opacity-50"
                onClick={handleDeleteUnit}
                disabled={loading}
              >
                {loading ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-[#d8ded2] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#2f6f5e]">
              Edit Property
            </h3>
            <form onSubmit={handleEditProperty} className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm font-medium text-[#435146]">
                Property Name
                <input
                  className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                  type="text"
                  value={editPropName}
                  onChange={(e) => setEditPropName(e.target.value)}
                  required
                  minLength={2}
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-[#435146]">
                Address{" "}
                <span className="font-normal text-[#8a9a88]">(optional)</span>
                <input
                  className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                  type="text"
                  value={editPropAddress}
                  onChange={(e) => setEditPropAddress(e.target.value)}
                />
              </label>
              <div className="mt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  className="rounded-md border border-[#c9d0c5] px-4 py-2 text-sm font-semibold text-[#435146] transition-colors hover:bg-[#eef0eb]"
                  onClick={() => setEditingProperty(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#2f6f5e] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#256652] disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Updating…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Unit Modal */}
      {editingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-lg border border-[#d8ded2] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#2f6f5e]">Edit Unit</h3>
            <form onSubmit={handleEditUnit} className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm font-medium text-[#435146]">
                Unit Name
                <input
                  className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                  type="text"
                  value={editUnitName}
                  onChange={(e) => setEditUnitName(e.target.value)}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-[#435146]">
                Monthly Rent (₹)
                <input
                  className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                  type="number"
                  min="1"
                  step="1"
                  value={editUnitRent}
                  onChange={(e) => setEditUnitRent(e.target.value)}
                  required
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="grid gap-1 text-sm font-medium text-[#435146]">
                  Late Fee (%)
                  <input
                    className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={editUnitLateFee}
                    onChange={(e) => setEditUnitLateFee(e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-[#435146]">
                  Grace Period (Days)
                  <input
                    className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                    type="number"
                    min="0"
                    max="31"
                    step="1"
                    value={editUnitGracePeriod}
                    onChange={(e) => setEditUnitGracePeriod(e.target.value)}
                  />
                </label>
              </div>
              <div className="mt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  className="rounded-md border border-[#c9d0c5] px-4 py-2 text-sm font-semibold text-[#435146] transition-colors hover:bg-[#eef0eb]"
                  onClick={() => setEditingUnit(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#2f6f5e] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#256652] disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Updating…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unit Details Modal */}
      {viewingUnitDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-[#d8ded2] bg-white p-6 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-[#1b1f1d]">
                  {viewingUnitDetails.unit_name}
                </h3>
                <p className="text-sm text-[#60715f]">
                  {viewingUnitDetails.property_name}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 -mr-2 -mt-2 text-[#60715f] transition-colors hover:bg-[#eef0eb] hover:text-[#1b1f1d]"
                onClick={() => setViewingUnitDetails(null)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md bg-[#f7f8f3] p-4 border border-[#e3e8df]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#60715f]">
                  Rent Amount
                </p>
                <p className="mt-1 text-xl font-semibold text-[#2f6f5e]">
                  {formatMoney(viewingUnitDetails.rent_amount)}
                  <span className="text-sm font-normal text-[#60715f]">
                    /mo
                  </span>
                </p>
              </div>
              <div className="rounded-md bg-[#f7f8f3] p-4 border border-[#e3e8df]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#60715f]">
                  Terms
                </p>
                <p className="mt-1 text-sm font-medium text-[#1b1f1d]">
                  Due:{" "}
                  <span className="font-normal text-[#435146]">
                    Day {viewingUnitDetails.due_day}
                  </span>
                </p>
                <p className="text-sm font-medium text-[#1b1f1d]">
                  Late Fee:{" "}
                  <span className="font-normal text-[#435146]">
                    {viewingUnitDetails.late_fee_percentage}% (Grace:{" "}
                    {viewingUnitDetails.grace_period_days}d)
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-[#e3e8df] pt-5">
              <h4 className="font-semibold text-[#1b1f1d] mb-4 flex items-center gap-2">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Assigned Tenant
              </h4>
              {viewingUnitDetails.tenancy_id ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#60715f]">
                      Tenant Info
                    </p>
                    <p className="text-sm font-medium text-[#1b1f1d]">
                      {viewingUnitDetails.tenant_name || "N/A"}
                    </p>
                    <p className="text-sm text-[#435146]">
                      {viewingUnitDetails.tenant_email}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#60715f]">
                      Lease Details
                    </p>
                    <p className="text-sm font-medium text-[#1b1f1d]">
                      Move-in:{" "}
                      <span className="font-normal text-[#435146]">
                        {formatDate(viewingUnitDetails.move_in_date)}
                      </span>
                    </p>
                    <p className="text-sm font-medium text-[#1b1f1d]">
                      Deposit:{" "}
                      <span className="font-normal text-[#435146]">
                        {formatMoney(viewingUnitDetails.deposit)}
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md bg-[#fff9eb] p-3 border border-[#e0b15c]/50 text-sm text-[#6b4c18]">
                  No tenant is currently assigned to this unit.
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                className="rounded-md bg-[#eef0eb] px-5 py-2.5 text-sm font-semibold text-[#435146] transition-colors hover:bg-[#d8ded2]"
                onClick={() => setViewingUnitDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <TenantDirectoryModal
        isOpen={showTenantDirectory}
        onClose={() => setShowTenantDirectory(false)}
      />
    </main>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-lg border border-[#d8ded2] bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-[#60715f]">{label}</p>
      <p
        className={
          (tone === "warn"
            ? "mt-2 text-xl font-semibold text-[#9a4d21]"
            : "mt-2 text-xl font-semibold") + " sm:text-2xl"
        }
      >
        {value}
      </p>
    </div>
  );
}

function DataTable({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#d8ded2] bg-white p-4 shadow-sm overflow-hidden">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 overflow-x-auto -mx-4 px-4">
        <table className="w-full min-w-[650px] border-collapse text-left text-sm md:min-w-[760px]">
          {children}
        </table>
      </div>
    </section>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="pb-3 pr-4 font-semibold text-[#435146]">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="py-3 pr-4">{children}</td>;
}

function StatusLabel({
  status,
  dueInDays,
  overdueByDays,
}: {
  status: string;
  dueInDays?: number | null;
  overdueByDays?: number | null;
}) {
  const normalized = status.toLowerCase();
  const dayWord = (count: number) => (count === 1 ? "day" : "days");
  const label =
    normalized === "pending" && typeof dueInDays === "number"
      ? `Pending (due in ${dueInDays} ${dayWord(dueInDays)})`
      : normalized === "overdue" && typeof overdueByDays === "number"
        ? `Overdue (${overdueByDays} ${dayWord(overdueByDays)})`
        : status;
  const className =
    normalized === "paid"
      ? "bg-[#e6f4ea] text-[#23633d]"
      : normalized === "partial"
        ? "bg-[#fef08a] text-[#854d0e]"
        : normalized === "overdue"
          ? "bg-[#fde8e8] text-[#933232]"
          : normalized === "upcoming"
            ? "bg-[#f3f4f6] text-[#4b5563]"
            : "bg-[#e0e7ff] text-[#3730a3]";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

function InviteStatusLabel({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const className =
    normalized === "accepted"
      ? "bg-[#e6f4ea] text-[#23633d]"
      : normalized === "pending"
        ? "bg-[#e8f0fe] text-[#1a56db]"
        : normalized === "declined"
          ? "bg-[#fde8e8] text-[#933232]"
          : "bg-[#f3f4f6] text-[#6b7280]";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${className}`}
    >
      {status}
    </span>
  );
}
