from __future__ import annotations
from dataclasses import dataclass, field
from typing import Literal, Optional

TODAY = "2026-06-19"

ReferralStatus = Literal["suggested", "introduced", "in_progress", "closed", "declined"]
ClientStatus = Literal["active", "prospect", "review_due", "dormant"]
NoteChannel = Literal["Meeting", "Call", "Email", "WhatsApp", "Note"]
FlagKind = Literal["match", "followup", "missing"]


@dataclass
class ContactNote:
    id: str
    date: str
    channel: NoteChannel
    summary: str
    source: bool = False


@dataclass
class Advisor:
    id: str
    name: str
    initials: str
    title: str
    district: str
    cpd_earned: int
    cpd_required: int
    cpd_deadline: str


@dataclass
class Client:
    id: str
    advisor_id: str
    name: str
    initials: str
    last_contact: str
    status: ClientStatus
    tags: list[str]
    needs: list[str]
    aum: int
    next_meeting: Optional[str] = None
    notes: list[ContactNote] = field(default_factory=list)


@dataclass
class Partner:
    id: str
    name: str
    initials: str
    specialty: str
    region: str
    success_rate: float
    acceptance_rate: float
    avg_days_to_close: int
    referrals_from_district: dict[str, int]


@dataclass
class Referral:
    id: str
    client_id: str
    advisor_id: str
    partner_id: str
    reason: str
    status: ReferralStatus
    created_at: str
    shared_fields: list[str] = field(default_factory=lambda: ["Need", "Time horizon"])


@dataclass
class MeetingFlag:
    kind: FlagKind
    text: str


@dataclass
class Meeting:
    id: str
    advisor_id: str
    time: str
    title: str
    channel: str
    meta: str
    client_id: Optional[str] = None
    flag: Optional[MeetingFlag] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _initials(name: str) -> str:
    return "".join(p[0] for p in name.split()[:2])


def _client(
    id: str, advisor_id: str, name: str, last_contact: str,
    status: ClientStatus, tags: list[str], needs: list[str], aum: int,
    next_meeting: Optional[str] = None,
    notes: list[ContactNote] | None = None,
) -> Client:
    return Client(
        id=id, advisor_id=advisor_id, name=name, initials=_initials(name),
        last_contact=last_contact, status=status, tags=tags, needs=needs,
        aum=aum, next_meeting=next_meeting, notes=notes or [],
    )


def _partner(
    id: str, name: str, specialty: str, region: str,
    success_rate: float, acceptance_rate: float, avg_days_to_close: int,
    referrals_from_district: dict[str, int],
) -> Partner:
    return Partner(
        id=id, name=name, initials=_initials(name), specialty=specialty,
        region=region, success_rate=success_rate, acceptance_rate=acceptance_rate,
        avg_days_to_close=avg_days_to_close,
        referrals_from_district=referrals_from_district,
    )


def _referral(
    id: str, client_id: str, advisor_id: str, partner_id: str,
    reason: str, status: ReferralStatus, created_at: str,
    shared_fields: list[str] | None = None,
) -> Referral:
    return Referral(
        id=id, client_id=client_id, advisor_id=advisor_id, partner_id=partner_id,
        reason=reason, status=status, created_at=created_at,
        shared_fields=shared_fields or ["Need", "Time horizon"],
    )


# ---------------------------------------------------------------------------
# Advisors
# ---------------------------------------------------------------------------

advisors: list[Advisor] = [
    Advisor("adv-1", "Marcus Tan", "MT", "Senior Financial Advisor", "Central", 18, 20, "2026-06-30"),
    Advisor("adv-2", "Aisyah Rahman", "AR", "Wealth Advisor", "North", 22, 20, "2026-09-30"),
    Advisor("adv-3", "Lim Wei Jie", "LW", "Financial Advisor", "East", 14, 20, "2026-08-15"),
    Advisor("adv-4", "Priya Nair", "PN", "Associate Advisor", "West", 9, 20, "2026-09-30"),
    Advisor("adv-5", "Daniel Wong", "DW", "Senior Financial Advisor", "Central", 16, 20, "2026-07-31"),
    Advisor("adv-6", "Nurul Huda", "NH", "Wealth Advisor", "North", 20, 20, "2026-09-30"),
]

# ---------------------------------------------------------------------------
# Clients
# ---------------------------------------------------------------------------

