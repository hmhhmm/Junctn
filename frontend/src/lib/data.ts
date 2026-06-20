import type {
  Advisor,
  Client,
  Partner,
  Referral,
  Module,
  Meeting,
  Suggestion,
  PartnerMatch,
  Gap,
  ReferralStatus,
} from "./types";

// ---------------------------------------------------------------------------
// Vocabulary — client needs and partner specialties share this list so that
// matching is a transparent tag-overlap, not a black box.
// ---------------------------------------------------------------------------
export const SPECIALTIES = [
  "Estate & Trust",
  "Tax Planning",
  "Mortgage",
  "Corporate Insurance",
  "Investments",
  "Legal / Will",
  "Business Succession",
  "Retirement",
] as const;

export const REGIONS = ["Central", "North", "East", "West"] as const;

export const TODAY = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Advisors
// ---------------------------------------------------------------------------
export const advisors: Advisor[] = [
  {
    id: "adv-1",
    name: "Marcus Tan",
    initials: "MT",
    title: "Senior Financial Advisor",
    district: "Central",
    cpdEarned: 18,
    cpdRequired: 20,
    cpdDeadline: "2026-06-30",
  },
  {
    id: "adv-2",
    name: "Aisyah Rahman",
    initials: "AR",
    title: "Wealth Advisor",
    district: "North",
    cpdEarned: 22,
    cpdRequired: 20,
    cpdDeadline: "2026-09-30",
  },
  {
    id: "adv-3",
    name: "Lim Wei Jie",
    initials: "LW",
    title: "Financial Advisor",
    district: "East",
    cpdEarned: 14,
    cpdRequired: 20,
    cpdDeadline: "2026-08-15",
  },
  {
    id: "adv-4",
    name: "Priya Nair",
    initials: "PN",
    title: "Associate Advisor",
    district: "West",
    cpdEarned: 9,
    cpdRequired: 20,
    cpdDeadline: "2026-09-30",
  },
  {
    id: "adv-5",
    name: "Daniel Wong",
    initials: "DW",
    title: "Senior Financial Advisor",
    district: "Central",
    cpdEarned: 16,
    cpdRequired: 20,
    cpdDeadline: "2026-07-31",
  },
  {
    id: "adv-6",
    name: "Nurul Huda",
    initials: "NH",
    title: "Wealth Advisor",
    district: "North",
    cpdEarned: 20,
    cpdRequired: 20,
    cpdDeadline: "2026-09-30",
  },
];

export const DEFAULT_ADVISOR_ID = "adv-1";

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------
const c = (
  id: string,
  advisorId: string,
  name: string,
  lastContact: string,
  status: Client["status"],
  tags: string[],
  needs: string[],
  aum: number,
  nextMeeting?: string,
  notes: Client["notes"] = [],
): Client => ({
  id,
  advisorId,
  name,
  initials: name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join(""),
  lastContact,
  nextMeeting,
  tags,
  needs,
  status,
  aum,
  notes,
});

