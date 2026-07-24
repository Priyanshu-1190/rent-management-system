import React from "react";
import { Toast } from "../types";

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 transform translate-y-0 ${
            t.type === "success"
              ? "border-[#2563eb]/20 bg-[#eff6ff] text-[#2563eb]"
              : t.type === "error"
                ? "border-red-500/20 bg-red-50/90 text-red-700"
                : "border-[#e2e8f0] bg-[#ffffff] text-[#334155]"
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
            onClick={() => onDismiss(t.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