clients: list[Client] = [
    # ---- Marcus Tan (adv-1, Central) ----
    _client("cli-1", "adv-1", "Lawrence Goh", "2026-06-17", "active",
            ["HNW", "Business owner", "Family office"],
            ["Estate & Trust", "Business Succession", "Tax Planning"],
            4_200_000, "2026-06-19T09:30",
            [
                ContactNote("n1", "2026-06-17", "Meeting",
                            "Mentioned wanting to set up a trust for his two children before year end. Worried about probate delays.", True),
                ContactNote("n2", "2026-05-29", "Call",
                            "Reviewed Q2 portfolio. Comfortable with current allocation; wants to revisit succession of the F&B business.", True),
                ContactNote("n3", "2026-04-12", "Email",
                            "Sent updated insurance summary. Daughter starting university in 2027."),
            ]),
    _client("cli-2", "adv-1", "Serena Koh", "2026-06-05", "review_due",
            ["Pre-retiree", "Conservative"],
            ["Retirement", "Investments"],
            980_000, "2026-06-19T11:00",
            [
                ContactNote("n4", "2026-06-05", "WhatsApp",
                            "Replied to last note — asked whether to top up SRS before the meeting. Awaiting your response.", True),
                ContactNote("n5", "2026-03-20", "Meeting",
                            "Annual review. On track for retirement at 62. Risk appetite lowered after market dip."),
            ]),
    _client("cli-3", "adv-1", "Raj Kumar", "2026-06-18", "active",
            ["Young family", "Property"],
            ["Mortgage", "Investments"],
            310_000, "2026-06-19T14:00",
            [
                ContactNote("n6", "2026-06-18", "Call",
                            "Found a resale condo, needs mortgage refinancing advice before option expires next week.", True),
            ]),
    _client("cli-4", "adv-1", "Madam Chua Bee Lian", "2026-05-02", "review_due",
            ["Legacy", "Widowed"],
            ["Estate & Trust", "Legal / Will"],
            1_650_000, "2026-06-19T16:00",
            [
                ContactNote("n7", "2026-05-02", "Meeting",
                            "Wants to update her will and ensure the grandchildren are provided for. No notes captured after the meeting."),
            ]),
    _client("cli-5", "adv-1", "Tan Soon Huat", "2026-06-10", "active",
            ["Business owner", "SME"],
            ["Corporate Insurance", "Business Succession"],
            2_100_000, None,
            [
                ContactNote("n8", "2026-06-10", "Meeting",
                            "Expanding logistics business, hiring 15 staff. Asked about keyman insurance and partner buyout cover.", True),
            ]),
    _client("cli-6", "adv-1", "Felicia Ong", "2026-06-14", "active",
            ["Professional", "DINK"],
            ["Investments", "Tax Planning"],
            540_000, None,
            [
                ContactNote("n9", "2026-06-14", "Email",
                            "New RSU vesting in July — asked about tax-efficient ways to diversify out of company stock.", True),
            ]),
    _client("cli-7", "adv-1", "Hafiz Ismail", "2026-04-28", "dormant", ["Young professional"], ["Investments"], 85_000),
    _client("cli-8", "adv-1", "Grace Lim", "2026-06-12", "active", ["Pre-retiree", "Property"], ["Retirement", "Mortgage"], 760_000),

    # ---- Aisyah Rahman (adv-2, North) ----
    _client("cli-9", "adv-2", "Zainal Abidin", "2026-06-15", "active", ["Business owner"], ["Tax Planning", "Business Succession"], 1_900_000),
    _client("cli-10", "adv-2", "Mei Ling Chan", "2026-06-11", "active", ["Pre-retiree"], ["Retirement", "Estate & Trust"], 1_200_000),
    _client("cli-11", "adv-2", "Arjun Menon", "2026-06-09", "review_due", ["HNW"], ["Tax Planning", "Investments"], 3_300_000),
    _client("cli-12", "adv-2", "Siti Nurhaliza", "2026-06-16", "active", ["Young family"], ["Mortgage", "Retirement"], 420_000),
    _client("cli-13", "adv-2", "Kelvin Teo", "2026-05-20", "active", ["Business owner"], ["Tax Planning"], 880_000),

    # ---- Lim Wei Jie (adv-3, East) ----
    _client("cli-14", "adv-3", "Brenda Sim", "2026-06-13", "active", ["HNW", "Legacy"], ["Estate & Trust", "Legal / Will"], 2_700_000),
    _client("cli-15", "adv-3", "Mohan Das", "2026-06-08", "active", ["SME"], ["Corporate Insurance", "Tax Planning"], 1_100_000),
    _client("cli-16", "adv-3", "Jocelyn Yeo", "2026-06-02", "prospect", ["Professional"], ["Investments", "Retirement"], 230_000),
    _client("cli-17", "adv-3", "Ng Kok Wai", "2026-06-17", "active", ["Pre-retiree"], ["Retirement", "Estate & Trust"], 1_450_000),
    _client("cli-18", "adv-3", "Farah Aziz", "2026-05-30", "active", ["Young family"], ["Mortgage"], 360_000),

    # ---- Priya Nair (adv-4, West) ----
    _client("cli-19", "adv-4", "Vincent Lau", "2026-06-14", "active", ["Business owner"], ["Business Succession", "Legal / Will"], 1_700_000),
    _client("cli-20", "adv-4", "Hannah Tan", "2026-06-10", "prospect", ["Young professional"], ["Investments"], 120_000),
    _client("cli-21", "adv-4", "Deepa Rao", "2026-06-07", "active", ["HNW"], ["Estate & Trust", "Tax Planning"], 2_900_000),
    _client("cli-22", "adv-4", "Samuel Ng", "2026-06-03", "active", ["Property"], ["Mortgage", "Investments"], 480_000),

    # ---- Daniel Wong (adv-5, Central) ----
    _client("cli-23", "adv-5", "Patricia Lee", "2026-06-16", "active", ["HNW", "Legacy"], ["Estate & Trust", "Investments"], 5_100_000),
    _client("cli-24", "adv-5", "Gopal Krishnan", "2026-06-12", "active", ["SME"], ["Corporate Insurance"], 1_300_000),
    _client("cli-25", "adv-5", "Wendy Chia", "2026-06-06", "review_due", ["Pre-retiree"], ["Retirement"], 690_000),
    _client("cli-26", "adv-5", "Adam Tan", "2026-06-01", "active", ["Professional"], ["Tax Planning", "Investments"], 540_000),

    # ---- Nurul Huda (adv-6, North) ----
    _client("cli-27", "adv-6", "Lydia Goh", "2026-06-15", "active", ["HNW"], ["Tax Planning", "Estate & Trust"], 2_200_000),
    _client("cli-28", "adv-6", "Ravi Shankar", "2026-06-11", "active", ["Business owner"], ["Tax Planning", "Business Succession"], 1_600_000),
    _client("cli-29", "adv-6", "Joanne Tay", "2026-06-09", "prospect", ["Young family"], ["Mortgage", "Retirement"], 300_000),
    _client("cli-30", "adv-6", "Hassan Ali", "2026-06-04", "active", ["Pre-retiree"], ["Retirement", "Tax Planning"], 980_000),
]