export const clients: Client[] = [
  // ---- Marcus Tan (adv-1, Central) — the hero advisor's book ----
  c(
    "cli-1",
    "adv-1",
    "Lawrence Goh",
    "2026-06-17",
    "active",
    ["HNW", "Business owner", "Family office"],
    ["Estate & Trust", "Business Succession", "Tax Planning"],
    4_200_000,
    "2026-06-19T09:30",
    [
      {
        id: "n1",
        date: "2026-06-17",
        channel: "Meeting",
        summary:
          "Mentioned wanting to set up a trust for his two children before year end. Worried about probate delays.",
        source: true,
      },
      {
        id: "n2",
        date: "2026-05-29",
        channel: "Call",
        summary: "Reviewed Q2 portfolio. Comfortable with current allocation; wants to revisit succession of the F&B business.",
        source: true,
      },
      {
        id: "n3",
        date: "2026-04-12",
        channel: "Email",
        summary: "Sent updated insurance summary. Daughter starting university in 2027.",
      },
    ],
  ),
  c(
    "cli-2",
    "adv-1",
    "Serena Koh",
    "2026-06-05",
    "review_due",
    ["Pre-retiree", "Conservative"],
    ["Retirement", "Investments"],
    980_000,
    "2026-06-19T11:00",
    [
      {
        id: "n4",
        date: "2026-06-05",
        channel: "WhatsApp",
        summary: "Replied to last note — asked whether to top up SRS before the meeting. Awaiting your response.",
        source: true,
      },
      {
        id: "n5",
        date: "2026-03-20",
        channel: "Meeting",
        summary: "Annual review. On track for retirement at 62. Risk appetite lowered after market dip.",
      },
    ],
  ),
  c(
    "cli-3",
    "adv-1",
    "Raj Kumar",
    "2026-06-18",
    "active",
    ["Young family", "Property"],
    ["Mortgage", "Investments"],
    310_000,
    "2026-06-19T14:00",
    [
      {
        id: "n6",
        date: "2026-06-18",
        channel: "Call",
        summary: "Found a resale condo, needs mortgage refinancing advice before option expires next week.",
        source: true,
      },
    ],
  ),
  c(
    "cli-4",
    "adv-1",
    "Madam Chua Bee Lian",
    "2026-05-02",
    "review_due",
    ["Legacy", "Widowed"],
    ["Estate & Trust", "Legal / Will"],
    1_650_000,
    "2026-06-19T16:00",
    [
      {
        id: "n7",
        date: "2026-05-02",
        channel: "Meeting",
        summary: "Wants to update her will and ensure the grandchildren are provided for. No notes captured after the meeting.",
      },
    ],
  ),
  c(
    "cli-5",
    "adv-1",
    "Tan Soon Huat",
    "2026-06-10",
    "active",
    ["Business owner", "SME"],
    ["Corporate Insurance", "Business Succession"],
    2_100_000,
    undefined,
    [
      {
        id: "n8",
        date: "2026-06-10",
        channel: "Meeting",
        summary: "Expanding logistics business, hiring 15 staff. Asked about keyman insurance and partner buyout cover.",
        source: true,
      },
    ],
  ),
  c(
    "cli-6",
    "adv-1",
    "Felicia Ong",
    "2026-06-14",
    "active",
    ["Professional", "DINK"],
    ["Investments", "Tax Planning"],
    540_000,
    undefined,
    [
      {
        id: "n9",
        date: "2026-06-14",
        channel: "Email",
        summary: "New RSU vesting in July — asked about tax-efficient ways to diversify out of company stock.",
        source: true,
      },
    ],
  ),
  c(
    "cli-7",
    "adv-1",
    "Hafiz Ismail",
    "2026-04-28",
    "dormant",
    ["Young professional"],
    ["Investments"],
    85_000,
    undefined,
    [],
  ),
  c(
    "cli-8",
    "adv-1",
    "Grace Lim",
    "2026-06-12",
    "active",
    ["Pre-retiree", "Property"],
    ["Retirement", "Mortgage"],
    760_000,
    undefined,
    [],
  ),

  // ---- Aisyah Rahman (adv-2, North) ----
  c("cli-9", "adv-2", "Zainal Abidin", "2026-06-15", "active", ["Business owner"], ["Tax Planning", "Business Succession"], 1_900_000),
  c("cli-10", "adv-2", "Mei Ling Chan", "2026-06-11", "active", ["Pre-retiree"], ["Retirement", "Estate & Trust"], 1_200_000),
  c("cli-11", "adv-2", "Arjun Menon", "2026-06-09", "review_due", ["HNW"], ["Tax Planning", "Investments"], 3_300_000),
  c("cli-12", "adv-2", "Siti Nurhaliza", "2026-06-16", "active", ["Young family"], ["Mortgage", "Retirement"], 420_000),
  c("cli-13", "adv-2", "Kelvin Teo", "2026-05-20", "active", ["Business owner"], ["Tax Planning"], 880_000),

  // ---- Lim Wei Jie (adv-3, East) ----
  c("cli-14", "adv-3", "Brenda Sim", "2026-06-13", "active", ["HNW", "Legacy"], ["Estate & Trust", "Legal / Will"], 2_700_000),
  c("cli-15", "adv-3", "Mohan Das", "2026-06-08", "active", ["SME"], ["Corporate Insurance", "Tax Planning"], 1_100_000),
  c("cli-16", "adv-3", "Jocelyn Yeo", "2026-06-02", "prospect", ["Professional"], ["Investments", "Retirement"], 230_000),
  c("cli-17", "adv-3", "Ng Kok Wai", "2026-06-17", "active", ["Pre-retiree"], ["Retirement", "Estate & Trust"], 1_450_000),
  c("cli-18", "adv-3", "Farah Aziz", "2026-05-30", "active", ["Young family"], ["Mortgage"], 360_000),

  // ---- Priya Nair (adv-4, West) ----
  c("cli-19", "adv-4", "Vincent Lau", "2026-06-14", "active", ["Business owner"], ["Business Succession", "Legal / Will"], 1_700_000),
  c("cli-20", "adv-4", "Hannah Tan", "2026-06-10", "prospect", ["Young professional"], ["Investments"], 120_000),
  c("cli-21", "adv-4", "Deepa Rao", "2026-06-07", "active", ["HNW"], ["Estate & Trust", "Tax Planning"], 2_900_000),
  c("cli-22", "adv-4", "Samuel Ng", "2026-06-03", "active", ["Property"], ["Mortgage", "Investments"], 480_000),

  // ---- Daniel Wong (adv-5, Central) ----
  c("cli-23", "adv-5", "Patricia Lee", "2026-06-16", "active", ["HNW", "Legacy"], ["Estate & Trust", "Investments"], 5_100_000),
  c("cli-24", "adv-5", "Gopal Krishnan", "2026-06-12", "active", ["SME"], ["Corporate Insurance"], 1_300_000),
  c("cli-25", "adv-5", "Wendy Chia", "2026-06-06", "review_due", ["Pre-retiree"], ["Retirement"], 690_000),
  c("cli-26", "adv-5", "Adam Tan", "2026-06-01", "active", ["Professional"], ["Tax Planning", "Investments"], 540_000),

  // ---- Nurul Huda (adv-6, North) ----
  c("cli-27", "adv-6", "Lydia Goh", "2026-06-15", "active", ["HNW"], ["Tax Planning", "Estate & Trust"], 2_200_000),
  c("cli-28", "adv-6", "Ravi Shankar", "2026-06-11", "active", ["Business owner"], ["Tax Planning", "Business Succession"], 1_600_000),
  c("cli-29", "adv-6", "Joanne Tay", "2026-06-09", "prospect", ["Young family"], ["Mortgage", "Retirement"], 300_000),
  c("cli-30", "adv-6", "Hassan Ali", "2026-06-04", "active", ["Pre-retiree"], ["Retirement", "Tax Planning"], 980_000),
];

