"use client";

import { useEffect, useState } from "react";

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

interface TenantDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TenantDirectoryModal({ isOpen, onClose }: TenantDirectoryModalProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "past" | "invited">("all");

  const fetchTenants = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/proxy/tenancies", {
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch tenants");
      }

      const data = await response.json();
      setTenants(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTenants();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filterTenants = () => {
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
  };

  const filteredTenants = filterTenants();

  const counts = {
    all: tenants.length,
    active: tenants.filter((t) => t.status === "active").length,
    past: tenants.filter((t) => t.status === "past").length,
    invited: tenants.filter((t) => t.status === "invited").length,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-md p-4 sm:p-8 flex justify-center items-start">
      <div className="w-full max-w-6xl my-8 rounded-xl border border-[#d8ded2] bg-[#f7f8f3] p-6 sm:p-8 shadow-2xl relative">
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
          <button
            onClick={onClose}
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
          </button>
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
              All Tenants ({counts.all})
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "active"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Active ({counts.active})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "past"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Past ({counts.past})
            </button>
            <button
              onClick={() => setActiveTab("invited")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "invited"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Invited ({counts.invited})
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No tenants found in this section.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold">
                <tr>
                  <th scope="col" className="px-6 py-4">Name / Email</th>
                  <th scope="col" className="px-6 py-4">Property</th>
                  <th scope="col" className="px-6 py-4">Unit</th>
                  <th scope="col" className="px-6 py-4">Move-in Date</th>
                  <th scope="col" className="px-6 py-4">Deposit</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 border-t border-gray-200">
                {filteredTenants.map((tenant) => (
                  <tr key={`${tenant.type}-${tenant.tenancy_id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {tenant.name || "Pending"}
                      <div className="text-xs text-gray-500 font-normal mt-0.5">{tenant.email}</div>
                    </td>
                    <td className="px-6 py-4">{tenant.property_name}</td>
                    <td className="px-6 py-4">{tenant.unit_name}</td>
                    <td className="px-6 py-4">{formatDate(tenant.move_in_date)}</td>
                    <td className="px-6 py-4">{formatMoney(tenant.deposit)}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          tenant.status === "active"
                            ? "bg-green-100 text-green-800"
                            : tenant.status === "past"
                            ? "bg-gray-100 text-gray-800"
                            : tenant.status === "invited"
                            ? "bg-yellow-100 text-yellow-800"
                            : tenant.status === "accepted"
                            ? "bg-cyan-100 text-cyan-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