# ---------------------------------------------------------------------------
# Partners
# ---------------------------------------------------------------------------

partners: list[Partner] = [
    _partner("ptr-1", "Meridian Trust Advisory", "Estate & Trust", "Central", 0.92, 0.95, 18, {"Central": 12, "North": 2, "East": 1, "West": 3}),
    _partner("ptr-2", "Pinnacle Tax Partners", "Tax Planning", "Central", 0.88, 0.90, 21, {"Central": 9, "North": 1, "East": 2, "West": 1}),
    _partner("ptr-3", "Northgate Mortgage Co.", "Mortgage", "North", 0.80, 0.86, 14, {"North": 8, "Central": 2}),
    _partner("ptr-4", "Sentinel Corporate Risk", "Corporate Insurance", "East", 0.85, 0.88, 25, {"East": 7, "Central": 3, "North": 1}),
    _partner("ptr-5", "Asia Capital Investments", "Investments", "Central", 0.90, 0.93, 12, {"Central": 14, "North": 3, "East": 2, "West": 4}),
    _partner("ptr-6", "Lex Estate Lawyers", "Legal / Will", "West", 0.83, 0.84, 30, {"West": 6, "Central": 2}),
    _partner("ptr-7", "Continuity Succession Group", "Business Succession", "Central", 0.78, 0.80, 35, {"Central": 5, "East": 1}),
    _partner("ptr-8", "Silverpine Retirement", "Retirement", "North", 0.87, 0.91, 16, {"North": 6, "Central": 1}),
    _partner("ptr-9", "Heritage Trust West", "Estate & Trust", "West", 0.81, 0.85, 22, {"West": 5, "Central": 1}),
    _partner("ptr-10", "Eastside Tax Chambers", "Tax Planning", "East", 0.84, 0.87, 20, {"East": 5, "Central": 1}),
    _partner("ptr-11", "Polaris Wealth (North)", "Investments", "North", 0.86, 0.90, 13, {"North": 7, "Central": 1}),
    _partner("ptr-12", "Westview Home Loans", "Mortgage", "West", 0.79, 0.82, 15, {"West": 4, "Central": 1}),
]

