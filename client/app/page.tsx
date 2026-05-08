"use client";

import { useEffect, useState } from "react";
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
  const [ownerDashboard, setOwnerDashboard] = useState<OwnerDashboard | null>(null);
  const [tenantDashboard, setTenantDashboard] = useState<TenantDashboard | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  // Owner property management state
  const [properties, setProperties] = useState<Property[]>([]);
  const [propName, setPropName] = useState("");
  const [propAddress, setPropAddress] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [unitName, setUnitName] = useState("");
  const [unitRent, setUnitRent] = useState("");
  const [propertyUnits, setPropertyUnits] = useState<Unit[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deletingProperty, setDeletingProperty] = useState<{ id: number; name: string } | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<{ id: number; name: string } | null>(null);

  // Restore session from httpOnly cookie on mount
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then(async (data) => {
        if (data.user) {
          setUser(data.user);
          await loadDashboard(data.user.role);
          if (data.user.role === "owner") await loadProperties();
        }
      })
      .catch(() => {});

    fetch("/api/db-test")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Backend request failed");
        return body;
      })
      .then((res) => setApiStatus(`Database online: ${formatKolkataTime(res.data[0].now)}`))
      .catch((err) => {
        console.error(err);
        setApiStatus(err.message || "Unable to reach backend database test endpoint.");
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
      const path = currentRole === "owner" ? "/api/proxy/dashboard/owner" : "/api/proxy/dashboard/tenant";
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
      setNotice(err instanceof Error ? err.message : "Dashboard request failed");
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
      if (body.user.role === "owner") await loadProperties();
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
        throw new Error(regBody.error || regBody.message || "Registration failed");
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
      await loadDashboard(loginBody.user.role);
      if (loginBody.user.role === "owner") await loadProperties();
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
      setNotice(err instanceof Error ? err.message : "Failed to load properties");
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
        body: JSON.stringify({ name: propName, address: propAddress || undefined }),
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

  // ── Owner: add unit ──
  const handleAddUnit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPropertyId) { setNotice("Select a property first"); return; }
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch(`/api/proxy/units/${selectedPropertyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: unitName, rent_amount: Number(unitRent) }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to add unit");
      setUnitName("");
      setUnitRent("");
      await loadUnits(selectedPropertyId);
      await loadDashboard();
      setNotice(`Unit "${body.name}" added with rent ${formatMoney(body.rent_amount)}`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to add unit");
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
      if (selectedPropertyId === deletingProperty.id) setSelectedPropertyId(null);
      await loadProperties();
      await loadDashboard();
      setNotice(`Property "${deletingProperty.name}" deleted.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to delete property");
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
      setNotice(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#1b1f1d]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-start justify-between border-b border-[#d8ded2] pb-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#60715f]">
              Rent Management
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Dashboard</h1>
            {apiStatus ? <p className="mt-1 text-sm text-[#60715f]">{apiStatus}</p> : null}
            {user ? <p className="text-sm text-[#60715f]">Signed in as {user.role} #{user.id}</p> : null}
          </div>
          {user ? (
            <div className="relative">
              <button
                type="button"
                className="rounded-md p-2 text-[#60715f] transition-colors hover:bg-[#eef0eb] hover:text-[#1b1f1d]"
                onClick={() => setShowMenu((v) => !v)}
                aria-label="Menu"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="4" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="10" cy="16" r="1.5"/></svg>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg border border-[#d8ded2] bg-white py-1 shadow-lg">
                    <button
                      type="button"
                      className="flex w-full px-4 py-2 text-sm font-medium text-[#435146] transition-colors hover:bg-[#eef0eb]"
                      onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); setUser(null); setOwnerDashboard(null); setTenantDashboard(null); setProperties([]); setPropertyUnits([]); setShowMenu(false); }}
                    >
                      Log Out
                    </button>
                    <button
                      type="button"
                      className="flex w-full px-4 py-2 text-sm font-medium text-[#c44d4d] transition-colors hover:bg-[#fde8e8]"
                      onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }}
                    >
                      Delete Account
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </header>

        <section className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
          <div className="rounded-lg border border-[#d8ded2] bg-white p-4 shadow-sm">
            <div className="flex gap-1 rounded-md bg-[#eef0eb] p-1">
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                  authMode === "login"
                    ? "bg-white text-[#1b1f1d] shadow-sm"
                    : "text-[#60715f] hover:text-[#435146]"
                }`}
                onClick={() => { setAuthMode("login"); setNotice(""); }}
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
                onClick={() => { setAuthMode("register"); setNotice(""); }}
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
                  Login
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
                  Register
                </button>
              </form>
            )}
            {notice ? (
              <p className="mt-3 rounded-md border border-[#e0b15c] bg-[#fff9eb] px-3 py-2 text-sm text-[#6b4c18]">
                {notice}
              </p>
            ) : null}
          </div>
        </section>

        {/* ── Owner: Property & Unit Management ── */}
        {user?.role === "owner" ? (
          <section className="grid gap-4 lg:grid-cols-2">
            {/* Add Property Card */}
            <div className="rounded-lg border border-[#d8ded2] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Add Property</h2>
              <form onSubmit={handleAddProperty} className="mt-3 grid gap-3">
                <label className="grid gap-1 text-sm font-medium text-[#435146]">
                  Property Name
                  <input className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]" type="text" value={propName} onChange={(e) => setPropName(e.target.value)} required minLength={2} placeholder="e.g. Sunrise Apartments" />
                </label>
                <label className="grid gap-1 text-sm font-medium text-[#435146]">
                  Address <span className="font-normal text-[#8a9a88]">(optional)</span>
                  <input className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]" type="text" value={propAddress} onChange={(e) => setPropAddress(e.target.value)} placeholder="e.g. 42 MG Road, Kolkata" />
                </label>
                <button className="rounded-md bg-[#2f6f5e] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98aaa1]" type="submit" disabled={loading}>Add Property</button>
              </form>

              {properties.length > 0 && (
                <div className="mt-4 border-t border-[#e3e8df] pt-3">
                  <p className="text-sm font-semibold text-[#435146]">Your Properties</p>
                  <ul className="mt-2 grid gap-1">
                    {properties.map((p) => (
                      <li key={p.id} className="flex items-center justify-between rounded-md border border-[#e3e8df] px-3 py-2 text-sm">
                        <div className="min-w-0 flex-1">
                          <span className="font-medium">{p.name}</span>
                          {p.address && <span className="ml-2 text-[#60715f]">{p.address}</span>}
                        </div>
                        <button
                          type="button"
                          className="ml-2 flex-shrink-0 rounded p-1 text-[#c44d4d] transition-colors hover:bg-[#fde8e8]"
                          onClick={() => setDeletingProperty({ id: p.id, name: p.name })}
                          title={`Delete ${p.name}`}
                          disabled={loading}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg>
                        </button>
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
                <p className="mt-3 text-sm text-[#60715f]">Add a property first to create units.</p>
              ) : (
                <form onSubmit={handleAddUnit} className="mt-3 grid gap-3">
                  <label className="grid gap-1 text-sm font-medium text-[#435146]">
                    Property
                    <select className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]" value={selectedPropertyId ?? ""} onChange={(e) => { const id = Number(e.target.value) || null; setSelectedPropertyId(id); if (id) loadUnits(id); else setPropertyUnits([]); }} required>
                      <option value="">Select property…</option>
                      {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-[#435146]">
                    Unit Name
                    <input className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]" type="text" value={unitName} onChange={(e) => setUnitName(e.target.value)} required placeholder="e.g. Flat 101" />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-[#435146]">
                    Monthly Rent (₹)
                    <input className="rounded-md border border-[#c9d0c5] px-3 py-2 text-[#1b1f1d] outline-none focus:border-[#3d7b65]" type="number" min="1" step="1" value={unitRent} onChange={(e) => setUnitRent(e.target.value)} required placeholder="e.g. 12000" />
                  </label>
                  <button className="rounded-md bg-[#2f6f5e] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98aaa1]" type="submit" disabled={loading || !selectedPropertyId}>Add Unit</button>
                </form>
              )}

              {propertyUnits.length > 0 && (
                <div className="mt-4 border-t border-[#e3e8df] pt-3">
                  <p className="text-sm font-semibold text-[#435146]">Units</p>
                  <ul className="mt-2 grid gap-1">
                    {propertyUnits.map((u) => (
                      <li key={u.id} className="flex items-center justify-between rounded-md border border-[#e3e8df] px-3 py-2 text-sm">
                        <div className="min-w-0 flex-1">
                          <span className="font-medium">{u.name}</span>
                          <span className="ml-2 text-[#2f6f5e] font-semibold">{formatMoney(u.rent_amount)}/mo</span>
                        </div>
                        <button
                          type="button"
                          className="ml-2 flex-shrink-0 rounded p-1 text-[#c44d4d] transition-colors hover:bg-[#fde8e8]"
                          onClick={() => setDeletingUnit({ id: u.id, name: u.name })}
                          title={`Delete ${u.name}`}
                          disabled={loading}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {ownerDashboard ? (
          <section className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Metric label="Total Rent" value={formatMoney(ownerDashboard.totals.total_rent)} />
              <Metric label="Collected" value={formatMoney(ownerDashboard.totals.total_collected)} />
              <Metric label="Pending" value={formatMoney(ownerDashboard.totals.total_pending)} tone="warn" />
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
                {ownerDashboard.properties.map((property) => (
                  <tr key={property.property_id} className="border-t border-[#e3e8df]">
                    <Td>{property.property_name}</Td>
                    <Td>{property.total_units}</Td>
                    <Td>{property.occupied_units}</Td>
                    <Td>{formatMoney(property.total_rent)}</Td>
                    <Td>{formatMoney(property.total_collected)}</Td>
                    <Td>{formatMoney(property.total_pending)}</Td>
                  </tr>
                ))}
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
                </tr>
              </thead>
              <tbody>
                {ownerDashboard.rent_status.map((rent) => (
                  <tr key={rent.rent_id} className="border-t border-[#e3e8df]">
                    <Td>{rent.tenant_name}</Td>
                    <Td>{rent.property_name}</Td>
                    <Td>{rent.unit_name}</Td>
                    <Td>{formatPeriod(rent.month, rent.year)}</Td>
                    <Td>{formatMoney(rent.amount)}</Td>
                    <Td>{formatMoney(rent.paid)}</Td>
                    <Td>{formatMoney(rent.pending)}</Td>
                    <Td>
                      <StatusLabel status={rent.payment_status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </section>
        ) : null}

        {tenantDashboard ? (
          <section className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Metric label="Total Rent" value={formatMoney(tenantDashboard.summary.total_rent)} />
              <Metric label="Paid" value={formatMoney(tenantDashboard.summary.total_paid)} />
              <Metric label="Pending" value={formatMoney(tenantDashboard.summary.total_pending)} tone="warn" />
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
                {tenantDashboard.rent_history.map((rent) => (
                  <tr key={rent.rent_id} className="border-t border-[#e3e8df] align-top">
                    <Td>{rent.property_name}</Td>
                    <Td>{rent.unit_name}</Td>
                    <Td>{formatPeriod(rent.month, rent.year)}</Td>
                    <Td>{formatDate(rent.due_date)}</Td>
                    <Td>{formatMoney(rent.amount)}</Td>
                    <Td>{formatMoney(rent.paid)}</Td>
                    <Td>{formatMoney(rent.pending)}</Td>
                    <Td>
                      <StatusLabel status={rent.payment_status} />
                    </Td>
                    <Td>
                      <div className="flex flex-col gap-2">
                        {rent.payments.length ? (
                          rent.payments.map((payment) => (
                            <button
                              key={payment.payment_id}
                              className="w-fit rounded-md border border-[#2f6f5e] px-3 py-1 text-sm font-semibold text-[#2f6f5e]"
                              type="button"
                              onClick={() => downloadReceipt(payment.payment_id)}
                            >
                              Receipt #{payment.payment_id}
                            </button>
                          ))
                        ) : (
                          <span className="text-sm text-[#60715f]">No payment</span>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </section>
        ) : null}
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-[#d8ded2] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#933232]">Delete Account</h3>
            <p className="mt-2 text-sm text-[#435146]">
              Are you sure? This will permanently delete your account and all associated data. This action cannot be undone.
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
            <h3 className="text-lg font-semibold text-[#933232]">Delete Property</h3>
            <p className="mt-2 text-sm text-[#435146]">
              Delete <strong>&ldquo;{deletingProperty.name}&rdquo;</strong> and all its units? This action cannot be undone.
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
            <h3 className="text-lg font-semibold text-[#933232]">Delete Unit</h3>
            <p className="mt-2 text-sm text-[#435146]">
              Delete <strong>&ldquo;{deletingUnit.name}&rdquo;</strong> and all its associated data? This action cannot be undone.
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
      <p className={tone === "warn" ? "mt-2 text-2xl font-semibold text-[#9a4d21]" : "mt-2 text-2xl font-semibold"}>
        {value}
      </p>
    </div>
  );
}

function DataTable({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#d8ded2] bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
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

function StatusLabel({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const className =
    normalized === "paid"
      ? "bg-[#e6f4ea] text-[#23633d]"
      : normalized === "partial"
        ? "bg-[#fff3d6] text-[#765315]"
        : "bg-[#fde8e8] text-[#933232]";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${className}`}>
      {status}
    </span>
  );
}
