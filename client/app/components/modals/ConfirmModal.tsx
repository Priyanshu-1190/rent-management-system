import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop-fade">
      <div className="w-full max-w-sm rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-2xl animate-modal-scale">
        <h3
          className={`text-lg font-semibold ${
            isDanger ? "text-[#933232]" : "text-[#0f172a]"
          }`}
        >
          {title}
        </h3>
        <div className="mt-2 text-sm text-[#334155]">{message}</div>
        <div className="mt-5 flex gap-3 justify-end">
          <button
            type="button"
            className="rounded-md border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#f1f5f9]"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
              isDanger
                ? "bg-[#c44d4d] hover:bg-[#a83a3a]"
                : "bg-[#2563eb] hover:bg-[#1e40af]"
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
