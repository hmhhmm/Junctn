"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  seedReferrals,
  DEFAULT_ADVISOR_ID,
  partners,
  TODAY,
} from "./data";
import type { Referral, ReferralStatus } from "./types";

type ToastMsg = { id: number; title: string; detail?: string };

type IntroduceInput = {
  clientId: string;
  advisorId: string;
  partnerId: string;
  reason: string;
  note?: string;
  sharedFields: string[];
};

type StoreValue = {
  referrals: Referral[];
  advisorId: string;
  partnerId: string;
  accessToken: string | null;
  setAdvisorId: (id: string) => void;
  setPartnerId: (id: string) => void;
  setAccessToken: (token: string) => void;
  addReferral: (input: IntroduceInput) => void;
  updateReferralStatus: (id: string, status: ReferralStatus) => void;
  toasts: ToastMsg[];
  pushToast: (title: string, detail?: string) => void;
  dismissToast: (id: number) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

let refSeq = seedReferrals.length;
let toastSeq = 0;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [referrals, setReferrals] = useState<Referral[]>(seedReferrals);
  const [advisorId, setAdvisorId] = useState(DEFAULT_ADVISOR_ID);
  const [partnerId, setPartnerId] = useState(partners[0].id);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const pushToast = useCallback((title: string, detail?: string) => {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, title, detail }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const dismissToast = useCallback(
    (id: number) => setToasts((t) => t.filter((x) => x.id !== id)),
    [],
  );

  const addReferral = useCallback(
    (input: IntroduceInput) => {
      const newRef: Referral = {
        id: `ref-${++refSeq}`,
        clientId: input.clientId,
        advisorId: input.advisorId,
        partnerId: input.partnerId,
        reason: input.reason,
        note: input.note,
        status: "introduced",
        createdAt: TODAY,
        sharedFields: input.sharedFields,
      };
      setReferrals((prev) => [newRef, ...prev]);
    },
    [],
  );

  const updateReferralStatus = useCallback((id: string, status: ReferralStatus) => {
    setReferrals((prev) => prev.map((rf) => (rf.id === id ? { ...rf, status } : rf)));
  }, []);

  const value = useMemo(
    () => ({
      referrals,
      advisorId,
      partnerId,
      accessToken,
      setAdvisorId,
      setPartnerId,
      setAccessToken,
      addReferral,
      updateReferralStatus,
      toasts,
      pushToast,
      dismissToast,
    }),
    [referrals, advisorId, partnerId, accessToken, toasts, addReferral, updateReferralStatus, pushToast, dismissToast],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
