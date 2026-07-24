import React from "react";
import { User } from "../types";

interface HeaderNavProps {
  apiStatus: string;
  user: User | null;
  showMenu: boolean;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
  showAccountDetails: boolean;
  setShowAccountDetails: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDeleteConfirm: (val: boolean) => void;
  setShowLogoutConfirm: (val: boolean) => void;
  setShowTenantDirectory: (val: boolean) => void;
  setShowInvitesModal: (val: boolean) => void;
}

export function HeaderNav({
  apiStatus,
  user,
  showMenu,
  setShowMenu,
  showAccountDetails,
  setShowAccountDetails,
  setShowDeleteConfirm,
  setShowLogoutConfirm,
  setShowTenantDirectory,
  setShowInvitesModal,
}: HeaderNavProps) {
  return (
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
  );
}