# ---------------------------------------------------------------------------
# Referrals
# ---------------------------------------------------------------------------

referrals: list[Referral] = [
    _referral("ref-1", "cli-1", "adv-1", "ptr-1", "Setting up a family trust before year end", "in_progress", "2026-06-02"),
    _referral("ref-2", "cli-5", "adv-1", "ptr-4", "Keyman & partner-buyout cover for expanding SME", "introduced", "2026-06-12"),
    _referral("ref-3", "cli-6", "adv-1", "ptr-2", "Tax-efficient diversification of vesting RSUs", "suggested", "2026-06-14"),
    _referral("ref-4", "cli-3", "adv-1", "ptr-12", "Mortgage refinancing on resale condo", "closed", "2026-05-10"),
    _referral("ref-5", "cli-4", "adv-1", "ptr-6", "Will update and estate structuring", "introduced", "2026-06-09"),
    _referral("ref-6", "cli-9", "adv-2", "ptr-10", "Corporate tax restructuring", "in_progress", "2026-05-28"),
    _referral("ref-7", "cli-11", "adv-2", "ptr-5", "Portfolio rebalancing for HNW client", "closed", "2026-04-20"),
    _referral("ref-8", "cli-10", "adv-2", "ptr-8", "Retirement income planning", "closed", "2026-05-15"),
    _referral("ref-9", "cli-12", "adv-2", "ptr-3", "First home mortgage", "in_progress", "2026-06-05"),
    _referral("ref-10", "cli-13", "adv-2", "ptr-10", "GST and corporate tax review", "suggested", "2026-06-16"),
    _referral("ref-11", "cli-14", "adv-3", "ptr-9", "Cross-region trust setup", "introduced", "2026-06-01"),
    _referral("ref-12", "cli-15", "adv-3", "ptr-4", "Corporate insurance for SME", "closed", "2026-04-30"),
    _referral("ref-13", "cli-17", "adv-3", "ptr-8", "Retirement drawdown plan", "in_progress", "2026-06-06"),
    _referral("ref-14", "cli-16", "adv-3", "ptr-5", "Starter investment portfolio", "declined", "2026-05-22"),
    _referral("ref-15", "cli-15", "adv-3", "ptr-10", "Tax filing for new entity", "in_progress", "2026-06-10"),
    _referral("ref-16", "cli-19", "adv-4", "ptr-7", "Family business succession plan", "in_progress", "2026-05-25"),
    _referral("ref-17", "cli-21", "adv-4", "ptr-9", "Estate structuring for HNW", "introduced", "2026-06-07"),
    _referral("ref-18", "cli-22", "adv-4", "ptr-12", "Mortgage for second property", "closed", "2026-05-18"),
    _referral("ref-19", "cli-19", "adv-4", "ptr-6", "Will and shareholder agreement", "suggested", "2026-06-14"),
    _referral("ref-20", "cli-21", "adv-4", "ptr-2", "Cross-region tax planning", "introduced", "2026-06-11"),
    _referral("ref-21", "cli-23", "adv-5", "ptr-1", "Multi-generational trust", "in_progress", "2026-05-12"),
    _referral("ref-22", "cli-24", "adv-5", "ptr-4", "Group corporate insurance", "closed", "2026-04-25"),
    _referral("ref-23", "cli-23", "adv-5", "ptr-5", "Alternative investments allocation", "closed", "2026-05-30"),
    _referral("ref-24", "cli-25", "adv-5", "ptr-8", "Retirement plan review", "in_progress", "2026-06-08"),
    _referral("ref-25", "cli-26", "adv-5", "ptr-2", "Personal income tax optimisation", "introduced", "2026-06-13"),
    _referral("ref-26", "cli-27", "adv-6", "ptr-1", "Estate & trust (referred cross-region to Central)", "in_progress", "2026-05-29"),
    _referral("ref-27", "cli-28", "adv-6", "ptr-7", "Business succession structuring", "introduced", "2026-06-04"),
    _referral("ref-28", "cli-29", "adv-6", "ptr-3", "First-time mortgage", "closed", "2026-05-08"),
    _referral("ref-29", "cli-30", "adv-6", "ptr-8", "Retirement income strategy", "closed", "2026-05-19"),
    _referral("ref-30", "cli-27", "adv-6", "ptr-2", "Tax planning (no North tax partner — sent to Central)", "suggested", "2026-06-15"),
    _referral("ref-31", "cli-1", "adv-1", "ptr-2", "Estate tax exposure review", "closed", "2026-03-15"),
    _referral("ref-32", "cli-11", "adv-2", "ptr-2", "Tax planning sent cross-region (no North tax partner)", "in_progress", "2026-06-02"),
    _referral("ref-33", "cli-14", "adv-3", "ptr-10", "Estate-related tax filing", "closed", "2026-04-18"),
    _referral("ref-34", "cli-21", "adv-4", "ptr-9", "Trust deed review", "closed", "2026-05-05"),
    _referral("ref-35", "cli-23", "adv-5", "ptr-7", "Succession planning for family holding co.", "introduced", "2026-06-10"),
    _referral("ref-36", "cli-9", "adv-2", "ptr-2", "Corporate restructuring tax (cross-region)", "suggested", "2026-06-17"),
    _referral("ref-37", "cli-5", "adv-1", "ptr-7", "Partner buyout succession structuring", "suggested", "2026-06-13"),
    _referral("ref-38", "cli-17", "adv-3", "ptr-9", "Trust for grandchildren (cross-region)", "in_progress", "2026-06-09"),
    _referral("ref-39", "cli-30", "adv-6", "ptr-2", "Tax planning (cross-region to Central)", "declined", "2026-05-21"),
    _referral("ref-40", "cli-26", "adv-5", "ptr-5", "Diversification of concentrated stock", "in_progress", "2026-06-11"),
]

