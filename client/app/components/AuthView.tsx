import React, { FormEvent } from "react";
import { Role } from "../types";

interface AuthViewProps {
  apiStatus: string;
  authMode: "login" | "register";
  setAuthMode: (mode: "login" | "register") => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  regName: string;
  setRegName: (val: string) => void;
  regEmail: string;
  setRegEmail: (val: string) => void;
  regPassword: string;
  setRegPassword: (val: string) => void;
  regRole: Role;
  setRegRole: (role: Role) => void;
  notice: string;
  setNotice: (msg: string) => void;
  loading: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogin: (e: FormEvent<HTMLFormElement>) => void;
  handleRegister: (e: FormEvent<HTMLFormElement>) => void;
  handleScrollTo: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
}

export function AuthView({
  apiStatus,
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword,
  regName,
  setRegName,
  regEmail,
  setRegEmail,
  regPassword,
  setRegPassword,
  regRole,
  setRegRole,
  notice,
  setNotice,
  loading,
  mobileMenuOpen,
  setMobileMenuOpen,
  handleLogin,
  handleRegister,
  handleScrollTo,
}: AuthViewProps) {
  const renderAuthForm = () => (
    <div className="w-full rounded-2xl border border-[#cbd5e1] bg-white p-6 sm:p-8 shadow-xl relative z-10 transition-all duration-300">
      <div className="flex border-b border-[#e2e8f0] mb-6">
        <button
          className={`flex-1 py-2.5 text-center font-bold text-sm transition-all duration-300 relative focus:outline-none ${
            authMode === "login"
              ? "text-[#2563eb]"
              : "text-[#64748b] hover:text-[#0f172a]"
          }`}
          onClick={() => {
            setAuthMode("login");
            setNotice("");
          }}
          type="button"
        >
          Account Login
          {authMode === "login" && (
            <span className="absolute bottom-0 left-0 h-0.5 w-full bg-[#2563eb]" />
          )}
        </button>
        <button
          className={`flex-1 py-2.5 text-center font-bold text-sm transition-all duration-300 relative focus:outline-none ${
            authMode === "register"
              ? "text-[#2563eb]"
              : "text-[#64748b] hover:text-[#0f172a]"
          }`}
          onClick={() => {
            setAuthMode("register");
            setNotice("");
          }}
          type="button"
        >
          Create Account
          {authMode === "register" && (
            <span className="absolute bottom-0 left-0 h-0.5 w-full bg-[#2563eb]" />
          )}
        </button>
      </div>

      {notice && (
        <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 p-3 text-xs font-semibold text-[#2563eb] leading-relaxed">
          {notice}
        </div>
      )}

      {authMode === "login" ? (
        <form onSubmit={handleLogin} className="grid gap-4">
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-[#475569]">
            Email Address
            <input
              className="rounded-md border border-[#cbd5e1] bg-[#faf8f5] px-4 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 hover:border-[#94a3b8] transition-all duration-300"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              required
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-[#475569]">
            Password
            <input
              className="rounded-md border border-[#cbd5e1] bg-[#faf8f5] px-4 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 hover:border-[#94a3b8] transition-all duration-300"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          <button
            className="mt-3 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] py-3 font-bold text-white shadow-md transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            type="submit"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Login to Account"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="grid gap-4">
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-[#475569]">
            Full Name
            <input
              className="rounded-md border border-[#cbd5e1] bg-[#faf8f5] px-4 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 hover:border-[#94a3b8] transition-all duration-300"
              type="text"
              value={regName}
              onChange={(event) => setRegName(event.target.value)}
              placeholder="e.g. Ramesh Kumar"
              required
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-[#475569]">
            Email Address
            <input
              className="rounded-md border border-[#cbd5e1] bg-[#faf8f5] px-4 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 hover:border-[#94a3b8] transition-all duration-300"
              type="email"
              value={regEmail}
              onChange={(event) => setRegEmail(event.target.value)}
              placeholder="name@example.com"
              required
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-[#475569]">
            Password
            <input
              className="rounded-md border border-[#cbd5e1] bg-[#faf8f5] px-4 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 hover:border-[#94a3b8] transition-all duration-300"
              type="password"
              value={regPassword}
              onChange={(event) => setRegPassword(event.target.value)}
              placeholder="•••••••• (min 6 chars)"
              required
              minLength={6}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-[#475569]">
            Account Role
            <select
              className="rounded-md border border-[#cbd5e1] bg-[#faf8f5] px-4 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 hover:border-[#94a3b8] transition-all duration-300 cursor-pointer"
              value={regRole}
              onChange={(event) => setRegRole(event.target.value as Role)}
            >
              <option value="tenant">Tenant</option>
              <option value="owner">Owner</option>
            </select>
          </label>
          <button
            className="mt-3 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] py-3 font-bold text-white shadow-md transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            type="submit"
            disabled={loading}
          >
            {loading ? "Registering..." : "Create Free Account"}
          </button>
        </form>
      )}
    </div>
  );

  return (
    <main className="min-h-screen w-full bg-[#faf8f5] text-[#0f172a] font-sans text-lg leading-[24px] selection:bg-[#2563eb] selection:text-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#e2e8f0] bg-[#faf8f5]/80 backdrop-blur-md text-[#0f172a] shadow-sm transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 py-4">
          <a
            href="#"
            className="flex items-center gap-2 group rounded focus:outline-none"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
              setMobileMenuOpen(false);
            }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563eb] text-white font-bold text-2xl shadow-sm group-hover:scale-105 transition-transform duration-300">
              ₹
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#0f172a] group-hover:text-[#2563eb] transition-colors duration-300">
              Rent Khata
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center gap-6"
            aria-label="Landing page"
          >
            <a
              className="relative px-3 py-2 text-sm font-semibold text-[#475569] transition-all duration-300 hover:text-[#2563eb] rounded"
              href="#features"
              onClick={(e) => handleScrollTo(e, "features")}
            >
              Features
            </a>
            <a
              className="relative px-3 py-2 text-sm font-semibold text-[#475569] transition-all duration-300 hover:text-[#2563eb] rounded"
              href="#access"
              onClick={(e) => {
                setAuthMode("login");
                setNotice("");
                handleScrollTo(e, "access");
              }}
            >
              Login
            </a>
            <div className="hidden h-5 w-px bg-[#cbd5e1] sm:block" />
            <a
              className="rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
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
            className="md:hidden rounded-lg p-2 text-[#475569] hover:text-[#2563eb] hover:bg-[#f1f5f9] transition-all duration-200"
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
          className={`md:hidden grid transition-[grid-template-rows,opacity] duration-300 ease-in-out bg-[#faf8f5]/95 backdrop-blur-md ${
            mobileMenuOpen
              ? "grid-rows-[1fr] opacity-100 border-t border-[#e2e8f0]"
              : "grid-rows-[0fr] opacity-0 border-t-0"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <nav
              className="flex flex-col space-y-3 px-6 py-4"
              aria-label="Mobile navigation"
            >
              <a
                className="text-base font-semibold text-[#475569] hover:text-[#2563eb] transition-colors py-2 border-b border-[#e2e8f0] rounded"
                href="#features"
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleScrollTo(e, "features");
                }}
              >
                Features
              </a>
              <a
                className="text-base font-semibold text-[#475569] hover:text-[#2563eb] transition-colors py-2 border-b border-[#e2e8f0] rounded"
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
                className="rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] px-4 py-3 text-center text-sm font-bold text-white shadow-md transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] mt-2"
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
      <section className="relative min-h-[85vh] overflow-hidden bg-[#faf8f5] text-[#0f172a] flex items-center py-12">

        <div className="mx-auto max-w-5xl w-full px-4 sm:px-8 relative z-10 -mt-6 md:mt-4">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#2563eb] shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-[#2563eb] animate-pulse" />
              Your Ultimate Rental Ledger
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.15] text-[#0f172a] max-w-4xl">
              Rent, tenants, receipts, & dues in{" "}
              <span className="italic font-normal text-[#2563eb]">
                one calm workspace.
              </span>
            </h1>

            <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-[#475569] font-normal">
              A modern, clean workspace designed for owners and tenants.
              Manage properties, coordinate leases, log payments, and generate
              invoices with ease.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <a
                className="inline-flex items-center justify-center rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
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
                className="inline-flex items-center justify-center rounded-xl border border-[#cbd5e1] bg-white px-6 py-3.5 text-sm font-bold text-[#334155] shadow-sm transition-all duration-300 hover:bg-[#faf8f5] hover:border-[#94a3b8] active:scale-[0.98]"
                href="#features"
                onClick={(e) => handleScrollTo(e, "features")}
              >
                Explore Features
              </a>
            </div>

            {/* Micro Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[#e2e8f0] max-w-lg w-full text-center">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#2563eb]">
                  100%
                </p>
                <p className="text-xs text-[#64748b] uppercase tracking-wider mt-1 leading-tight font-semibold">
                  Ledger Accuracy
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">
                  Instant
                </p>
                <p className="text-xs text-[#64748b] uppercase tracking-wider mt-1 leading-tight font-semibold">
                  PDF Receipts
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#64748b]">
                  Zero
                </p>
                <p className="text-xs text-[#64748b] uppercase tracking-wider mt-1 leading-tight font-semibold">
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
        className="scroll-mt-16 pt-16 pb-12 bg-[#faf8f5] border-t border-[#e2e8f0] relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
              Platform Features
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#0f172a] leading-tight">
              Everything you need to manage rental operations smoothly
            </p>
            <p className="mt-3 text-sm sm:text-base text-[#64748b]">
              Forget messy spreadsheets and chaotic WhatsApp chats. Rent Khata
              organizes everything into clean, auditable records.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                color: "bg-blue-50 text-[#2563eb]",
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
                color: "bg-blue-50 text-[#2563eb]",
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
                color: "bg-blue-50 text-[#2563eb]",
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
                color: "bg-blue-50 text-[#2563eb]",
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
                color: "bg-blue-50 text-[#2563eb]",
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
                color: "bg-blue-50 text-[#2563eb]",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group rounded-xl bg-white p-6 border border-[#e2e8f0] hover:border-[#2563eb]/40 hover:-translate-y-1 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
              >
                <div
                  className={`h-12 w-12 rounded-lg ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-[#0f172a] group-hover:text-[#2563eb] transition-colors duration-300">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
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
        className="scroll-mt-16 bg-[#faf8f5] border-t border-[#e2e8f0] relative overflow-hidden py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-8 relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Text content left */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#2563eb] shadow-sm">
                Access Portal
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold text-[#0f172a] leading-tight">
                Ready to experience absolute ledger peace?
              </h2>
              <p className="max-w-2xl text-sm sm:text-base text-[#64748b] leading-relaxed">
                Join Rent Khata now to eliminate spreadsheet errors,
                centralize invoices, and keep accounts clear.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-[#2563eb] flex-shrink-0 mt-0.5 text-xs font-bold">
                    ✓
                  </div>
                  <p className="text-sm text-[#475569] leading-relaxed">
                    <strong className="text-[#0f172a] font-bold">
                      For Owners:
                    </strong>{" "}
                    Comprehensive property dashboard, automatic late fee
                    calculations, security deposit status tracker, and simple
                    inviting mechanism.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-[#2563eb] flex-shrink-0 mt-0.5 text-xs font-bold">
                    ✓
                  </div>
                  <p className="text-sm text-[#475569] leading-relaxed">
                    <strong className="text-[#0f172a] font-bold">
                      For Tenants:
                    </strong>{" "}
                    Instant receipt generation, real-time dashboard of pending
                    dues, and email-based contract accepts.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                {apiStatus && (
                  <div className="inline-flex items-center gap-2.5 rounded-lg bg-white border border-[#e2e8f0] px-4 py-3 text-xs font-mono text-[#64748b] shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-[#2563eb] animate-pulse" />
                    {apiStatus}
                  </div>
                )}
              </div>
            </div>

            {/* Auth Form right */}
            <div className="lg:col-span-5">{renderAuthForm()}</div>
          </div>
        </div>
      </section>

      {/* Landing Footer */}
      <footer className="border-t border-[#e2e8f0] bg-white text-[#475569] py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:px-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#2563eb] text-white text-xs font-bold">
              ₹
            </div>
            <span className="text-sm font-bold tracking-tight text-[#0f172a]">
              Rent Khata
            </span>
          </div>
          <p className="text-xs text-[#64748b]">
            © {new Date().getFullYear()} Rent Khata. All rights reserved. Calm,
            auditable rental ledger management.
          </p>
        </div>
      </footer>
    </main>
  );
}
