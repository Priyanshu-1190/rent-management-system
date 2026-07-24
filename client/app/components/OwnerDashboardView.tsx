import React, { useState, useMemo } from "react";
import { OwnerDashboard, Property, Unit } from "../types";
import { formatMoney, formatPeriod, formatDate } from "../lib/formatters";
import { Metric, DataTable, Th, Td, StatusLabel } from "./ui/Primitives";

function groupRentsByTenant(rentStatus: OwnerDashboard["rent_status"]) {
  const tenants = new Map<
    number,
    {
      tenantName: string;
      tenantEmail: string | null;
      rents: OwnerDashboard["rent_status"];
    }
  >();

  rentStatus.forEach((rent) => {
    const tenant = tenants.get(rent.tenant_id);

    if (tenant) {
      tenant.rents.push(rent);
      return;
    }

    tenants.set(rent.tenant_id, {
      tenantName: rent.tenant_name,
      tenantEmail: rent.tenant_email,
      rents: [rent],
    });
  });

  return Array.from(tenants, ([tenantId, tenant]) => ({
    tenantId,
    ...tenant,
  }));
}

function groupRentsByUnit(rents: OwnerDashboard["rent_status"]) {
  const units = new Map<
    string,
    {
      propertyId: number;
      unitId: number;
      propertyName: string;
      unitName: string;
      rents: OwnerDashboard["rent_status"];
    }
  >();

  rents.forEach((rent) => {
    const key = `${rent.property_id}-${rent.unit_id}`;
    const unit = units.get(key);
    if (unit) {
      unit.rents.push(rent);
      return;
    }
    units.set(key, {
      propertyId: rent.property_id,
      unitId: rent.unit_id,
      propertyName: rent.property_name,
      unitName: rent.unit_name,
      rents: [rent],
    });
  });

  return Array.from(units.values());
}

