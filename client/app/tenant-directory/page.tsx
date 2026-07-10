"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

type Tenant = {
  type: "tenant" | "invited";
  tenant_id: number | null;
  name: string | null;
  email: string;
  property_name: string;
  unit_name: string;
  move_in_date: string | null;
  move_out_date: string | null;
  status: "active" | "past" | "invited" | "accepted" | "declined";
  deposit: number;
  tenancy_id: number;
};

function formatDate(value: string | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getStatusBadgeClass(status: string) {
  const baseClass = "px-3 py-1 rounded-full text-sm font-medium";
  switch (status) {
    case "active":
      return `${baseClass} bg-green-100 text-green-800`;
    case "past":
      return `${baseClass} bg-gray-100 text-gray-800`;
    case "invited":
      return `${baseClass} bg-blue-100 text-blue-800`;
    case "accepted":
      return `${baseClass} bg-cyan-100 text-cyan-800`;
    case "declined":
      return `${baseClass} bg-red-100 text-red-800`;
    default:
      return `${baseClass} bg-gray-100 text-gray-800`;
  }
}

function TableRowSkeleton({ showMoveOut = false }: { showMoveOut?: boolean }) {
  return (
    <tr className="animate-pulse border-t border-gray-200">
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
        <div className="h-3 bg-gray-200/70 rounded w-1/2"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </td>
      {showMoveOut && (
        <td className="px-6 py-4">
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </td>
      )}
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200/80 rounded-full w-16"></div>
      </td>
    </tr>
  );
}

export default function TenantDirectory() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "past" | "invited"
  >("all");

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/proxy/tenancies", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError("Access denied. Only property owners can view this.");
        } else if (response.status === 401) {
          setError("Please log in first.");
        } else {
          setError("Failed to fetch tenants");
        }
        return;
      }

      const data = await response.json();
      setTenants(data);
    } catch (err) {
      setError(
        "Error fetching tenants: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = useMemo(() => {
    switch (activeTab) {
      case "active":
        return tenants.filter((t) => t.status === "active");
      case "past":
        return tenants.filter((t) => t.status === "past");
      case "invited":
        return tenants.filter((t) => t.status === "invited");
      default:
        return tenants;
    }
  }, [tenants, activeTab]);

  const counts = useMemo(
    () => ({
      all: tenants.length,
      active: tenants.filter((t) => t.status === "active").length,
      past: tenants.filter((t) => t.status === "past").length,
      invited: tenants.filter((t) => t.status === "invited").length,
    }),
    [tenants],
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Tenant Directory
            </h1>
            <p className="text-gray-600">
              Manage and view all your tenants, past tenants, and invitations
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-lg shadow-sm font-medium transition-all duration-200"
          >
            <svg
              width="16"
              height="16"
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
            Close
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "all"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              All Tenants <span className="ml-1 text-sm">({counts.all})</span>
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "active"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Active <span className="ml-1 text-sm">({counts.active})</span>
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "past"
                  ? "border-gray-500 text-gray-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Past <span className="ml-1 text-sm">({counts.past})</span>
            </button>
            <button
              onClick={() => setActiveTab("invited")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "invited"
                  ? "border-blue-400 text-blue-500"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Invited <span className="ml-1 text-sm">({counts.invited})</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        {!loading && filteredTenants.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 text-[#2563eb]">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.003 9.003 0 00-18 0M12 10a4 4 0 11-8 0 4 4 0 018 0zM23 18.72a9 9 0 00-10.364-5.326M19 10a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              No Tenants Found
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              {activeTab === "all"
                ? "No tenants found. Create your first property and invite tenants."
                : `No ${activeTab} tenants.`}
            </p>
            <Link
              href="/?invite=true"
              className="inline-flex items-center gap-2 rounded-md bg-[#2563eb] hover:bg-[#1e40af] px-4 py-2 text-sm font-semibold text-white transition-all shadow-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Invite a Tenant
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Name / Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Move-in Date
                  </th>
                  {activeTab === "past" && (
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Move-out Date
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Deposit
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    <TableRowSkeleton showMoveOut={activeTab === "past"} />
                    <TableRowSkeleton showMoveOut={activeTab === "past"} />
                    <TableRowSkeleton showMoveOut={activeTab === "past"} />
                    <TableRowSkeleton showMoveOut={activeTab === "past"} />
                    <TableRowSkeleton showMoveOut={activeTab === "past"} />
                  </>
                ) : (
                  filteredTenants.map((tenant, idx) => (
                    <tr
                      key={tenant.tenancy_id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">
                          {tenant.name || "Pending"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {tenant.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {tenant.property_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {tenant.unit_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDate(tenant.move_in_date)}
                      </td>
                      {activeTab === "past" && (
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatDate(tenant.move_out_date)}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        {formatMoney(tenant.deposit)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={getStatusBadgeClass(tenant.status)}>
                          {tenant.status.charAt(0).toUpperCase() +
                            tenant.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