// ---------------------------------------------------------------------------
// Partners — note deliberate gaps: NO "Tax Planning" partner in North,
// no "Estate & Trust" in North or East, etc.
// ---------------------------------------------------------------------------
const p = (
  id: string,
  name: string,
  specialty: string,
  region: string,
  successRate: number,
  acceptanceRate: number,
  avgDaysToClose: number,
  referralsFromDistrict: Record<string, number>,
): Partner => ({
  id,
  name,
  initials: name
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join(""),
  specialty,
  region,
  successRate,
  acceptanceRate,
  avgDaysToClose,
  referralsFromDistrict,
});

export const partners: Partner[] = [
  p("ptr-1", "Meridian Trust Advisory", "Estate & Trust", "Central", 0.92, 0.95, 18, { Central: 12, North: 2, East: 1, West: 3 }),
  p("ptr-2", "Pinnacle Tax Partners", "Tax Planning", "Central", 0.88, 0.9, 21, { Central: 9, North: 1, East: 2, West: 1 }),
  p("ptr-3", "Northgate Mortgage Co.", "Mortgage", "North", 0.8, 0.86, 14, { North: 8, Central: 2 }),
  p("ptr-4", "Sentinel Corporate Risk", "Corporate Insurance", "East", 0.85, 0.88, 25, { East: 7, Central: 3, North: 1 }),
  p("ptr-5", "Asia Capital Investments", "Investments", "Central", 0.9, 0.93, 12, { Central: 14, North: 3, East: 2, West: 4 }),
  p("ptr-6", "Lex Estate Lawyers", "Legal / Will", "West", 0.83, 0.84, 30, { West: 6, Central: 2 }),
  p("ptr-7", "Continuity Succession Group", "Business Succession", "Central", 0.78, 0.8, 35, { Central: 5, East: 1 }),
  p("ptr-8", "Silverpine Retirement", "Retirement", "North", 0.87, 0.91, 16, { North: 6, Central: 1 }),
  p("ptr-9", "Heritage Trust West", "Estate & Trust", "West", 0.81, 0.85, 22, { West: 5, Central: 1 }),
  p("ptr-10", "Eastside Tax Chambers", "Tax Planning", "East", 0.84, 0.87, 20, { East: 5, Central: 1 }),
  p("ptr-11", "Polaris Wealth (North)", "Investments", "North", 0.86, 0.9, 13, { North: 7, Central: 1 }),
  p("ptr-12", "Westview Home Loans", "Mortgage", "West", 0.79, 0.82, 15, { West: 4, Central: 1 }),
];

// ---------------------------------------------------------------------------
// Referrals — seeded across statuses. These feed both the partner inbox and
// the org pipeline. The Introduce dialog appends to this list at runtime.
// ---------------------------------------------------------------------------
const r = (
  id: string,
  clientId: string,
  advisorId: string,
  partnerId: string,
  reason: string,
  status: ReferralStatus,
  createdAt: string,
  sharedFields: string[] = ["Need", "Time horizon"],
): Referral => ({ id, clientId, advisorId, partnerId, reason, status, createdAt, sharedFields });