export function OwnerDashboardView({
  dashboard,
  onViewProperty,
  onLogPayment,
  downloadReceipt,
}: {
  dashboard: OwnerDashboard;
  onViewProperty: (property: any, e: React.MouseEvent) => void;
  onLogPayment: (rent: any) => void;
  downloadReceipt: (id: number) => void;
}) {
  // Local states for filtering, search, sorting and accordion states
  const [paymentSearchTerm, setPaymentSearchTerm] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentSortOption, setPaymentSortOption] = useState("tenant-name-asc");
  const [expandedTenantPayments, setExpandedTenantPayments] = useState<
    Record<number, boolean>
  >({});
  const [expandedUnitPayments, setExpandedUnitPayments] = useState<
    Record<string, boolean>
  >({});
  const [expandedReceipts, setExpandedReceipts] = useState<
    Record<number, boolean>
  >({});

  // Filtered and sorted list of tenants for Payment Status Accordion
  const sortedAndFilteredTenants = useMemo(() => {
    if (!dashboard.rent_status) return [];

    let filtered = dashboard.rent_status;

    // Apply text search
    if (paymentSearchTerm.trim()) {
      const q = paymentSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (rent) =>
          rent.tenant_name.toLowerCase().includes(q) ||
          rent.property_name.toLowerCase().includes(q) ||
          rent.unit_name.toLowerCase().includes(q),
      );
    }

    // Apply status filter
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter(
        (rent) => rent.payment_status === paymentStatusFilter,
      );
    }

    // Group rents by tenant
    const grouped = groupRentsByTenant(filtered);

    // Apply sorting
    return grouped.sort((a, b) => {
      if (paymentSortOption === "tenant-name-asc") {
        return a.tenantName.localeCompare(b.tenantName);
      }
      if (paymentSortOption === "tenant-name-desc") {
        return b.tenantName.localeCompare(a.tenantName);
      }
      if (paymentSortOption === "pending-amount-desc") {
        const sumA = a.rents.reduce((sum, r) => sum + r.pending, 0);
        const sumB = b.rents.reduce((sum, r) => sum + r.pending, 0);
        return sumB - sumA;
      }
      if (paymentSortOption === "pending-amount-asc") {
        const sumA = a.rents.reduce((sum, r) => sum + r.pending, 0);
        const sumB = b.rents.reduce((sum, r) => sum + r.pending, 0);
        return sumA - sumB;
      }
      if (paymentSortOption === "total-due-desc") {
        const sumA = a.rents.reduce((sum, r) => sum + r.total_due, 0);
        const sumB = b.rents.reduce((sum, r) => sum + r.total_due, 0);
        return sumB - sumA;
      }
      if (paymentSortOption === "overdue-count-desc") {
        const countA = a.rents.filter((r) => r.payment_status === "overdue").length;
        const countB = b.rents.filter((r) => r.payment_status === "overdue").length;
        return countB - countA;
      }
      return 0;
    });
  }, [
    dashboard.rent_status,
    paymentSearchTerm,
    paymentStatusFilter,
    paymentSortOption,
  ]);

  // Compute status counts for filter buttons
  const paymentCounts = useMemo(() => {
    const counts = { all: 0, overdue: 0, pending: 0, paid: 0 };
    if (!dashboard.rent_status) return counts;

    dashboard.rent_status.forEach((rent) => {
      counts.all++;
      if (rent.payment_status === "overdue") counts.overdue++;
      else if (rent.payment_status === "pending" || rent.payment_status === "upcoming") counts.pending++;
      else if (rent.payment_status === "paid") counts.paid++;
    });

    return counts;
  }, [dashboard.rent_status]);

  return (
    <section className="grid gap-4">
      {/* Metric summary grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Total Rent"
          value={formatMoney(dashboard.totals.total_rent)}
        />
        <Metric
          label="Collected"
          value={formatMoney(dashboard.totals.total_collected)}
        />
        <Metric
          label="Pending"
          value={formatMoney(dashboard.totals.total_pending)}
          tone="warn"
        />
        <Metric
          label="Occupancy"
          value={`${dashboard.totals.occupied_units}/${dashboard.totals.total_units}`}
        />
      </div>

      {/* Property Overview table */}
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
          {dashboard.properties.length > 0 ? (
            dashboard.properties.map((property) => (
              <tr
                key={property.property_id}
                data-property-row={property.property_id}
                className="border-t border-[#e2e8f0] hover:bg-[#f1f5f9]/50 cursor-pointer transition-colors"
                onClick={(e) => onViewProperty(property, e)}
              >
                <Td className="font-semibold text-[#2563eb] hover:underline">
                  <span className="property-name-text inline-block">
                    {property.property_name}
                  </span>
                </Td>
                <Td>{property.total_units}</Td>
                <Td>{property.occupied_units}</Td>
                <Td>{formatMoney(property.total_rent)}</Td>
                <Td>{formatMoney(property.total_collected)}</Td>
                <Td>{formatMoney(property.total_pending)}</Td>
              </tr>
            ))
          ) : (
            <tr className="border-t border-[#e2e8f0]">
              <td
                colSpan={6}
                className="py-4 text-center text-sm text-[#475569]"
              >
                No properties overview information available.
              </td>
            </tr>
          )}
        </tbody>
      </DataTable>

      {/* Payment Status section */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm overflow-hidden flex flex-col gap-5">
        {/* Header Panel */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
              <svg className="w-5 h-5 text-[#2563eb]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Payment Status
              {dashboard.rent_status.length > 0 && (
                <span className="ml-2 inline-flex items-center rounded-md bg-[#eff6ff] px-2 py-0.5 text-xs font-semibold text-[#2563eb]">
                  {sortedAndFilteredTenants.length} Tenant{sortedAndFilteredTenants.length === 1 ? "" : "s"}
                </span>
              )}
            </h2>
            <p className="text-xs text-[#64748b] mt-1">Track and manage rental collections, overdue records, and invoice receipts.</p>
          </div>

          {/* Search and Sort controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-[#94a3b8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search tenant, property, or unit..."
                value={paymentSearchTerm}
                onChange={(e) => setPaymentSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm text-[#0f172a] bg-slate-50 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
              />
              {paymentSearchTerm && (
                <button
                  type="button"
                  onClick={() => setPaymentSearchTerm("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#94a3b8] hover:text-[#475569] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={paymentSortOption}
                onChange={(e) => setPaymentSortOption(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-sm text-[#334155] bg-white border border-[#cbd5e1] rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all cursor-pointer font-medium"
              >
                <option value="tenant-name-asc">Sort: Tenant Name (A-Z)</option>
                <option value="tenant-name-desc">Sort: Tenant Name (Z-A)</option>
                <option value="pending-amount-desc">Sort: Pending (High to Low)</option>
                <option value="pending-amount-asc">Sort: Pending (Low to High)</option>
                <option value="total-due-desc">Sort: Total Due (High to Low)</option>
                <option value="overdue-count-desc">Sort: Overdue Count (High to Low)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#64748b]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 border-b border-[#e2e8f0] pb-3">
          <button
            type="button"
            onClick={() => setPaymentStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              paymentStatusFilter === "all"
                ? "bg-[#2563eb] text-white shadow-sm"
                : "bg-slate-100 text-[#475569] hover:bg-slate-200/70"
            }`}
          >
            All Tenants
            <span className={`ml-1.5 rounded px-1 py-0.25 text-[10px] ${
              paymentStatusFilter === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-[#334155]"
            }`}>
              {paymentCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentStatusFilter("overdue")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              paymentStatusFilter === "overdue"
                ? "bg-[#ef4444] text-white shadow-sm"
                : "bg-slate-100 text-[#c53030] hover:bg-red-50"
            }`}
          >
            Overdue
            <span className={`ml-1.5 rounded px-1 py-0.25 text-[10px] ${
              paymentStatusFilter === "overdue" ? "bg-white/20 text-white" : "bg-red-100 text-[#c53030]"
            }`}>
              {paymentCounts.overdue}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              paymentStatusFilter === "pending"
                ? "bg-[#f59e0b] text-white shadow-sm"
                : "bg-slate-100 text-[#b45309] hover:bg-amber-50"
            }`}
          >
            Pending / Due
            <span className={`ml-1.5 rounded px-1 py-0.25 text-[10px] ${
              paymentStatusFilter === "pending" ? "bg-white/20 text-white" : "bg-amber-100 text-[#b45309]"
            }`}>
              {paymentCounts.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentStatusFilter("paid")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              paymentStatusFilter === "paid"
                ? "bg-[#10b981] text-white shadow-sm"
                : "bg-slate-100 text-[#15803d] hover:bg-emerald-50"
            }`}
          >
            Paid
            <span className={`ml-1.5 rounded px-1 py-0.25 text-[10px] ${
              paymentStatusFilter === "paid" ? "bg-white/20 text-white" : "bg-emerald-100 text-[#15803d]"
            }`}>
              {paymentCounts.paid}
            </span>
          </button>
        </div>

        {/* Tenants Accordion List */}
        <div className="flex flex-col gap-4">
          {sortedAndFilteredTenants.length > 0 ? (
            sortedAndFilteredTenants.map((tenant) => {
              const totalDue = tenant.rents.reduce((sum, rent) => sum + rent.total_due, 0);
              const totalPending = tenant.rents.reduce((sum, rent) => sum + rent.pending, 0);
              const totalPaid = totalDue - totalPending;
              const unitCount = new Set(tenant.rents.map((rent) => rent.unit_id)).size;
              const overdueCount = tenant.rents.filter((rent) => rent.payment_status === "overdue").length;
              const openPaymentCount = tenant.rents.filter((rent) => rent.pending > 0).length;
              const isExpanded = expandedTenantPayments[tenant.tenantId];

              let summary = "All paid";
              let statusColor = "border-l-[#10b981]"; // Green
              let badgeColor = "bg-[#dcfce7] text-[#15803d]";

              if (overdueCount > 0) {
                summary = `${overdueCount} overdue`;
                statusColor = "border-l-[#ef4444]"; // Red
                badgeColor = "bg-[#fee2e2] text-[#b91c1c]";
              } else if (totalPending > 0) {
                summary = `${openPaymentCount} due`;
                statusColor = "border-l-[#f59e0b]"; // Amber
                badgeColor = "bg-[#fef3c7] text-[#a16207]";
              }

              // Initials for avatar
              const initials = tenant.tenantName
                ? tenant.tenantName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "T";

              const gradientClasses = [
                "from-blue-500 to-indigo-600",
                "from-purple-500 to-pink-600",
                "from-emerald-400 to-teal-600",
                "from-orange-400 to-red-500",
              ];
              const gradientIdx = (tenant.tenantId || 0) % gradientClasses.length;
              const avatarGradient = gradientClasses[gradientIdx];

              return (
                <React.Fragment key={tenant.tenantId}>
                  <div className={`rounded-xl border border-[#e2e8f0] bg-white transition-all duration-300 hover:shadow-md overflow-hidden border-l-4 ${statusColor}`}>
                    {/* Level 1 Header Button */}
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={`tenant-payments-${tenant.tenantId}`}
                      onClick={() =>
                        setExpandedTenantPayments((prev) => ({
                          ...prev,
                          [tenant.tenantId]: !prev[tenant.tenantId],
                        }))
                      }
                      className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Initials Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${avatarGradient} shadow-sm shrink-0`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#0f172a] text-base truncate">
                            {tenant.tenantName}
                          </p>
                          {tenant.tenantEmail && (
                            <p className="text-xs text-[#64748b] truncate mt-0.5">
                              {tenant.tenantEmail}
                            </p>
                          )}
                          <p className="text-[11px] text-[#94a3b8] mt-1 flex items-center gap-1.5 font-medium">
                            <span className="bg-slate-100 text-[#475569] px-2 py-0.5 rounded">
                              {unitCount} Unit{unitCount === 1 ? "" : "s"}
                            </span>
                            <span className="bg-slate-100 text-[#475569] px-2 py-0.5 rounded">
                              {tenant.rents.length} Payment{tenant.rents.length === 1 ? "" : "s"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Right statistics */}
                      <div className="flex flex-wrap md:flex-nowrap items-center justify-between md:justify-end gap-4 md:gap-8 grow md:grow-0">
                        <div className="text-left md:text-right">
                          <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Total Due</p>
                          <p className="font-bold text-sm text-[#0f172a] mt-0.5">
                            {formatMoney(totalDue)}
                          </p>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Collected</p>
                          <p className="font-bold text-sm text-[#10b981] mt-0.5">
                            {formatMoney(totalPaid)}
                          </p>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Pending</p>
                          <p className={`font-bold text-sm mt-0.5 ${totalPending > 0 ? "text-[#d97706]" : "text-[#10b981]"}`}>
                            {formatMoney(totalPending)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeColor}`}>
                            {summary}
                          </span>
                          <svg
                            className={`h-4.5 w-4.5 text-[#64748b] transition-transform duration-300 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                          </svg>
                        </div>
                      </div>
                    </button>

                    {/* Level 2: Nested Units */}
                    <div
                      id={`tenant-payments-${tenant.tenantId}`}
                      className={`grid transition-[grid-template-rows,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isExpanded
                          ? "grid-rows-[1fr] border-t border-[#e2e8f0]"
                          : "grid-rows-[0fr] border-t-0 border-transparent"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="bg-slate-50/40 p-4">
                          <div className="flex flex-col gap-4">
                            {groupRentsByUnit(tenant.rents).map((unit) => {
                              const unitKey = `${tenant.tenantId}-${unit.propertyId}-${unit.unitId}`;
                              const unitRents = unit.rents;

                              const isUnitExpanded =
                                expandedUnitPayments[unitKey] !== undefined
                                  ? expandedUnitPayments[unitKey]
                                  : groupRentsByUnit(tenant.rents).length === 1;

                              const unitTotalDue = unitRents.reduce((sum, r) => sum + r.total_due, 0);
                              const unitTotalPending = unitRents.reduce((sum, r) => sum + r.pending, 0);
                              const unitTotalPaid = unitTotalDue - unitTotalPending;
                              const unitOverdueCount = unitRents.filter((r) => r.payment_status === "overdue").length;
                              const unitOpenPaymentCount = unitRents.filter((r) => r.pending > 0).length;

                              let unitSummary = "All paid";
                              let unitBadgeColor = "bg-[#dcfce7] text-[#15803d]";
                              let unitBorderLeft = "border-l-[#10b981]";

                              if (unitOverdueCount > 0) {
                                unitSummary = `${unitOverdueCount} overdue`;
                                unitBadgeColor = "bg-[#fee2e2] text-[#b91c1c]";
                                unitBorderLeft = "border-l-[#ef4444]";
                              } else if (unitTotalPending > 0) {
                                unitSummary = `${unitOpenPaymentCount} due`;
                                unitBadgeColor = "bg-[#fef3c7] text-[#a16207]";
                                unitBorderLeft = "border-l-[#f59e0b]";
                              }

                              const currentExpanded =
                                expandedUnitPayments[unitKey] ??
                                (groupRentsByUnit(tenant.rents).length === 1);

                              return (
                                <div
                                  key={unitKey}
                                  className={`rounded-lg border border-[#e2e8f0] bg-white shadow-sm overflow-hidden border-l-3 ${unitBorderLeft} transition-all duration-200`}
                                >
                                  {/* Unit Toggle Button */}
                                  <button
                                    type="button"
                                    aria-expanded={isUnitExpanded}
                                    onClick={() =>
                                      setExpandedUnitPayments((prev) => ({
                                        ...prev,
                                        [unitKey]: !currentExpanded,
                                      }))
                                    }
                                    className="w-full grid gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/60 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] sm:items-center bg-[#f8fafc]/20 cursor-pointer"
                                  >
                                    <div>
                                      <p className="font-bold text-[#0f172a] text-sm flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-[#475569]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        {unit.propertyName}
                                        <span className="text-[#94a3b8] font-normal">·</span>
                                        <span className="text-[#2563eb]">Unit {unit.unitName}</span>
                                      </p>
                                      <p className="text-[11px] text-[#64748b] mt-0.5">
                                        {unitRents.length} Invoice{unitRents.length === 1 ? "" : "s"}
                                      </p>
                                    </div>

                                    <div className="text-left sm:text-right">
                                      <p className="text-[9px] font-semibold text-[#94a3b8] uppercase tracking-wider">Total Due</p>
                                      <p className="font-bold text-xs text-[#0f172a] mt-0.5">
                                        {formatMoney(unitTotalDue)}
                                      </p>
                                    </div>

                                    <div className="text-left sm:text-right">
                                      <p className="text-[9px] font-semibold text-[#94a3b8] uppercase tracking-wider">Paid</p>
                                      <p className="font-bold text-xs text-[#10b981] mt-0.5">
                                        {formatMoney(unitTotalPaid)}
                                      </p>
                                    </div>

                                    <div className="text-left sm:text-right">
                                      <p className="text-[9px] font-semibold text-[#94a3b8] uppercase tracking-wider">Pending</p>
                                      <p className={`font-bold text-xs mt-0.5 ${unitTotalPending > 0 ? "text-[#d97706]" : "text-[#10b981]"}`}>
                                        {formatMoney(unitTotalPending)}
                                      </p>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${unitBadgeColor}`}>
                                        {unitSummary}
                                      </span>
                                      <svg
                                        className={`h-4 w-4 text-[#64748b] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                          isUnitExpanded ? "rotate-180" : ""
                                        }`}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                                      </svg>
                                    </div>
                                  </button>

                                  {/* Level 3: Rents Table */}
                                  <div
                                    className={`grid transition-[grid-template-rows,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                      isUnitExpanded
                                        ? "grid-rows-[1fr] border-t border-[#e2e8f0]"
                                        : "grid-rows-[0fr] border-t-0 border-transparent"
                                    }`}
                                  >
                                    <div className="overflow-hidden">
                                      <div className="bg-white">
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-sm">
                                            <thead className="bg-slate-50/80 text-left text-xs font-bold uppercase tracking-wider text-[#64748b] border-b border-[#e2e8f0]">
                                              <tr>
                                                <th className="px-5 py-3">Billing Period</th>
                                                <th className="px-5 py-3">Payment Progress</th>
                                                <th className="px-5 py-3">Status</th>
                                                <th className="px-5 py-3 text-right">Actions</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#e2e8f0]">
                                              {unitRents.map((rent) => {
                                                const totalDueAmount = rent.amount + rent.late_fee;
                                                const paidPercent = totalDueAmount > 0
                                                  ? Math.min(Math.round((rent.paid / totalDueAmount) * 100), 100)
                                                  : 0;

                                                let progressColor = "bg-[#10b981]";
                                                if (rent.payment_status === "overdue") {
                                                  progressColor = "bg-[#ef4444]";
                                                } else if (rent.payment_status === "partial" || rent.payment_status === "pending") {
                                                  progressColor = "bg-[#f59e0b]";
                                                }

                                                return (
                                                  <tr key={rent.rent_id} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="px-5 py-4 font-semibold text-[#334155] whitespace-nowrap">
                                                      {formatPeriod(rent.month, rent.year)}
                                                    </td>
                                                    <td className="px-5 py-4 min-w-[200px]">
                                                      <div className="flex items-center justify-between text-xs text-[#334155] font-medium mb-1">
                                                        <span>{formatMoney(rent.paid)} paid</span>
                                                        <span className="text-[#64748b]">of {formatMoney(totalDueAmount)}</span>
                                                      </div>
                                                      {/* Visual Progress Bar */}
                                                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                                                        <div
                                                          style={{ width: `${paidPercent}%` }}
                                                          className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                                                        />
                                                      </div>
                                                      {rent.pending > 0 && (
                                                        <p className="mt-1 text-[11px] font-semibold text-[#b45309]">
                                                          {formatMoney(rent.pending)} remaining
                                                        </p>
                                                      )}
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                      <StatusLabel
                                                        status={rent.payment_status}
                                                        dueInDays={rent.due_in_days}
                                                        overdueByDays={rent.overdue_by_days}
                                                      />
                                                    </td>
                                                    <td className="px-5 py-4 text-right whitespace-nowrap">
                                                      <div className="flex items-center justify-end gap-2.5">
                                                        {rent.payments && rent.payments.length ? (
                                                          rent.payments.length === 1 ? (
                                                            <button
                                                              key={rent.payments[0].payment_id}
                                                              type="button"
                                                              onClick={() => downloadReceipt(rent.payments[0].payment_id)}
                                                              className="inline-flex items-center gap-1 rounded-lg border border-[#2563eb] hover:bg-[#eff6ff] px-2.5 py-1 text-xs font-bold text-[#2563eb] transition-all cursor-pointer"
                                                            >
                                                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                              </svg>
                                                              Receipt
                                                            </button>
                                                          ) : (
                                                            <div className="relative inline-block text-left">
                                                              <button
                                                                type="button"
                                                                onClick={() =>
                                                                  setExpandedReceipts((prev) => ({
                                                                    ...prev,
                                                                    [rent.rent_id]: !prev[rent.rent_id],
                                                                  }))
                                                                }
                                                                className="inline-flex items-center gap-1 rounded-lg border border-[#2563eb] hover:bg-[#eff6ff] px-2.5 py-1 text-xs font-bold text-[#2563eb] transition-all cursor-pointer"
                                                              >
                                                                <span>Receipts ({rent.payments.length})</span>
                                                                <span className={`inline-block transition-transform duration-200 ${expandedReceipts[rent.rent_id] ? "rotate-180" : ""}`}>
                                                                  ▾
                                                                </span>
                                                              </button>
                                                              {expandedReceipts[rent.rent_id] && (
                                                                <div className="absolute right-0 z-10 mt-1 w-40 origin-top-right rounded-lg bg-white shadow-lg border border-[#cbd5e1] p-1 flex flex-col gap-0.5 animate-modal-scale">
                                                                  {rent.payments.map((payment) => (
                                                                    <button
                                                                      key={payment.payment_id}
                                                                      type="button"
                                                                      onClick={() => downloadReceipt(payment.payment_id)}
                                                                      className="w-full text-left rounded-md px-2 py-1.5 text-xs font-semibold text-[#334155] hover:bg-slate-100 hover:text-[#2563eb] transition-all cursor-pointer"
                                                                    >
                                                                      Receipt #{payment.payment_id}
                                                                    </button>
                                                                  ))}
                                                                </div>
                                                              )}
                                                            </div>
                                                          )
                                                        ) : null}

                                                        {rent.payment_status !== "paid" && (
                                                          <button
                                                            type="button"
                                                            onClick={() => onLogPayment(rent)}
                                                            className="rounded-lg bg-[#2563eb] hover:bg-[#1e40af] px-3 py-1.5 text-xs font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                                          >
                                                            Log Payment
                                                          </button>
                                                        )}
                                                      </div>
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
              <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h4 className="text-sm font-semibold text-slate-700">No payment results found</h4>
              <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
