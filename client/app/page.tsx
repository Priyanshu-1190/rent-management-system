"use client";

import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import TenantDirectoryModal from "./components/TenantDirectoryModal";
import type { FormEvent, ReactNode } from "react";

type Role = "owner" | "tenant";

type User = {
  id: number;
  email?: string;
  role: Role;
  name?: string;
};

type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
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
  active_tenancy?: {
    property_id: number;
    property_name: string;
    property_address: string | null;
    property_lease_agreement?: string | null;
    unit_lease_agreement?: string | null;
    lease_agreement: string | null;
    unit_name: string;
    move_in_date: string | null;
    deposit: number;
  } | null;
  active_tenancies?: Array<{
    property_id: number;
    property_name: string;
    property_address: string | null;
    property_lease_agreement?: string | null;
    unit_lease_agreement?: string | null;
    lease_agreement: string | null;
    unit_name: string;
    move_in_date: string | null;
    deposit: number;
  }>;
};

type Property = {
  id: number;
  name: string;
  address: string | null;
  lease_agreement?: string | null;
  created_at: string;
  images?: Array<{ id: number; image_path: string }>;
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
  unit_id?: number;
  unit_name: string;
  property_name: string;
  rent_amount: number;
  due_day: number;
  late_fee_percentage: number;
  grace_period_days: number;
  unit_lease_agreement?: string | null;
  property_lease_agreement?: string | null;
  tenancy_id?: number | null;
  tenant_name?: string | null;
  tenant_email?: string | null;
  move_in_date?: string | null;
  deposit?: number;
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

/**
 * Extracted view for the Owner Dashboard
 */
function OwnerDashboardView({
  dashboard,
  onViewProperty,
  onLogPayment,
  downloadReceipt,
  expandedReceipts,
  setExpandedReceipts,
}: {
  dashboard: OwnerDashboard;
  onViewProperty: (property: any, e: React.MouseEvent) => void;
  onLogPayment: (rent: any) => void;
  downloadReceipt: (id: number) => void;
  expandedReceipts: Record<number, boolean>;
  setExpandedReceipts: React.Dispatch<
    React.SetStateAction<Record<number, boolean>>
  >;
}) {
  return (
    <section className="grid gap-4">
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
                No properties available.
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
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {dashboard.rent_status.length > 0 ? (
            dashboard.rent_status.map((rent) => (
              <tr key={rent.rent_id} className="border-t border-[#e2e8f0]">
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
                    {rent.payments?.length ? (
                      <div className="relative flex flex-col gap-1.5">
                        <button
                          type="button"
                          className="w-fit flex items-center gap-1.5 rounded-md border border-[#2563eb] hover:bg-[#eff6ff] px-3 py-1 text-sm font-semibold text-[#2563eb] transition-colors"
                          onClick={() =>
                            setExpandedReceipts((prev) => ({
                              ...prev,
                              [rent.rent_id]: !prev[rent.rent_id],
                            }))
                          }
                        >
                          <span>Receipts ({rent.payments.length})</span>
                          <span
                            className={`transition-transform ${expandedReceipts[rent.rent_id] ? "rotate-180" : ""}`}
                          >
                            ▾
                          </span>
                        </button>
                        {expandedReceipts[rent.rent_id] && (
                          <div className="flex flex-col gap-1 pl-2 border-l-2 border-[#2563eb]/30">
                            {rent.payments.map((p) => (
                              <button
                                key={p.payment_id}
                                className="text-left text-xs font-semibold text-[#2563eb] hover:underline"
                                onClick={() => downloadReceipt(p.payment_id)}
                              >
                                Receipt #{p.payment_id}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-[#475569]">No payment</span>
                    )}
                  </div>
                </Td>
                <Td className="text-right">
                  {rent.payment_status !== "paid" && (
                    <button
                      type="button"
                      className="rounded-md bg-[#2563eb] hover:bg-[#1e40af] px-3 py-1.5 text-xs font-semibold text-white transition-all"
                      onClick={() => onLogPayment(rent)}
                    >
                      Log Payment
                    </button>
                  )}
                </Td>
              </tr>
            ))
          ) : (
            <tr className="border-t border-[#e2e8f0]">
              <td
                colSpan={10}
                className="py-4 text-center text-sm text-[#475569]"
              >
                No payment status information available.
              </td>
            </tr>
          )}
        </tbody>
      </DataTable>
    </section>
  );
}

/**
 * Extracted view for the Tenant Dashboard
 */
function TenantDashboardView({
  dashboard,
  downloadReceipt,
  expandedReceipts,
  setExpandedReceipts,
}: {
  dashboard: TenantDashboard;
  downloadReceipt: (id: number) => void;
  expandedReceipts: Record<number, boolean>;
  setExpandedReceipts: React.Dispatch<
    React.SetStateAction<Record<number, boolean>>
  >;
}) {
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

      {groupedProperties.length > 0 && (
        <div
          className={`grid gap-4 ${groupedProperties.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"}`}
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
                        className={
                          index > 0 ? "border-t border-[#e2e8f0] pt-4" : ""
                        }
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
              <tr
                key={rent.rent_id}
                className="border-t border-[#e2e8f0] align-top"
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
                      <div className="relative flex flex-col gap-1.5">
                        <button
                          type="button"
                          className="w-fit flex items-center gap-1.5 rounded-md border border-[#2563eb] hover:bg-[#eff6ff] px-3 py-1 text-sm font-semibold text-[#2563eb] transition-colors"
                          onClick={() =>
                            setExpandedReceipts((prev) => ({
                              ...prev,
                              [rent.rent_id]: !prev[rent.rent_id],
                            }))
                          }
                        >
                          <span>Receipts ({rent.payments.length})</span>
                          <span
                            className={`transition-transform ${expandedReceipts[rent.rent_id] ? "rotate-180" : ""}`}
                          >
                            ▾
                          </span>
                        </button>
                        {expandedReceipts[rent.rent_id] && (
                          <div className="flex flex-col gap-1 pl-2 border-l-2 border-[#2563eb]/30 mt-1">
                            {rent.payments.map((p) => (
                              <button
                                key={p.payment_id}
                                className="w-fit text-left text-xs font-semibold text-[#2563eb] hover:underline"
                                onClick={() => downloadReceipt(p.payment_id)}
                              >
                                Receipt #{p.payment_id}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-[#475569]">No payment</span>
                    )}
                  </div>
                </Td>
              </tr>
            ))
          ) : (
            <tr className="border-t border-[#e2e8f0]">
              <td
                colSpan={9}
                className="py-4 text-center text-sm text-[#475569]"
              >
                No rent history available.
              </td>
            </tr>
          )}
        </tbody>
      </DataTable>
    </section>
  );
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const [viewingPropertyDetails, setViewingPropertyDetails] = useState<
    any | null
  >(null);

  // Lease agreement states
  const [editingLeaseProp, setEditingLeaseProp] = useState<Property | null>(
    null,
  );
  const [editLeaseText, setEditLeaseText] = useState("");
  const [showLeaseEditModal, setShowLeaseEditModal] = useState(false);

  // Property images states
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [selectedAddFiles, setSelectedAddFiles] = useState<File[]>([]);

  // Toast notifications states
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Unit lease agreement states
  const [editingUnitLease, setEditingUnitLease] = useState<UnitDetails | null>(
    null,
  );
  const [unitLeaseText, setUnitLeaseText] = useState("");
  const [unitLeaseMode, setUnitLeaseMode] = useState<"inherit" | "custom">(
    "inherit",
  );
  const [showUnitLeaseModal, setShowUnitLeaseModal] = useState(false);

  // Creation-time lease agreement states
  const [propLeaseAgreement, setPropLeaseAgreement] = useState("");
  const [addUnitLeaseMode, setAddUnitLeaseMode] = useState<
    "inherit" | "custom"
  >("inherit");
  const [addUnitLeaseText, setAddUnitLeaseText] = useState("");

  const [viewingPropertyUnits, setViewingPropertyUnits] = useState<Unit[]>([]);

  // Receipt expansion states
  const [expandedReceipts, setExpandedReceipts] = useState<
    Record<number, boolean>
  >({});

  // Log payment state
  const [loggingPaymentRent, setLoggingPaymentRent] = useState<
    OwnerDashboard["rent_status"][number] | null
  >(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentTxnId, setPaymentTxnId] = useState("");
  // Morph transition state for property details
  const [morphStartRect, setMorphStartRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    propertyId: number;
  } | null>(null);
  const [morphPhase, setMorphPhase] = useState<
    "idle" | "morphing-in" | "expanded" | "morphing-out"
  >("idle");
  const [preloadedUnits, setPreloadedUnits] = useState<Record<number, Unit[]>>(
    {},
  );
  const modalRef = useRef<HTMLDivElement>(null);
  const [titleStartRect, setTitleStartRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  // Morph transition state for unit details
  const [unitMorphStartRect, setUnitMorphStartRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    unitId: number;
  } | null>(null);
  const [unitMorphPhase, setUnitMorphPhase] = useState<
    "idle" | "morphing-in" | "expanded" | "morphing-out"
  >("idle");
  const unitModalRef = useRef<HTMLDivElement>(null);
  const [unitTitleStartRect, setUnitTitleStartRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const unitTitleRef = useRef<HTMLHeadingElement>(null);

  // Morph transition state for editing property
  const [editPropMorphStartRect, setEditPropMorphStartRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    propertyId: number;
  } | null>(null);
  const [editPropMorphPhase, setEditPropMorphPhase] = useState<
    "idle" | "morphing-in" | "expanded" | "morphing-out"
  >("idle");
  const editPropModalRef = useRef<HTMLDivElement>(null);
  const [editPropTitleStartRect, setEditPropTitleStartRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const editPropTitleRef = useRef<HTMLHeadingElement>(null);

  // Morph transition state for editing unit
  const [editUnitMorphStartRect, setEditUnitMorphStartRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    unitId: number;
  } | null>(null);
  const [editUnitMorphPhase, setEditUnitMorphPhase] = useState<
    "idle" | "morphing-in" | "expanded" | "morphing-out"
  >("idle");
  const editUnitModalRef = useRef<HTMLDivElement>(null);
  const [editUnitTitleStartRect, setEditUnitTitleStartRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const editUnitTitleRef = useRef<HTMLHeadingElement>(null);

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

  const handleScrollTo = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

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

  // Listen for ?invite=true query parameter to trigger invite modal
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("invite") === "true") {
        setShowInvitesModal(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, []);

  // Intercept notice banner messages and route them to Toast alerts for logged-in users
  useEffect(() => {
    if (notice && user) {
      const lower = notice.toLowerCase();
      const isError =
        lower.includes("fail") ||
        lower.includes("error") ||
        lower.includes("denied") ||
        lower.includes("invalid") ||
        lower.includes("unable");
      const isSuccess =
        lower.includes("success") ||
        lower.includes("create") ||
        lower.includes("delete") ||
        lower.includes("update") ||
        lower.includes("save") ||
        lower.includes("register") ||
        lower.includes("login") ||
        lower.includes("sent") ||
        lower.includes("online") ||
        lower.includes("paid") ||
        lower.includes("cleared") ||
        lower.includes("accepted") ||
        lower.includes("declined") ||
        lower.includes("deleted");

      addToast(notice, isError ? "error" : isSuccess ? "success" : "info");
      setNotice("");
    }
  }, [notice, user]);

  // Morph animation lifecycle management using FLIP
  useLayoutEffect(() => {
    if (
      viewingPropertyDetails &&
      modalRef.current &&
      morphStartRect &&
      morphPhase === "morphing-in"
    ) {
      const modal = modalRef.current;
      const finalRect = modal.getBoundingClientRect();

      let tDeltaX = 0;
      let tDeltaY = 0;
      let tScale = 1;
      let title = null;

      if (titleRef.current && titleStartRect) {
        title = titleRef.current;
        const titleFinalRect = title.getBoundingClientRect();
        tDeltaX = titleStartRect.left - titleFinalRect.left;
        tDeltaY = titleStartRect.top - titleFinalRect.top;
        tScale = titleStartRect.height / titleFinalRect.height;
      }

      const deltaX = morphStartRect.left - finalRect.left;
      const deltaY = morphStartRect.top - finalRect.top;
      const scaleX = morphStartRect.width / finalRect.width;
      const scaleY = morphStartRect.height / finalRect.height;

      modal.style.transition = "none";
      modal.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
      modal.style.opacity = "1";
      modal.style.transformOrigin = "top left";

      if (title && scaleX && scaleY) {
        title.style.transition = "none";
        title.style.transform = `translate3d(${tDeltaX / scaleX}px, ${tDeltaY / scaleY}px, 0) scale(${tScale / scaleX}, ${tScale / scaleY})`;
        title.style.transformOrigin = "top left";
        title.style.color = "#2563eb";
      }

      modal.offsetHeight;

      modal.style.transition =
        "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease";
      modal.style.transform = "translate3d(0, 0, 0) scale(1)";
      modal.style.opacity = "1";

      if (title) {
        title.style.transition =
          "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), color 250ms ease";
        title.style.transform = "translate3d(0, 0, 0) scale(1)";
        title.style.color = "#0f172a";
      }

      const timer = setTimeout(() => {
        setMorphPhase("expanded");
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [viewingPropertyDetails, morphStartRect, titleStartRect, morphPhase]);

  // Morph animation lifecycle management using FLIP for unit details
  useLayoutEffect(() => {
    if (
      viewingUnitDetails &&
      unitModalRef.current &&
      unitMorphStartRect &&
      unitMorphPhase === "morphing-in"
    ) {
      const modal = unitModalRef.current;
      const finalRect = modal.getBoundingClientRect();

      let tDeltaX = 0;
      let tDeltaY = 0;
      let tScale = 1;
      let title = null;

      if (unitTitleRef.current && unitTitleStartRect) {
        title = unitTitleRef.current;
        const titleFinalRect = title.getBoundingClientRect();
        tDeltaX = unitTitleStartRect.left - titleFinalRect.left;
        tDeltaY = unitTitleStartRect.top - titleFinalRect.top;
        tScale = unitTitleStartRect.height / titleFinalRect.height;
      }

      const deltaX = unitMorphStartRect.left - finalRect.left;
      const deltaY = unitMorphStartRect.top - finalRect.top;
      const scaleX = unitMorphStartRect.width / finalRect.width;
      const scaleY = unitMorphStartRect.height / finalRect.height;

      modal.style.transition = "none";
      modal.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
      modal.style.opacity = "1";
      modal.style.transformOrigin = "top left";

      if (title && scaleX && scaleY) {
        title.style.transition = "none";
        title.style.transform = `translate3d(${tDeltaX / scaleX}px, ${tDeltaY / scaleY}px, 0) scale(${tScale / scaleX}, ${tScale / scaleY})`;
        title.style.transformOrigin = "top left";
        title.style.color = "#2563eb";
      }

      modal.offsetHeight;

      modal.style.transition =
        "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease";
      modal.style.transform = "translate3d(0, 0, 0) scale(1)";
      modal.style.opacity = "1";

      if (title) {
        title.style.transition =
          "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), color 250ms ease";
        title.style.transform = "translate3d(0, 0, 0) scale(1)";
        title.style.color = "#0f172a";
      }

      const timer = setTimeout(() => {
        setUnitMorphPhase("expanded");
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [
    viewingUnitDetails,
    unitMorphStartRect,
    unitTitleStartRect,
    unitMorphPhase,
  ]);

  // Morph animation lifecycle management using FLIP for editing property
  useLayoutEffect(() => {
    if (
      editingProperty &&
      editPropModalRef.current &&
      editPropMorphStartRect &&
      editPropMorphPhase === "morphing-in"
    ) {
      const modal = editPropModalRef.current;
      const finalRect = modal.getBoundingClientRect();

      let tDeltaX = 0;
      let tDeltaY = 0;
      let tScale = 1;
      let title = null;

      if (editPropTitleRef.current && editPropTitleStartRect) {
        title = editPropTitleRef.current;
        const titleFinalRect = title.getBoundingClientRect();
        tDeltaX = editPropTitleStartRect.left - titleFinalRect.left;
        tDeltaY = editPropTitleStartRect.top - titleFinalRect.top;
        tScale = editPropTitleStartRect.height / titleFinalRect.height;
      }

      const deltaX = editPropMorphStartRect.left - finalRect.left;
      const deltaY = editPropMorphStartRect.top - finalRect.top;
      const scaleX = editPropMorphStartRect.width / finalRect.width;
      const scaleY = editPropMorphStartRect.height / finalRect.height;

      modal.style.transition = "none";
      modal.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
      modal.style.opacity = "1";
      modal.style.transformOrigin = "top left";

      if (title && scaleX && scaleY) {
        title.style.transition = "none";
        title.style.transform = `translate3d(${tDeltaX / scaleX}px, ${tDeltaY / scaleY}px, 0) scale(${tScale / scaleX}, ${tScale / scaleY})`;
        title.style.transformOrigin = "top left";
        title.style.color = "#2563eb";
      }

      modal.offsetHeight;

      modal.style.transition =
        "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease";
      modal.style.transform = "translate3d(0, 0, 0) scale(1)";
      modal.style.opacity = "1";

      if (title) {
        title.style.transition =
          "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), color 250ms ease";
        title.style.transform = "translate3d(0, 0, 0) scale(1)";
        title.style.color = "#2563eb";
      }

      const timer = setTimeout(() => {
        setEditPropMorphPhase("expanded");
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [
    editingProperty,
    editPropMorphStartRect,
    editPropTitleStartRect,
    editPropMorphPhase,
  ]);

  // Morph animation lifecycle management using FLIP for editing unit
  useLayoutEffect(() => {
    if (
      editingUnit &&
      editUnitModalRef.current &&
      editUnitMorphStartRect &&
      editUnitMorphPhase === "morphing-in"
    ) {
      const modal = editUnitModalRef.current;
      const finalRect = modal.getBoundingClientRect();

      let tDeltaX = 0;
      let tDeltaY = 0;
      let tScale = 1;
      let title = null;

      if (editUnitTitleRef.current && editUnitTitleStartRect) {
        title = editUnitTitleRef.current;
        const titleFinalRect = title.getBoundingClientRect();
        tDeltaX = editUnitTitleStartRect.left - titleFinalRect.left;
        tDeltaY = editUnitTitleStartRect.top - titleFinalRect.top;
        tScale = editUnitTitleStartRect.height / titleFinalRect.height;
      }

      const deltaX = editUnitMorphStartRect.left - finalRect.left;
      const deltaY = editUnitMorphStartRect.top - finalRect.top;
      const scaleX = editUnitMorphStartRect.width / finalRect.width;
      const scaleY = editUnitMorphStartRect.height / finalRect.height;

      modal.style.transition = "none";
      modal.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
      modal.style.opacity = "1";
      modal.style.transformOrigin = "top left";

      if (title && scaleX && scaleY) {
        title.style.transition = "none";
        title.style.transform = `translate3d(${tDeltaX / scaleX}px, ${tDeltaY / scaleY}px, 0) scale(${tScale / scaleX}, ${tScale / scaleY})`;
        title.style.transformOrigin = "top left";
        title.style.color = "#2563eb";
      }

      modal.offsetHeight;

      modal.style.transition =
        "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease";
      modal.style.transform = "translate3d(0, 0, 0) scale(1)";
      modal.style.opacity = "1";

      if (title) {
        title.style.transition =
          "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), color 250ms ease";
        title.style.transform = "translate3d(0, 0, 0) scale(1)";
        title.style.color = "#2563eb";
      }

      const timer = setTimeout(() => {
        setEditUnitMorphPhase("expanded");
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [
    editingUnit,
    editUnitMorphStartRect,
    editUnitTitleStartRect,
    editUnitMorphPhase,
  ]);

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

  const prefetchPropertyUnits = async (propsList: Property[]) => {
    const cache: Record<number, Unit[]> = {};
    await Promise.all(
      propsList.map(async (p) => {
        try {
          const res = await fetch(`/api/proxy/units/property/${p.id}`);
          if (res.ok) {
            const body = await res.json();
            cache[p.id] = body;
          }
        } catch (err) {
          console.error("Prefetch units failed for property", p.id, err);
        }
      }),
    );
    setPreloadedUnits((prev) => ({ ...prev, ...cache }));
  };

  // ── Owner: load properties ──
  const loadProperties = async () => {
    try {
      const res = await fetch("/api/proxy/properties");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load properties");
      setProperties(body);
      prefetchPropertyUnits(body);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Failed to load properties",
      );
    }
  };

  // ── Owner: add property ──
  const handleAddProperty = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");

    // Local file size validation (10MB limit)
    for (let i = 0; i < selectedAddFiles.length; i++) {
      const file = selectedAddFiles[i];
      if (file.size > 10 * 1024 * 1024) {
        addToast(`File "${file.name}" is too large (maximum 10MB)`, "error");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/proxy/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: propName,
          address: propAddress || undefined,
          lease_agreement: propLeaseAgreement || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to add property");

      if (selectedAddFiles.length > 0) {
        const formData = new FormData();
        selectedAddFiles.forEach((file) => {
          formData.append("images", file);
        });
        const uploadRes = await fetch(
          `/api/proxy/properties/${body.id}/images`,
          {
            method: "POST",
            body: formData,
          },
        );
        if (!uploadRes.ok) {
          const uploadBody = await uploadRes.json();
          addToast(
            `Property created, but picture upload failed: ${uploadBody.error || "Unknown error"}`,
            "error",
          );
        }
      }

      setPropName("");
      setPropAddress("");
      setPropLeaseAgreement("");
      setSelectedAddFiles([]);
      await loadProperties();
      await loadDashboard();
      if (selectedAddFiles.length > 0) {
        addToast(`Property "${body.name}" created with pictures!`, "success");
      } else {
        addToast(`Property "${body.name}" created!`, "success");
      }
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to add property",
        "error",
      );
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
      handleCloseEditProperty();
      await loadProperties();
      await loadDashboard();
      await loadAvailableUnits();
      if (
        viewingPropertyDetails &&
        viewingPropertyDetails.property_id === editingProperty.id
      ) {
        setViewingPropertyDetails((prev: any) =>
          prev ? { ...prev, property_name: editPropName } : null,
        );
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

  // ── Owner: save lease agreement ──
  const handleSaveLeaseAgreement = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!editingLeaseProp) return;
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch(
        `/api/proxy/properties/${editingLeaseProp.id}/lease-agreement`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lease_agreement: editLeaseText,
          }),
        },
      );
      const body = await res.json();
      if (!res.ok)
        throw new Error(body.error || "Failed to save lease agreement");

      // Update properties list state
      setProperties((prev) =>
        prev.map((p) =>
          p.id === editingLeaseProp.id
            ? { ...p, lease_agreement: editLeaseText }
            : p,
        ),
      );

      // Update viewing property details state if currently viewing it
      if (
        viewingPropertyDetails &&
        viewingPropertyDetails.property_id === editingLeaseProp.id
      ) {
        setViewingPropertyDetails((prev: any) =>
          prev ? { ...prev, lease_agreement: editLeaseText } : null,
        );
      }

      setShowLeaseEditModal(false);
      setEditingLeaseProp(null);
      setEditLeaseText("");
      setNotice(`Lease agreement for "${editingLeaseProp.name}" saved!`);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Failed to save lease agreement",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Owner: upload property pictures ──
  const handleUploadImages = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (
      !event.target.files ||
      event.target.files.length === 0 ||
      !viewingPropertyDetails
    )
      return;
    setNotice("");

    // Local file size validation (10MB limit)
    for (let i = 0; i < event.target.files.length; i++) {
      const file = event.target.files[i];
      if (file.size > 10 * 1024 * 1024) {
        addToast(`File "${file.name}" is too large (maximum 10MB)`, "error");
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < event.target.files.length; i++) {
        formData.append("images", event.target.files[i]);
      }
      const res = await fetch(
        `/api/proxy/properties/${viewingPropertyDetails.property_id}/images`,
        {
          method: "POST",
          body: formData,
        },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to upload images");

      await loadProperties();
      await loadDashboard();
      addToast(
        `Uploaded ${event.target.files.length} property picture(s) successfully!`,
        "success",
      );
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to upload images",
        "error",
      );
    } finally {
      setLoading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  // ── Owner: delete property picture ──
  const handleDeleteImage = async (imageId: number) => {
    if (!confirm("Are you sure you want to delete this picture?")) return;
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch(`/api/proxy/properties/images/${imageId}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to delete image");

      await loadProperties();
      await loadDashboard();
      addToast("Property picture deleted!", "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to delete image",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Owner: save unit lease agreement ──
  const handleSaveUnitLeaseAgreement = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!editingUnitLease || !editingUnitLease.unit_id) return;
    setLoading(true);
    setNotice("");
    const leaseToSave = unitLeaseMode === "custom" ? unitLeaseText : null;
    try {
      const res = await fetch(
        `/api/proxy/units/${editingUnitLease.unit_id}/lease-agreement`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lease_agreement: leaseToSave,
          }),
        },
      );
      const body = await res.json();
      if (!res.ok)
        throw new Error(body.error || "Failed to save unit lease agreement");

      // Update unit details modal state
      setViewingUnitDetails((prev) =>
        prev ? { ...prev, unit_lease_agreement: leaseToSave } : null,
      );

      // Refresh units list in details modal if property details is open
      if (viewingPropertyDetails) {
        await refreshViewingPropertyUnits(viewingPropertyDetails.property_id);
      }

      setShowUnitLeaseModal(false);
      setEditingUnitLease(null);
      setUnitLeaseText("");
      setNotice(`Lease agreement for unit updated!`);
    } catch (err) {
      setNotice(
        err instanceof Error
          ? err.message
          : "Failed to save unit lease agreement",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKickTenant = async (tenancyId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this tenant from the unit? This will end the active tenancy.",
    );
    if (!confirmed) return;

    setLoading(true);
    setNotice("");
    try {
      const res = await fetch(`/api/proxy/tenancies/${tenancyId}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to remove tenant");

      setNotice("Tenant removed successfully.");

      // Refresh dashboard overview
      await loadDashboard();

      // Refresh unit details modal view
      if (viewingUnitDetails?.unit_id) {
        await handleViewUnitDetails(viewingUnitDetails.unit_id);
      }

      // Refresh units list in details modal if property details is open
      if (viewingPropertyDetails) {
        await refreshViewingPropertyUnits(viewingPropertyDetails.property_id);
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to remove tenant");
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
      setPreloadedUnits((prev) => ({ ...prev, [propertyId]: body }));
    } catch {
      setPropertyUnits([]);
    }
  };

  const handleViewUnitDetails = async (
    unitId: number,
    e?: React.MouseEvent,
  ) => {
    setLoading(true);
    setNotice("");
    const animationStartTime = Date.now();

    // Look up cached unit info so we can morph/render immediately
    const unit =
      viewingPropertyUnits.find((u) => u.id === unitId) ||
      propertyUnits.find((u) => u.id === unitId);

    if (unit) {
      const prop =
        properties.find((p) => p.id === unit.property_id) ||
        viewingPropertyDetails;
      const propertyName = prop ? prop.name || prop.property_name : "";

      setViewingUnitDetails({
        unit_name: unit.name,
        property_name: propertyName || "",
        rent_amount: unit.rent_amount,
        due_day: unit.due_day,
        late_fee_percentage: unit.late_fee_percentage,
        grace_period_days: unit.grace_period_days,
        tenancy_id: undefined, // undefined tenancy_id represents loading state
      });
    }

    if (e) {
      const button = e.currentTarget as HTMLElement;
      const container = button.closest("li, tr") as HTMLElement;
      const nameEl = container
        ? (container.querySelector(".unit-name-text") as HTMLElement)
        : null;
      const rect = nameEl
        ? nameEl.getBoundingClientRect()
        : container
          ? container.getBoundingClientRect()
          : button.getBoundingClientRect();

      setUnitMorphStartRect({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        unitId: unitId,
      });

      if (nameEl) {
        const nameRect = nameEl.getBoundingClientRect();
        setUnitTitleStartRect({
          left: nameRect.left,
          top: nameRect.top,
          width: nameRect.width,
          height: nameRect.height,
        });
      }

      setUnitMorphPhase("morphing-in");
    }

    try {
      const res = await fetch(`/api/proxy/units/${unitId}/details`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load unit details");

      const elapsed = Date.now() - animationStartTime;
      const remainingTime = 300 - elapsed;
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      // Update with full unit details including lease/tenant
      setViewingUnitDetails(body);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Failed to load unit details",
      );
      if (!unit) {
        // If we didn't have cached data and loading failed, close modal
        setUnitMorphPhase("idle");
        setUnitMorphStartRect(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewPropertyDetails = async (
    property: any,
    e?: React.MouseEvent,
  ) => {
    const propertyId = property.property_id;
    const cachedUnits = preloadedUnits[propertyId] || [];

    setViewingPropertyUnits(cachedUnits);
    const animationStartTime = Date.now();

    if (e) {
      const row = e.currentTarget as HTMLElement;
      const nameEl = row.querySelector(".property-name-text") as HTMLElement;
      const rect = nameEl
        ? nameEl.getBoundingClientRect()
        : row.getBoundingClientRect();
      setMorphStartRect({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        propertyId: propertyId,
      });

      if (nameEl) {
        const nameRect = nameEl.getBoundingClientRect();
        setTitleStartRect({
          left: nameRect.left,
          top: nameRect.top,
          width: nameRect.width,
          height: nameRect.height,
        });
      }

      setMorphPhase("morphing-in");
    }

    const fullProperty = properties.find((p) => p.id === propertyId);
    setViewingPropertyDetails({
      ...property,
      lease_agreement: fullProperty?.lease_agreement || null,
    });

    try {
      const res = await fetch(`/api/proxy/units/property/${propertyId}`);
      const body = await res.json();
      if (res.ok) {
        const elapsed = Date.now() - animationStartTime;
        const remainingTime = 300 - elapsed;
        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }
        setViewingPropertyUnits(body);
        setPreloadedUnits((prev) => ({ ...prev, [propertyId]: body }));
      }
    } catch (err) {
      console.error("Revalidation of property units failed", err);
    }
  };

  const handleClosePropertyDetails = () => {
    if (!modalRef.current || !morphStartRect) {
      setViewingPropertyDetails(null);
      setMorphPhase("idle");
      setMorphStartRect(null);
      return;
    }

    const modal = modalRef.current;
    let latestRect = morphStartRect;

    const rowElement = document.querySelector(
      `[data-property-row="${morphStartRect.propertyId}"]`,
    );
    if (rowElement) {
      const nameEl = rowElement.querySelector(
        ".property-name-text",
      ) as HTMLElement;
      const rect = nameEl
        ? nameEl.getBoundingClientRect()
        : rowElement.getBoundingClientRect();
      latestRect = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        propertyId: morphStartRect.propertyId,
      };
      setMorphStartRect(latestRect);
    }

    const finalRect = modal.getBoundingClientRect();
    const deltaX = latestRect.left - finalRect.left;
    const deltaY = latestRect.top - finalRect.top;
    const scaleX = latestRect.width / finalRect.width;
    const scaleY = latestRect.height / finalRect.height;

    setMorphPhase("morphing-out");

    modal.style.transition =
      "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease";
    modal.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
    modal.style.opacity = "0";
    modal.style.transformOrigin = "top left";

    if (titleRef.current && titleStartRect && scaleX && scaleY) {
      const title = titleRef.current;
      const titleFinalRect = title.getBoundingClientRect();
      const tDeltaX = titleStartRect.left - titleFinalRect.left;
      const tDeltaY = titleStartRect.top - titleFinalRect.top;
      const tScale = titleStartRect.height / titleFinalRect.height;

      title.style.transition =
        "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), color 250ms ease";
      title.style.transform = `translate3d(${tDeltaX / scaleX}px, ${tDeltaY / scaleY}px, 0) scale(${tScale / scaleX}, ${tScale / scaleY})`;
      title.style.transformOrigin = "top left";
      title.style.color = "#2563eb";
    }

    setTimeout(() => {
      setViewingPropertyDetails(null);
      setMorphPhase("idle");
      setMorphStartRect(null);
    }, 250);
  };

  const handleCloseUnitDetails = () => {
    if (!unitModalRef.current || !unitMorphStartRect) {
      setViewingUnitDetails(null);
      setUnitMorphPhase("idle");
      setUnitMorphStartRect(null);
      return;
    }

    const modal = unitModalRef.current;
    let latestRect = unitMorphStartRect;

    const rowElement =
      document.querySelector(
        `[data-unit-row="${unitMorphStartRect.unitId}"]`,
      ) ||
      document.querySelector(
        `[data-property-unit-row="${unitMorphStartRect.unitId}"]`,
      );
    if (rowElement) {
      const nameEl = rowElement.querySelector(".unit-name-text") as HTMLElement;
      const rect = nameEl
        ? nameEl.getBoundingClientRect()
        : rowElement.getBoundingClientRect();
      latestRect = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        unitId: unitMorphStartRect.unitId,
      };
      setUnitMorphStartRect(latestRect);
    }

    const finalRect = modal.getBoundingClientRect();
    const deltaX = latestRect.left - finalRect.left;
    const deltaY = latestRect.top - finalRect.top;
    const scaleX = latestRect.width / finalRect.width;
    const scaleY = latestRect.height / finalRect.height;

    setUnitMorphPhase("morphing-out");

    modal.style.transition =
      "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease";
    modal.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
    modal.style.opacity = "0";
    modal.style.transformOrigin = "top left";

    if (unitTitleRef.current && unitTitleStartRect && scaleX && scaleY) {
      const title = unitTitleRef.current;
      const titleFinalRect = title.getBoundingClientRect();
      const tDeltaX = unitTitleStartRect.left - titleFinalRect.left;
      const tDeltaY = unitTitleStartRect.top - titleFinalRect.top;
      const tScale = unitTitleStartRect.height / titleFinalRect.height;

      title.style.transition =
        "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), color 250ms ease";
      title.style.transform = `translate3d(${tDeltaX / scaleX}px, ${tDeltaY / scaleY}px, 0) scale(${tScale / scaleX}, ${tScale / scaleY})`;
      title.style.transformOrigin = "top left";
      title.style.color = "#2563eb";
    }

    setTimeout(() => {
      setViewingUnitDetails(null);
      setUnitMorphPhase("idle");
      setUnitMorphStartRect(null);
    }, 250);
  };

  const handleOpenEditProperty = (p: Property, e?: React.MouseEvent) => {
    if (e) {
      const button = e.currentTarget as HTMLElement;
      const row = button.closest("li") as HTMLElement;
      const nameEl = row
        ? (row.querySelector(".property-name-text") as HTMLElement)
        : null;
      const rect = nameEl
        ? nameEl.getBoundingClientRect()
        : row
          ? row.getBoundingClientRect()
          : button.getBoundingClientRect();
      setEditPropMorphStartRect({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        propertyId: p.id,
      });

      if (nameEl) {
        const nameRect = nameEl.getBoundingClientRect();
        setEditPropTitleStartRect({
          left: nameRect.left,
          top: nameRect.top,
          width: nameRect.width,
          height: nameRect.height,
        });
      }
      setEditPropMorphPhase("morphing-in");
    }
    setEditingProperty(p);
    setEditPropName(p.name);
    setEditPropAddress(p.address || "");
  };

  const handleCloseEditProperty = () => {
    if (!editPropModalRef.current || !editPropMorphStartRect) {
      setEditingProperty(null);
      setEditPropMorphPhase("idle");
      setEditPropMorphStartRect(null);
      return;
    }

    const modal = editPropModalRef.current;
    let latestRect = editPropMorphStartRect;

    const rowElement = document.querySelector(
      `[data-edit-property-row="${editPropMorphStartRect.propertyId}"]`,
    );
    if (rowElement) {
      const nameEl = rowElement.querySelector(
        ".property-name-text",
      ) as HTMLElement;
      const rect = nameEl
        ? nameEl.getBoundingClientRect()
        : rowElement.getBoundingClientRect();
      latestRect = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        propertyId: editPropMorphStartRect.propertyId,
      };
      setEditPropMorphStartRect(latestRect);
    }

    const finalRect = modal.getBoundingClientRect();
    const deltaX = latestRect.left - finalRect.left;
    const deltaY = latestRect.top - finalRect.top;
    const scaleX = latestRect.width / finalRect.width;
    const scaleY = latestRect.height / finalRect.height;

    setEditPropMorphPhase("morphing-out");

    modal.style.transition =
      "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease";
    modal.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
    modal.style.opacity = "0";
    modal.style.transformOrigin = "top left";

    if (
      editPropTitleRef.current &&
      editPropTitleStartRect &&
      scaleX &&
      scaleY
    ) {
      const title = editPropTitleRef.current;
      const titleFinalRect = title.getBoundingClientRect();
      const tDeltaX = editPropTitleStartRect.left - titleFinalRect.left;
      const tDeltaY = editPropTitleStartRect.top - titleFinalRect.top;
      const tScale = editPropTitleStartRect.height / titleFinalRect.height;

      title.style.transition =
        "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), color 250ms ease";
      title.style.transform = `translate3d(${tDeltaX / scaleX}px, ${tDeltaY / scaleY}px, 0) scale(${tScale / scaleX}, ${tScale / scaleY})`;
      title.style.transformOrigin = "top left";
      title.style.color = "#2563eb";
    }

    setTimeout(() => {
      setEditingProperty(null);
      setEditPropMorphPhase("idle");
      setEditPropMorphStartRect(null);
    }, 250);
  };

  const handleOpenEditUnit = (u: Unit, e?: React.MouseEvent) => {
    if (e) {
      const button = e.currentTarget as HTMLElement;
      const container = button.closest("li, tr") as HTMLElement;
      const nameEl = container
        ? (container.querySelector(".unit-name-text") as HTMLElement)
        : null;
      const rect = nameEl
        ? nameEl.getBoundingClientRect()
        : container
          ? container.getBoundingClientRect()
          : button.getBoundingClientRect();
      setEditUnitMorphStartRect({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        unitId: u.id,
      });

      if (nameEl) {
        const nameRect = nameEl.getBoundingClientRect();
        setEditUnitTitleStartRect({
          left: nameRect.left,
          top: nameRect.top,
          width: nameRect.width,
          height: nameRect.height,
        });
      }
      setEditUnitMorphPhase("morphing-in");
    }
    setEditingUnit(u);
    setEditUnitName(u.name);
    setEditUnitRent(u.rent_amount.toString());
    setEditUnitLateFee(u.late_fee_percentage.toString());
    setEditUnitGracePeriod(u.grace_period_days.toString());
  };

  const handleCloseEditUnit = () => {
    if (!editUnitModalRef.current || !editUnitMorphStartRect) {
      setEditingUnit(null);
      setEditUnitMorphPhase("idle");
      setEditUnitMorphStartRect(null);
      return;
    }

    const modal = editUnitModalRef.current;
    let latestRect = editUnitMorphStartRect;

    const rowElement =
      document.querySelector(
        `[data-edit-unit-row="${editUnitMorphStartRect.unitId}"]`,
      ) ||
      document.querySelector(
        `[data-property-edit-unit-row="${editUnitMorphStartRect.unitId}"]`,
      );
    if (rowElement) {
      const nameEl = rowElement.querySelector(".unit-name-text") as HTMLElement;
      const rect = nameEl
        ? nameEl.getBoundingClientRect()
        : rowElement.getBoundingClientRect();
      latestRect = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        unitId: editUnitMorphStartRect.unitId,
      };
      setEditUnitMorphStartRect(latestRect);
    }

    const finalRect = modal.getBoundingClientRect();
    const deltaX = latestRect.left - finalRect.left;
    const deltaY = latestRect.top - finalRect.top;
    const scaleX = latestRect.width / finalRect.width;
    const scaleY = latestRect.height / finalRect.height;

    setEditUnitMorphPhase("morphing-out");

    modal.style.transition =
      "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease";
    modal.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
    modal.style.opacity = "0";
    modal.style.transformOrigin = "top left";

    if (
      editUnitTitleRef.current &&
      editUnitTitleStartRect &&
      scaleX &&
      scaleY
    ) {
      const title = editUnitTitleRef.current;
      const titleFinalRect = title.getBoundingClientRect();
      const tDeltaX = editUnitTitleStartRect.left - titleFinalRect.left;
      const tDeltaY = editUnitTitleStartRect.top - titleFinalRect.top;
      const tScale = editUnitTitleStartRect.height / titleFinalRect.height;

      title.style.transition =
        "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), color 250ms ease";
      title.style.transform = `translate3d(${tDeltaX / scaleX}px, ${tDeltaY / scaleY}px, 0) scale(${tScale / scaleX}, ${tScale / scaleY})`;
      title.style.transformOrigin = "top left";
      title.style.color = "#2563eb";
    }

    setTimeout(() => {
      setEditingUnit(null);
      setEditUnitMorphPhase("idle");
      setEditUnitMorphStartRect(null);
    }, 250);
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
          lease_agreement:
            addUnitLeaseMode === "custom" && addUnitLeaseText
              ? addUnitLeaseText
              : null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to add unit");
      setUnitName("");
      setUnitRent("");
      setUnitLateFee("0");
      setUnitGracePeriod("0");
      setAddUnitLeaseMode("inherit");
      setAddUnitLeaseText("");
      await loadUnits(selectedPropertyId);
      await loadDashboard();
      await loadAvailableUnits();
      if (
        viewingPropertyDetails &&
        viewingPropertyDetails.property_id === selectedPropertyId
      ) {
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
      handleCloseEditUnit();
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
      if (
        viewingPropertyDetails &&
        viewingPropertyDetails.property_id === deletingProperty.id
      ) {
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
        setViewingPropertyUnits((prev) =>
          prev.filter((u) => u.id !== deletingUnit.id),
        );
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

  const handleOpenLogPayment = (
    rent: OwnerDashboard["rent_status"][number],
  ) => {
    setLoggingPaymentRent(rent);
    setPaymentAmount(rent.pending.toString());
    setPaymentMethod("cash");
    setPaymentTxnId("");
  };

  const handleLogPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loggingPaymentRent) return;

    setLoading(true);
    setNotice("");

    try {
      const response = await fetch(
        `/api/proxy/rent/pay/${loggingPaymentRent.rent_id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: parseFloat(paymentAmount),
            method: paymentMethod,
            txn_id: paymentTxnId || undefined,
          }),
        },
      );

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "Failed to log payment");
      }

      setNotice("Payment logged successfully!");
      setLoggingPaymentRent(null);
      await loadDashboard();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to log payment");
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
    <div className="rounded-ru-lg border border-rucoria-text-tert bg-rucoria-bg-raised p-ru-8 shadow-ru-2 backdrop-blur-md relative z-10 font-ru-sans">
      <div className="flex gap-ru-3 rounded-ru-md bg-rucoria-bg-base/50 p-ru-2 border border-rucoria-text-tert/30">
        <button
          type="button"
          className={`flex-1 rounded-ru-sm py-ru-5 text-ru-sm font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2 ${
            authMode === "login"
              ? "bg-rucoria-text-inv text-white shadow-ru-1"
              : "text-rucoria-text-sec/60 hover:text-rucoria-text-sec hover:bg-rucoria-text-tert/10"
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
          className={`flex-1 rounded-ru-sm py-ru-5 text-ru-sm font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2 ${
            authMode === "register"
              ? "bg-rucoria-text-inv text-white shadow-ru-1"
              : "text-rucoria-text-sec/60 hover:text-rucoria-text-sec hover:bg-rucoria-text-tert/10"
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
        <div className="mt-ru-5 rounded-ru-md border border-rucoria-text-inv/30 bg-rucoria-text-inv/10 px-ru-5 py-ru-4 text-ru-sm text-rucoria-text-sec flex items-start gap-ru-3">
          <svg
            className="w-5 h-5 flex-shrink-0 mt-ru-1 text-rucoria-text-inv"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="flex-1 leading-normal">{notice}</span>
        </div>
      )}

      {authMode === "login" ? (
        <form onSubmit={handleLogin} className="mt-ru-6 grid gap-ru-5">
          <label className="grid gap-ru-2 text-ru-xs font-bold uppercase tracking-wider text-rucoria-text-sec/60">
            Email Address
            <input
              className="rounded-ru-sm border border-rucoria-text-tert bg-rucoria-bg-base px-ru-5 py-ru-4 text-ru-sm text-rucoria-text-sec outline-none focus:border-rucoria-text-inv focus:ring-1 focus:ring-rucoria-text-inv/20 hover:border-rucoria-text-inv/50 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              required
            />
          </label>
          <label className="grid gap-ru-2 text-ru-xs font-bold uppercase tracking-wider text-rucoria-text-sec/60">
            Password
            <input
              className="rounded-ru-sm border border-rucoria-text-tert bg-rucoria-bg-base px-ru-5 py-ru-4 text-ru-sm text-rucoria-text-sec outline-none focus:border-rucoria-text-inv focus:ring-1 focus:ring-rucoria-text-inv/20 hover:border-rucoria-text-inv/50 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          <button
            className="mt-ru-3 rounded-ru-lg bg-rucoria-text-inv hover:bg-rucoria-text-inv/90 active:bg-rucoria-text-inv/80 py-ru-5 font-bold text-white shadow-ru-2 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed text-ru-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login to Account"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="mt-ru-6 grid gap-ru-5">
          <label className="grid gap-ru-2 text-ru-xs font-bold uppercase tracking-wider text-rucoria-text-sec/60">
            Name
            <input
              className="rounded-ru-sm border border-rucoria-text-tert bg-rucoria-bg-base px-ru-5 py-ru-4 text-ru-sm text-rucoria-text-sec outline-none focus:border-rucoria-text-inv focus:ring-1 focus:ring-rucoria-text-inv/20 hover:border-rucoria-text-inv/50 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2"
              type="text"
              value={regName}
              onChange={(event) => setRegName(event.target.value)}
              placeholder="John Doe"
              required
              minLength={2}
            />
          </label>
          <label className="grid gap-ru-2 text-ru-xs font-bold uppercase tracking-wider text-rucoria-text-sec/60">
            Email Address
            <input
              className="rounded-ru-sm border border-rucoria-text-tert bg-rucoria-bg-base px-ru-5 py-ru-4 text-ru-sm text-rucoria-text-sec outline-none focus:border-rucoria-text-inv focus:ring-1 focus:ring-rucoria-text-inv/20 hover:border-rucoria-text-inv/50 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2"
              type="email"
              value={regEmail}
              onChange={(event) => setRegEmail(event.target.value)}
              placeholder="name@example.com"
              required
            />
          </label>
          <label className="grid gap-ru-2 text-ru-xs font-bold uppercase tracking-wider text-rucoria-text-sec/60">
            Password
            <input
              className="rounded-ru-sm border border-rucoria-text-tert bg-rucoria-bg-base px-ru-5 py-ru-4 text-ru-sm text-rucoria-text-sec outline-none focus:border-rucoria-text-inv focus:ring-1 focus:ring-rucoria-text-inv/20 hover:border-rucoria-text-inv/50 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2"
              type="password"
              value={regPassword}
              onChange={(event) => setRegPassword(event.target.value)}
              placeholder="•••••••• (min 6 chars)"
              required
              minLength={6}
            />
          </label>
          <label className="grid gap-ru-2 text-ru-xs font-bold uppercase tracking-wider text-rucoria-text-sec/60">
            Account Role
            <select
              className="rounded-ru-sm border border-rucoria-text-tert bg-rucoria-bg-base px-ru-5 py-ru-4 text-ru-sm text-rucoria-text-sec outline-none focus:border-rucoria-text-inv focus:ring-1 focus:ring-rucoria-text-inv/20 hover:border-rucoria-text-inv/50 transition-all duration-300 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2"
              value={regRole}
              onChange={(event) => setRegRole(event.target.value as Role)}
            >
              <option
                value="tenant"
                className="bg-rucoria-bg-raised text-white"
              >
                Tenant
              </option>
              <option value="owner" className="bg-rucoria-bg-raised text-white">
                Owner
              </option>
            </select>
          </label>
          <button
            className="mt-ru-3 rounded-ru-lg bg-rucoria-text-inv hover:bg-rucoria-text-inv/90 active:bg-rucoria-text-inv/80 py-ru-5 font-bold text-white shadow-ru-2 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed text-ru-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2"
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
      <main className="min-h-screen w-full bg-rucoria-bg-base text-rucoria-text-sec font-ru-sans text-ru-lg leading-[24px] selection:bg-rucoria-text-inv selection:text-white">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 w-full border-b border-rucoria-text-tert/25 bg-rucoria-bg-base/75 backdrop-blur-md text-rucoria-text-sec shadow-ru-1 transition-all duration-300">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-ru-8 py-ru-5">
            <a
              href="#"
              className="flex items-center gap-ru-2 group rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
                setMobileMenuOpen(false);
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-ru-md bg-rucoria-text-inv text-white font-bold text-ru-2xl shadow-ru-1 group-hover:scale-105 transition-transform duration-300">
                ₹
              </div>
              <span className="text-ru-2xl font-bold tracking-tight text-rucoria-text-sec group-hover:text-rucoria-text-inv transition-colors duration-300">
                Rent Khata
              </span>
            </a>

            {/* Desktop Navigation */}
            <nav
              className="hidden md:flex items-center gap-ru-5"
              aria-label="Landing page"
            >
              <a
                className="relative px-ru-4 py-ru-3 text-ru-sm font-semibold text-rucoria-text-sec/80 transition-all duration-300 hover:text-rucoria-text-inv focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2 rounded"
                href="#features"
                onClick={(e) => handleScrollTo(e, "features")}
              >
                Features
              </a>
              <a
                className="relative px-ru-4 py-ru-3 text-ru-sm font-semibold text-rucoria-text-sec/80 transition-all duration-300 hover:text-rucoria-text-inv focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2 rounded"
                href="#access"
                onClick={(e) => {
                  setAuthMode("login");
                  setNotice("");
                  handleScrollTo(e, "access");
                }}
              >
                Login
              </a>
              <div className="hidden h-5 w-px bg-rucoria-text-tert/30 sm:block" />
              <a
                className="rounded-ru-lg bg-rucoria-text-inv hover:bg-rucoria-text-inv/90 active:bg-rucoria-text-inv/80 px-ru-5 py-ru-3 text-ru-sm font-bold text-white shadow-ru-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2"
                href="#access"
                onClick={(e) => {
                  setAuthMode("register");
                  setNotice("");
                  handleScrollTo(e, "access");
                }}
              >
                Create Account
              </a>
            </nav>

            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              className="md:hidden rounded-ru-md p-ru-2 text-rucoria-text-sec/80 hover:text-rucoria-text-inv hover:bg-rucoria-text-tert/10 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile menu dropdown overlay */}
          <div
            className={`md:hidden grid transition-[grid-template-rows,opacity] duration-300 ease-in-out bg-rucoria-bg-base/95 backdrop-blur-md ${
              mobileMenuOpen
                ? "grid-rows-[1fr] opacity-100 border-t border-rucoria-text-tert/25"
                : "grid-rows-[0fr] opacity-0 border-t-0"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <nav
                className="flex flex-col space-y-3 px-ru-8 py-ru-5"
                aria-label="Mobile navigation"
              >
                <a
                  className="text-ru-md font-semibold text-rucoria-text-sec/80 hover:text-rucoria-text-inv transition-colors py-ru-3 border-b border-rucoria-text-tert/10 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2"
                  href="#features"
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleScrollTo(e, "features");
                  }}
                >
                  Features
                </a>
                <a
                  className="text-ru-md font-semibold text-rucoria-text-sec/80 hover:text-rucoria-text-inv transition-colors py-ru-3 border-b border-rucoria-text-tert/10 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2"
                  href="#access"
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    setAuthMode("login");
                    setNotice("");
                    handleScrollTo(e, "access");
                  }}
                >
                  Login
                </a>
                <a
                  className="rounded-ru-lg bg-rucoria-text-inv hover:bg-rucoria-text-inv/90 active:bg-rucoria-text-inv/80 px-ru-5 py-ru-4 text-center text-ru-sm font-bold text-white shadow-ru-2 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] mt-ru-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2"
                  href="#access"
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    setAuthMode("register");
                    setNotice("");
                    handleScrollTo(e, "access");
                  }}
                >
                  Create Account
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative min-h-[90vh] overflow-hidden bg-rucoria-bg-base text-rucoria-text-sec flex items-center py-ru-8 lg:py-ru-8">
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/10 w-96 h-96 rounded-ru-xl bg-rucoria-bg-strong/5 blur-3xl animate-pulse-glow pointer-events-none" />
          <div
            className="absolute bottom-1/4 right-1/10 w-[450px] h-[450px] rounded-ru-xl bg-rucoria-text-inv/5 blur-3xl animate-pulse-glow pointer-events-none"
            style={{ animationDelay: "4s" }}
          />

          <div className="mx-auto max-w-5xl w-full px-ru-8 relative z-10 -mt-10 md:mt-10">
            <div className="flex flex-col items-center text-center space-y-8">
              <div className="inline-flex items-center gap-ru-2 rounded-ru-xl border border-rucoria-text-inv/30 bg-rucoria-bg-raised/80 px-ru-5 py-ru-3 text-ru-xs font-semibold uppercase tracking-wider text-rucoria-text-inv backdrop-blur-sm shadow-ru-1">
                <span className="flex h-2 w-2 rounded-ru-xl bg-rucoria-text-inv animate-pulse" />
                Your Ultimate Rental Ledger
              </div>

              <h1 className="text-ru-4xl font-extrabold tracking-tight font-ru-sans leading-[1.1] text-rucoria-text-sec max-w-4xl">
                Rent, tenants, receipts, & dues in{" "}
                <span className="italic font-normal text-rucoria-text-inv">
                  one calm workspace.
                </span>
              </h1>

              <p className="max-w-2xl text-ru-lg leading-relaxed text-rucoria-text-sec/80 font-normal">
                A modern, clean workspace designed for owners and tenants.
                Manage properties, coordinate leases, log payments, and generate
                invoices with ease.
              </p>

              <div className="flex flex-wrap justify-center gap-ru-5 pt-2">
                <a
                  className="inline-flex items-center justify-center rounded-ru-lg bg-rucoria-text-inv hover:bg-rucoria-text-inv/90 active:bg-rucoria-text-inv/80 px-ru-6 py-ru-5 text-ru-sm font-bold text-white shadow-ru-2 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2"
                  href="#access"
                  onClick={(e) => {
                    setAuthMode("register");
                    setNotice("");
                    handleScrollTo(e, "access");
                  }}
                >
                  Start Managing
                </a>
                <a
                  className="inline-flex items-center justify-center rounded-ru-lg border border-rucoria-text-tert bg-rucoria-bg-raised px-ru-6 py-ru-5 text-ru-sm font-bold text-rucoria-text-sec shadow-ru-1 transition-all duration-300 hover:bg-rucoria-bg-raised/90 hover:border-rucoria-text-inv/50 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2"
                  href="#features"
                  onClick={(e) => handleScrollTo(e, "features")}
                >
                  Explore Features
                </a>
              </div>

              {/* Micro Stats */}
              <div className="grid grid-cols-3 gap-ru-5 pt-ru-8 border-t border-rucoria-text-tert/20 max-w-lg w-full text-center">
                <div>
                  <p className="text-ru-3xl font-extrabold text-rucoria-text-inv">
                    100%
                  </p>
                  <p className="text-ru-xs text-rucoria-text-sec/60 uppercase tracking-wider mt-1 leading-tight font-semibold">
                    Ledger Accuracy
                  </p>
                </div>
                <div>
                  <p className="text-ru-3xl font-extrabold text-rucoria-text-sec">
                    Instant
                  </p>
                  <p className="text-ru-xs text-rucoria-text-sec/60 uppercase tracking-wider mt-1 leading-tight font-semibold">
                    PDF Receipts
                  </p>
                </div>
                <div>
                  <p className="text-ru-3xl font-extrabold text-rucoria-text-sec/60">
                    Zero
                  </p>
                  <p className="text-ru-xs text-rucoria-text-sec/60 uppercase tracking-wider mt-1 leading-tight font-semibold">
                    Clutter
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section
          id="features"
          className="scroll-mt-16 pt-20 pb-10 bg-rucoria-bg-base border-t border-rucoria-text-tert/15 relative"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,12,35,0.05),transparent_60%)] pointer-events-none" />

          <div className="mx-auto max-w-7xl px-ru-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-ru-sm font-semibold uppercase tracking-wider text-rucoria-text-inv">
                Platform Features
              </h2>
              <p className="mt-2 text-ru-3xl font-bold font-ru-sans text-rucoria-text-sec leading-tight">
                Everything you need to manage rental operations smoothly
              </p>
              <p className="mt-4 text-rucoria-text-sec/70">
                Forget messy spreadsheets and chaotic WhatsApp chats. Rent Khata
                organizes everything into clean, auditable records.
              </p>
            </div>

            <div className="grid gap-ru-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Owner Dashboard",
                  body: "Track total properties, units, current occupancy, total rents, actual collections, and pending dues from a single window.",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  ),
                  color: "bg-rucoria-text-inv/10 text-rucoria-text-inv",
                },
                {
                  title: "Tenant Portal",
                  body: "Tenants get a focused view of rent status, due dates, outstanding amount, grace periods, and payment history.",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  ),
                  color: "bg-rucoria-text-inv/10 text-rucoria-text-inv",
                },
                {
                  title: "Property & Unit Operations",
                  body: "Create and edit properties, add individual rental units, customize rent cycles, due dates, late fee rates, and grace periods.",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2"
                      />
                    </svg>
                  ),
                  color: "bg-rucoria-text-inv/10 text-rucoria-text-inv",
                },
                {
                  title: "Financial Ledger Clarity",
                  body: "Obligations (rents) are tracked independently from transactions (payments), ensuring ledger logs never mismatch.",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  ),
                  color: "bg-rucoria-text-inv/10 text-rucoria-text-inv",
                },
                {
                  title: "PDF Rent Receipts",
                  body: "Generate professional, download-ready PDF receipts for payments, equipped with transaction IDs and timestamp details.",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  ),
                  color: "bg-rucoria-text-inv/10 text-rucoria-text-inv",
                },
                {
                  title: "Leasing & Invitations",
                  body: "Invite tenants to specific units via email. Set lease starting dates, security deposits, and customized invitation notes.",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5m4.72 0V12a9 9 0 00-9-9"
                      />
                    </svg>
                  ),
                  color: "bg-rucoria-text-inv/10 text-rucoria-text-inv",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="group rounded-ru-lg bg-rucoria-bg-raised p-ru-8 border border-rucoria-text-tert/20 hover:border-rucoria-text-inv/40 hover:-translate-y-1 shadow-ru-2 transition-all duration-300 relative overflow-hidden"
                >
                  <div
                    className={`h-12 w-12 rounded-ru-md ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {f.icon}
                  </div>
                  <h3 className="text-ru-xl font-bold text-rucoria-text-sec group-hover:text-rucoria-text-inv transition-colors duration-300">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-ru-sm leading-relaxed text-rucoria-text-sec/70">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Access Section (Authentication) */}
        <section
          id="access"
          className="scroll-mt-16 bg-rucoria-bg-base border-t border-rucoria-text-tert/15 relative overflow-hidden py-20"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rucoria-bg-strong/5 blur-3xl rounded-ru-xl pointer-events-none" />

          <div className="mx-auto max-w-7xl px-ru-8 relative z-10">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              {/* Text content left */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-ru-2 rounded-ru-xl border border-rucoria-text-inv/30 bg-rucoria-bg-raised/80 px-ru-5 py-ru-3 text-ru-xs font-semibold uppercase tracking-wider text-rucoria-text-inv backdrop-blur-sm shadow-ru-1">
                  Access Portal
                </div>
                <h2 className="text-ru-3xl font-bold font-ru-sans text-rucoria-text-sec leading-tight">
                  Ready to experience absolute ledger peace?
                </h2>
                <p className="max-w-2xl text-rucoria-text-sec/70 leading-relaxed">
                  Join Rent Khata now to eliminate spreadsheet errors,
                  centralize invoices, and keep accounts clear.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex gap-ru-3">
                    <div className="h-6 w-6 rounded-ru-xl bg-rucoria-text-inv/20 flex items-center justify-center text-rucoria-text-inv flex-shrink-0 mt-0.5 text-ru-xs font-bold">
                      ✓
                    </div>
                    <p className="text-ru-sm text-rucoria-text-sec/80 leading-relaxed">
                      <strong className="text-rucoria-text-sec font-bold">
                        For Owners:
                      </strong>{" "}
                      Comprehensive property dashboard, automatic late fee
                      calculations, security deposit status tracker, and simple
                      inviting mechanism.
                    </p>
                  </div>
                  <div className="flex gap-ru-3">
                    <div className="h-6 w-6 rounded-ru-xl bg-rucoria-text-inv/20 flex items-center justify-center text-rucoria-text-inv flex-shrink-0 mt-0.5 text-ru-xs font-bold">
                      ✓
                    </div>
                    <p className="text-ru-sm text-rucoria-text-sec/80 leading-relaxed">
                      <strong className="text-rucoria-text-sec font-bold">
                        For Tenants:
                      </strong>{" "}
                      Instant receipt generation, real-time dashboard of pending
                      dues, and email-based contract accepts.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  {apiStatus && (
                    <div className="inline-flex items-center gap-ru-3 rounded-ru-md bg-rucoria-bg-raised border border-rucoria-text-tert px-ru-5 py-ru-4 text-ru-xs font-mono text-rucoria-text-sec/70 shadow-ru-1">
                      <span className="h-2 w-2 rounded-ru-xl bg-rucoria-text-inv animate-pulse" />
                      {apiStatus}
                    </div>
                  )}
                </div>
              </div>

              {/* Auth Panel right */}
              <div className="lg:col-span-5 relative">
                <div className="absolute inset-0 bg-rucoria-bg-strong/5 blur-3xl rounded-ru-xl pointer-events-none" />
                {authPanel}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-rucoria-bg-base text-rucoria-text-sec border-t border-rucoria-text-tert/15 py-12 font-ru-sans">
          <div className="mx-auto max-w-7xl px-ru-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-ru-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-ru-sm bg-rucoria-text-inv text-white font-bold text-ru-lg shadow-ru-1">
                    ₹
                  </div>
                  <span className="text-ru-xl font-bold tracking-tight text-rucoria-text-sec">
                    Rent Khata
                  </span>
                </div>
                <p className="max-w-md text-ru-sm leading-relaxed text-rucoria-text-sec/60">
                  A focused rental operations workspace for properties, tenants,
                  rent schedules, payments, and receipts. Built for simplicity
                  and ledger peace.
                </p>
              </div>
              <nav
                className="flex flex-wrap gap-x-8 gap-y-4"
                aria-label="Footer"
              >
                <a
                  className="text-ru-sm font-semibold text-rucoria-text-sec/60 hover:text-rucoria-text-inv transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2 rounded"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Home
                </a>
                <a
                  className="text-ru-sm font-semibold text-rucoria-text-sec/60 hover:text-rucoria-text-inv transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2 rounded"
                  href="#features"
                  onClick={(e) => handleScrollTo(e, "features")}
                >
                  Features
                </a>
                <a
                  className="text-ru-sm font-semibold text-rucoria-text-sec/60 hover:text-rucoria-text-inv transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2 rounded"
                  href="#access"
                  onClick={(e) => {
                    setAuthMode("login");
                    setNotice("");
                    handleScrollTo(e, "access");
                  }}
                >
                  Login
                </a>
              </nav>
            </div>
            <div className="mt-8 pt-8 border-t border-rucoria-text-tert/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-ru-xs text-rucoria-text-sec/40">
              <p>
                &copy; {new Date().getFullYear()} Rent Khata. All rights
                reserved.
              </p>
              <p className="flex gap-4">
                <a
                  href="#"
                  className="hover:text-rucoria-text-inv transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2 rounded"
                  onClick={(e) => e.preventDefault()}
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="hover:text-rucoria-text-inv transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-rucoria-text-inv focus-visible:outline-offset-2 rounded"
                  onClick={(e) => e.preventDefault()}
                >
                  Terms of Service
                </a>
              </p>
            </div>
          </div>
        </footer>
      </main>
    );
  }
  //Header Section
  return (
    <main className="min-h-screen w-full bg-[#f8fafc] text-[#0f172a]">
      <header className="border-b border-[#e2e8f0] bg-[#f8fafc]/25 backdrop-blur(16)">
        <div className="mx-auto flex w-full max-w-7xl items-start justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#475569]">
              Rent Management
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Dashboard</h1>
            {apiStatus ? (
              <p className="mt-1 text-sm text-[#475569]">{apiStatus}</p>
            ) : null}
            {user ? (
              <p className="text-sm text-[#475569]">
                Signed in as {user.role} #{user.id}
              </p>
            ) : null}
          </div>
          {user ? (
            <div className="relative">
              <button
                type="button"
                className="rounded-md p-2 text-[#475569] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
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
                  <div className="absolute right-0 z-50 mt-1 w-56 rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-lg">
                    <div className="border-b border-[#e2e8f0] px-4 py-2">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-md px-0 py-1 text-left transition-colors hover:text-[#0f172a]"
                        onClick={() => setShowAccountDetails((value) => !value)}
                        aria-expanded={showAccountDetails}
                        aria-controls="account-details"
                      >
                        <span className="text-sm font-semibold text-[#0f172a]">
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
                          className={`text-[#475569] transition-transform ${
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
                            className="space-y-2 rounded-md bg-[#f8fafc] p-2.5"
                          >
                            <p className="truncate text-sm font-semibold text-[#0f172a]">
                              {user.name || "User"}
                            </p>
                            <p className="truncate text-xs text-[#475569]">
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
                        className="flex w-full px-4 py-2 text-sm font-medium text-[#334155] text-left transition-colors hover:bg-[#f1f5f9]"
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
                        className="flex w-full px-4 py-2 text-sm font-medium text-[#334155] text-left transition-colors hover:bg-[#f1f5f9]"
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
                      className="flex w-full px-4 py-2 text-sm font-medium text-[#334155] transition-colors hover:bg-[#f1f5f9]"
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
        <section className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
          {!user && (
            <div className="rounded-lg border border-[#e2e8f0] bg-white p-4 shadow-sm">
              <div className="flex gap-1 rounded-md bg-[#f1f5f9] p-1">
                <button
                  type="button"
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                    authMode === "login"
                      ? "bg-white text-[#0f172a] shadow-sm"
                      : "text-[#475569] hover:text-[#334155]"
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
                      ? "bg-white text-[#0f172a] shadow-sm"
                      : "text-[#475569] hover:text-[#334155]"
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
                  <label className="grid gap-1 text-sm font-medium text-[#334155]">
                    Email
                    <input
                      className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-[#334155]">
                    Password
                    <input
                      className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>
                  <button
                    className="rounded-md bg-[#2563eb] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98aaa1]"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="mt-4 grid gap-3">
                  <label className="grid gap-1 text-sm font-medium text-[#334155]">
                    Name
                    <input
                      className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                      type="text"
                      value={regName}
                      onChange={(event) => setRegName(event.target.value)}
                      required
                      minLength={2}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-[#334155]">
                    Email
                    <input
                      className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                      type="email"
                      value={regEmail}
                      onChange={(event) => setRegEmail(event.target.value)}
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-[#334155]">
                    Password
                    <input
                      className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                      type="password"
                      value={regPassword}
                      onChange={(event) => setRegPassword(event.target.value)}
                      required
                      minLength={6}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-[#334155]">
                    Role
                    <select
                      className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
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
                    className="rounded-md bg-[#2563eb] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98aaa1]"
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
            <div className="rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Add Property</h2>
              <form onSubmit={handleAddProperty} className="mt-3 grid gap-3">
                <label className="grid gap-1 text-sm font-medium text-[#334155]">
                  Property Name
                  <input
                    className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                    type="text"
                    value={propName}
                    onChange={(e) => setPropName(e.target.value)}
                    required
                    minLength={2}
                    placeholder="e.g. Sunrise Apartments"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-[#334155]">
                  Address{" "}
                  <span className="font-normal text-[#64748b]">(optional)</span>
                  <input
                    className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                    type="text"
                    value={propAddress}
                    onChange={(e) => setPropAddress(e.target.value)}
                    placeholder="e.g. 42 MG Road, Kolkata"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-[#334155]">
                  Lease Agreement{" "}
                  <span className="font-normal text-[#64748b]">(optional)</span>
                  <textarea
                    className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6] h-24 text-xs font-mono"
                    value={propLeaseAgreement}
                    onChange={(e) => setPropLeaseAgreement(e.target.value)}
                    placeholder="Standard terms and conditions for this property..."
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-[#334155]">
                  Property Pictures{" "}
                  <span className="font-normal text-[#64748b]">(optional)</span>
                  <input
                    className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6] text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#f1f5f9] file:text-[#2563eb] hover:file:bg-[#e2e8f0] file:cursor-pointer"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        setSelectedAddFiles(Array.from(e.target.files));
                      }
                    }}
                  />
                </label>

                {selectedAddFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedAddFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="group relative w-12 h-12 rounded-md border border-[#e2e8f0] overflow-hidden"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px] font-bold"
                          onClick={() =>
                            setSelectedAddFiles((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          title="Remove picture"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  className="rounded-md bg-[#2563eb] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98aaa1]"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Property"}
                </button>
              </form>

              {properties.length > 0 && (
                <div className="mt-4 border-t border-[#e2e8f0] pt-3">
                  <p className="text-sm font-semibold text-[#334155]">
                    Your Properties
                  </p>
                  <ul className="mt-2 grid gap-1">
                    {properties.map((p) => (
                      <li
                        key={p.id}
                        data-edit-property-row={p.id}
                        className="flex items-center justify-between rounded-md border border-[#e2e8f0] px-3 py-2 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="property-name-text font-medium">
                            {p.name}
                          </span>
                          {p.address && (
                            <span className="ml-2 text-[#475569]">
                              {p.address}
                            </span>
                          )}
                        </div>
                        <div className="ml-2 flex items-center gap-1">
                          <button
                            type="button"
                            className="flex-shrink-0 rounded p-1 text-[#2563eb] transition-colors hover:bg-[#f1f5f9]"
                            onClick={(e) => handleOpenEditProperty(p, e)}
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
            <div className="rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Add Unit</h2>
              {properties.length === 0 ? (
                <p className="mt-3 text-sm text-[#475569]">
                  Add a property first to create units.
                </p>
              ) : (
                <form onSubmit={handleAddUnit} className="mt-3 grid gap-3">
                  <label className="grid gap-1 text-sm font-medium text-[#334155]">
                    Property
                    <select
                      className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
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
                  <label className="grid gap-1 text-sm font-medium text-[#334155]">
                    Unit Name
                    <input
                      className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                      type="text"
                      value={unitName}
                      onChange={(e) => setUnitName(e.target.value)}
                      required
                      placeholder="e.g. Flat 101"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-[#334155]">
                    Monthly Rent (₹)
                    <input
                      className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
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
                    <label className="grid gap-1 text-sm font-medium text-[#334155]">
                      Late Fee (%)
                      <input
                        className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={unitLateFee}
                        onChange={(e) => setUnitLateFee(e.target.value)}
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-[#334155]">
                      Grace Period (Days)
                      <input
                        className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                        type="number"
                        min="0"
                        max="31"
                        step="1"
                        value={unitGracePeriod}
                        onChange={(e) => setUnitGracePeriod(e.target.value)}
                      />
                    </label>
                  </div>
                  {/* Creation-time Unit Lease Selection */}
                  <div className="grid gap-2 p-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
                    <span className="text-xs font-semibold text-[#334155]">
                      Lease Agreement Option
                    </span>
                    <div className="flex gap-4 text-xs font-medium text-[#334155]">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="addUnitLeaseMode"
                          value="inherit"
                          checked={addUnitLeaseMode === "inherit"}
                          onChange={() => setAddUnitLeaseMode("inherit")}
                          className="accent-[#2563eb]"
                        />
                        Inherit from Property
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="addUnitLeaseMode"
                          value="custom"
                          checked={addUnitLeaseMode === "custom"}
                          onChange={() => setAddUnitLeaseMode("custom")}
                          className="accent-[#2563eb]"
                        />
                        Write Custom Lease
                      </label>
                    </div>

                    {addUnitLeaseMode === "custom" && (
                      <textarea
                        className="rounded-md border border-[#cbd5e1] px-3 py-2 text-xs font-mono text-[#0f172a] outline-none focus:border-[#3b82f6] h-24 bg-white mt-1"
                        placeholder="Custom lease agreement terms for this unit..."
                        value={addUnitLeaseText}
                        onChange={(e) => setAddUnitLeaseText(e.target.value)}
                      />
                    )}
                  </div>
                  <button
                    className="rounded-md bg-[#2563eb] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98aaa1]"
                    type="submit"
                    disabled={loading || !selectedPropertyId}
                  >
                    {loading ? "Adding..." : "Add Unit"}
                  </button>
                </form>
              )}

              {propertyUnits.length > 0 && (
                <div className="mt-4 border-t border-[#e2e8f0] pt-3">
                  <p className="text-sm font-semibold text-[#334155]">Units</p>
                  <ul className="mt-2 grid gap-1">
                    {propertyUnits.map((u) => (
                      <li
                        key={u.id}
                        data-unit-row={u.id}
                        className="flex items-center justify-between rounded-md border border-[#e2e8f0] px-3 py-2 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="unit-name-text font-medium">
                            {u.name}
                          </span>
                          <span className="ml-2 text-[#2563eb] font-semibold">
                            {formatMoney(u.rent_amount)}/mo
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="flex-shrink-0 rounded p-1 text-[#2563eb] transition-colors hover:bg-[#f1f5f9]"
                            onClick={(e) => handleViewUnitDetails(u.id, e)}
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
                            className="flex-shrink-0 rounded p-1 text-[#2563eb] transition-colors hover:bg-[#f1f5f9]"
                            onClick={(e) => handleOpenEditUnit(u, e)}
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
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-[#f8fafc] p-6 shadow-xl border border-[#e2e8f0]">
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  className="rounded-md p-2 -mr-2 -mt-2 text-[#475569] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
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
                <div className="rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold">
                    Send Invite to Tenant
                  </h2>
                  {availableUnits.length === 0 ? (
                    <p className="mt-3 text-sm text-[#475569]">
                      No available units. Add units first or wait for existing
                      invites to be resolved.
                    </p>
                  ) : (
                    <form
                      onSubmit={handleSendInvite}
                      className="mt-3 grid gap-3"
                    >
                      <label className="grid gap-1 text-sm font-medium text-[#334155]">
                        Tenant Email
                        <input
                          className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          required
                          placeholder="tenant@example.com"
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium text-[#334155]">
                        Unit
                        <select
                          className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
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
                      <label className="grid gap-1 text-sm font-medium text-[#334155]">
                        Deposit (₹){" "}
                        <span className="font-normal text-[#64748b]">
                          (optional)
                        </span>
                        <input
                          className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                          type="number"
                          min="0"
                          step="1"
                          value={inviteDeposit}
                          onChange={(e) => setInviteDeposit(e.target.value)}
                          placeholder="e.g. 25000"
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium text-[#334155]">
                        Move-in Date{" "}
                        <input
                          className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                          type="date"
                          value={inviteMoveIn}
                          onChange={(e) => setInviteMoveIn(e.target.value)}
                          required
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium text-[#334155]">
                        Message{" "}
                        <span className="font-normal text-[#64748b]">
                          (optional)
                        </span>
                        <textarea
                          className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6] resize-none"
                          rows={2}
                          value={inviteMessage}
                          onChange={(e) => setInviteMessage(e.target.value)}
                          placeholder="Welcome message…"
                        />
                      </label>
                      <button
                        className="rounded-md bg-[#2563eb] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98aaa1]"
                        type="submit"
                        disabled={loading || !inviteUnitId || !inviteMoveIn}
                      >
                        {loading ? "Sending..." : "Send Invite"}
                      </button>
                    </form>
                  )}
                </div>

                {/* Sent Invites List */}
                <div className="rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold">Sent Invites</h2>
                  {sentInvites.length === 0 ? (
                    <p className="mt-3 text-sm text-[#475569]">
                      No invites sent yet.
                    </p>
                  ) : (
                    <ul className="mt-3 grid gap-2">
                      {sentInvites.map((inv) => (
                        <li
                          key={inv.id}
                          className="rounded-md border border-[#e2e8f0] p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">
                                {inv.tenant_email}
                              </p>
                              <p className="text-xs text-[#475569]">
                                {inv.property_name} — {inv.unit_name}
                              </p>
                              {inv.move_in_date && (
                                <p className="text-xs text-[#475569]">
                                  Move-in: {formatDate(inv.move_in_date)}
                                </p>
                              )}
                              {inv.deposit > 0 && (
                                <p className="text-xs text-[#475569]">
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
                      data-property-row={property.property_id}
                      className="border-t border-[#e2e8f0] hover:bg-[#f1f5f9]/50 cursor-pointer transition-colors"
                      onClick={(e) => handleViewPropertyDetails(property, e)}
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

            <DataTable title="Payment Status">
              <thead>
                <tr>
                  <Th>Tenant & unit</Th>
                  <Th>Period</Th>
                  <Th>Payment</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {ownerDashboard.rent_status.length > 0 ? (
                  ownerDashboard.rent_status.map((rent) => (
                    <tr
                      key={rent.rent_id}
                      className="border-t border-[#e2e8f0]"
                    >
                      <Td className="min-w-[13rem]">
                        <p className="font-semibold text-[#0f172a]">
                          {rent.tenant_name}
                        </p>
                        <p className="mt-0.5 text-xs text-[#64748b]">
                          {rent.property_name} · Unit {rent.unit_name}
                        </p>
                      </Td>
                      <Td>{formatPeriod(rent.month, rent.year)}</Td>
                      <Td className="min-w-[10rem]">
                        <p className="font-medium text-[#0f172a]">
                          {formatMoney(rent.paid)} paid of {formatMoney(rent.amount)}
                        </p>
                        {rent.pending > 0 && (
                          <p className="mt-0.5 text-xs text-[#b45309]">
                            {formatMoney(rent.pending)} remaining
                          </p>
                        )}
                      </Td>
                      <Td>
                        <StatusLabel
                          status={rent.payment_status}
                          dueInDays={rent.due_in_days}
                          overdueByDays={rent.overdue_by_days}
                        />
                      </Td>
                      <Td className="text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {rent.payments && rent.payments.length ? (
                            rent.payments.length === 1 ? (
                              <button
                                key={rent.payments[0].payment_id}
                                className="w-fit rounded-md border border-[#2563eb] hover:bg-[#eff6ff] px-3 py-1 text-sm font-semibold text-[#2563eb] transition-colors"
                                type="button"
                                onClick={() =>
                                  downloadReceipt(rent.payments[0].payment_id)
                                }
                              >
                                View receipt
                              </button>
                            ) : (
                              <div className="relative flex flex-col gap-1.5">
                                <button
                                  type="button"
                                  className="w-fit flex items-center gap-1.5 rounded-md border border-[#2563eb] hover:bg-[#eff6ff] px-3 py-1 text-sm font-semibold text-[#2563eb] transition-colors"
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
                                      expandedReceipts[rent.rent_id]
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                  >
                                    ▾
                                  </span>
                                </button>
                                {expandedReceipts[rent.rent_id] && (
                                  <div className="flex flex-col gap-1 pl-2 border-l-2 border-[#2563eb]/30 mt-1">
                                    {rent.payments.map((payment) => (
                                      <button
                                        key={payment.payment_id}
                                        className="w-fit text-left rounded-md px-2 py-0.5 text-xs font-semibold text-[#2563eb] hover:bg-[#eff6ff] transition-colors"
                                        type="button"
                                        onClick={() =>
                                          downloadReceipt(payment.payment_id)
                                        }
                                      >
                                        Receipt #{payment.payment_id}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          ) : (
                            <span className="text-sm text-[#94a3b8]">—</span>
                          )}
                        </div>
                        {rent.payment_status !== "paid" && (
                          <button
                            type="button"
                            className="mt-2 rounded-md bg-[#2563eb] hover:bg-[#1e40af] px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                            onClick={() => handleOpenLogPayment(rent)}
                          >
                            Log Payment
                          </button>
                        )}
                      </Td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-[#e2e8f0]">
                    <td
                      colSpan={5}
                      className="py-4 text-center text-sm text-[#475569]"
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
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-[#f8fafc] p-6 shadow-xl border border-[#e2e8f0]">
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  className="rounded-md p-2 -mr-2 -mt-2 text-[#475569] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
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
                <div className="rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="#2563eb"
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
                      <span className="inline-flex items-center justify-center rounded-full bg-[#2563eb] px-2 py-0.5 text-xs font-bold text-white">
                        {
                          receivedInvites.filter((i) => i.status === "pending")
                            .length
                        }
                      </span>
                    )}
                  </h2>
                  {receivedInvites.length === 0 ? (
                    <p className="mt-3 text-sm text-[#475569]">
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
                              ? "border-[#2563eb]/30 bg-[#eff6ff] shadow-sm"
                              : "border-[#e2e8f0] bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-[#0f172a]">
                                {inv.property_name} — {inv.unit_name}
                              </p>
                              {inv.property_address && (
                                <p className="text-xs text-[#475569]">
                                  {inv.property_address}
                                </p>
                              )}
                              <p className="mt-1 text-sm text-[#334155]">
                                From: {inv.owner_name || inv.owner_email}
                              </p>
                              {inv.rent_amount != null && (
                                <p className="text-sm text-[#334155]">
                                  Rent:{" "}
                                  <span className="font-semibold text-[#2563eb]">
                                    {formatMoney(inv.rent_amount)}/mo
                                  </span>
                                </p>
                              )}
                              {inv.deposit > 0 && (
                                <p className="text-sm text-[#334155]">
                                  Deposit: {formatMoney(inv.deposit)}
                                </p>
                              )}
                              {inv.move_in_date && (
                                <p className="text-sm text-[#334155]">
                                  Move-in: {formatDate(inv.move_in_date)}
                                </p>
                              )}
                              {inv.message && (
                                <p className="mt-1 rounded-md bg-[#f1f5f9] px-3 py-2 text-sm italic text-[#334155]">
                                  &ldquo;{inv.message}&rdquo;
                                </p>
                              )}
                              <p className="mt-1 text-xs text-[#64748b]">
                                Received {formatDate(inv.created_at)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <InviteStatusLabel status={inv.status} />
                              {inv.status === "pending" && (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    className="rounded-md bg-[#2563eb] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
                                    onClick={() => handleAcceptInvite(inv.id)}
                                    disabled={loading}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-md border border-[#cbd5e1] px-3 py-1.5 text-xs font-semibold text-[#c44d4d] transition-colors hover:bg-[#fde8e8] disabled:opacity-50"
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

            {(() => {
              const activeTenancies =
                tenantDashboard.active_tenancies ||
                (tenantDashboard.active_tenancy
                  ? [tenantDashboard.active_tenancy]
                  : []);
              if (activeTenancies.length === 0) return null;
              const groupedProperties = activeTenancies.reduce(
                (acc, tenancy) => {
                  const existing = acc.find(
                    (p) => p.property_id === tenancy.property_id,
                  );
                  if (existing) {
                    existing.leases.push(tenancy);
                  } else {
                    acc.push({
                      property_id: tenancy.property_id,
                      property_name: tenancy.property_name,
                      property_address: tenancy.property_address,
                      property_lease_agreement:
                        tenancy.property_lease_agreement,
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
                <div
                  className={`grid gap-4 ${groupedProperties.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"}`}
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
                                className={
                                  index > 0
                                    ? "border-t border-[#e2e8f0] pt-4"
                                    : ""
                                }
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
              );
            })()}

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
                      className="border-t border-[#e2e8f0] align-top"
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
                            rent.payments.length === 1 ? (
                              <button
                                key={rent.payments[0].payment_id}
                                className="w-fit rounded-md border border-[#2563eb] hover:bg-[#eff6ff] px-3 py-1 text-sm font-semibold text-[#2563eb] transition-colors"
                                type="button"
                                onClick={() =>
                                  downloadReceipt(rent.payments[0].payment_id)
                                }
                              >
                                Receipt #{rent.payments[0].payment_id}
                              </button>
                            ) : (
                              <div className="relative flex flex-col gap-1.5">
                                <button
                                  type="button"
                                  className="w-fit flex items-center gap-1.5 rounded-md border border-[#2563eb] hover:bg-[#eff6ff] px-3 py-1 text-sm font-semibold text-[#2563eb] transition-colors"
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
                                      expandedReceipts[rent.rent_id]
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                  >
                                    ▾
                                  </span>
                                </button>
                                {expandedReceipts[rent.rent_id] && (
                                  <div className="flex flex-col gap-1 pl-2 border-l-2 border-[#2563eb]/30 mt-1">
                                    {rent.payments.map((payment) => (
                                      <button
                                        key={payment.payment_id}
                                        className="w-fit text-left rounded-md px-2 py-0.5 text-xs font-semibold text-[#2563eb] hover:bg-[#eff6ff] transition-colors"
                                        type="button"
                                        onClick={() =>
                                          downloadReceipt(payment.payment_id)
                                        }
                                      >
                                        Receipt #{payment.payment_id}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          ) : (
                            <span className="text-sm text-[#475569]">
                              No payment
                            </span>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-[#e2e8f0]">
                    <td
                      colSpan={9}
                      className="py-4 text-center text-sm text-[#475569]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          {/* Backdrop overlay */}
          <div
            className={`fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto ${
              morphPhase === "expanded" ? "opacity-100" : "opacity-0"
            }`}
            onClick={handleClosePropertyDetails}
          />

          {/* Modal card */}
          <div
            ref={modalRef}
            className={`w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6 shadow-2xl relative z-10 ${
              morphPhase === "expanded"
                ? "pointer-events-auto"
                : "pointer-events-none"
            }`}
            style={{
              willChange: "transform",
            }}
          >
            {/* Close Button - elevated z-index to sit on top of the z-20 header */}
            <button
              type="button"
              className={`absolute right-6 top-6 z-30 rounded-lg p-2 text-[#475569] transition-all hover:bg-[#f1f5f9] hover:text-[#0f172a] hover:scale-105 active:scale-95 ${
                morphPhase === "expanded"
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              }`}
              style={{
                transition:
                  morphPhase === "expanded"
                    ? "opacity 250ms ease-out 200ms"
                    : "opacity 150ms ease-out",
              }}
              onClick={handleClosePropertyDetails}
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

            {/* Header: Always visible during transition */}
            <div className="mb-6 pr-10 relative z-20">
              <p
                className="text-xs font-semibold uppercase tracking-[0.18em] text-[#475569] transition-opacity duration-[250ms]"
                style={{ opacity: morphPhase === "expanded" ? 1 : 0 }}
              >
                Property Details
              </p>
              <h3 className="mt-1 text-2xl font-bold text-[#0f172a] flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-[#2563eb] transition-opacity duration-[250ms]"
                  style={{ opacity: morphPhase === "expanded" ? 1 : 0 }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2"
                  />
                </svg>
                <span
                  ref={titleRef}
                  style={{ display: "inline-block", willChange: "transform" }}
                >
                  {viewingPropertyDetails.property_name}
                </span>
              </h3>
            </div>

            {/* Rest of the contents: Fade-in after morph completes */}
            <div
              style={{
                opacity: morphPhase === "expanded" ? 1 : 0,
                transition:
                  morphPhase === "expanded"
                    ? "opacity 250ms ease-out 200ms"
                    : "opacity 150ms ease-out",
              }}
            >
              {properties.find(
                (p) => p.id === viewingPropertyDetails.property_id,
              )?.address && (
                <p className="mt-1.5 text-sm text-[#475569] flex items-center gap-1.5 mb-6">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {
                    properties.find(
                      (p) => p.id === viewingPropertyDetails.property_id,
                    )?.address
                  }
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <div className="rounded-lg border border-[#e2e8f0] bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#475569]">
                    Total Rent
                  </p>
                  <p className="mt-1 text-xl font-bold text-[#0f172a]">
                    {formatMoney(viewingPropertyDetails.total_rent)}
                    <span className="text-xs font-normal text-[#475569] block mt-0.5">
                      Estimated monthly
                    </span>
                  </p>
                </div>
                <div className="rounded-lg border border-[#e2e8f0] bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#475569]">
                    Collected
                  </p>
                  <p className="mt-1 text-xl font-bold text-[#23633d]">
                    {formatMoney(viewingPropertyDetails.total_collected)}
                    <span className="text-xs font-normal text-[#475569] block mt-0.5">
                      This period
                    </span>
                  </p>
                </div>
                <div className="rounded-lg border border-[#e2e8f0] bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#475569]">
                    Pending
                  </p>
                  <p className="mt-1 text-xl font-bold text-[#9a4d21]">
                    {formatMoney(viewingPropertyDetails.total_pending)}
                    <span className="text-xs font-normal text-[#475569] block mt-0.5">
                      Outstanding
                    </span>
                  </p>
                </div>
                <div className="rounded-lg border border-[#e2e8f0] bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#475569]">
                    Occupancy
                  </p>
                  <p className="mt-1 text-xl font-bold text-[#0f172a]">
                    {viewingPropertyDetails.occupied_units} /{" "}
                    {viewingPropertyDetails.total_units}
                    <span className="text-xs font-normal text-[#475569] block mt-0.5">
                      {viewingPropertyDetails.total_units > 0
                        ? Math.round(
                            (viewingPropertyDetails.occupied_units /
                              viewingPropertyDetails.total_units) *
                              100,
                          )
                        : 0}
                      % Occupied
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-bold text-[#0f172a]">
                    Units in Property
                  </h4>
                  <button
                    type="button"
                    className="rounded-lg bg-[#2563eb] hover:bg-[#1e40af] px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => {
                      setSelectedPropertyId(viewingPropertyDetails.property_id);
                      loadUnits(viewingPropertyDetails.property_id);
                      handleClosePropertyDetails();
                      setNotice(
                        `Property "${viewingPropertyDetails.property_name}" selected. You can now add units to it in the "Add Unit" section.`,
                      );
                      setTimeout(() => {
                        window.scrollTo({ top: 300, behavior: "smooth" });
                      }, 500);
                    }}
                  >
                    Manage Units & Add New
                  </button>
                </div>

                {viewingPropertyUnits.length === 0 ? (
                  <div className="text-center py-8 text-sm text-[#475569]">
                    No units added to this property yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#e2e8f0]">
                          <th className="pb-3 pr-4 font-semibold text-[#334155]">
                            Unit
                          </th>
                          <th className="pb-3 pr-4 font-semibold text-[#334155]">
                            Monthly Rent
                          </th>
                          <th className="pb-3 pr-4 font-semibold text-[#334155]">
                            Tenant
                          </th>
                          <th className="pb-3 pr-4 font-semibold text-[#334155]">
                            Status
                          </th>
                          <th className="pb-3 pr-4 font-semibold text-[#334155] text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e2e8f0]">
                        {viewingPropertyUnits.map((unit) => {
                          const activeRent = ownerDashboard?.rent_status?.find(
                            (r) => r.unit_id === unit.id,
                          );

                          return (
                            <tr
                              key={unit.id}
                              data-property-unit-row={unit.id}
                              className="hover:bg-[#f8fafc]/50"
                            >
                              <td className="unit-name-text py-3.5 pr-4 font-medium text-[#0f172a]">
                                {unit.name}
                              </td>
                              <td className="py-3.5 pr-4">
                                {formatMoney(unit.rent_amount)}/mo
                              </td>
                              <td className="py-3.5 pr-4">
                                {activeRent ? (
                                  <div>
                                    <p className="font-semibold text-gray-900">
                                      {activeRent.tenant_name}
                                    </p>
                                    <p className="text-xs text-gray-500 font-normal">
                                      Active Tenant
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-xs text-[#64748b] italic">
                                    Vacant
                                  </span>
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
                                    className="rounded p-1.5 text-[#2563eb] transition-colors hover:bg-[#f1f5f9]"
                                    onClick={(e) =>
                                      handleViewUnitDetails(unit.id, e)
                                    }
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
                                    className="rounded p-1.5 text-[#2563eb] transition-colors hover:bg-[#f1f5f9]"
                                    onClick={(e) => handleOpenEditUnit(unit, e)}
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
                                      setDeletingUnit({
                                        id: unit.id,
                                        name: unit.name,
                                      })
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

              {/* Lease Agreement Section */}
              <div className="mt-6 rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-[#2563eb]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Lease Agreement
                  </h4>
                  <button
                    type="button"
                    className="rounded-lg bg-[#2563eb] hover:bg-[#1e40af] px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => {
                      const fullProp = properties.find(
                        (p) => p.id === viewingPropertyDetails.property_id,
                      );
                      setEditingLeaseProp(
                        fullProp || {
                          id: viewingPropertyDetails.property_id,
                          name: viewingPropertyDetails.property_name,
                          address:
                            properties.find(
                              (p) =>
                                p.id === viewingPropertyDetails.property_id,
                            )?.address || null,
                          lease_agreement:
                            viewingPropertyDetails.lease_agreement || null,
                          created_at: "",
                        },
                      );
                      setEditLeaseText(
                        viewingPropertyDetails.lease_agreement || "",
                      );
                      setShowLeaseEditModal(true);
                    }}
                  >
                    {viewingPropertyDetails.lease_agreement
                      ? "Edit Lease Agreement"
                      : "Write Lease Agreement"}
                  </button>
                </div>

                <div className="mt-3 text-sm text-[#334155] leading-relaxed whitespace-pre-wrap bg-[#f8fafc] p-4 rounded-md border border-[#e2e8f0] max-h-80 overflow-y-auto">
                  {viewingPropertyDetails.lease_agreement ? (
                    viewingPropertyDetails.lease_agreement
                  ) : (
                    <span className="text-[#64748b] italic">
                      No lease agreement has been written for this property yet.
                      Click "Write Lease Agreement" to set up terms and
                      conditions.
                    </span>
                  )}
                </div>
              </div>

              {/* Property Pictures Gallery */}
              <div className="mt-6 rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                  <h4 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-[#2563eb]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z"
                      />
                    </svg>
                    Property Pictures
                  </h4>
                  <div className="relative">
                    <input
                      type="file"
                      ref={imageInputRef}
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleUploadImages}
                    />
                    <button
                      type="button"
                      className="rounded-lg bg-[#2563eb] hover:bg-[#1e40af] px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.02]"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={loading}
                    >
                      Upload Pictures
                    </button>
                  </div>
                </div>

                {/* Grid of existing pictures */}
                {(() => {
                  const currentProperty = properties.find(
                    (p) => p.id === viewingPropertyDetails.property_id,
                  );
                  const propertyImages = currentProperty?.images || [];

                  if (propertyImages.length === 0) {
                    return (
                      <div className="text-center py-6 text-sm text-[#64748b] bg-[#f8fafc] rounded-md border border-dashed border-[#cbd5e1]">
                        No pictures uploaded for this property yet. Upload some
                        pictures to show the property details!
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {propertyImages.map((img: any) => (
                        <div
                          key={img.id}
                          className="group relative aspect-video overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#f8fafc] shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <img
                            src={`/api/proxy/properties/images/${img.image_path}`}
                            alt="Property"
                            className="h-full w-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-105"
                            onClick={() =>
                              setLightboxImage(
                                `/api/proxy/properties/images/${img.image_path}`,
                              )
                            }
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-2 rounded-md bg-white/95 p-1.5 text-[#c44d4d] shadow-sm transition-opacity opacity-0 group-hover:opacity-100 hover:bg-[#fde8e8] duration-200"
                            onClick={() => handleDeleteImage(img.id)}
                            title="Delete Picture"
                            disabled={loading}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition-all"
            onClick={() => setLightboxImage(null)}
          >
            <svg
              width="24"
              height="24"
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
          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt="Property Full Preview"
              className="max-w-full max-h-[90vh] rounded-lg object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 transform translate-y-0 ${
              t.type === "success"
                ? "border-[#2563eb]/20 bg-[#eff6ff] text-[#2563eb]"
                : t.type === "error"
                  ? "border-red-500/20 bg-red-50/90 text-red-700"
                  : "border-[#e2e8f0] bg-white text-[#334155]"
            }`}
          >
            {t.type === "success" && (
              <svg
                className="w-5 h-5 text-[#2563eb] flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {t.type === "error" && (
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
            {t.type === "info" && (
              <svg
                className="w-5 h-5 text-[#334155] flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <div className="flex-1 text-sm font-semibold leading-relaxed">
              {t.message}
            </div>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors text-xs font-bold font-mono pl-1"
              onClick={() =>
                setToasts((prev) => prev.filter((toast) => toast.id !== t.id))
              }
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-[#e2e8f0] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#0f172a]">Log Out</h3>
            <p className="mt-2 text-sm text-[#475569]">
              Are you sure you want to log out?
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                className="rounded-md border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#f1f5f9]"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1e40af] disabled:opacity-50"
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
          <div className="mx-4 w-full max-w-sm rounded-lg border border-[#e2e8f0] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#933232]">
              Delete Account
            </h3>
            <p className="mt-2 text-sm text-[#334155]">
              Are you sure? This will permanently delete your account and all
              associated data. This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                className="rounded-md border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#f1f5f9]"
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
          <div className="mx-4 w-full max-w-sm rounded-lg border border-[#e2e8f0] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#933232]">
              Delete Property
            </h3>
            <p className="mt-2 text-sm text-[#334155]">
              Delete <strong>&ldquo;{deletingProperty.name}&rdquo;</strong> and
              all its units? This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                className="rounded-md border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#f1f5f9]"
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
          <div className="mx-4 w-full max-w-sm rounded-lg border border-[#e2e8f0] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#933232]">
              Delete Unit
            </h3>
            <p className="mt-2 text-sm text-[#334155]">
              Delete <strong>&ldquo;{deletingUnit.name}&rdquo;</strong> and all
              its associated data? This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                className="rounded-md border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#f1f5f9]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          {/* Backdrop overlay */}
          <div
            className={`fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto ${
              editPropMorphPhase === "expanded" ? "opacity-100" : "opacity-0"
            }`}
            onClick={handleCloseEditProperty}
          />

          {/* Modal card */}
          <div
            ref={editPropModalRef}
            className={`mx-4 w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6 shadow-2xl relative z-10 ${
              editPropMorphPhase === "expanded"
                ? "pointer-events-auto"
                : "pointer-events-none"
            }`}
            style={{
              willChange: "transform",
            }}
          >
            {/* Header: Always visible during transition */}
            <div className="mb-4 pr-10 relative z-20">
              <h3
                ref={editPropTitleRef}
                className="text-lg font-bold text-[#2563eb]"
                style={{ display: "inline-block", willChange: "transform" }}
              >
                Edit Property
              </h3>
            </div>

            {/* Rest of the contents: Fade-in after morph completes */}
            <div
              style={{
                opacity: editPropMorphPhase === "expanded" ? 1 : 0,
                transition:
                  editPropMorphPhase === "expanded"
                    ? "opacity 250ms ease-out 200ms"
                    : "opacity 150ms ease-out",
              }}
            >
              <form onSubmit={handleEditProperty} className="grid gap-3">
                <label className="grid gap-1 text-sm font-medium text-[#334155]">
                  Property Name
                  <input
                    className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                    type="text"
                    value={editPropName}
                    onChange={(e) => setEditPropName(e.target.value)}
                    required
                    minLength={2}
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-[#334155]">
                  Address{" "}
                  <span className="font-normal text-[#64748b]">(optional)</span>
                  <input
                    className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                    type="text"
                    value={editPropAddress}
                    onChange={(e) => setEditPropAddress(e.target.value)}
                  />
                </label>
                <div className="mt-2 flex gap-3 justify-end">
                  <button
                    type="button"
                    className="rounded-md border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#f1f5f9]"
                    onClick={handleCloseEditProperty}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Updating…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lease Agreement Edit Modal */}
      {showLeaseEditModal && editingLeaseProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => {
              setShowLeaseEditModal(false);
              setEditingLeaseProp(null);
            }}
          />

          {/* Modal card */}
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6 shadow-2xl relative z-10">
            <div className="mb-4 pr-10">
              <h3 className="text-lg font-bold text-[#2563eb]">
                Write Lease Agreement — {editingLeaseProp.name}
              </h3>
              <p className="text-xs text-[#475569] mt-1">
                Draft terms, rules, and payment policies for all tenants of this
                property.
              </p>
            </div>

            <form onSubmit={handleSaveLeaseAgreement} className="grid gap-4">
              <textarea
                className="w-full h-80 rounded-md border border-[#cbd5e1] px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#3b82f6] bg-white font-mono leading-relaxed"
                placeholder={`LEASE AGREEMENT
This agreement is made on [Date] between the Owner and the Tenant...
1. Rent: Due on the specified day of each month.
2. Utilities: Tenant is responsible for...`}
                value={editLeaseText}
                onChange={(e) => setEditLeaseText(e.target.value)}
              />

              <div className="flex justify-between items-center text-xs text-[#475569]">
                <span>Line breaks and spaces will be preserved.</span>
                <span className="font-semibold">
                  {editLeaseText.length} characters
                </span>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  className="rounded-md border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#f1f5f9]"
                  onClick={() => {
                    setShowLeaseEditModal(false);
                    setEditingLeaseProp(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Saving…" : "Save Lease Agreement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unit Lease Agreement Edit Modal */}
      {showUnitLeaseModal && editingUnitLease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => {
              setShowUnitLeaseModal(false);
              setEditingUnitLease(null);
            }}
          />

          {/* Modal card */}
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6 shadow-2xl relative z-10">
            <div className="mb-4 pr-10">
              <h3 className="text-lg font-bold text-[#2563eb]">
                Write Lease Agreement — {editingUnitLease.unit_name}
              </h3>
              <p className="text-xs text-[#475569] mt-1">
                Configure whether this unit inherits property terms or uses its
                own custom terms.
              </p>
            </div>

            <form
              onSubmit={handleSaveUnitLeaseAgreement}
              className="grid gap-4"
            >
              <div className="grid gap-2 p-3 rounded-lg border border-[#e2e8f0] bg-white">
                <span className="text-xs font-semibold text-[#334155]">
                  Option
                </span>
                <div className="flex gap-6 text-sm font-medium text-[#334155]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="unitLeaseMode"
                      value="inherit"
                      checked={unitLeaseMode === "inherit"}
                      onChange={() => {
                        setUnitLeaseMode("inherit");
                        setUnitLeaseText(
                          editingUnitLease.property_lease_agreement || "",
                        );
                      }}
                      className="accent-[#2563eb]"
                    />
                    Keep the same agreement as the property (Inherit)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="unitLeaseMode"
                      value="custom"
                      checked={unitLeaseMode === "custom"}
                      onChange={() => {
                        setUnitLeaseMode("custom");
                        setUnitLeaseText(
                          editingUnitLease.unit_lease_agreement ||
                            editingUnitLease.property_lease_agreement ||
                            "",
                        );
                      }}
                      className="accent-[#2563eb]"
                    />
                    Set a unit-specific agreement (Custom)
                  </label>
                </div>
              </div>

              <textarea
                className={`w-full h-80 rounded-md border border-[#cbd5e1] px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#3b82f6] bg-white font-mono leading-relaxed ${
                  unitLeaseMode === "inherit"
                    ? "opacity-60 bg-gray-50 cursor-not-allowed"
                    : ""
                }`}
                placeholder="Draft custom terms and conditions for this specific unit..."
                value={unitLeaseText}
                onChange={(e) => {
                  if (unitLeaseMode === "custom") {
                    setUnitLeaseText(e.target.value);
                  }
                }}
                disabled={unitLeaseMode === "inherit"}
              />

              <div className="flex justify-between items-center text-xs text-[#475569]">
                <span>
                  {unitLeaseMode === "inherit"
                    ? "Currently inheriting property terms. Switch to Custom to edit."
                    : "Line breaks and spaces will be preserved."}
                </span>
                <span className="font-semibold">
                  {unitLeaseText.length} characters
                </span>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  className="rounded-md border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#f1f5f9]"
                  onClick={() => {
                    setShowUnitLeaseModal(false);
                    setEditingUnitLease(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Saving…" : "Save Lease Agreement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Unit Modal */}
      {editingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          {/* Backdrop overlay */}
          <div
            className={`fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto ${
              editUnitMorphPhase === "expanded" ? "opacity-100" : "opacity-0"
            }`}
            onClick={handleCloseEditUnit}
          />

          {/* Modal card */}
          <div
            ref={editUnitModalRef}
            className={`mx-4 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6 shadow-2xl relative z-10 ${
              editUnitMorphPhase === "expanded"
                ? "pointer-events-auto"
                : "pointer-events-none"
            }`}
            style={{
              willChange: "transform",
            }}
          >
            {/* Header: Always visible during transition */}
            <div className="mb-4 pr-10 relative z-20">
              <h3
                ref={editUnitTitleRef}
                className="text-lg font-bold text-[#2563eb]"
                style={{ display: "inline-block", willChange: "transform" }}
              >
                Edit Unit
              </h3>
            </div>

            {/* Rest of the contents: Fade-in after morph completes */}
            <div
              style={{
                opacity: editUnitMorphPhase === "expanded" ? 1 : 0,
                transition:
                  editUnitMorphPhase === "expanded"
                    ? "opacity 250ms ease-out 200ms"
                    : "opacity 150ms ease-out",
              }}
            >
              <form onSubmit={handleEditUnit} className="grid gap-3">
                <label className="grid gap-1 text-sm font-medium text-[#334155]">
                  Unit Name
                  <input
                    className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                    type="text"
                    value={editUnitName}
                    onChange={(e) => setEditUnitName(e.target.value)}
                    required
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-[#334155]">
                  Monthly Rent (₹)
                  <input
                    className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                    type="number"
                    min="1"
                    step="1"
                    value={editUnitRent}
                    onChange={(e) => setEditUnitRent(e.target.value)}
                    required
                  />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="grid gap-1 text-sm font-medium text-[#334155]">
                    Late Fee (%)
                    <input
                      className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editUnitLateFee}
                      onChange={(e) => setEditUnitLateFee(e.target.value)}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-[#334155]">
                    Grace Period (Days)
                    <input
                      className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
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
                    className="rounded-md border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#f1f5f9]"
                    onClick={handleCloseEditUnit}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Updating…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Unit Details Modal */}
      {viewingUnitDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          {/* Backdrop overlay */}
          <div
            className={`fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto ${
              unitMorphPhase === "expanded" ? "opacity-100" : "opacity-0"
            }`}
            onClick={handleCloseUnitDetails}
          />

          {/* Modal card */}
          <div
            ref={unitModalRef}
            className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6 shadow-2xl relative z-10 ${
              unitMorphPhase === "expanded"
                ? "pointer-events-auto"
                : "pointer-events-none"
            }`}
            style={{
              willChange: "transform",
            }}
          >
            {/* Close Button - elevated z-index */}
            <button
              type="button"
              className={`absolute right-6 top-6 z-30 rounded-lg p-2 text-[#475569] transition-all hover:bg-[#f1f5f9] hover:text-[#0f172a] hover:scale-105 active:scale-95 ${
                unitMorphPhase === "expanded"
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              }`}
              style={{
                transition:
                  unitMorphPhase === "expanded"
                    ? "opacity 250ms ease-out 200ms"
                    : "opacity 150ms ease-out",
              }}
              onClick={handleCloseUnitDetails}
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

            {/* Header: Always visible during transition */}
            <div className="mb-5 pr-10 relative z-20">
              <h3
                ref={unitTitleRef}
                className="text-xl font-semibold text-[#0f172a]"
                style={{ display: "inline-block", willChange: "transform" }}
              >
                {viewingUnitDetails.unit_name}
              </h3>
              <p
                className="text-sm text-[#475569] transition-opacity duration-[250ms]"
                style={{ opacity: unitMorphPhase === "expanded" ? 1 : 0 }}
              >
                {viewingUnitDetails.property_name}
              </p>
            </div>

            {/* Rest of the contents: Fade-in after morph completes */}
            <div
              style={{
                opacity: unitMorphPhase === "expanded" ? 1 : 0,
                transition:
                  unitMorphPhase === "expanded"
                    ? "opacity 250ms ease-out 200ms"
                    : "opacity 150ms ease-out",
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-md bg-[#f8fafc] p-4 border border-[#e2e8f0]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Rent Amount
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[#2563eb]">
                    {formatMoney(viewingUnitDetails.rent_amount)}
                    <span className="text-sm font-normal text-[#475569]">
                      /mo
                    </span>
                  </p>
                </div>
                <div className="rounded-md bg-[#f8fafc] p-4 border border-[#e2e8f0]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Terms
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#0f172a]">
                    Due:{" "}
                    <span className="font-normal text-[#334155]">
                      Day {viewingUnitDetails.due_day}
                    </span>
                  </p>
                  <p className="text-sm font-medium text-[#0f172a]">
                    Late Fee:{" "}
                    <span className="font-normal text-[#334155]">
                      {viewingUnitDetails.late_fee_percentage}% (Grace:{" "}
                      {viewingUnitDetails.grace_period_days}d)
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-[#e2e8f0] pt-5">
                <h4 className="font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
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
                {viewingUnitDetails.tenancy_id === undefined ? (
                  <div className="animate-pulse space-y-3 py-2">
                    <div className="h-4 bg-[#f1f5f9] rounded w-1/3"></div>
                    <div className="h-4 bg-[#f1f5f9] rounded w-1/2"></div>
                  </div>
                ) : viewingUnitDetails.tenancy_id ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-[#475569]">
                          Tenant Info
                        </p>
                        <p className="text-sm font-medium text-[#0f172a]">
                          {viewingUnitDetails.tenant_name || "N/A"}
                        </p>
                        <p className="text-sm text-[#334155]">
                          {viewingUnitDetails.tenant_email}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-[#475569]">
                          Lease Details
                        </p>
                        <p className="text-sm font-medium text-[#0f172a]">
                          Move-in:{" "}
                          <span className="font-normal text-[#334155]">
                            {formatDate(
                              viewingUnitDetails.move_in_date ?? null,
                            )}
                          </span>
                        </p>
                        <p className="text-sm font-medium text-[#0f172a]">
                          Deposit:{" "}
                          <span className="font-normal text-[#334155]">
                            {formatMoney(viewingUnitDetails.deposit ?? 0)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2 border-t border-dashed border-[#e2e8f0]">
                      <button
                        type="button"
                        onClick={() =>
                          handleKickTenant(viewingUnitDetails.tenancy_id!)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#fca5a5] bg-red-50 hover:bg-red-100 hover:text-red-950 px-3 py-1.5 text-xs font-semibold text-[#b91c1c] shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Remove Tenant
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md bg-[#fff9eb] p-3 border border-[#e0b15c]/50 text-sm text-[#6b4c18]">
                    No tenant is currently assigned to this unit.
                  </div>
                )}
              </div>

              {/* Unit Lease Agreement Section */}
              <div className="mt-6 border-t border-[#e2e8f0] pt-5">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-[#0f172a] flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-[#2563eb]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Lease Agreement
                  </h4>
                  <div className="flex items-center gap-2">
                    {viewingUnitDetails.unit_lease_agreement ? (
                      <span className="inline-flex rounded-full bg-[#dcfce7] text-[#15803d] px-2.5 py-0.5 text-xs font-semibold">
                        Unit-Specific
                      </span>
                    ) : viewingUnitDetails.property_lease_agreement ? (
                      <span className="inline-flex rounded-full bg-[#f3f4f6] text-[#4b5563] px-2.5 py-0.5 text-xs font-semibold">
                        Inherited
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-[#fee2e2] text-[#991b1b] px-2.5 py-0.5 text-xs font-semibold">
                        Not Set
                      </span>
                    )}
                    <button
                      type="button"
                      className="rounded-lg bg-[#2563eb] hover:bg-[#1e40af] px-3 py-1 text-xs font-semibold text-white shadow-sm transition-all"
                      onClick={() => {
                        setEditingUnitLease(viewingUnitDetails);
                        const hasCustom =
                          !!viewingUnitDetails.unit_lease_agreement;
                        setUnitLeaseMode(hasCustom ? "custom" : "inherit");
                        setUnitLeaseText(
                          viewingUnitDetails.unit_lease_agreement ||
                            viewingUnitDetails.property_lease_agreement ||
                            "",
                        );
                        setShowUnitLeaseModal(true);
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="text-xs text-[#334155] leading-relaxed whitespace-pre-wrap bg-[#f8fafc] p-3 rounded-md border border-[#e2e8f0] max-h-40 overflow-y-auto font-mono">
                  {viewingUnitDetails.unit_lease_agreement ? (
                    viewingUnitDetails.unit_lease_agreement
                  ) : viewingUnitDetails.property_lease_agreement ? (
                    viewingUnitDetails.property_lease_agreement
                  ) : (
                    <span className="text-[#64748b] italic">
                      No lease agreement terms set for this unit or the
                      property.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Rent Payment Modal */}
      {loggingPaymentRent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6 shadow-2xl relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#2563eb]">
                  Log Rent Payment
                </h3>
                <p className="text-xs text-[#475569]">
                  Log payment for {loggingPaymentRent.tenant_name} (
                  {loggingPaymentRent.unit_name})
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-1.5 text-[#475569] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                onClick={() => setLoggingPaymentRent(null)}
              >
                <svg
                  width="18"
                  height="18"
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

            <form onSubmit={handleLogPayment} className="grid gap-4">
              <div className="rounded-lg bg-white p-3 border border-[#e2e8f0] text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#475569]">Period:</span>{" "}
                  <span className="font-semibold text-gray-800">
                    {formatPeriod(
                      loggingPaymentRent.month,
                      loggingPaymentRent.year,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#475569]">Rent Due:</span>{" "}
                  <span className="font-semibold text-gray-800">
                    {formatMoney(loggingPaymentRent.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#475569]">Already Paid:</span>{" "}
                  <span className="font-semibold text-gray-800">
                    {formatMoney(loggingPaymentRent.paid)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#e2e8f0] pt-1 mt-1 font-semibold">
                  <span className="text-[#9a4d21]">Outstanding:</span>{" "}
                  <span className="text-[#9a4d21]">
                    {formatMoney(loggingPaymentRent.pending)}
                  </span>
                </div>
              </div>

              <label className="grid gap-1 text-sm font-medium text-[#334155]">
                Payment Amount (₹)
                <input
                  className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={loggingPaymentRent.pending}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </label>

              <label className="grid gap-1 text-sm font-medium text-[#334155]">
                Payment Method
                <select
                  className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI (GPay/PhonePe/Paytm)</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="grid gap-1 text-sm font-medium text-[#334155]">
                Transaction ID / Notes
                <span className="font-normal text-[#64748b] text-xs">
                  {" "}
                  (optional)
                </span>
                <input
                  className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[#0f172a] outline-none focus:border-[#3b82f6]"
                  type="text"
                  value={paymentTxnId}
                  onChange={(e) => setPaymentTxnId(e.target.value)}
                  placeholder="e.g. TXN123456789"
                />
              </label>

              <div className="mt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  className="rounded-md border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#f1f5f9]"
                  onClick={() => setLoggingPaymentRent(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  disabled={loading || !paymentAmount}
                >
                  {loading ? "Logging…" : "Log Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TenantDirectoryModal
        isOpen={showTenantDirectory}
        onClose={() => setShowTenantDirectory(false)}
        onInviteClick={() => {
          setShowTenantDirectory(false);
          setShowInvitesModal(true);
        }}
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
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-[#475569]">{label}</p>
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
    <section className="rounded-lg border border-[#e2e8f0] bg-white p-4 shadow-sm overflow-hidden">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 overflow-x-auto -mx-4 px-4">
        <table className="w-full min-w-[650px] border-collapse text-left text-sm md:min-w-[760px]">
          {children}
        </table>
      </div>
    </section>
  );
}

function Th({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th className={`pb-3 pr-4 font-semibold text-[#334155] ${className}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
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
