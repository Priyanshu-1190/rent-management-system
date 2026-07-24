import React, { FormEvent } from "react";
import { OwnerDashboard } from "../../types";
import { formatMoney, formatPeriod } from "../../lib/formatters";

interface PaymentModalProps {
  loggingPaymentRent: OwnerDashboard["rent_status"][number] | null;
  onClose: () => void;
  paymentAmount: string;
  setPaymentAmount: (val: string) => void;
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  paymentTxnId: string;
  setPaymentTxnId: (val: string) => void;
  loading: boolean;
  handleLogPayment: (e: FormEvent<HTMLFormElement>) => void;
}

export function PaymentModal({
  loggingPaymentRent,
  onClose,
  paymentAmount,
  setPaymentAmount,
  paymentMethod,
  setPaymentMethod,
  paymentTxnId,
  setPaymentTxnId,
  loading,
  handleLogPayment,
}: PaymentModalProps) {
  if (!loggingPaymentRent) return null;

  return (
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
            onClick={onClose}
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
              onClick={onClose}
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
  );
}
