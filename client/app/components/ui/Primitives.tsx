import React, { ReactNode } from "react";

export function Metric({
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

export function DataTable({
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

export function Th({
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

export function Td({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`py-3 pr-4 ${className}`}>{children}</td>;
}

export function StatusLabel({
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
        : normalized === "upcoming" && typeof dueInDays === "number"
          ? `Due in ${dueInDays} ${dayWord(dueInDays)}`
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

export function InviteStatusLabel({ status }: { status: string }) {
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
