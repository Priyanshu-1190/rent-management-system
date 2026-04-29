"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

type Role = "owner" | "tenant";

type User = {
  id: number;
  email?: string;
  role: Role;
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

function decodeToken(token: string): User | null {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized));

    if (!["owner", "tenant"].includes(decoded.role)) return null;

    return {
      id: Number(decoded.id),
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export default function Home() {
  const [apiStatus, setApiStatus] = useState("Checking backend...");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [ownerDashboard, setOwnerDashboard] = useState<OwnerDashboard | null>(null);
  const [tenantDashboard, setTenantDashboard] = useState<TenantDashboard | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/db-test")
      .then(async (res) => {
        const body = await res.json();

        if (!res.ok) {
          throw new Error(body.error || "Backend request failed");
        }

        return body;
      })
      .then((res) => setApiStatus(`Database online: ${formatKolkataTime(res.data[0].now)}`))
      .catch((err) => {
        console.error(err);
        setApiStatus(err.message || "Unable to reach backend database test endpoint.");
      });
  }, []);

  const loadDashboard = async (authToken = token, role = user?.role) => {
    if (!authToken || !role) {
      setNotice("Login or add a valid token first.");
      return;
    }

    setLoading(true);
    setNotice("");

    try {
      const path = role === "owner" ? "/api/dashboard/owner" : "/api/dashboard/tenant";
      const response = await fetch(`${backendUrl}${path}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "Dashboard request failed");
      }

      if (role === "owner") {
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
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "Login failed");
      }

      setToken(body.token);
      setUser(body.user);
      await loadDashboard(body.token, body.user.role);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTokenLoad = async () => {
    const decodedUser = decodeToken(token);

    if (!decodedUser) {
      setNotice("Token is invalid or missing a supported role.");
      return;
    }

    setUser(decodedUser);
    await loadDashboard(token, decodedUser.role);
  };

  const downloadReceipt = async (paymentId: number) => {
    setNotice("");

    try {
      const response = await fetch(`${backendUrl}/api/receipts/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#1b1f1d]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-[#d8ded2] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#60715f]">
              Rent Management
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Dashboard</h1>
          </div>
          <div className="text-sm text-[#60715f]">
            <p>{apiStatus}</p>
            {user ? <p>Signed in as {user.role} #{user.id}</p> : null}
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
          <form
            onSubmit={handleLogin}
            className="rounded-lg border border-[#d8ded2] bg-white p-4 shadow-sm"
          >
            <h2 className="text-lg font-semibold">Login</h2>
            <div className="mt-4 grid gap-3">
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
            </div>
          </form>

          <section className="rounded-lg border border-[#d8ded2] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="grid flex-1 gap-1 text-sm font-medium text-[#435146]">
                JWT Token
                <textarea
                  className="min-h-24 rounded-md border border-[#c9d0c5] px-3 py-2 font-mono text-xs text-[#1b1f1d] outline-none focus:border-[#3d7b65]"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                />
              </label>
              <div className="flex gap-2">
                <button
                  className="rounded-md border border-[#2f6f5e] px-4 py-2 font-semibold text-[#2f6f5e] disabled:cursor-not-allowed disabled:border-[#98aaa1] disabled:text-[#98aaa1]"
                  type="button"
                  onClick={handleTokenLoad}
                  disabled={loading}
                >
                  Load
                </button>
                <button
                  className="rounded-md border border-[#2f6f5e] px-4 py-2 font-semibold text-[#2f6f5e] disabled:cursor-not-allowed disabled:border-[#98aaa1] disabled:text-[#98aaa1]"
                  type="button"
                  onClick={() => loadDashboard()}
                  disabled={loading}
                >
                  Refresh
                </button>
              </div>
            </div>
            {notice ? (
              <p className="mt-3 rounded-md border border-[#e0b15c] bg-[#fff9eb] px-3 py-2 text-sm text-[#6b4c18]">
                {notice}
              </p>
            ) : null}
          </section>
        </section>

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
