export type Role = "owner" | "tenant";

export type User = {
  id: number;
  email?: string;
  role: Role;
  name?: string;
};

export type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};

export type OwnerDashboard = {
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
    tenant_id: number;
    property_id: number;
    unit_id: number;
    property_name: string;
    unit_name: string;
    tenant_name: string;
    tenant_email: string | null;
    month: number;
    year: number;
    amount: number;
    late_fee: number;
    total_due: number;
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

export type TenantDashboard = {
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

export type Property = {
  id: number;
  name: string;
  address: string | null;
  lease_agreement?: string | null;
  created_at: string;
  images?: Array<{ id: number; image_path: string }>;
};

export type Unit = {
  id: number;
  property_id: number;
  name: string;
  rent_amount: number;
  due_day: number;
  late_fee_percentage: number;
  grace_period_days: number;
  lease_agreement?: string | null;
  unit_lease_agreement?: string | null;
  property_name?: string;
  property_lease_agreement?: string | null;
  tenancy_id?: number | null;
  move_in_date?: string | null;
  deposit?: number | null;
  is_active?: boolean;
  tenant_id?: number | null;
  tenant_name?: string | null;
  tenant_email?: string | null;
};

export type Invite = {
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

export type AvailableUnit = {
  id: number;
  name: string;
  rent_amount: number;
  property_name: string;
  property_id: number;
};

export type UnitDetails = {
  unit_id?: number;
  unit_name: string;
  property_id?: number;
  property_name: string;
  rent_amount: number;
  due_day: number;
  late_fee_percentage: number;
  grace_period_days: number;
  unit_lease_agreement?: string | null;
  property_lease_agreement?: string | null;
  tenancy_id?: number | null;
  tenant_id?: number | null;
  tenant_name?: string | null;
  tenant_email?: string | null;
  move_in_date?: string | null;
  deposit?: number;
  is_active?: boolean;
};

export type TenantDirectoryRecord = {
  type: string;
  tenancy_id: number | string;
  name: string | null;
  email: string | null;
  property_name: string;
  unit_name: string;
  move_in_date: string | null;
  deposit: number;
  status: "active" | "past" | "invited" | "accepted" | "declined" | string;
};