export const seedReferrals: Referral[] = [
  r("ref-1", "cli-1", "adv-1", "ptr-1", "Setting up a family trust before year end", "in_progress", "2026-06-02"),
  r("ref-2", "cli-5", "adv-1", "ptr-4", "Keyman & partner-buyout cover for expanding SME", "introduced", "2026-06-12"),
  r("ref-3", "cli-6", "adv-1", "ptr-2", "Tax-efficient diversification of vesting RSUs", "suggested", "2026-06-14"),
  r("ref-4", "cli-3", "adv-1", "ptr-12", "Mortgage refinancing on resale condo", "closed", "2026-05-10"),
  r("ref-5", "cli-4", "adv-1", "ptr-6", "Will update and estate structuring", "introduced", "2026-06-09"),

  r("ref-6", "cli-9", "adv-2", "ptr-10", "Corporate tax restructuring", "in_progress", "2026-05-28"),
  r("ref-7", "cli-11", "adv-2", "ptr-5", "Portfolio rebalancing for HNW client", "closed", "2026-04-20"),
  r("ref-8", "cli-10", "adv-2", "ptr-8", "Retirement income planning", "closed", "2026-05-15"),
  r("ref-9", "cli-12", "adv-2", "ptr-3", "First home mortgage", "in_progress", "2026-06-05"),
  r("ref-10", "cli-13", "adv-2", "ptr-10", "GST and corporate tax review", "suggested", "2026-06-16"),

  r("ref-11", "cli-14", "adv-3", "ptr-9", "Cross-region trust setup", "introduced", "2026-06-01"),
  r("ref-12", "cli-15", "adv-3", "ptr-4", "Corporate insurance for SME", "closed", "2026-04-30"),
  r("ref-13", "cli-17", "adv-3", "ptr-8", "Retirement drawdown plan", "in_progress", "2026-06-06"),
  r("ref-14", "cli-16", "adv-3", "ptr-5", "Starter investment portfolio", "declined", "2026-05-22"),
  r("ref-15", "cli-15", "adv-3", "ptr-10", "Tax filing for new entity", "in_progress", "2026-06-10"),

  r("ref-16", "cli-19", "adv-4", "ptr-7", "Family business succession plan", "in_progress", "2026-05-25"),
  r("ref-17", "cli-21", "adv-4", "ptr-9", "Estate structuring for HNW", "introduced", "2026-06-07"),
  r("ref-18", "cli-22", "adv-4", "ptr-12", "Mortgage for second property", "closed", "2026-05-18"),
  r("ref-19", "cli-19", "adv-4", "ptr-6", "Will and shareholder agreement", "suggested", "2026-06-14"),
  r("ref-20", "cli-21", "adv-4", "ptr-2", "Cross-region tax planning", "introduced", "2026-06-11"),

  r("ref-21", "cli-23", "adv-5", "ptr-1", "Multi-generational trust", "in_progress", "2026-05-12"),
  r("ref-22", "cli-24", "adv-5", "ptr-4", "Group corporate insurance", "closed", "2026-04-25"),
  r("ref-23", "cli-23", "adv-5", "ptr-5", "Alternative investments allocation", "closed", "2026-05-30"),
  r("ref-24", "cli-25", "adv-5", "ptr-8", "Retirement plan review", "in_progress", "2026-06-08"),
  r("ref-25", "cli-26", "adv-5", "ptr-2", "Personal income tax optimisation", "introduced", "2026-06-13"),

  r("ref-26", "cli-27", "adv-6", "ptr-1", "Estate & trust (referred cross-region to Central)", "in_progress", "2026-05-29"),
  r("ref-27", "cli-28", "adv-6", "ptr-7", "Business succession structuring", "introduced", "2026-06-04"),
  r("ref-28", "cli-29", "adv-6", "ptr-3", "First-time mortgage", "closed", "2026-05-08"),
  r("ref-29", "cli-30", "adv-6", "ptr-8", "Retirement income strategy", "closed", "2026-05-19"),
  r("ref-30", "cli-27", "adv-6", "ptr-2", "Tax planning (no North tax partner — sent to Central)", "suggested", "2026-06-15"),

  // a few more to thicken the funnel
  r("ref-31", "cli-1", "adv-1", "ptr-2", "Estate tax exposure review", "closed", "2026-03-15"),
  r("ref-32", "cli-11", "adv-2", "ptr-2", "Tax planning sent cross-region (no North tax partner)", "in_progress", "2026-06-02"),
  r("ref-33", "cli-14", "adv-3", "ptr-10", "Estate-related tax filing", "closed", "2026-04-18"),
  r("ref-34", "cli-21", "adv-4", "ptr-9", "Trust deed review", "closed", "2026-05-05"),
  r("ref-35", "cli-23", "adv-5", "ptr-7", "Succession planning for family holding co.", "introduced", "2026-06-10"),
  r("ref-36", "cli-9", "adv-2", "ptr-2", "Corporate restructuring tax (cross-region)", "suggested", "2026-06-17"),
  r("ref-37", "cli-5", "adv-1", "ptr-7", "Partner buyout succession structuring", "suggested", "2026-06-13"),
  r("ref-38", "cli-17", "adv-3", "ptr-9", "Trust for grandchildren (cross-region)", "in_progress", "2026-06-09"),
  r("ref-39", "cli-30", "adv-6", "ptr-2", "Tax planning (cross-region to Central)", "declined", "2026-05-21"),
  r("ref-40", "cli-26", "adv-5", "ptr-5", "Diversification of concentrated stock", "in_progress", "2026-06-11"),
];

// ---------------------------------------------------------------------------
// Modules (L&D)
// ---------------------------------------------------------------------------
const m = (
  id: string,
  title: string,
  topic: string,
  credits: number,
  durationMin: number,
  required: boolean,
  completedByAdvisor: string[] = [],
): Module => ({ id, title, topic, credits, durationMin, required, completedByAdvisor });

