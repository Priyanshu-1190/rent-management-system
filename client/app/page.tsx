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
    property_id: number;
    unit_id: number;
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
  const [viewingPropertyDetails, setViewingPropertyDetails] =
    useState<any | null>(null);
  const [viewingPropertyUnits, setViewingPropertyUnits] =
    useState<Unit[]>([]);

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
      await loadAvailableUnits();
      if (viewingPropertyDetails && viewingPropertyDetails.property_id === editingProperty.id) {
        setViewingPropertyDetails((prev: any) => prev ? { ...prev, property_name: editPropName } : null);
      }
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

  const handleViewPropertyDetails = async (property: any) => {
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch(`/api/proxy/units/property/${property.property_id}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load units");
      setViewingPropertyUnits(body);
      setViewingPropertyDetails(property);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Failed to load property details",
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshViewingPropertyUnits = async (propertyId: number) => {
    try {
      const res = await fetch(`/api/proxy/units/property/${propertyId}`);
      const body = await res.json();
      if (res.ok) {
        setViewingPropertyUnits(body);
      }
    } catch {}
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
      await loadAvailableUnits();
      if (viewingPropertyDetails && viewingPropertyDetails.property_id === selectedPropertyId) {
        await refreshViewingPropertyUnits(selectedPropertyId);
      }
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
      await loadAvailableUnits();
      if (viewingPropertyDetails) {
        await refreshViewingPropertyUnits(viewingPropertyDetails.property_id);
      }
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
      await loadAvailableUnits();
      if (viewingPropertyDetails && viewingPropertyDetails.property_id === deletingProperty.id) {
        setViewingPropertyDetails(null);
      }
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
      await loadAvailableUnits();
      if (viewingPropertyDetails) {
        setViewingPropertyUnits((prev) => prev.filter((u) => u.id !== deletingUnit.id));
      }
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



  const handleSendInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inviteUnitId) {
      setNotice("Select a unit");
      return;
    }

    if (!inviteMoveIn) {
      setNotice("Select a move-in date");
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
          move_in_date: inviteMoveIn,
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

  const handleLogout = async () => {
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to log out");
      }
      setUser(null);
      setOwnerDashboard(null);
      setTenantDashboard(null);
      setProperties([]);
      setPropertyUnits([]);
      setShowAccountDetails(false);
      setShowMenu(false);
      setShowLogoutConfirm(false);
      setNotice("Logged out successfully.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to log out");
    } finally {
      setLoading(false);
    }
  };

  const authPanel = (
    <div
      id="access"
      className="scroll-mt-24 rounded-2xl border border-white/10 bg-brand-green-dark/85 p-6 shadow-2xl backdrop-blur-md relative z-10"
    >
      <div className="flex gap-1.5 rounded-xl bg-brand-green-mid/70 p-1.5 border border-white/5">
        <button
          type="button"
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
            authMode === "login"
              ? "bg-brand-green-emerald text-white shadow-md shadow-brand-green-emerald/10"
              : "text-white/60 hover:text-white hover:bg-white/5"
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
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
            authMode === "register"
              ? "bg-brand-green-emerald text-white shadow-md shadow-brand-green-emerald/10"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
          onClick={() => {
            setAuthMode("register");
            setNotice("");
          }}
        >
          Register
        </button>
      </div>

      {notice && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span className="flex-1 leading-normal">{notice}</span>
        </div>
      )}

      {authMode === "login" ? (
        <form onSubmit={handleLogin} className="mt-5 grid gap-4">
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-white/60">
            Email Address
            <input
              className="rounded-xl border border-white/10 bg-brand-green-mid/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-gold/60 focus:bg-brand-green-mid/70 focus:ring-1 focus:ring-brand-gold/20 transition-all"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              required
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-white/60">
            Password
            <input
              className="rounded-xl border border-white/10 bg-brand-green-mid/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-gold/60 focus:bg-brand-green-mid/70 focus:ring-1 focus:ring-brand-gold/20 transition-all"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          <button
            className="mt-2 rounded-xl bg-gradient-to-r from-brand-gold to-brand-gold-light py-3 font-bold text-brand-dark shadow-md shadow-brand-gold/15 transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-brand-gold/25 active:scale-[0.98] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login to Account"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="mt-5 grid gap-4">
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-white/60">
            Name
            <input
              className="rounded-xl border border-white/10 bg-brand-green-mid/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-gold/60 focus:bg-brand-green-mid/70 focus:ring-1 focus:ring-brand-gold/20 transition-all"
              type="text"
              value={regName}
              onChange={(event) => setRegName(event.target.value)}
              placeholder="John Doe"
              required
              minLength={2}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-white/60">
            Email Address
            <input
              className="rounded-xl border border-white/10 bg-brand-green-mid/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-gold/60 focus:bg-brand-green-mid/70 focus:ring-1 focus:ring-brand-gold/20 transition-all"
              type="email"
              value={regEmail}
              onChange={(event) => setRegEmail(event.target.value)}
              placeholder="name@example.com"
              required
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-white/60">
            Password
            <input
              className="rounded-xl border border-white/10 bg-brand-green-mid/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-gold/60 focus:bg-brand-green-mid/70 focus:ring-1 focus:ring-brand-gold/20 transition-all"
              type="password"
              value={regPassword}
              onChange={(event) => setRegPassword(event.target.value)}
              placeholder="•••••••• (min 6 chars)"
              required
              minLength={6}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-white/60">
            Account Role
            <select
              className="rounded-xl border border-white/10 bg-brand-green-mid/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-gold/60 focus:bg-brand-green-mid/70 focus:ring-1 focus:ring-brand-gold/20 transition-all cursor-pointer"
              value={regRole}
              onChange={(event) => setRegRole(event.target.value as Role)}
            >
              <option value="tenant" className="bg-brand-green-dark text-white">Tenant</option>
              <option value="owner" className="bg-brand-green-dark text-white">Owner</option>
            </select>
          </label>
          <button
            className="mt-2 rounded-xl bg-gradient-to-r from-brand-gold to-brand-gold-light py-3 font-bold text-brand-dark shadow-md shadow-brand-gold/15 transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-brand-gold/25 active:scale-[0.98] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? "Registering..." : "Create Free Account"}
          </button>
        </form>
      )}
    </div>
  );

  if (!user) {
    return (
      <main className="min-h-screen w-full bg-[#071210] text-[#f3f4f6] selection:bg-brand-gold selection:text-brand-dark">
        
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-brand-green-dark/75 backdrop-blur-md text-white shadow-lg transition-all duration-300">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <a href="#" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-gold to-brand-gold-light text-[#1b1f1d] font-bold text-xl shadow-md shadow-brand-gold/10 group-hover:scale-105 transition-transform">
                ₹
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-[#cbd5e1] bg-clip-text text-transparent">
                Rent Khata
              </span>
            </a>
            <nav className="flex items-center gap-4" aria-label="Landing page">
              <a
                className="relative px-3 py-2 text-sm font-semibold text-white/80 transition-colors hover:text-white after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-brand-gold after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
                href="#features"
              >
                Features
              </a>
              <a
                className="relative px-3 py-2 text-sm font-semibold text-white/80 transition-colors hover:text-white after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-brand-gold after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
                href="#access"
                onClick={() => {
                  setAuthMode("login");
                  setNotice("");
                }}
              >
                Login
              </a>
              <div className="hidden h-5 w-px bg-white/20 sm:block" />
              <a
                className="rounded-lg bg-gradient-to-r from-brand-gold to-brand-gold-light px-4 py-2 text-sm font-bold text-brand-dark shadow-md shadow-brand-gold/20 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-brand-gold/30 active:scale-[0.98]"
                href="#access"
                onClick={() => {
                  setAuthMode("register");
                  setNotice("");
                }}
              >
                Create Account
              </a>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative min-h-[90vh] overflow-hidden bg-brand-green-dark text-white flex items-center py-16 lg:py-24">
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/10 w-96 h-96 rounded-full bg-brand-green-emerald/10 blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/10 w-[450px] h-[450px] rounded-full bg-brand-gold/5 blur-3xl animate-pulse-glow" style={{ animationDelay: '4s' }} />

          <div className="mx-auto max-w-7xl w-full px-6 lg:px-8 relative z-10">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              
              {/* Hero Left: Text Content */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-green-emerald/30 bg-brand-green-mid/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-green-glow backdrop-blur-sm">
                  <span className="flex h-2 w-2 rounded-full bg-brand-gold animate-pulse" />
                  Your Ultimate Rental Ledger
                </div>
                
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl font-serif leading-[1.1] text-gradient">
                  Rent, tenants, receipts, & dues in <span className="italic font-normal text-brand-gold-light">one calm workspace.</span>
                </h1>
                
                <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-white/80 font-normal">
                  A modern, clean workspace designed for owners and tenants. Manage properties, coordinate leases, log payments, and generate invoices with ease.
                </p>
                
                <div className="flex flex-wrap gap-4 pt-2">
                  <a
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-gold to-brand-gold-light px-6 py-3.5 text-sm font-bold text-brand-dark shadow-lg shadow-brand-gold/15 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-brand-gold/25 active:scale-[0.98]"
                    href="#access"
                    onClick={() => {
                      setAuthMode("register");
                      setNotice("");
                    }}
                  >
                    Start Managing
                  </a>
                  <a
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/30 active:scale-[0.98]"
                    href="#features"
                  >
                    Explore Features
                  </a>
                </div>
                
                {/* Micro Stats */}
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10 max-w-lg">
                  <div>
                    <p className="text-3xl font-extrabold text-brand-gold">100%</p>
                    <p className="text-xs text-white/60 uppercase tracking-wider mt-1">Ledger Accuracy</p>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-brand-green-glow">Instant</p>
                    <p className="text-xs text-white/60 uppercase tracking-wider mt-1">PDF Receipts</p>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-white">Zero</p>
                    <p className="text-xs text-white/60 uppercase tracking-wider mt-1">Clutter</p>
                  </div>
                </div>
              </div>
              
              {/* Hero Right: Interactive Browser Mockup */}
              <div className="lg:col-span-5 relative flex justify-center">
                {/* Floating card background decoration */}
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-brand-green-emerald/20 blur-2xl rounded-full pointer-events-none" />
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-brand-gold/10 blur-3xl rounded-full pointer-events-none" />
                
                {/* Browser Mockup Window */}
                <div className="w-full max-w-[480px] rounded-2xl glassmorphism border border-white/15 shadow-2xl overflow-hidden animate-float relative">
                  {/* Browser top bar */}
                  <div className="flex items-center gap-1.5 bg-brand-green-dark/80 px-4 py-3 border-b border-white/10">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    <div className="mx-auto bg-brand-green-mid/80 rounded-md px-4 py-0.5 text-[10px] text-white/40 font-mono w-40 truncate text-center">
                      rentkhata.in/dashboard
                    </div>
                  </div>
                  
                  {/* Mockup Image */}
                  <div className="relative bg-brand-green-dark/40 p-1">
                    <img 
                      src="/dashboard-mockup.png" 
                      alt="Rent Khata Dashboard Mockup" 
                      className="w-full h-auto rounded-b-xl object-cover mix-blend-lighten opacity-95 transition-opacity hover:opacity-100 duration-300"
                    />
                  </div>
                  
                  {/* Floating Badges */}
                  <div className="absolute bottom-4 -left-4 glassmorphism rounded-xl p-3 border border-white/10 shadow-lg animate-float-delayed flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-brand-green-emerald/20 flex items-center justify-center text-brand-green-glow">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider leading-none">Monthly Rent</p>
                      <p className="text-xs font-extrabold text-white mt-1">Dues Sorted Automatically</p>
                    </div>
                  </div>

                  <div className="absolute -top-4 -right-4 bg-gradient-to-r from-brand-gold to-brand-gold-light rounded-xl p-3 shadow-lg flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-black/10 flex items-center justify-center text-brand-dark">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-brand-dark/70 font-bold uppercase tracking-wider leading-none">Collected</p>
                      <p className="text-xs font-extrabold text-brand-dark mt-0.5">₹1,85,000</p>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section id="features" className="scroll-mt-2 py-20 bg-brand-green-dark border-t border-white/5 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(46,125,99,0.05),transparent_60%)] pointer-events-none" />
          
          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-gold">Platform Features</h2>
              <p className="mt-3 text-3xl font-bold font-serif sm:text-4xl text-gradient">
                Everything you need to manage rental operations smoothly
              </p>
              <p className="mt-4 text-white/60">
                Forget messy spreadsheets and chaotic WhatsApp chats. Rent Khata organizes everything into clean, auditable records.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Owner Dashboard",
                  body: "Track total properties, units, current occupancy, total rents, actual collections, and pending dues from a single window.",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  ),
                  color: "from-emerald-500/20 to-teal-500/20 text-brand-green-glow"
                },
                {
                  title: "Tenant Portal",
                  body: "Tenants get a focused view of rent status, due dates, outstanding amount, grace periods, and payment history.",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  ),
                  color: "from-brand-gold/20 to-amber-500/20 text-brand-gold"
                },
                {
                  title: "Property & Unit Operations",
                  body: "Create and edit properties, add individual rental units, customize rent cycles, due dates, late fee rates, and grace periods.",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                  ),
                  color: "from-blue-500/20 to-indigo-500/20 text-blue-400"
                },
                {
                  title: "Financial Ledger Clarity",
                  body: "Obligations (rents) are tracked independently from transactions (payments), ensuring ledger logs never mismatch.",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  ),
                  color: "from-purple-500/20 to-pink-500/20 text-purple-400"
                },
                {
                  title: "PDF Rent Receipts",
                  body: "Generate professional, download-ready PDF receipts for payments, equipped with transaction IDs and timestamp details.",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  ),
                  color: "from-rose-500/20 to-orange-500/20 text-rose-400"
                },
                {
                  title: "Leasing & Invitations",
                  body: "Invite tenants to specific units via email. Set lease starting dates, security deposits, and customized invitation notes.",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5m4.72 0V12a9 9 0 00-9-9" /></svg>
                  ),
                  color: "from-brand-green-emerald/30 to-brand-green-glow/20 text-brand-green-glow"
                }
              ].map((f, i) => (
                <div
                  key={i}
                  className="group rounded-2xl glassmorphism p-6 hover:bg-brand-green-mid/70 hover:-translate-y-1 hover:border-brand-green-emerald/40 transition-all duration-300 relative overflow-hidden"
                >
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-brand-gold transition-colors duration-300">{f.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Access Section (Authentication) */}
        <section className="bg-brand-green-dark border-t border-white/5 relative overflow-hidden py-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-green-emerald/5 blur-3xl rounded-full pointer-events-none" />
          
          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              
              {/* Text content left */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-gold backdrop-blur-sm">
                  Access Portal
                </div>
                <h2 className="text-3xl font-bold font-serif sm:text-4xl text-gradient">
                  Ready to experience absolute ledger peace?
                </h2>
                <p className="max-w-2xl text-white/70 leading-relaxed">
                  Join hundreds of landlords and tenants already using Rent Khata to eliminate spreadsheet errors, centralize invoices, and keep accounts clear.
                </p>
                
                <div className="space-y-4 pt-4">
                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-brand-green-emerald/30 flex items-center justify-center text-brand-green-glow flex-shrink-0 mt-0.5 text-xs font-bold">
                      ✓
                    </div>
                    <p className="text-sm text-white/80">
                      <strong>For Owners:</strong> Comprehensive property dashboard, automatic late fee calculations, security deposit status tracker, and simple inviting mechanism.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-brand-green-emerald/30 flex items-center justify-center text-brand-green-glow flex-shrink-0 mt-0.5 text-xs font-bold">
                      ✓
                    </div>
                    <p className="text-sm text-white/80">
                      <strong>For Tenants:</strong> Instant receipt generation, real-time dashboard of pending dues, and email-based contract accepts.
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  {apiStatus && (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-mono text-white/60">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      {apiStatus}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Auth Panel right */}
              <div className="lg:col-span-5 relative">
                <div className="absolute inset-0 bg-brand-gold/5 blur-3xl rounded-full pointer-events-none" />
                {authPanel}
              </div>
              
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-brand-dark text-white border-t border-white/5 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gold text-brand-dark font-bold text-base">
                    ₹
                  </div>
                  <span className="text-lg font-bold tracking-tight text-white">
                    Rent Khata
                  </span>
                </div>
                <p className="max-w-md text-sm leading-relaxed text-white/60">
                  A focused rental operations workspace for properties, tenants, rent schedules, payments, and receipts. Built for simplicity and ledger peace.
                </p>
              </div>
              <nav className="flex flex-wrap gap-x-8 gap-y-4" aria-label="Footer">
                <a className="text-sm font-semibold text-white/60 hover:text-brand-gold transition-colors" href="#">
                  Home
                </a>
                <a className="text-sm font-semibold text-white/60 hover:text-brand-gold transition-colors" href="#features">
                  Features
                </a>
                <a 
                  className="text-sm font-semibold text-white/60 hover:text-brand-gold transition-colors" 
                  href="#access"
                  onClick={() => {
                    setAuthMode("login");
                    setNotice("");
                  }}
                >
                  Login
                </a>
              </nav>
            </div>
            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-white/40">
              <p>&copy; {new Date().getFullYear()} Rent Khata. All rights reserved.</p>
              <p className="flex gap-4">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              </p>
            </div>
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
                      onClick={() => {
                        setShowLogoutConfirm(true);
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
                        <input
                          className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                          type="date"
                          value={inviteMoveIn}
                          onChange={(e) => setInviteMoveIn(e.target.value)}
                          required
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
                        disabled={loading || !inviteUnitId || !inviteMoveIn}
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
                      className="border-t border-[#e3e8df] hover:bg-[#eef0eb]/50 cursor-pointer transition-colors"
                      onClick={() => handleViewPropertyDetails(property)}
                    >
                      <Td className="font-semibold text-[#2f6f5e] hover:underline">{property.property_name}</Td>
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

      {viewingPropertyDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl border border-[#d8ded2] bg-[#f7f8f3] p-6 shadow-2xl relative">
            <div className="absolute right-6 top-6">
              <button
                type="button"
                className="rounded-lg p-2 text-[#60715f] transition-all hover:bg-[#eef0eb] hover:text-[#1b1f1d] hover:scale-105 active:scale-95"
                onClick={() => setViewingPropertyDetails(null)}
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

            <div className="mb-6 pr-10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60715f]">
                Property Details
              </p>
              <h3 className="mt-1 text-2xl font-bold text-[#1b1f1d] flex items-center gap-2">
                <svg className="w-6 h-6 text-[#2f6f5e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
                {viewingPropertyDetails.property_name}
              </h3>
              {properties.find(p => p.id === viewingPropertyDetails.property_id)?.address && (
                <p className="mt-1.5 text-sm text-[#60715f] flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {properties.find(p => p.id === viewingPropertyDetails.property_id)?.address}
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="rounded-lg border border-[#d8ded2] bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#60715f]">Total Rent</p>
                <p className="mt-1 text-xl font-bold text-[#1b1f1d]">
                  {formatMoney(viewingPropertyDetails.total_rent)}
                  <span className="text-xs font-normal text-[#60715f] block mt-0.5">Estimated monthly</span>
                </p>
              </div>
              <div className="rounded-lg border border-[#d8ded2] bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#60715f]">Collected</p>
                <p className="mt-1 text-xl font-bold text-[#23633d]">
                  {formatMoney(viewingPropertyDetails.total_collected)}
                  <span className="text-xs font-normal text-[#60715f] block mt-0.5">This period</span>
                </p>
              </div>
              <div className="rounded-lg border border-[#d8ded2] bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#60715f]">Pending</p>
                <p className="mt-1 text-xl font-bold text-[#9a4d21]">
                  {formatMoney(viewingPropertyDetails.total_pending)}
                  <span className="text-xs font-normal text-[#60715f] block mt-0.5">Outstanding</span>
                </p>
              </div>
              <div className="rounded-lg border border-[#d8ded2] bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#60715f]">Occupancy</p>
                <p className="mt-1 text-xl font-bold text-[#1b1f1d]">
                  {viewingPropertyDetails.occupied_units} / {viewingPropertyDetails.total_units}
                  <span className="text-xs font-normal text-[#60715f] block mt-0.5">
                    {viewingPropertyDetails.total_units > 0 
                      ? Math.round((viewingPropertyDetails.occupied_units / viewingPropertyDetails.total_units) * 100)
                      : 0}% Occupied
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[#d8ded2] bg-white p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-[#1b1f1d]">Units in Property</h4>
                <button
                  type="button"
                  className="rounded-lg bg-[#2f6f5e] hover:bg-[#235346] px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => {
                    setSelectedPropertyId(viewingPropertyDetails.property_id);
                    loadUnits(viewingPropertyDetails.property_id);
                    setViewingPropertyDetails(null);
                    setNotice(`Property "${viewingPropertyDetails.property_name}" selected. You can now add units to it in the "Add Unit" section.`);
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                >
                  Manage Units & Add New
                </button>
              </div>

              {viewingPropertyUnits.length === 0 ? (
                <div className="text-center py-8 text-sm text-[#60715f]">
                  No units added to this property yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#e3e8df]">
                        <th className="pb-3 pr-4 font-semibold text-[#435146]">Unit</th>
                        <th className="pb-3 pr-4 font-semibold text-[#435146]">Monthly Rent</th>
                        <th className="pb-3 pr-4 font-semibold text-[#435146]">Tenant</th>
                        <th className="pb-3 pr-4 font-semibold text-[#435146]">Status</th>
                        <th className="pb-3 pr-4 font-semibold text-[#435146] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e3e8df]">
                      {viewingPropertyUnits.map((unit) => {
                        const activeRent = ownerDashboard?.rent_status?.find(
                          (r) => r.unit_id === unit.id
                        );

                        return (
                          <tr key={unit.id} className="hover:bg-[#f7f8f3]/50">
                            <td className="py-3.5 pr-4 font-medium text-[#1b1f1d]">{unit.name}</td>
                            <td className="py-3.5 pr-4">{formatMoney(unit.rent_amount)}/mo</td>
                            <td className="py-3.5 pr-4">
                              {activeRent ? (
                                <div>
                                  <p className="font-semibold text-gray-900">{activeRent.tenant_name}</p>
                                  <p className="text-xs text-gray-500 font-normal">Active Tenant</p>
                                </div>
                              ) : (
                                <span className="text-xs text-[#8a9a88] italic">Vacant</span>
                              )}
                            </td>
                            <td className="py-3.5 pr-4">
                              {activeRent ? (
                                <StatusLabel
                                  status={activeRent.payment_status}
                                  dueInDays={activeRent.due_in_days}
                                  overdueByDays={activeRent.overdue_by_days}
                                />
                              ) : (
                                <span className="inline-flex rounded-full bg-[#f3f4f6] text-[#6b7280] px-2.5 py-1 text-xs font-semibold">
                                  N/A
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 pr-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  className="rounded p-1.5 text-[#2f6f5e] transition-colors hover:bg-[#eef0eb]"
                                  onClick={() => handleViewUnitDetails(unit.id)}
                                  title={`View details of ${unit.name}`}
                                  disabled={loading}
                                >
                                  <svg
                                    width="16"
                                    height="16"
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
                                  className="rounded p-1.5 text-[#2f6f5e] transition-colors hover:bg-[#eef0eb]"
                                  onClick={() => {
                                    setEditingUnit(unit);
                                    setEditUnitName(unit.name);
                                    setEditUnitRent(unit.rent_amount.toString());
                                    setEditUnitLateFee(
                                      unit.late_fee_percentage.toString(),
                                    );
                                    setEditUnitGracePeriod(
                                      unit.grace_period_days.toString(),
                                    );
                                  }}
                                  title={`Edit ${unit.name}`}
                                  disabled={loading}
                                >
                                  <svg
                                    width="16"
                                    height="16"
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
                                  className="rounded p-1.5 text-[#c44d4d] transition-colors hover:bg-[#fde8e8]"
                                  onClick={() =>
                                    setDeletingUnit({ id: unit.id, name: unit.name })
                                  }
                                  title={`Delete ${unit.name}`}
                                  disabled={loading}
                                >
                                  <svg
                                    width="16"
                                    height="16"
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
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-[#d8ded2] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#1b1f1d]">
              Log Out
            </h3>
            <p className="mt-2 text-sm text-[#60715f]">
              Are you sure you want to log out?
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                className="rounded-md border border-[#c9d0c5] px-4 py-2 text-sm font-semibold text-[#435146] transition-colors hover:bg-[#eef0eb]"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-[#2f6f5e] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#235346] disabled:opacity-50"
                onClick={handleLogout}
                disabled={loading}
              >
                {loading ? "Logging out…" : "Log Out"}
              </button>
            </div>
          </div>
        </div>
      )}

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

function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <th className={`pb-3 pr-4 font-semibold text-[#435146] ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`py-3 pr-4 ${className}`}>{children}</td>;
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
