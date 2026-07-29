import React, { useState } from "react";
import { TenantDashboard } from "../types";
import { formatMoney, formatPeriod, formatDate } from "../lib/formatters";
import { Metric, DataTable, Th, Td, StatusLabel } from "./ui/Primitives";

export function TenantDashboardView({
  dashboard,
  downloadReceipt,
}: {
  dashboard: TenantDashboard;
  downloadReceipt: (id: number) => void;
}) {
  const [expandedReceipts, setExpandedReceipts] = useState<Record<number, boolean>>({});

  const activeTenancies =
    dashboard.active_tenancies ||
    (dashboard.active_tenancy ? [dashboard.active_tenancy] : []);

  const groupedProperties = activeTenancies.reduce(
    (acc, tenancy) => {
      const existing = acc.find((p) => p.property_id === tenancy.property_id);
      if (existing) {
        existing.leases.push(tenancy);
      } else {
        acc.push({
          property_id: tenancy.property_id,
          property_name: tenancy.property_name,
          property_address: tenancy.property_address,
          property_lease_agreement: tenancy.property_lease_agreement,
          leases: [tenancy],
        });
      }
      return acc;
    },
    [] as Array<{
      property_id: number;
      property_name: string;
      property_address: string | null;
      property_lease_agreement?: string | null;
      leases: typeof activeTenancies;
    }>,
  );

  return (
    <section className="grid gap-4">
      {/* Metric Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <Metric
          label="Total Rent"
          value={formatMoney(dashboard.summary.total_rent)}
        />
        <Metric
          label="Paid"
          value={formatMoney(dashboard.summary.total_paid)}
        />
        <Metric
          label="Pending"
          value={formatMoney(dashboard.summary.total_pending)}
          tone="warn"
        />
      </div>

      {/* Grouped Properties / Leases */}
      {groupedProperties.length > 0 && (
        <div
          className={`grid gap-4 ${
            groupedProperties.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {groupedProperties.map((property) => {
            const hasAnyUnitSpecificAgreement = property.leases.some(
              (lease) =>
                lease.unit_lease_agreement !== null &&
                lease.unit_lease_agreement !== undefined &&
                lease.unit_lease_agreement.trim() !== "",
            );

            return (
              <div
                key={property.property_id}
                className="rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm flex flex-col gap-4"
              >
                <div className="flex justify-between items-start border-b border-[#e2e8f0] pb-3">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-[#2563eb]">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      {property.property_name}
                    </h3>
                    {property.property_address && (
                      <span className="block text-xs text-[#64748b] mt-0.5">
                        {property.property_address}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex rounded-full bg-[#f1f5f9] text-[#2563eb] px-2.5 py-0.5 text-xs font-semibold">
                    {property.leases.length > 1
                      ? `${property.leases.length} Active Leases`
                      : "Active Tenancy"}
                  </span>
                </div>

                {property.property_lease_agreement ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-[#334155]">
                      Property Lease Agreement
                    </span>
                    <div className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap bg-[#f8fafc] p-4 rounded-md border border-[#e2e8f0] max-h-40 overflow-y-auto font-mono">
                      {property.property_lease_agreement}
                    </div>
                  </div>
                ) : (
                  !hasAnyUnitSpecificAgreement && (
                    <div className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap bg-[#f8fafc] p-4 rounded-md border border-[#e2e8f0] max-h-40 overflow-y-auto font-mono">
                      <span className="text-[#64748b] italic">
                        No lease agreement uploaded yet.
                      </span>
                    </div>
                  )
                )}

                <div className="flex flex-col gap-5">
                  {property.leases.map((lease, index) => {
                    const showUnitAgreement =
                      lease.unit_lease_agreement !== null &&
                      lease.unit_lease_agreement !== undefined &&
                      lease.unit_lease_agreement.trim() !== "";

                    const showUnitPlaceholder =
                      !lease.unit_lease_agreement &&
                      !property.property_lease_agreement &&
                      hasAnyUnitSpecificAgreement;

                    return (
                      <div
                        key={lease.unit_name}
                        className={index > 0 ? "border-t border-[#e2e8f0] pt-4" : ""}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-bold text-[#334155]">
                            Unit {lease.unit_name}
                          </h4>
                        </div>

                        {showUnitAgreement && (
                          <div className="flex flex-col gap-1 mb-2">
                            <span className="text-xs font-semibold text-[#475569]">
                              Unit Specific Lease Agreement
                            </span>
                            <div className="mt-1 text-sm text-[#334155] leading-relaxed whitespace-pre-wrap bg-[#f8fafc] p-4 rounded-md border border-[#e2e8f0] max-h-40 overflow-y-auto font-mono">
                              {lease.unit_lease_agreement}
                            </div>
                          </div>
                        )}

                        {showUnitPlaceholder && (
                          <div className="mt-1 text-sm text-[#334155] leading-relaxed whitespace-pre-wrap bg-[#f8fafc] p-4 rounded-md border border-[#e2e8f0] max-h-40 overflow-y-auto font-mono">
                            <span className="text-[#64748b] italic">
                              No lease agreement uploaded yet.
                            </span>
                          </div>
                        )}

                        <div className="mt-3 grid gap-3 grid-cols-2 text-xs text-[#475569]">
                          <div>
                            <span className="block font-medium text-[#334155]">
                              Move-in Date
                            </span>
                            <span className="text-sm font-semibold text-[#0f172a]">
                              {formatDate(lease.move_in_date)}
                            </span>
                          </div>
                          <div>
                            <span className="block font-medium text-[#334155]">
                              Security Deposit
                            </span>
                            <span className="text-sm font-semibold text-[#23633d]">
                              {formatMoney(lease.deposit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rent History Table */}
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
          {dashboard.rent_history.length > 0 ? (
            dashboard.rent_history.map((rent) => (
              <tr key={rent.rent_id} className="border-t border-[#e2e8f0] align-top">
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
                      rent.payments.length === 1 ? (
                        <button
                          key={rent.payments[0].payment_id}
                          className="w-fit rounded-md border border-[#2563eb] hover:bg-[#eff6ff] px-3 py-1 text-sm font-semibold text-[#2563eb] transition-colors cursor-pointer"
                          type="button"
                          onClick={() => downloadReceipt(rent.payments[0].payment_id)}
                        >
                          Receipt #{rent.payments[0].payment_id}
                        </button>
                      ) : (
                        <div className="relative flex flex-col gap-1.5">
                          <button
                            type="button"
                            className="w-fit flex items-center gap-1.5 rounded-md border border-[#2563eb] hover:bg-[#eff6ff] px-3 py-1 text-sm font-semibold text-[#2563eb] transition-colors cursor-pointer"
                            onClick={() =>
                              setExpandedReceipts((prev) => ({
                                ...prev,
                                [rent.rent_id]: !prev[rent.rent_id],
                              }))
                            }
                          >
                            <span>Receipts ({rent.payments.length})</span>
                            <span
                              className={`inline-block transition-transform duration-200 ${
                                expandedReceipts[rent.rent_id] ? "rotate-180" : ""
                              }`}
                            >
                              ▾
                            </span>
                          </button>
                          <div
                            className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                              expandedReceipts[rent.rent_id] ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="flex flex-col gap-1 pl-2 pt-1 border-l-2 border-[#2563eb]/30">
                                {rent.payments.map((p) => (
                                  <button
                                    key={p.payment_id}
                                    className="text-left text-xs font-semibold text-[#2563eb] hover:underline cursor-pointer"
                                    onClick={() => downloadReceipt(p.payment_id)}
                                  >
                                    Receipt #{p.payment_id}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      <span className="text-sm text-[#475569]">No payment</span>
                    )}
                  </div>
                </Td>
              </tr>
            ))
          ) : (
            <tr className="border-t border-[#e2e8f0]">
              <td colSpan={9} className="py-4 text-center text-sm text-[#475569]">
                No rent history available.
              </td>
            </tr>
          )}
        </tbody>
      </DataTable>
    </section>
  );
}