export const modules: Module[] = [
  m("mod-1", "Trust Structures & Probate Essentials", "Estate & Trust", 2, 45, true, ["adv-2", "adv-5"]),
  m("mod-2", "Advanced Estate Planning for HNW Families", "Estate & Trust", 3, 90, false, ["adv-5"]),
  m("mod-3", "Personal & Corporate Tax Planning 2026", "Tax Planning", 2, 60, true, ["adv-2", "adv-6"]),
  m("mod-4", "GST & Cross-Border Tax Update", "Tax Planning", 1, 30, false, []),
  m("mod-5", "Mortgage & Property Financing Masterclass", "Mortgage", 2, 50, false, ["adv-4"]),
  m("mod-6", "Keyman & Business Insurance Fundamentals", "Corporate Insurance", 2, 45, true, ["adv-3", "adv-5"]),
  m("mod-7", "Portfolio Construction & Risk", "Investments", 3, 75, true, ["adv-1", "adv-2", "adv-5"]),
  m("mod-8", "Behavioural Finance for Advisors", "Investments", 1, 30, false, ["adv-1"]),
  m("mod-9", "Will Writing & Legal Compliance", "Legal / Will", 2, 40, true, ["adv-3", "adv-4"]),
  m("mod-10", "Business Succession Playbook", "Business Succession", 3, 80, false, []),
  m("mod-11", "Retirement Income & CPF Strategies", "Retirement", 2, 55, true, ["adv-2", "adv-6", "adv-5"]),
  m("mod-12", "SRS & Tax-Efficient Retirement", "Retirement", 1, 25, false, ["adv-6"]),
  m("mod-13", "Ethics & Fair Dealing (Mandatory)", "Compliance", 2, 40, true, ["adv-1", "adv-2", "adv-3", "adv-5", "adv-6"]),
  m("mod-14", "AML / KYC Annual Refresher", "Compliance", 1, 30, true, ["adv-1", "adv-2", "adv-3", "adv-6"]),
  m("mod-15", "Client Conversations & Discovery", "Practice", 1, 35, false, ["adv-1", "adv-4"]),
];

// ---------------------------------------------------------------------------
// Today's meetings (hero advisor)
// ---------------------------------------------------------------------------
export const meetings: Meeting[] = [
  {
    id: "mtg-1",
    advisorId: "adv-1",
    clientId: "cli-1",
    time: "09:30",
    title: "Lawrence Goh — portfolio & trust review",
    channel: "In person",
    meta: "Central · 45 min",
    flag: { kind: "match", text: "Mentioned a trust 2 days ago — partner match ready" },
  },
  {
    id: "mtg-2",
    advisorId: "adv-1",
    clientId: "cli-2",
    time: "11:00",
    title: "Serena Koh — pre-retirement check-in",
    channel: "Video",
    meta: "Zoom · 30 min",
    flag: { kind: "followup", text: "Unread WhatsApp reply about SRS top-up" },
  },
  {
    id: "mtg-3",
    advisorId: "adv-1",
    time: "12:30",
    title: "Block: CPD module — 'Trust Structures & Probate'",
    channel: "Office",
    meta: "Self-study · 45 min",
    flag: { kind: "match", text: "Recommended — matches your most common client need" },
  },
  {
    id: "mtg-4",
    advisorId: "adv-1",
    clientId: "cli-3",
    time: "14:00",
    title: "Raj Kumar — mortgage refinancing",
    channel: "Call",
    meta: "Phone · 20 min",
    flag: { kind: "followup", text: "Option expires next week — time-sensitive" },
  },
  {
    id: "mtg-5",
    advisorId: "adv-1",
    clientId: "cli-4",
    time: "16:00",
    title: "Madam Chua — will & estate follow-up",
    channel: "In person",
    meta: "Central · 45 min",
    flag: { kind: "missing", text: "No notes captured from last meeting (May 2)" },
  },
];

// ---------------------------------------------------------------------------
// Suggestions (hero advisor) — every one carries a visible trigger/source
// ---------------------------------------------------------------------------
export const suggestions: Suggestion[] = [
  {
    id: "sug-1",
    advisorId: "adv-1",
    kind: "partner_match",
    trigger: "Lawrence Goh mentioned a trust · 2 days ago",
    payload: {
      title: "Introduce Meridian Trust Advisory",
      detail: "Estate & Trust specialist, Central",
      clientId: "cli-1",
      partnerId: "ptr-1",
    },
  },
  {
    id: "sug-2",
    advisorId: "adv-1",
    kind: "followup",
    trigger: "Serena Koh replied on WhatsApp · unanswered 14 days",
    payload: {
      title: "Reply to Serena about SRS top-up",
      detail: "She asked before her 11:00 meeting today",
      clientId: "cli-2",
    },
  },
  {
    id: "sug-3",
    advisorId: "adv-1",
    kind: "cpd",
    trigger: "11 days to your CPD deadline · 2 credits short",
    payload: {
      title: "Complete 'Trust Structures & Probate Essentials'",
      detail: "Matches your most common client need (Estate & Trust)",
      moduleId: "mod-1",
    },
  },
  {
    id: "sug-4",
    advisorId: "adv-1",
    kind: "partner_match",
    trigger: "Felicia Ong's RSUs vest in July · tax question",
    payload: {
      title: "Introduce Pinnacle Tax Partners",
      detail: "Tax Planning specialist, Central",
      clientId: "cli-6",
      partnerId: "ptr-2",
    },
  },
];

// ===========================================================================
// HELPER QUERY FUNCTIONS — deterministic & explainable
// ===========================================================================

