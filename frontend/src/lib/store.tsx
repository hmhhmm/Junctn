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
  modules,
  getAdvisor,
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
  completedModuleIds: string[];
  accessToken: string | null;
  setAdvisorId: (id: string) => void;
  setPartnerId: (id: string) => void;
  setAccessToken: (token: string) => void;
  addReferral: (input: IntroduceInput) => void;
  updateReferralStatus: (id: string, status: ReferralStatus) => void;
  completeModule: (moduleId: string) => void;
  toasts: ToastMsg[];
  pushToast: (title: string, detail?: string) => void;
  dismissToast: (id: number) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

let refSeq = seedReferrals.length;
let toastSeq = 0;

function getInitialCompletedIds(advId: string): string[] {
  return modules.filter((m) => m.completedByAdvisor.includes(advId)).map((m) => m.id);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [referrals, setReferrals] = useState<Referral[]>(seedReferrals);
  const [advisorId, setAdvisorIdRaw] = useState(DEFAULT_ADVISOR_ID);
  const [partnerId, setPartnerId] = useState(partners[0].id);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>(() =>
    getInitialCompletedIds(DEFAULT_ADVISOR_ID),
  );

  const setAdvisorId = useCallback((id: string) => {
    setAdvisorIdRaw(id);
    setCompletedModuleIds(getInitialCompletedIds(id));
  }, []);

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

  const completeModule = useCallback(
    (moduleId: string) => {
      let isNew = false;
      setCompletedModuleIds((prev) => {
        if (prev.includes(moduleId)) return prev;
        isNew = true;
        return [...prev, moduleId];
      });
      if (isNew) {
        const mod = modules.find((m) => m.id === moduleId);
        const advisor = getAdvisor(advisorId);
        const deadline = advisor?.cpdDeadline
          ? new Date(advisor.cpdDeadline).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })
          : "quarter-end";
        if (mod) {
          pushToast(
            `+${mod.credits} CPD credit${mod.credits > 1 ? "s" : ""} earned`,
            `"${mod.title}" complete · MAS FAA-N13 deadline: ${deadline}`,
          );
        }
      }
    },
    [advisorId, pushToast],
  );

  const value = useMemo(
    () => ({
      referrals,
      advisorId,
      partnerId,
      completedModuleIds,
      accessToken,
      setAdvisorId,
      setPartnerId,
      setAccessToken,
      addReferral,
      updateReferralStatus,
      completeModule,
      toasts,
      pushToast,
      dismissToast,
    }),
    [referrals, advisorId, partnerId, completedModuleIds, accessToken, toasts, addReferral, updateReferralStatus, completeModule, pushToast, dismissToast],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
