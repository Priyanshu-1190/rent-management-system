import React, { FormEvent } from "react";
import { Invite, AvailableUnit, User } from "../../types";
import { formatMoney, formatDate } from "../../lib/formatters";
import { InviteStatusLabel } from "../ui/Primitives";

interface InvitesModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  availableUnits: AvailableUnit[];
  inviteEmail: string;
  setInviteEmail: (val: string) => void;
  inviteUnitId: number | null;
  setInviteUnitId: (val: number | null) => void;
  inviteDeposit: string;
  setInviteDeposit: (val: string) => void;
  inviteMoveIn: string;
  setInviteMoveIn: (val: string) => void;
  inviteMessage: string;
  setInviteMessage: (val: string) => void;
  sentInvites: Invite[];
  receivedInvites: Invite[];
  loading: boolean;
  handleSendInvite: (e: FormEvent<HTMLFormElement>) => void;
  handleCancelInvite: (id: number) => void;
  handleAcceptInvite?: (id: number) => void;
  handleDeclineInvite?: (id: number) => void;
  handleRespondInvite?: (id: number, accept: boolean) => void;
}

export function InvitesModal({
  user,
  isOpen,
  onClose,
  availableUnits,
  inviteEmail,
  setInviteEmail,
  inviteUnitId,
  setInviteUnitId,
  inviteDeposit,
  setInviteDeposit,
  inviteMoveIn,
  setInviteMoveIn,
  inviteMessage,
  setInviteMessage,
  sentInvites,
  receivedInvites,
  loading,
  handleSendInvite,
  handleCancelInvite,
  handleAcceptInvite,
  handleDeclineInvite,
  handleRespondInvite,
}: InvitesModalProps) {
  if (!isOpen) return null;

  if (user.role === "owner") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-backdrop-fade">
        <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-[#f8fafc] p-6 shadow-xl border border-[#e2e8f0] animate-modal-scale">
          <div className="flex justify-end mb-4">
            <button
              type="button"
              className="rounded-md p-2 -mr-2 -mt-2 text-[#475569] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              onClick={onClose}
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
                    className="rounded-md bg-[#2563eb] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
    );
  }

  // Tenant view for received invites
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-backdrop-fade">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-[#f8fafc] p-6 shadow-xl border border-[#e2e8f0] animate-modal-scale">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            className="rounded-md p-2 -mr-2 -mt-2 text-[#475569] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
            onClick={onClose}
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
              Tenancy Invitations
            </h2>
            {receivedInvites.length === 0 ? (
              <p className="mt-3 text-sm text-[#475569]">
                No tenancy invitations received yet.
              </p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {receivedInvites.map((inv) => (
                  <li
                    key={inv.id}
                    className="rounded-md border border-[#e2e8f0] p-4 bg-[#f8fafc]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#0f172a]">
                            {inv.property_name} — {inv.unit_name}
                          </h3>
                          <InviteStatusLabel status={inv.status} />
                        </div>
                        {inv.owner_name && (
                          <p className="text-xs text-[#475569]">
                            Owner: {inv.owner_name} ({inv.owner_email})
                          </p>
                        )}
                        {inv.rent_amount && (
                          <p className="text-xs text-[#2563eb] font-semibold">
                            Rent: {formatMoney(inv.rent_amount)}/month
                          </p>
                        )}
                        {inv.move_in_date && (
                          <p className="text-xs text-[#475569]">
                            Move-in Date: {formatDate(inv.move_in_date)}
                          </p>
                        )}
                        {inv.deposit > 0 && (
                          <p className="text-xs text-[#475569]">
                            Security Deposit: {formatMoney(inv.deposit)}
                          </p>
                        )}
                        {inv.message && (
                          <p className="text-xs italic text-[#475569] mt-2 bg-white p-2 rounded border border-[#e2e8f0]">
                            &quot;{inv.message}&quot;
                          </p>
                        )}
                      </div>
                      {inv.status === "pending" && (
                        <div className="flex gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            className="rounded-md bg-[#2563eb] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
                            onClick={() => {
                              if (handleAcceptInvite) handleAcceptInvite(inv.id);
                              else if (handleRespondInvite) handleRespondInvite(inv.id, true);
                            }}
                            disabled={loading}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-[#c44d4d] px-3.5 py-1.5 text-xs font-semibold text-[#c44d4d] transition-colors hover:bg-[#fde8e8] disabled:opacity-50"
                            onClick={() => {
                              if (handleDeclineInvite) handleDeclineInvite(inv.id);
                              else if (handleRespondInvite) handleRespondInvite(inv.id, false);
                            }}
                            disabled={loading}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