export const getAdvisor = (id: string) => advisors.find((a) => a.id === id);
export const getClient = (id: string) => clients.find((x) => x.id === id);
export const getPartner = (id: string) => partners.find((x) => x.id === id);
export const getModule = (id: string) => modules.find((x) => x.id === id);
export const getClientsByAdvisor = (advisorId: string) =>
  clients.filter((x) => x.advisorId === advisorId);

export function daysBetween(fromISO: string, toISO: string) {
  const a = new Date(fromISO).getTime();
  const b = new Date(toISO).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

// --- matchPartners ---------------------------------------------------------
// Ranks partners by tag-overlap (client needs vs partner specialty) weighted
// by the partner's proven success and familiarity in the advisor's district.
export function matchPartners(client: Client): PartnerMatch[] {
  const advisor = getAdvisor(client.advisorId);
  const district = advisor?.district ?? "Central";

  const matches: PartnerMatch[] = [];
  for (const partner of partners) {
    const direct = client.needs.includes(partner.specialty);
    if (!direct) continue; // only show partners that address a stated need

    const needMatch = 1;
    const proven = partner.successRate; // 0..1
    const regionMatch = partner.region === district ? 1 : 0.45;
    const fromDistrict = partner.referralsFromDistrict[district] ?? 0;
    const familiarity = Math.min(1, fromDistrict / 8); // 8+ prior referrals = fully proven locally

    const raw = needMatch * (0.5 * proven + 0.3 * regionMatch + 0.2 * familiarity);
    const score = Math.round(raw * 100);

    const reasonParts: string[] = [];
    reasonParts.push(`Matches "${partner.specialty}" need`);
    reasonParts.push(`${Math.round(proven * 100)}% success rate`);
    if (partner.region === district) reasonParts.push(`in-district (${district})`);
    else reasonParts.push(`${partner.region} region`);
    if (fromDistrict > 0)
      reasonParts.push(`${fromDistrict} prior ${district} referral${fromDistrict > 1 ? "s" : ""}`);

    matches.push({
      partner,
      score,
      overlap: [partner.specialty],
      reason: reasonParts.join(" · "),
    });
  }
  return matches.sort((a, b) => b.score - a.score);
}

// --- getCpdStatus ----------------------------------------------------------
export function getCpdStatus(advisorId: string, completedIds?: string[]) {
  const advisor = getAdvisor(advisorId)!;
  const isCompleted = (mod: Module) =>
    completedIds ? completedIds.includes(mod.id) : mod.completedByAdvisor.includes(advisorId);

  const earned = completedIds
    ? modules.filter(isCompleted).reduce((s, m) => s + m.credits, 0)
    : advisor.cpdEarned;
  const required = advisor.cpdRequired;
  const pct = Math.min(100, Math.round((earned / required) * 100));
  const daysToDeadline = daysBetween(TODAY, advisor.cpdDeadline);
  const remaining = Math.max(0, required - earned);

  // recommend a module whose topic matches the advisor's most common active client need
  const needCounts = new Map<string, number>();
  for (const cl of getClientsByAdvisor(advisorId)) {
    if (cl.status === "dormant") continue;
    for (const need of cl.needs) needCounts.set(need, (needCounts.get(need) ?? 0) + 1);
  }
  const topNeed = [...needCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const recommendedModule =
    modules
      .filter((mod) => mod.topic === topNeed && !isCompleted(mod))
      .sort((a, b) => b.credits - a.credits)[0] ??
    modules.find((mod) => mod.required && !isCompleted(mod));

  return { advisor, earned, required, pct, daysToDeadline, remaining, topNeed, recommendedModule };
}

// --- getCpdCategoryBreakdown -----------------------------------------------
export function getCpdCategoryBreakdown(advisorId: string, completedIds?: string[]) {
  const isCompleted = (mod: Module) =>
    completedIds ? completedIds.includes(mod.id) : mod.completedByAdvisor.includes(advisorId);

  const topicMap = new Map<string, { total: number; earned: number; count: number; done: number }>();
  for (const mod of modules) {
    const existing = topicMap.get(mod.topic) ?? { total: 0, earned: 0, count: 0, done: 0 };
    topicMap.set(mod.topic, {
      total: existing.total + mod.credits,
      earned: existing.earned + (isCompleted(mod) ? mod.credits : 0),
      count: existing.count + 1,
      done: existing.done + (isCompleted(mod) ? 1 : 0),
    });
  }
  return [...topicMap.entries()].map(([topic, v]) => ({
    topic,
    totalCredits: v.total,
    earnedCredits: v.earned,
    pct: v.total > 0 ? Math.round((v.earned / v.total) * 100) : 0,
    moduleCount: v.count,
    completedCount: v.done,
  }));
}

// --- getWeeklyPicks --------------------------------------------------------
// Reads the advisor's active client needs + note keywords to recommend modules
// with visible reasoning — "because 3 clients discussed X this week"
export function getWeeklyPicks(advisorId: string, completedIds?: string[]) {
  const isCompleted = (mod: Module) =>
    completedIds ? completedIds.includes(mod.id) : mod.completedByAdvisor.includes(advisorId);

  const topicCounts = new Map<string, { count: number; clientNames: string[] }>();
  for (const cl of getClientsByAdvisor(advisorId)) {
    if (cl.status === "dormant") continue;
    for (const need of cl.needs) {
      const existing = topicCounts.get(need) ?? { count: 0, clientNames: [] };
      topicCounts.set(need, {
        count: existing.count + 1,
        clientNames: [...existing.clientNames, cl.name.split(" ")[0]],
      });
    }
  }

  const picks: Array<{ module: Module; reason: string }> = [];
  const sorted = [...topicCounts.entries()].sort((a, b) => b[1].count - a[1].count);

  for (const [topic, { count, clientNames }] of sorted) {
    const mod = modules
      .filter((m) => m.topic === topic && !isCompleted(m))
      .sort((a, b) => b.credits - a.credits)[0];
    if (!mod) continue;
    const names = clientNames.slice(0, 2).join(", ");
    const extra = count > 2 ? ` +${count - 2} more` : "";
    picks.push({
      module: mod,
      reason: `${count} client${count > 1 ? "s" : ""} (${names}${extra}) discussed ${topic} — you haven't completed this module`,
    });
    if (picks.length >= 3) break;
  }
  return picks;
}

// --- searchModules ---------------------------------------------------------
// Keyword ranking over module title + topic. No API required.
const STOP_WORDS = new Set(["a", "an", "the", "for", "and", "or", "of", "in", "to", "with", "on", "at", "by", "from"]);

export function searchModules(query: string, advisorId: string, completedIds?: string[]) {
  if (!query.trim()) return [];
  const isCompleted = (mod: Module) =>
    completedIds ? completedIds.includes(mod.id) : mod.completedByAdvisor.includes(advisorId);

  const tokens = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  if (tokens.length === 0) return [];

  return modules
    .map((mod) => {
      const title = mod.title.toLowerCase();
      const topic = mod.topic.toLowerCase();
      let score = 0;
      const matched: string[] = [];
      for (const tok of tokens) {
        if (title.includes(tok)) { score += 2; matched.push(tok); }
        if (topic.includes(tok)) { score += 3; matched.push(tok); }
      }
      if (mod.required) score += 1;
      if (!isCompleted(mod)) score += 2;
      const uniqueMatched = [...new Set(matched)];
      const reason = uniqueMatched.length > 0
        ? `Matches "${uniqueMatched.join(", ")}" · ${mod.credits} credit${mod.credits > 1 ? "s" : ""} · ${mod.required ? "required" : "optional"}`
        : null;
      return { module: mod, score, reason, completed: isCompleted(mod) };
    })
    .filter((r) => r.score > 0 && r.reason)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// --- getOrgCpdCompliance ---------------------------------------------------
export function getOrgCpdCompliance(activeAdvisorId?: string, completedIds?: string[]) {
  return advisors.map((advisor) => {
    const isActive = activeAdvisorId && advisor.id === activeAdvisorId;
    const earned = isActive && completedIds != null
      ? getCpdStatus(advisor.id, completedIds).earned
      : advisor.cpdEarned;
    const daysToDeadline = daysBetween(TODAY, advisor.cpdDeadline);
    const complete = earned >= advisor.cpdRequired;
    const atRisk = !complete && daysToDeadline <= 14;
    const status: "complete" | "at_risk" | "on_track" = complete
      ? "complete"
      : atRisk
        ? "at_risk"
        : "on_track";
    return { advisor: { ...advisor, cpdEarned: earned }, daysToDeadline, status };
  });
}

// --- getMorningBriefing ----------------------------------------------------
export function getMorningBriefing(advisorId: string, referrals: Referral[], completedIds?: string[]) {
  const advisor = getAdvisor(advisorId)!;
  const todays = meetings.filter((mt) => mt.advisorId === advisorId);
  const sugs = suggestions.filter((s) => s.advisorId === advisorId);
  const cpd = getCpdStatus(advisorId, completedIds);

  const followups = sugs.filter((s) => s.kind === "followup").length;
  const matchCount = sugs.filter((s) => s.kind === "partner_match").length;

  const firstName = advisor.name.split(" ")[0];
  const briefingText =
    `Good morning, ${firstName}. You have ${todays.length} meetings today, ` +
    `${followups} follow-up${followups !== 1 ? "s" : ""} waiting on you, and ` +
    `${matchCount} partner introduction${matchCount !== 1 ? "s" : ""} ready to review. ` +
    `You're ${cpd.remaining} CPD credit${cpd.remaining !== 1 ? "s" : ""} short with ${cpd.daysToDeadline} days to your deadline.`;

  const stats = getAdvisorStats(advisorId, referrals, completedIds);

  return { advisor, meetings: todays, suggestions: sugs, cpd, briefingText, stats };
}

// --- per-advisor stats for the metric row ----------------------------------
export function getAdvisorStats(advisorId: string, referrals: Referral[], completedIds?: string[]) {
  const myClients = getClientsByAdvisor(advisorId);
  const activeClients = myClients.filter((c) => c.status !== "dormant").length;
  const myReferrals = referrals.filter((rf) => rf.advisorId === advisorId);
  const openReferrals = myReferrals.filter(
    (rf) => rf.status === "introduced" || rf.status === "in_progress" || rf.status === "suggested",
  ).length;
  const cpd = getCpdStatus(advisorId, completedIds);
  return { activeClients, openReferrals, cpd };
}

// --- getEcosystemGaps ------------------------------------------------------
// Finds (region × specialty) cells with zero or low partner coverage,
// weighted by demand aggregated across the advisor force.
export function getEcosystemGaps(): Gap[] {
  const gaps: Gap[] = [];
  for (const region of REGIONS) {
    for (const specialty of SPECIALTIES) {
      const coverage = partners.filter(
        (pt) => pt.region === region && pt.specialty === specialty,
      ).length;
      // demand = active clients in that region (by advisor district) needing the specialty
      const demand = clients.filter((cl) => {
        const adv = getAdvisor(cl.advisorId);
        return (
          adv?.district === region &&
          cl.status !== "dormant" &&
          cl.needs.includes(specialty)
        );
      }).length;

      let severity: Gap["severity"] = "ok";
      if (coverage === 0 && demand > 0) severity = "none";
      else if (coverage === 0) severity = "low";
      else severity = "ok";

      gaps.push({ region, specialty, coverage, demand, severity });
    }
  }
  return gaps;
}

// Returns just the critical gaps (zero coverage with real demand), worst first
export function getCriticalGaps(): Gap[] {
  return getEcosystemGaps()
    .filter((g) => g.severity === "none")
    .sort((a, b) => b.demand - a.demand);
}

// --- getReferralPipeline ---------------------------------------------------
const PIPELINE_ORDER: ReferralStatus[] = [
  "suggested",
  "introduced",
  "in_progress",
  "closed",
  "declined",
];

export function getReferralPipeline(
  scope: { advisorId?: string; partnerId?: string } | "org",
  referrals: Referral[],
) {
  let set = referrals;
  if (scope !== "org") {
    if (scope.advisorId) set = set.filter((rf) => rf.advisorId === scope.advisorId);
    if (scope.partnerId) set = set.filter((rf) => rf.partnerId === scope.partnerId);
  }
  const counts: Record<ReferralStatus, number> = {
    suggested: 0,
    introduced: 0,
    in_progress: 0,
    closed: 0,
    declined: 0,
  };
  for (const rf of set) counts[rf.status]++;
  return {
    counts,
    total: set.length,
    ordered: PIPELINE_ORDER.map((status) => ({ status, count: counts[status] })),
  };
}

// --- partner inbox + stats -------------------------------------------------
export function getPartnerInbox(partnerId: string, referrals: Referral[]) {
  return referrals
    .filter((rf) => rf.partnerId === partnerId)
    .map((rf) => ({
      referral: rf,
      client: getClient(rf.clientId)!,
      advisor: getAdvisor(rf.advisorId)!,
    }))
    .sort((a, b) => (a.referral.createdAt < b.referral.createdAt ? 1 : -1));
}

export function getPartnerStats(partnerId: string, referrals: Referral[]) {
  const partner = getPartner(partnerId)!;
  const mine = referrals.filter((rf) => rf.partnerId === partnerId);
  const closed = mine.filter((rf) => rf.status === "closed").length;
  const declined = mine.filter((rf) => rf.status === "declined").length;
  const open = mine.filter(
    (rf) => rf.status === "introduced" || rf.status === "in_progress",
  ).length;
  const pending = mine.filter((rf) => rf.status === "suggested").length;
  const decided = closed + declined + open;
  const acceptanceRate = decided > 0 ? (closed + open) / decided : partner.acceptanceRate;
  return {
    partner,
    total: mine.length,
    closed,
    declined,
    open,
    pending,
    acceptanceRate,
    avgDaysToClose: partner.avgDaysToClose,
  };
}

// --- org-level metrics -----------------------------------------------------
export function getOrgMetrics(referrals: Referral[]) {
  const totalAdvisors = advisors.length;
  const totalClients = clients.length;
  const activeReferrals = referrals.filter(
    (rf) => rf.status === "introduced" || rf.status === "in_progress" || rf.status === "suggested",
  ).length;
  const closed = referrals.filter((rf) => rf.status === "closed").length;
  const declined = referrals.filter((rf) => rf.status === "declined").length;
  const decided = closed + declined;
  const closeRate = decided > 0 ? closed / decided : 0;

  const compliant = advisors.filter((a) => a.cpdEarned >= a.cpdRequired).length;
  const cpdCompliance = compliant / totalAdvisors;

  return {
    totalAdvisors,
    totalClients,
    totalPartners: partners.length,
    activeReferrals,
    closeRate,
    cpdCompliance,
    criticalGaps: getCriticalGaps().length,
  };
}

// top partners by closed referrals
export function getTopPartners(referrals: Referral[], limit = 5) {
  return partners
    .map((pt) => {
      const mine = referrals.filter((rf) => rf.partnerId === pt.id);
      const closed = mine.filter((rf) => rf.status === "closed").length;
      return { partner: pt, total: mine.length, closed };
    })
    .sort((a, b) => b.closed - a.closed || b.total - a.total)
    .slice(0, limit);
}