# ---------------------------------------------------------------------------
# Meetings (hero advisor adv-1)
# ---------------------------------------------------------------------------

meetings: list[Meeting] = [
    Meeting("mtg-1", "adv-1", "09:30", "Lawrence Goh — portfolio & trust review", "In person",
            "Central · 45 min", "cli-1", MeetingFlag("match", "Mentioned a trust 2 days ago — partner match ready")),
    Meeting("mtg-2", "adv-1", "11:00", "Serena Koh — pre-retirement check-in", "Video",
            "Zoom · 30 min", "cli-2", MeetingFlag("followup", "Unread WhatsApp reply about SRS top-up")),
    Meeting("mtg-3", "adv-1", "12:30", "Block: CPD module — 'Trust Structures & Probate'", "Office",
            "Self-study · 45 min", None, MeetingFlag("match", "Recommended — matches your most common client need")),
    Meeting("mtg-4", "adv-1", "14:00", "Raj Kumar — mortgage refinancing", "Call",
            "Phone · 20 min", "cli-3", MeetingFlag("followup", "Option expires next week — time-sensitive")),
    Meeting("mtg-5", "adv-1", "16:00", "Madam Chua — will & estate follow-up", "In person",
            "Central · 45 min", "cli-4", MeetingFlag("missing", "No notes captured from last meeting (May 2)")),
]

# ---------------------------------------------------------------------------
# Lookup helpers
# ---------------------------------------------------------------------------

def get_advisor(advisor_id: str) -> Optional[Advisor]:
    return next((a for a in advisors if a.id == advisor_id), None)


def get_client(client_id: str) -> Optional[Client]:
    return next((c for c in clients if c.id == client_id), None)


def get_partner(partner_id: str) -> Optional[Partner]:
    return next((p for p in partners if p.id == partner_id), None)


def get_clients_for_advisor(advisor_id: str) -> list[Client]:
    return [c for c in clients if c.advisor_id == advisor_id]


def get_meetings_for_advisor(advisor_id: str) -> list[Meeting]:
    return [m for m in meetings if m.advisor_id == advisor_id]
