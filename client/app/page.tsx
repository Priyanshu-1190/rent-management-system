"use client";

import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import TenantDirectoryModal from "./components/TenantDirectoryModal";
import { OwnerDashboardView } from "./components/OwnerDashboardView";
import { TenantDashboardView } from "./components/TenantDashboardView";
import { ToastContainer } from "./components/ToastContainer";
import { AuthView } from "./components/AuthView";
import { HeaderNav } from "./components/HeaderNav";
import { InvitesModal } from "./components/modals/InvitesModal";
import { PaymentModal } from "./components/modals/PaymentModal";
import { ConfirmModal } from "./components/modals/ConfirmModal";
import type { FormEvent, ReactNode } from "react";

// Re-export types, formatters, and UI primitives for backward compatibility
export type {
  Role,
  User,
  Toast,
  OwnerDashboard,
  TenantDashboard,
  Property,
  Unit,
  Invite,
  AvailableUnit,
  UnitDetails,
} from "./types";
export { formatKolkataTime, formatMoney, formatPeriod, formatDate } from "./lib/formatters";
export { Metric, DataTable, Th, Td, StatusLabel, InviteStatusLabel } from "./components/ui/Primitives";

import type {
  Role,
  User,
  Toast,
  OwnerDashboard,
  TenantDashboard,
  Property,
  Unit,
  Invite,
  AvailableUnit,
  UnitDetails,
} from "./types";
import { formatKolkataTime, formatMoney, formatPeriod, formatDate } from "./lib/formatters";
import { Metric, DataTable, Th, Td, StatusLabel, InviteStatusLabel } from "./components/ui/Primitives";


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
  const [subStartRect, setSubStartRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const subRef = useRef<HTMLParagraphElement>(null);

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
  const [unitSubStartRect, setUnitSubStartRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const unitSubRef = useRef<HTMLParagraphElement>(null);

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
  const [editPropSubStartRect, setEditPropSubStartRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const editPropSubRef = useRef<HTMLParagraphElement>(null);

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
  const [editUnitSubStartRect, setEditUnitSubStartRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const editUnitSubRef = useRef<HTMLParagraphElement>(null);

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

  // Payment status sort/filter states

  // Computed values for payment status search, filter, and sort


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

  // Listen for Escape key to smoothly dismiss any active morph modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (viewingPropertyDetails && morphPhase !== "morphing-out") {
          handleClosePropertyDetails();
        } else if (viewingUnitDetails && unitMorphPhase !== "morphing-out") {
          handleCloseUnitDetails();
        } else if (editingProperty && editPropMorphPhase !== "morphing-out") {
          handleCloseEditProperty();
        } else if (editingUnit && editUnitMorphPhase !== "morphing-out") {
          handleCloseEditUnit();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    viewingPropertyDetails,
    morphPhase,
    viewingUnitDetails,
    unitMorphPhase,
    editingProperty,
    editPropMorphPhase,
    editingUnit,
    editUnitMorphPhase,
  ]);

  // Morph animation lifecycle management using FLIP for property details
  useLayoutEffect(() => {
    if (
      viewingPropertyDetails &&
      modalRef.current &&
      morphStartRect &&
      morphPhase === "morphing-in"
    ) {
      const modal = modalRef.current;
      if (modal.dataset.morphing === "true") return;
      modal.dataset.morphing = "true";

      const finalRect = modal.getBoundingClientRect();
      const deltaX = morphStartRect.left - finalRect.left;
      const deltaY = morphStartRect.top - finalRect.top;
      const scaleX = morphStartRect.width / finalRect.width;
      const scaleY = morphStartRect.height / finalRect.height;

      let title: HTMLElement | null = null;
      let tDeltaX = 0;
      let tDeltaY = 0;
      let tScaleX = 1;
      let tScaleY = 1;

      if (titleRef.current && titleStartRect && scaleX && scaleY) {
        title = titleRef.current;
        const titleFinalRect = title.getBoundingClientRect();
        const relX = titleFinalRect.left - finalRect.left;
        const relY = titleFinalRect.top - finalRect.top;
        const childVisOffsetX =
          titleStartRect.left - (morphStartRect.left + relX * scaleX);
        const childVisOffsetY =
          titleStartRect.top - (morphStartRect.top + relY * scaleY);
        tDeltaX = childVisOffsetX / scaleX;
        tDeltaY = childVisOffsetY / scaleY;
        tScaleX = titleStartRect.width / titleFinalRect.width / scaleX;
        tScaleY = titleStartRect.height / titleFinalRect.height / scaleY;
      }

      let subTitle: HTMLElement | null = null;
      let sDeltaX = 0;
      let sDeltaY = 0;
      let sScaleX = 1;
      let sScaleY = 1;

      if (subRef.current && subStartRect && scaleX && scaleY) {
        subTitle = subRef.current;
        const subFinalRect = subTitle.getBoundingClientRect();
        const relX = subFinalRect.left - finalRect.left;
        const relY = subFinalRect.top - finalRect.top;
        const childVisOffsetX =
          subStartRect.left - (morphStartRect.left + relX * scaleX);
        const childVisOffsetY =
          subStartRect.top - (morphStartRect.top + relY * scaleY);
        sDeltaX = childVisOffsetX / scaleX;
        sDeltaY = childVisOffsetY / scaleY;
        sScaleX = subStartRect.width / subFinalRect.width / scaleX;
        sScaleY = subStartRect.height / subFinalRect.height / scaleY;
      }

      modal.style.transition = "none";
      modal.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
      modal.style.opacity = "1";
      modal.style.transformOrigin = "top left";

      if (title) {
        title.style.transition = "none";
        title.style.transform = `translate3d(${tDeltaX}px, ${tDeltaY}px, 0) scale(${tScaleX}, ${tScaleY})`;
        title.style.transformOrigin = "top left";
        title.style.color = "#2563eb";
      }

      if (subTitle) {
        subTitle.style.transition = "none";
        subTitle.style.transform = `translate3d(${sDeltaX}px, ${sDeltaY}px, 0) scale(${sScaleX}, ${sScaleY})`;
        subTitle.style.transformOrigin = "top left";
      }

      let timer: NodeJS.Timeout;
      let raf2: number;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          modal.style.transition =
            "transform 340ms cubic-bezier(0.32, 0.72, 0, 1), opacity 340ms cubic-bezier(0.32, 0.72, 0, 1)";
          modal.style.transform = "translate3d(0, 0, 0) scale(1, 1)";
          modal.style.opacity = "1";

          if (title) {
            title.style.transition =
              "transform 340ms cubic-bezier(0.32, 0.72, 0, 1), color 340ms ease";
            title.style.transform = "translate3d(0, 0, 0) scale(1, 1)";
            title.style.color = "#0f172a";
          }

          if (subTitle) {
            subTitle.style.transition =
              "transform 340ms cubic-bezier(0.32, 0.72, 0, 1), opacity 340ms ease";
            subTitle.style.transform = "translate3d(0, 0, 0) scale(1, 1)";
          }

          timer = setTimeout(() => {
            delete modal.dataset.morphing;
            setMorphPhase("expanded");
          }, 340);
        });
      });

      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
        if (timer) clearTimeout(timer);
      };
    }
  }, [viewingPropertyDetails, morphStartRect, titleStartRect, subStartRect, morphPhase]);

  // Morph animation lifecycle management using FLIP for unit details
  useLayoutEffect(() => {
    if (
      viewingUnitDetails &&
      unitModalRef.current &&
      unitMorphStartRect &&
      unitMorphPhase === "morphing-in"
    ) {
      const modal = unitModalRef.current;
      if (modal.dataset.morphing === "true") return;
      modal.dataset.morphing = "true";

      const finalRect = modal.getBoundingClientRect();
      const deltaX = unitMorphStartRect.left - finalRect.left;
      const deltaY = unitMorphStartRect.top - finalRect.top;
      const scaleX = unitMorphStartRect.width / finalRect.width;
      const scaleY = unitMorphStartRect.height / finalRect.height;

      let title: HTMLElement | null = null;
      let tDeltaX = 0;
      let tDeltaY = 0;
      let tScaleX = 1;
      let tScaleY = 1;

      if (unitTitleRef.current && unitTitleStartRect && scaleX && scaleY) {
        title = unitTitleRef.current;
        const titleFinalRect = title.getBoundingClientRect();
        const relX = titleFinalRect.left - finalRect.left;
        const relY = titleFinalRect.top - finalRect.top;
        const childVisOffsetX =
          unitTitleStartRect.left - (unitMorphStartRect.left + relX * scaleX);
        const childVisOffsetY =
          unitTitleStartRect.top - (unitMorphStartRect.top + relY * scaleY);
        tDeltaX = childVisOffsetX / scaleX;
        tDeltaY = childVisOffsetY / scaleY;
        tScaleX = unitTitleStartRect.width / titleFinalRect.width / scaleX;
        tScaleY = unitTitleStartRect.height / titleFinalRect.height / scaleY;
      }

      let subTitle: HTMLElement | null = null;
      let sDeltaX = 0;
      let sDeltaY = 0;
      let sScaleX = 1;
      let sScaleY = 1;

      if (unitSubRef.current && unitSubStartRect && scaleX && scaleY) {
        subTitle = unitSubRef.current;
        const subFinalRect = subTitle.getBoundingClientRect();
        const relX = subFinalRect.left - finalRect.left;
        const relY = subFinalRect.top - finalRect.top;
        const childVisOffsetX =
          unitSubStartRect.left - (unitMorphStartRect.left + relX * scaleX);
        const childVisOffsetY =
          unitSubStartRect.top - (unitMorphStartRect.top + relY * scaleY);
        sDeltaX = childVisOffsetX / scaleX;
        sDeltaY = childVisOffsetY / scaleY;
        sScaleX = unitSubStartRect.width / subFinalRect.width / scaleX;
        sScaleY = unitSubStartRect.height / subFinalRect.height / scaleY;
      }

      modal.style.transition = "none";
      modal.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
      modal.style.opacity = "1";
      modal.style.transformOrigin = "top left";

      if (title) {
        title.style.transition = "none";
        title.style.transform = `translate3d(${tDeltaX}px, ${tDeltaY}px, 0) scale(${tScaleX}, ${tScaleY})`;
        title.style.transformOrigin = "top left";
        title.style.color = "#2563eb";
      }

      if (subTitle) {
        subTitle.style.transition = "none";
        subTitle.style.transform = `translate3d(${sDeltaX}px, ${sDeltaY}px, 0) scale(${sScaleX}, ${sScaleY})`;
        subTitle.style.transformOrigin = "top left";
      }

      let timer: NodeJS.Timeout;
      let raf2: number;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          modal.style.transition =
            "transform 340ms cubic-bezier(0.32, 0.72, 0, 1), opacity 340ms cubic-bezier(0.32, 0.72, 0, 1)";
          modal.style.transform = "translate3d(0, 0, 0) scale(1, 1)";
          modal.style.opacity = "1";

          if (title) {
            title.style.transition =
              "transform 340ms cubic-bezier(0.32, 0.72, 0, 1), color 340ms ease";
            title.style.transform = "translate3d(0, 0, 0) scale(1, 1)";
            title.style.color = "#0f172a";
          }

          if (subTitle) {
            subTitle.style.transition =
              "transform 340ms cubic-bezier(0.32, 0.72, 0, 1), opacity 340ms ease";
            subTitle.style.transform = "translate3d(0, 0, 0) scale(1, 1)";
          }

          timer = setTimeout(() => {
            delete modal.dataset.morphing;
            setUnitMorphPhase("expanded");
          }, 340);
        });
      });

      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
        if (timer) clearTimeout(timer);
      };
    }
  }, [
    viewingUnitDetails,
    unitMorphStartRect,
    unitTitleStartRect,
    unitSubStartRect,
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
      if (modal.dataset.morphing === "true") return;
      modal.dataset.morphing = "true";

      const finalRect = modal.getBoundingClientRect();
      const deltaX = editPropMorphStartRect.left - finalRect.left;
      const deltaY = editPropMorphStartRect.top - finalRect.top;
      const scaleX = editPropMorphStartRect.width / finalRect.width;
      const scaleY = editPropMorphStartRect.height / finalRect.height;

      let title: HTMLElement | null = null;
      let tDeltaX = 0;
      let tDeltaY = 0;
      let tScaleX = 1;
      let tScaleY = 1;

      if (editPropTitleRef.current && editPropTitleStartRect && scaleX && scaleY) {
        title = editPropTitleRef.current;
        const titleFinalRect = title.getBoundingClientRect();
        const relX = titleFinalRect.left - finalRect.left;
        const relY = titleFinalRect.top - finalRect.top;
        const childVisOffsetX =
          editPropTitleStartRect.left - (editPropMorphStartRect.left + relX * scaleX);
        const childVisOffsetY =
          editPropTitleStartRect.top - (editPropMorphStartRect.top + relY * scaleY);
        tDeltaX = childVisOffsetX / scaleX;
        tDeltaY = childVisOffsetY / scaleY;
        tScaleX = editPropTitleStartRect.width / titleFinalRect.width / scaleX;
        tScaleY = editPropTitleStartRect.height / titleFinalRect.height / scaleY;
      }

      let subTitle: HTMLElement | null = null;
      let sDeltaX = 0;
      let sDeltaY = 0;
      let sScaleX = 1;
      let sScaleY = 1;

      if (editPropSubRef.current && editPropSubStartRect && scaleX && scaleY) {
        subTitle = editPropSubRef.current;
        const subFinalRect = subTitle.getBoundingClientRect();
        const relX = subFinalRect.left - finalRect.left;
        const relY = subFinalRect.top - finalRect.top;
        const childVisOffsetX =
          editPropSubStartRect.left - (editPropMorphStartRect.left + relX * scaleX);
        const childVisOffsetY =
          editPropSubStartRect.top - (editPropMorphStartRect.top + relY * scaleY);
        sDeltaX = childVisOffsetX / scaleX;
        sDeltaY = childVisOffsetY / scaleY;
        sScaleX = editPropSubStartRect.width / subFinalRect.width / scaleX;
        sScaleY = editPropSubStartRect.height / subFinalRect.height / scaleY;
      }

      modal.style.transition = "none";
      modal.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
      modal.style.opacity = "1";
      modal.style.transformOrigin = "top left";

      if (title) {
        title.style.transition = "none";
        title.style.transform = `translate3d(${tDeltaX}px, ${tDeltaY}px, 0) scale(${tScaleX}, ${tScaleY})`;
        title.style.transformOrigin = "top left";
        title.style.color = "#2563eb";
      }

      if (subTitle) {
        subTitle.style.transition = "none";
        subTitle.style.transform = `translate3d(${sDeltaX}px, ${sDeltaY}px, 0) scale(${sScaleX}, ${sScaleY})`;
        subTitle.style.transformOrigin = "top left";
      }

      let timer: NodeJS.Timeout;
      let raf2: number;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          modal.style.transition =
            "transform 340ms cubic-bezier(0.32, 0.72, 0, 1), opacity 340ms cubic-bezier(0.32, 0.72, 0, 1)";
          modal.style.transform = "translate3d(0, 0, 0) scale(1, 1)";
          modal.style.opacity = "1";

          if (title) {
            title.style.transition =
              "transform 340ms cubic-bezier(0.32, 0.72, 0, 1), color 340ms ease";
            title.style.transform = "translate3d(0, 0, 0) scale(1, 1)";
            title.style.color = "#2563eb";
          }

          if (subTitle) {
            subTitle.style.transition =
              "transform 340ms cubic-bezier(0.32, 0.72, 0, 1), opacity 340ms ease";
            subTitle.style.transform = "translate3d(0, 0, 0) scale(1, 1)";
          }

          timer = setTimeout(() => {
            delete modal.dataset.morphing;
            setEditPropMorphPhase("expanded");
          }, 340);
        });
      });

      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
        if (timer) clearTimeout(timer);
      };
    }
  }, [
    editingProperty,
    editPropMorphStartRect,
    editPropTitleStartRect,
    editPropSubStartRect,
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
      if (modal.dataset.morphing === "true") return;
      modal.dataset.morphing = "true";

      const finalRect = modal.getBoundingClientRect();
      const deltaX = editUnitMorphStartRect.left - finalRect.left;
      const deltaY = editUnitMorphStartRect.top - finalRect.top;
      const scaleX = editUnitMorphStartRect.width / finalRect.width;
      const scaleY = editUnitMorphStartRect.height / finalRect.height;

      let title: HTMLElement | null = null;
      let tDeltaX = 0;
      let tDeltaY = 0;
      let tScaleX = 1;
      let tScaleY = 1;

      if (editUnitTitleRef.current && editUnitTitleStartRect && scaleX && scaleY) {
        title = editUnitTitleRef.current;
        const titleFinalRect = title.getBoundingClientRect();
        const relX = titleFinalRect.left - finalRect.left;
        const relY = titleFinalRect.top - finalRect.top;
        const childVisOffsetX =
          editUnitTitleStartRect.left - (editUnitMorphStartRect.left + relX * scaleX);
        const childVisOffsetY =
          editUnitTitleStartRect.top - (editUnitMorphStartRect.top + relY * scaleY);
        tDeltaX = childVisOffsetX / scaleX;
        tDeltaY = childVisOffsetY / scaleY;
        tScaleX = editUnitTitleStartRect.width / titleFinalRect.width / scaleX;
        tScaleY = editUnitTitleStartRect.height / titleFinalRect.height / scaleY;
      }

      let subTitle: HTMLElement | null = null;
      let sDeltaX = 0;
      let sDeltaY = 0;
      let sScaleX = 1;
      let sScaleY = 1;

      if (editUnitSubRef.current && editUnitSubStartRect && scaleX && scaleY) {
        subTitle = editUnitSubRef.current;
        const subFinalRect = subTitle.getBoundingClientRect();
        const relX = subFinalRect.left - finalRect.left;
        const relY = subFinalRect.top - finalRect.top;
        const childVisOffsetX =
          editUnitSubStartRect.left - (editUnitMorphStartRect.left + relX * scaleX);
        const childVisOffsetY =
          editUnitSubStartRect.top - (editUnitMorphStartRect.top + relY * scaleY);
        sDeltaX = childVisOffsetX / scaleX;
        sDeltaY = childVisOffsetY / scaleY;
        sScaleX = editUnitSubStartRect.width / subFinalRect.width / scaleX;
        sScaleY = editUnitSubStartRect.height / subFinalRect.height / scaleY;
      }

      modal.style.transition = "none";
      modal.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
      modal.style.opacity = "1";
      modal.style.transformOrigin = "top left";

      if (title) {
        title.style.transition = "none";
        title.style.transform = `translate3d(${tDeltaX}px, ${tDeltaY}px, 0) scale(${tScaleX}, ${tScaleY})`;
        title.style.transformOrigin = "top left";
        title.style.color = "#2563eb";
      }

      if (subTitle) {
        subTitle.style.transition = "none";
        subTitle.style.transform = `translate3d(${sDeltaX}px, ${sDeltaY}px, 0) scale(${sScaleX}, ${sScaleY})`;
        subTitle.style.transformOrigin = "top left";
      }

      let timer: NodeJS.Timeout;
      let raf2: number;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          modal.style.transition =
            "transform 340ms cubic-bezier(0.32, 0.72, 0, 1), opacity 340ms cubic-bezier(0.32, 0.72, 0, 1)";
          modal.style.transform = "translate3d(0, 0, 0) scale(1, 1)";
          modal.style.opacity = "1";

          if (title) {
            title.style.transition =
              "transform 340ms cubic-bezier(0.32, 0.72, 0, 1), color 340ms ease";
            title.style.transform = "translate3d(0, 0, 0) scale(1, 1)";
            title.style.color = "#2563eb";
          }

          if (subTitle) {
            subTitle.style.transition =
              "transform 340ms cubic-bezier(0.32, 0.72, 0, 1), opacity 340ms ease";
            subTitle.style.transform = "translate3d(0, 0, 0) scale(1, 1)";
          }

          timer = setTimeout(() => {
            delete modal.dataset.morphing;
            setEditUnitMorphPhase("expanded");
          }, 340);
        });
      });

      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
        if (timer) clearTimeout(timer);
      };
    }
  }, [
    editingUnit,
    editUnitMorphStartRect,
    editUnitTitleStartRect,
    editUnitSubStartRect,
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
    const preloadedList = Object.values(preloadedUnits).flat();
    const unit =
      viewingPropertyUnits.find((u) => u.id === unitId || (u as any).unit_id === unitId) ||
      propertyUnits.find((u) => u.id === unitId || (u as any).unit_id === unitId) ||
      preloadedList.find((u) => u.id === unitId || (u as any).unit_id === unitId);

    if (unit) {
      const prop =
        properties.find((p) => p.id === unit.property_id) ||
        viewingPropertyDetails;
      const propertyName = unit.property_name || (prop ? prop.name || prop.property_name : "");

      setViewingUnitDetails({
        unit_id: unit.id || (unit as any).unit_id,
        unit_name: unit.name || (unit as any).unit_name || "",
        property_id: unit.property_id,
        property_name: propertyName || "",
        rent_amount: unit.rent_amount,
        due_day: unit.due_day,
        late_fee_percentage: unit.late_fee_percentage,
        grace_period_days: unit.grace_period_days,
        unit_lease_agreement: unit.unit_lease_agreement !== undefined ? unit.unit_lease_agreement : (unit.lease_agreement || null),
        property_lease_agreement: unit.property_lease_agreement !== undefined ? unit.property_lease_agreement : (prop?.lease_agreement || null),
        tenancy_id: unit.tenancy_id !== undefined ? unit.tenancy_id : null,
        tenant_id: unit.tenant_id ?? null,
        tenant_name: unit.tenant_name ?? null,
        tenant_email: unit.tenant_email ?? null,
        move_in_date: unit.move_in_date ?? null,
        deposit: unit.deposit ?? 0,
        is_active: unit.is_active ?? false,
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
      const button = e.currentTarget as HTMLElement;
      const row = (button.closest("li, tr, [data-property-row]") as HTMLElement) || button;
      const nameEl = row.querySelector(".property-name-text") as HTMLElement;
      const cardRect = row.getBoundingClientRect();
      setMorphStartRect({
        left: cardRect.left,
        top: cardRect.top,
        width: cardRect.width,
        height: cardRect.height,
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
    if (morphPhase === "morphing-out") return;
    if (!modalRef.current || !morphStartRect) {
      setViewingPropertyDetails(null);
      setMorphPhase("idle");
      setMorphStartRect(null);
      return;
    }

    const modal = modalRef.current;
    delete modal.dataset.morphing;
    let latestRect = morphStartRect;

    const rowElement = document.querySelector(
      `[data-property-row="${morphStartRect.propertyId}"]`,
    ) as HTMLElement;
    if (rowElement) {
      const rect = rowElement.getBoundingClientRect();
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

    let title: HTMLElement | null = null;
    let tDeltaX = 0;
    let tDeltaY = 0;
    let tScaleX = 1;
    let tScaleY = 1;

    if (titleRef.current && titleStartRect && scaleX && scaleY) {
      title = titleRef.current;
      const titleFinalRect = title.getBoundingClientRect();
      const relX = titleFinalRect.left - finalRect.left;
      const relY = titleFinalRect.top - finalRect.top;
      const childVisOffsetX =
        titleStartRect.left - (latestRect.left + relX * scaleX);
      const childVisOffsetY =
        titleStartRect.top - (latestRect.top + relY * scaleY);
      tDeltaX = childVisOffsetX / scaleX;
      tDeltaY = childVisOffsetY / scaleY;
      tScaleX = titleStartRect.width / titleFinalRect.width / scaleX;
      tScaleY = titleStartRect.height / titleFinalRect.height / scaleY;
    }

    let subTitle: HTMLElement | null = null;
    let sDeltaX = 0;
    let sDeltaY = 0;
    let sScaleX = 1;
    let sScaleY = 1;

    if (subRef.current && subStartRect && scaleX && scaleY) {
      subTitle = subRef.current;
      const subFinalRect = subTitle.getBoundingClientRect();
      const relX = subFinalRect.left - finalRect.left;
      const relY = subFinalRect.top - finalRect.top;
      const childVisOffsetX =
        subStartRect.left - (latestRect.left + relX * scaleX);
      const childVisOffsetY =
        subStartRect.top - (latestRect.top + relY * scaleY);
      sDeltaX = childVisOffsetX / scaleX;
      sDeltaY = childVisOffsetY / scaleY;
      sScaleX = subStartRect.width / subFinalRect.width / scaleX;
      sScaleY = subStartRect.height / subFinalRect.height / scaleY;
    }

    setMorphPhase("morphing-out");

    modal.style.transition =
      "transform 320ms cubic-bezier(0.32, 0.72, 0, 1), opacity 320ms cubic-bezier(0.32, 0.72, 0, 1)";
    modal.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
    modal.style.opacity = "0";
    modal.style.transformOrigin = "top left";

    if (title) {
      title.style.transition =
        "transform 320ms cubic-bezier(0.32, 0.72, 0, 1), color 250ms ease";
      title.style.transform = `translate3d(${tDeltaX}px, ${tDeltaY}px, 0) scale(${tScaleX}, ${tScaleY})`;
      title.style.transformOrigin = "top left";
      title.style.color = "#2563eb";
    }

    if (subTitle) {
      subTitle.style.transition =
        "transform 320ms cubic-bezier(0.32, 0.72, 0, 1), opacity 250ms ease";
      subTitle.style.transform = `translate3d(${sDeltaX}px, ${sDeltaY}px, 0) scale(${sScaleX}, ${sScaleY})`;
      subTitle.style.transformOrigin = "top left";
    }

    setTimeout(() => {
      setViewingPropertyDetails(null);
      setMorphPhase("idle");
      setMorphStartRect(null);
    }, 320);
  };

  const handleCloseUnitDetails = () => {
    if (unitMorphPhase === "morphing-out") return;
    if (!unitModalRef.current || !unitMorphStartRect) {
      setViewingUnitDetails(null);
      setUnitMorphPhase("idle");
      setUnitMorphStartRect(null);
      return;
    }

    const modal = unitModalRef.current;
    delete modal.dataset.morphing;
    let latestRect = unitMorphStartRect;

    const rowElement =
      (document.querySelector(
        `[data-unit-row="${unitMorphStartRect.unitId}"]`,
      ) as HTMLElement) ||
      (document.querySelector(
        `[data-property-unit-row="${unitMorphStartRect.unitId}"]`,
      ) as HTMLElement);
    if (rowElement) {
      const rect = rowElement.getBoundingClientRect();
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

    let title: HTMLElement | null = null;
    let tDeltaX = 0;
    let tDeltaY = 0;
    let tScaleX = 1;
    let tScaleY = 1;

    if (unitTitleRef.current && unitTitleStartRect && scaleX && scaleY) {
      title = unitTitleRef.current;
      const titleFinalRect = title.getBoundingClientRect();
      const relX = titleFinalRect.left - finalRect.left;
      const relY = titleFinalRect.top - finalRect.top;
      const childVisOffsetX =
        unitTitleStartRect.left - (latestRect.left + relX * scaleX);
      const childVisOffsetY =
        unitTitleStartRect.top - (latestRect.top + relY * scaleY);
      tDeltaX = childVisOffsetX / scaleX;
      tDeltaY = childVisOffsetY / scaleY;
      tScaleX = unitTitleStartRect.width / titleFinalRect.width / scaleX;
      tScaleY = unitTitleStartRect.height / titleFinalRect.height / scaleY;
    }

    let subTitle: HTMLElement | null = null;
    let sDeltaX = 0;
    let sDeltaY = 0;
    let sScaleX = 1;
    let sScaleY = 1;

    if (unitSubRef.current && unitSubStartRect && scaleX && scaleY) {
      subTitle = unitSubRef.current;
      const subFinalRect = subTitle.getBoundingClientRect();
      const relX = subFinalRect.left - finalRect.left;
      const relY = subFinalRect.top - finalRect.top;
      const childVisOffsetX =
        unitSubStartRect.left - (latestRect.left + relX * scaleX);
      const childVisOffsetY =
        unitSubStartRect.top - (latestRect.top + relY * scaleY);
      sDeltaX = childVisOffsetX / scaleX;
      sDeltaY = childVisOffsetY / scaleY;
      sScaleX = unitSubStartRect.width / subFinalRect.width / scaleX;
      sScaleY = unitSubStartRect.height / subFinalRect.height / scaleY;
    }

    setUnitMorphPhase("morphing-out");

    modal.style.transition =
      "transform 320ms cubic-bezier(0.32, 0.72, 0, 1), opacity 320ms cubic-bezier(0.32, 0.72, 0, 1)";
    modal.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
    modal.style.opacity = "0";
    modal.style.transformOrigin = "top left";

    if (title) {
      title.style.transition =
        "transform 320ms cubic-bezier(0.32, 0.72, 0, 1), color 250ms ease";
      title.style.transform = `translate3d(${tDeltaX}px, ${tDeltaY}px, 0) scale(${tScaleX}, ${tScaleY})`;
      title.style.transformOrigin = "top left";
      title.style.color = "#2563eb";
    }

    if (subTitle) {
      subTitle.style.transition =
        "transform 320ms cubic-bezier(0.32, 0.72, 0, 1), opacity 250ms ease";
      subTitle.style.transform = `translate3d(${sDeltaX}px, ${sDeltaY}px, 0) scale(${sScaleX}, ${sScaleY})`;
      subTitle.style.transformOrigin = "top left";
    }

    setTimeout(() => {
      setViewingUnitDetails(null);
      setUnitMorphPhase("idle");
      setUnitMorphStartRect(null);
    }, 320);
  };

  const handleOpenEditProperty = (p: Property, e?: React.MouseEvent) => {
    if (e) {
      const button = e.currentTarget as HTMLElement;
      const row = (button.closest("li, tr, [data-edit-property-row]") as HTMLElement) || button;
      const nameEl = row.querySelector(".property-name-text") as HTMLElement;
      const cardRect = row.getBoundingClientRect();
      setEditPropMorphStartRect({
        left: cardRect.left,
        top: cardRect.top,
        width: cardRect.width,
        height: cardRect.height,
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
    if (editPropMorphPhase === "morphing-out") return;
    if (!editPropModalRef.current || !editPropMorphStartRect) {
      setEditingProperty(null);
      setEditPropMorphPhase("idle");
      setEditPropMorphStartRect(null);
      return;
    }

    const modal = editPropModalRef.current;
    delete modal.dataset.morphing;
    let latestRect = editPropMorphStartRect;

    const rowElement = document.querySelector(
      `[data-edit-property-row="${editPropMorphStartRect.propertyId}"]`,
    ) as HTMLElement;
    if (rowElement) {
      const rect = rowElement.getBoundingClientRect();
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

    let title: HTMLElement | null = null;
    let tDeltaX = 0;
    let tDeltaY = 0;
    let tScaleX = 1;
    let tScaleY = 1;

    if (
      editPropTitleRef.current &&
      editPropTitleStartRect &&
      scaleX &&
      scaleY
    ) {
      title = editPropTitleRef.current;
      const titleFinalRect = title.getBoundingClientRect();
      const relX = titleFinalRect.left - finalRect.left;
      const relY = titleFinalRect.top - finalRect.top;
      const childVisOffsetX =
        editPropTitleStartRect.left - (latestRect.left + relX * scaleX);
      const childVisOffsetY =
        editPropTitleStartRect.top - (latestRect.top + relY * scaleY);
      tDeltaX = childVisOffsetX / scaleX;
      tDeltaY = childVisOffsetY / scaleY;
      tScaleX = editPropTitleStartRect.width / titleFinalRect.width / scaleX;
      tScaleY = editPropTitleStartRect.height / titleFinalRect.height / scaleY;
    }

    let subTitle: HTMLElement | null = null;
    let sDeltaX = 0;
    let sDeltaY = 0;
    let sScaleX = 1;
    let sScaleY = 1;

    if (editPropSubRef.current && editPropSubStartRect && scaleX && scaleY) {
      subTitle = editPropSubRef.current;
      const subFinalRect = subTitle.getBoundingClientRect();
      const relX = subFinalRect.left - finalRect.left;
      const relY = subFinalRect.top - finalRect.top;
      const childVisOffsetX =
        editPropSubStartRect.left - (latestRect.left + relX * scaleX);
      const childVisOffsetY =
        editPropSubStartRect.top - (latestRect.top + relY * scaleY);
      sDeltaX = childVisOffsetX / scaleX;
      sDeltaY = childVisOffsetY / scaleY;
      sScaleX = editPropSubStartRect.width / subFinalRect.width / scaleX;
      sScaleY = editPropSubStartRect.height / subFinalRect.height / scaleY;
    }

    setEditPropMorphPhase("morphing-out");

    modal.style.transition =
      "transform 320ms cubic-bezier(0.32, 0.72, 0, 1), opacity 320ms cubic-bezier(0.32, 0.72, 0, 1)";
    modal.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
    modal.style.opacity = "0";
    modal.style.transformOrigin = "top left";

    if (title) {
      title.style.transition =
        "transform 320ms cubic-bezier(0.32, 0.72, 0, 1), color 250ms ease";
      title.style.transform = `translate3d(${tDeltaX}px, ${tDeltaY}px, 0) scale(${tScaleX}, ${tScaleY})`;
      title.style.transformOrigin = "top left";
      title.style.color = "#2563eb";
    }

    if (subTitle) {
      subTitle.style.transition =
        "transform 320ms cubic-bezier(0.32, 0.72, 0, 1), opacity 250ms ease";
      subTitle.style.transform = `translate3d(${sDeltaX}px, ${sDeltaY}px, 0) scale(${sScaleX}, ${sScaleY})`;
      subTitle.style.transformOrigin = "top left";
    }

    setTimeout(() => {
      setEditingProperty(null);
      setEditPropMorphPhase("idle");
      setEditPropMorphStartRect(null);
    }, 320);
  };

  const handleOpenEditUnit = (u: Unit, e?: React.MouseEvent) => {
    if (e) {
      const button = e.currentTarget as HTMLElement;
      const container = (button.closest("li, tr, [data-edit-unit-row], [data-property-edit-unit-row]") as HTMLElement) || button;
      const nameEl = container.querySelector(".unit-name-text") as HTMLElement;
      const cardRect = container.getBoundingClientRect();
      setEditUnitMorphStartRect({
        left: cardRect.left,
        top: cardRect.top,
        width: cardRect.width,
        height: cardRect.height,
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
    if (editUnitMorphPhase === "morphing-out") return;
    if (!editUnitModalRef.current || !editUnitMorphStartRect) {
      setEditingUnit(null);
      setEditUnitMorphPhase("idle");
      setEditUnitMorphStartRect(null);
      return;
    }

    const modal = editUnitModalRef.current;
    delete modal.dataset.morphing;
    let latestRect = editUnitMorphStartRect;

    const rowElement =
      (document.querySelector(
        `[data-edit-unit-row="${editUnitMorphStartRect.unitId}"]`,
      ) as HTMLElement) ||
      (document.querySelector(
        `[data-property-edit-unit-row="${editUnitMorphStartRect.unitId}"]`,
      ) as HTMLElement);
    if (rowElement) {
      const rect = rowElement.getBoundingClientRect();
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

    let title: HTMLElement | null = null;
    let tDeltaX = 0;
    let tDeltaY = 0;
    let tScaleX = 1;
    let tScaleY = 1;

    if (
      editUnitTitleRef.current &&
      editUnitTitleStartRect &&
      scaleX &&
      scaleY
    ) {
      title = editUnitTitleRef.current;
      const titleFinalRect = title.getBoundingClientRect();
      const relX = titleFinalRect.left - finalRect.left;
      const relY = titleFinalRect.top - finalRect.top;
      const childVisOffsetX =
        editUnitTitleStartRect.left - (latestRect.left + relX * scaleX);
      const childVisOffsetY =
        editUnitTitleStartRect.top - (latestRect.top + relY * scaleY);
      tDeltaX = childVisOffsetX / scaleX;
      tDeltaY = childVisOffsetY / scaleY;
      tScaleX = editUnitTitleStartRect.width / titleFinalRect.width / scaleX;
      tScaleY = editUnitTitleStartRect.height / titleFinalRect.height / scaleY;
    }

    let subTitle: HTMLElement | null = null;
    let sDeltaX = 0;
    let sDeltaY = 0;
    let sScaleX = 1;
    let sScaleY = 1;

    if (editUnitSubRef.current && editUnitSubStartRect && scaleX && scaleY) {
      subTitle = editUnitSubRef.current;
      const subFinalRect = subTitle.getBoundingClientRect();
      const relX = subFinalRect.left - finalRect.left;
      const relY = subFinalRect.top - finalRect.top;
      const childVisOffsetX =
        editUnitSubStartRect.left - (latestRect.left + relX * scaleX);
      const childVisOffsetY =
        editUnitSubStartRect.top - (latestRect.top + relY * scaleY);
      sDeltaX = childVisOffsetX / scaleX;
      sDeltaY = childVisOffsetY / scaleY;
      sScaleX = editUnitSubStartRect.width / subFinalRect.width / scaleX;
      sScaleY = editUnitSubStartRect.height / subFinalRect.height / scaleY;
    }

    setEditUnitMorphPhase("morphing-out");

    modal.style.transition =
      "transform 320ms cubic-bezier(0.32, 0.72, 0, 1), opacity 320ms cubic-bezier(0.32, 0.72, 0, 1)";
    modal.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
    modal.style.opacity = "0";
    modal.style.transformOrigin = "top left";

    if (title) {
      title.style.transition =
        "transform 320ms cubic-bezier(0.32, 0.72, 0, 1), color 250ms ease";
      title.style.transform = `translate3d(${tDeltaX}px, ${tDeltaY}px, 0) scale(${tScaleX}, ${tScaleY})`;
      title.style.transformOrigin = "top left";
      title.style.color = "#2563eb";
    }

    if (subTitle) {
      subTitle.style.transition =
        "transform 320ms cubic-bezier(0.32, 0.72, 0, 1), opacity 250ms ease";
      subTitle.style.transform = `translate3d(${sDeltaX}px, ${sDeltaY}px, 0) scale(${sScaleX}, ${sScaleY})`;
      subTitle.style.transformOrigin = "top left";
    }

    setTimeout(() => {
      setEditingUnit(null);
      setEditUnitMorphPhase("idle");
      setEditUnitMorphStartRect(null);
    }, 320);
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
      <AuthView
        apiStatus={apiStatus}
        authMode={authMode}
        setAuthMode={setAuthMode}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        regName={regName}
        setRegName={setRegName}
        regEmail={regEmail}
        setRegEmail={setRegEmail}
        regPassword={regPassword}
        setRegPassword={setRegPassword}
        regRole={regRole}
        setRegRole={setRegRole}
        notice={notice}
        setNotice={setNotice}
        loading={loading}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
        handleScrollTo={handleScrollTo}
      />
    );
  }
  const isAnyModalActive =
    (morphPhase !== "idle" && morphPhase !== "morphing-out") ||
    (unitMorphPhase !== "idle" && unitMorphPhase !== "morphing-out") ||
    (editPropMorphPhase !== "idle" && editPropMorphPhase !== "morphing-out") ||
    (editUnitMorphPhase !== "idle" && editUnitMorphPhase !== "morphing-out");

  //Header Section
  return (
    <>
      <main
        className={`min-h-screen w-full bg-[#faf8f5] text-[#0f172a] transition-all duration-340 ease-[cubic-bezier(0.32,0.72,0,1)] origin-center ${
          isAnyModalActive
            ? "scale-[0.98] -translate-y-1 rounded-2xl overflow-hidden shadow-2xl brightness-[0.95]"
            : "scale-100 translate-y-0 rounded-none brightness-100"
        }`}
      >
      <HeaderNav
        apiStatus={apiStatus}
        user={user}
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        showAccountDetails={showAccountDetails}
        setShowAccountDetails={setShowAccountDetails}
        setShowDeleteConfirm={setShowDeleteConfirm}
        setShowLogoutConfirm={setShowLogoutConfirm}
        setShowTenantDirectory={setShowTenantDirectory}
        setShowInvitesModal={setShowInvitesModal}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">


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
                  className="rounded-md bg-[#2563eb] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="rounded-md bg-[#2563eb] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
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

        {user && showInvitesModal && (
          <InvitesModal
            user={user}
            isOpen={showInvitesModal}
            onClose={() => setShowInvitesModal(false)}
            availableUnits={availableUnits}
            inviteEmail={inviteEmail}
            setInviteEmail={setInviteEmail}
            inviteUnitId={inviteUnitId}
            setInviteUnitId={setInviteUnitId}
            inviteDeposit={inviteDeposit}
            setInviteDeposit={setInviteDeposit}
            inviteMoveIn={inviteMoveIn}
            setInviteMoveIn={setInviteMoveIn}
            inviteMessage={inviteMessage}
            setInviteMessage={setInviteMessage}
            sentInvites={sentInvites}
            receivedInvites={receivedInvites}
            loading={loading}
            handleSendInvite={handleSendInvite}
            handleCancelInvite={handleCancelInvite}
            handleAcceptInvite={handleAcceptInvite}
            handleDeclineInvite={handleDeclineInvite}
          />
        )}

        {ownerDashboard ? (
          <OwnerDashboardView
            dashboard={ownerDashboard}
            onViewProperty={handleViewPropertyDetails}
            onLogPayment={handleOpenLogPayment}
            downloadReceipt={downloadReceipt}
          />
        ) : null}

        {tenantDashboard ? (
          <TenantDashboardView
            dashboard={tenantDashboard}
            downloadReceipt={downloadReceipt}
          />
        ) : null}
      </div>
      </main>

      {viewingPropertyDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          {/* Backdrop overlay */}
          <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-340 ease-[cubic-bezier(0.32,0.72,0,1)] pointer-events-auto ${
              morphPhase !== "idle" && morphPhase !== "morphing-out"
                ? "opacity-100"
                : "opacity-0"
            }`}
            onClick={handleClosePropertyDetails}
          />

          {/* Modal card */}
          <div
            ref={modalRef}
            className={`my-auto w-full max-w-5xl max-h-[84vh] sm:max-h-[86vh] overflow-y-auto custom-scrollbar rounded-2xl border border-[#e2e8f0]/80 bg-[#f8fafc] p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] relative z-10 ${
              morphPhase === "expanded"
                ? "pointer-events-auto"
                : "pointer-events-none"
            }`}
            style={{
              willChange: "transform",
            }}
          >
            {/* iOS Pull Handle Bar */}
            <div className="mx-auto -mt-2 mb-3 h-1.5 w-10 rounded-full bg-[#cbd5e1]/80" />
            {/* Close Button - elevated z-index to sit on top of the z-20 header */}
            <button
              type="button"
              className={`absolute right-6 top-6 z-30 rounded-lg p-2 text-[#475569] transition-all hover:bg-[#f1f5f9] hover:text-[#0f172a] hover:scale-105 active:scale-95 ${
                morphPhase !== "idle" && morphPhase !== "morphing-out"
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              }`}
              style={{
                transition:
                  morphPhase !== "idle" && morphPhase !== "morphing-out"
                    ? "opacity 320ms cubic-bezier(0.16, 1, 0.3, 1)"
                    : "opacity 180ms ease-out",
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
                className="text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]"
                style={{
                  opacity:
                    morphPhase !== "idle" && morphPhase !== "morphing-out"
                      ? 1
                      : 0,
                  transition: "opacity 320ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                Property Details
              </p>
              <h3 className="mt-1 text-2xl font-bold text-[#0f172a] flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-[#2563eb]"
                  style={{
                    opacity:
                      morphPhase !== "idle" && morphPhase !== "morphing-out"
                        ? 1
                        : 0,
                    transition: "opacity 320ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
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

            {/* Rest of the contents: Fade-in during morph expansion */}
            <div
              style={{
                opacity:
                  morphPhase !== "idle" && morphPhase !== "morphing-out"
                    ? 1
                    : 0,
                transition:
                  morphPhase !== "idle" && morphPhase !== "morphing-out"
                    ? "opacity 280ms cubic-bezier(0.16, 1, 0.3, 1) 40ms"
                    : "opacity 180ms ease-out",
              }}
            >
              {properties.find(
                (p) => p.id === viewingPropertyDetails.property_id,
              )?.address && (
                <p
                  ref={subRef}
                  className="mt-1.5 text-sm text-[#475569] flex items-center gap-1.5 mb-6"
                  style={{ display: "inline-flex", willChange: "transform" }}
                >
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

      <ToastContainer
        toasts={toasts}
        onDismiss={(id) =>
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }
      />

      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmLabel="Log Out"
        loading={loading}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Account"
        message="Are you sure? This will permanently delete your account and all associated data. This action cannot be undone."
        confirmLabel="Yes, Delete"
        isDanger={true}
        loading={loading}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <ConfirmModal
        isOpen={!!deletingProperty}
        title="Delete Property"
        message={
          <span>
            Delete <strong>&ldquo;{deletingProperty?.name}&rdquo;</strong> and
            all its units? This action cannot be undone.
          </span>
        }
        confirmLabel="Yes, Delete"
        isDanger={true}
        loading={loading}
        onConfirm={handleDeleteProperty}
        onCancel={() => setDeletingProperty(null)}
      />
      <ConfirmModal
        isOpen={!!deletingUnit}
        title="Delete Unit"
        message={
          <span>
            Delete <strong>&ldquo;{deletingUnit?.name}&rdquo;</strong> and all
            its associated data? This action cannot be undone.
          </span>
        }
        confirmLabel="Yes, Delete"
        isDanger={true}
        loading={loading}
        onConfirm={handleDeleteUnit}
        onCancel={() => setDeletingUnit(null)}
      />

      {/* Edit Property Modal */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          {/* Backdrop overlay */}
          <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-340 ease-[cubic-bezier(0.32,0.72,0,1)] pointer-events-auto ${
              editPropMorphPhase !== "idle" && editPropMorphPhase !== "morphing-out"
                ? "opacity-100"
                : "opacity-0"
            }`}
            onClick={handleCloseEditProperty}
          />

          {/* Modal card */}
          <div
            ref={editPropModalRef}
            className={`my-auto w-full max-w-sm max-h-[84vh] overflow-y-auto custom-scrollbar rounded-2xl border border-[#e2e8f0]/80 bg-[#f8fafc] p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] relative z-10 ${
              editPropMorphPhase === "expanded"
                ? "pointer-events-auto"
                : "pointer-events-none"
            }`}
            style={{
              willChange: "transform",
            }}
          >
            {/* iOS Pull Handle Bar */}
            <div className="mx-auto -mt-2 mb-3 h-1.5 w-10 rounded-full bg-[#cbd5e1]/80" />
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

            {/* Rest of the contents: Fade-in during morph expansion */}
            <div
              style={{
                opacity:
                  editPropMorphPhase !== "idle" && editPropMorphPhase !== "morphing-out"
                    ? 1
                    : 0,
                transition:
                  editPropMorphPhase !== "idle" && editPropMorphPhase !== "morphing-out"
                    ? "opacity 280ms cubic-bezier(0.16, 1, 0.3, 1) 40ms"
                    : "opacity 180ms ease-out",
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
            className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-200 animate-backdrop-fade"
            onClick={() => {
              setShowLeaseEditModal(false);
              setEditingLeaseProp(null);
            }}
          />

          {/* Modal card */}
          <div className="my-auto w-full max-w-2xl max-h-[84vh] overflow-y-auto custom-scrollbar rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-6 shadow-2xl relative z-10 animate-modal-scale">
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
            className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-200 animate-backdrop-fade"
            onClick={() => {
              setShowUnitLeaseModal(false);
              setEditingUnitLease(null);
            }}
          />

          {/* Modal card */}
          <div className="my-auto w-full max-w-2xl max-h-[84vh] overflow-y-auto custom-scrollbar rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-6 shadow-2xl relative z-10 animate-modal-scale">
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
            className={`fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-340 ease-[cubic-bezier(0.32,0.72,0,1)] pointer-events-auto ${
              editUnitMorphPhase !== "idle" && editUnitMorphPhase !== "morphing-out"
                ? "opacity-100"
                : "opacity-0"
            }`}
            onClick={handleCloseEditUnit}
          />

          {/* Modal card */}
          <div
            ref={editUnitModalRef}
            className={`my-auto w-full max-w-md max-h-[84vh] overflow-y-auto custom-scrollbar rounded-2xl border border-[#e2e8f0]/80 bg-[#f8fafc] p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] relative z-10 ${
              editUnitMorphPhase === "expanded"
                ? "pointer-events-auto"
                : "pointer-events-none"
            }`}
            style={{
              willChange: "transform",
            }}
          >
            {/* iOS Pull Handle Bar */}
            <div className="mx-auto -mt-2 mb-3 h-1.5 w-10 rounded-full bg-[#cbd5e1]/80" />
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

            {/* Rest of the contents: Fade-in during morph expansion */}
            <div
              style={{
                opacity:
                  editUnitMorphPhase !== "idle" && editUnitMorphPhase !== "morphing-out"
                    ? 1
                    : 0,
                transition:
                  editUnitMorphPhase !== "idle" && editUnitMorphPhase !== "morphing-out"
                    ? "opacity 280ms cubic-bezier(0.16, 1, 0.3, 1) 40ms"
                    : "opacity 180ms ease-out",
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
            className={`fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-340 ease-[cubic-bezier(0.32,0.72,0,1)] pointer-events-auto ${
              unitMorphPhase !== "idle" && unitMorphPhase !== "morphing-out"
                ? "opacity-100"
                : "opacity-0"
            }`}
            onClick={handleCloseUnitDetails}
          />

          {/* Modal card */}
          <div
            ref={unitModalRef}
            className={`my-auto w-full max-w-lg max-h-[84vh] overflow-y-auto custom-scrollbar rounded-2xl border border-[#e2e8f0]/80 bg-[#f8fafc] p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] relative z-10 ${
              unitMorphPhase === "expanded"
                ? "pointer-events-auto"
                : "pointer-events-none"
            }`}
            style={{
              willChange: "transform",
            }}
          >
            {/* iOS Pull Handle Bar */}
            <div className="mx-auto -mt-2 mb-3 h-1.5 w-10 rounded-full bg-[#cbd5e1]/80" />
            {/* Close Button - elevated z-index */}
            <button
              type="button"
              className={`absolute right-6 top-6 z-30 rounded-lg p-2 text-[#475569] transition-all hover:bg-[#f1f5f9] hover:text-[#0f172a] hover:scale-105 active:scale-95 ${
                unitMorphPhase !== "idle" && unitMorphPhase !== "morphing-out"
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              }`}
              style={{
                transition:
                  unitMorphPhase !== "idle" && unitMorphPhase !== "morphing-out"
                    ? "opacity 320ms cubic-bezier(0.16, 1, 0.3, 1)"
                    : "opacity 180ms ease-out",
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
                ref={unitSubRef}
                className="text-sm text-[#475569]"
                style={{ display: "block", willChange: "transform" }}
              >
                {viewingUnitDetails.property_name}
              </p>
            </div>

            {/* Rest of the contents: Fade-in during morph expansion */}
            <div
              style={{
                opacity:
                  unitMorphPhase !== "idle" && unitMorphPhase !== "morphing-out"
                    ? 1
                    : 0,
                transition:
                  unitMorphPhase !== "idle" && unitMorphPhase !== "morphing-out"
                    ? "opacity 280ms cubic-bezier(0.16, 1, 0.3, 1) 40ms"
                    : "opacity 180ms ease-out",
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

      <PaymentModal
        loggingPaymentRent={loggingPaymentRent}
        onClose={() => setLoggingPaymentRent(null)}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentTxnId={paymentTxnId}
        setPaymentTxnId={setPaymentTxnId}
        loading={loading}
        handleLogPayment={handleLogPayment}
      />

      <TenantDirectoryModal
        isOpen={showTenantDirectory}
        onClose={() => setShowTenantDirectory(false)}
        onInviteClick={() => {
          setShowTenantDirectory(false);
          setShowInvitesModal(true);
        }}
      />
    </>
  );
}