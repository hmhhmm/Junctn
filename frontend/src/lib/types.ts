export type Role = "advisor" | "partner" | "org";

export type ReferralStatus =
  | "suggested"
  | "introduced"
  | "in_progress"
  | "closed"
  | "declined";

export type ClientStatus = "active" | "prospect" | "review_due" | "dormant";

export type SuggestionKind = "followup" | "partner_match" | "cpd";

export type FlagKind = "followup" | "match" | "missing" | "logged";

export type Advisor = {
  id: string;
  name: string;
  initials: string;
  title: string;
  district: string; // region
  cpdEarned: number;
  cpdRequired: number;
  cpdDeadline: string; // ISO date
};

export type ClientProfile = {
  interests: string[];
  family: string[];
  importantDates: { label: string; date: string }[];
  communicationStyle: string;
  giftIdeas: string[];
  lastPersonalTouch: string | null;
  sourceNote: string; // e.g. "derived from 4 meeting notes"
};

export type NewsItem = {
  id: string;
  headline: string;
  source: string;
  date: string;
  summary: string;
  tags: string[]; // matches client needs/interests
  url?: string;
};

export type Client = {
  id: string;
  advisorId: string;
  name: string;
  initials: string;
  lastContact: string; // ISO date
  nextMeeting?: string; // ISO datetime
  tags: string[];
  needs: string[]; // drives partner matching
  status: ClientStatus;
  aum: number; // assets under management (SGD)
  notes: ContactNote[];
  profile?: ClientProfile;
};

export type ContactNote = {
  id: string;
  date: string; // ISO date
  channel: "Meeting" | "Call" | "Email" | "WhatsApp" | "Note";
  summary: string;
  source?: boolean; // used as an AI memory source
};

export interface ApiPartnerMatch {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  region: string;
  score: number;
  reason: string;
  successRate: number;
  acceptanceRate: number;
  avgDaysToClose: number;
}

export interface BriefingTraceEvent {
  agent: string;
  status: string;
  timestamp: string;
  summary: string;
}

export interface BriefingCacheEntry {
  text: string;
  traceEvents: BriefingTraceEvent[];
}

export type Partner = {
  id: string;
  name: string;
  initials: string;
  specialty: string; // matches client needs
  region: string;
  email: string;
  successRate: number; // 0..1, overall
  referralsFromDistrict: Record<string, number>; // district -> count
  acceptanceRate: number; // 0..1
  avgDaysToClose: number;
};

export type Referral = {
  id: string;
  clientId: string;
  advisorId: string;
  partnerId: string;
  reason: string;
  note?: string;
  status: ReferralStatus;
  createdAt: string; // ISO date
  sharedFields: string[]; // what the advisor chose to share with the partner
};

export type Module = {
  id: string;
  title: string;
  credits: number;
  topic: string;
  required: boolean;
  durationMin: number;
  completedByAdvisor: string[]; // advisorIds
};

export type Meeting = {
  id: string;
  advisorId: string;
  clientId?: string;
  time: string; // "09:30"
  title: string;
  channel: "In person" | "Video" | "Call" | "Office";
  meta: string;
  flag?: { kind: FlagKind; text: string };
};

export type Suggestion = {
  id: string;
  advisorId: string;
  kind: SuggestionKind;
  trigger: string; // the inline "why" — e.g. "mentioned a trust, 2 days ago"
  payload: {
    title: string;
    detail?: string;
    clientId?: string;
    partnerId?: string;
    moduleId?: string;
    score?: number;
  };
};

export type PartnerMatch = {
  partner: Partner;
  score: number; // 0..100
  reason: string;
  overlap: string[];
};

export type Gap = {
  region: string;
  specialty: string;
  coverage: number; // partner count covering this cell
  demand: number; // referrals requesting this cell
  severity: "none" | "low" | "ok";
};
