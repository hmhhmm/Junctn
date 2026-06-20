"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock, CheckCircle2, BookOpen, Zap, AlertTriangle, Search,
  Sparkles, RefreshCw, ShieldAlert, GraduationCap, ArrowRight,
  ChevronDown, Play, X, ChevronLeft, ChevronRight as ChevronRightIcon,
  Award, ListChecks, FileText,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  getCpdStatus, getCpdCategoryBreakdown, getWeeklyPicks, modules, getAdvisor,
} from "@/lib/data";
import { ProgressRing } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { CpdSearchResult } from "@/app/api/cpd/search/route";

/* ── Types ────────────────────────────────────────────────────────────────── */
type CourseSection = { title: string; body: string[] };
type QuizItem = { q: string; options: string[]; answer: number };
type ModuleContent = {
  objectives: string[];
  keyTopics: string[];
  format: string;
  sections: CourseSection[];
  quiz: QuizItem[];
};

/* ── Topic colours ────────────────────────────────────────────────────────── */
const TOPIC_COLORS: Record<string, { bg: string; color: string }> = {
  "Estate & Trust":      { bg: "#ccfbf1", color: "#134e4a" },
  "Tax Planning":        { bg: "#fef3c7", color: "#b45309" },
  Mortgage:              { bg: "#dbeafe", color: "#1e40af" },
  "Corporate Insurance": { bg: "#f3e8ff", color: "#6b21a8" },
  Investments:           { bg: "#dcfce7", color: "#166534" },
  "Legal / Will":        { bg: "#fee2e2", color: "#c53030" },
  "Business Succession": { bg: "#ffedd5", color: "#c2410c" },
  Retirement:            { bg: "#e0f2fe", color: "#0369a1" },
  Compliance:            { bg: "var(--surface-raised)", color: "var(--ink-soft)" },
  Practice:              { bg: "#fce7f3", color: "#9d174d" },
};

const SHORT_LABEL: Record<string, string> = {
  "Estate & Trust":      "Estate",
  "Tax Planning":        "Tax",
  "Corporate Insurance": "Corp. Ins.",
  "Legal / Will":        "Legal",
  "Business Succession": "Succession",
  Investments:           "Investing",
};

function fmtDeadline(iso: string) {
  return new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

/* ── Full module content ─────────────────────────────────────────────────── */
const MODULE_CONTENT: Record<string, ModuleContent> = {
  "mod-1": {
    format: "Video lectures + case study workbook",
    objectives: [
      "Understand trust structures used in Singapore estate planning",
      "Navigate the probate process and its typical timeline",
      "Identify when a trust is more effective than a will",
    ],
    keyTopics: ["Revocable vs irrevocable trusts", "Trustee duties", "Probate process", "Letter of administration"],
    sections: [
      {
        title: "What is Estate Planning?",
        body: [
          "Estate planning is the process of arranging how your assets will be managed and distributed after death or incapacity. In Singapore, a comprehensive plan typically involves a valid will, one or more trusts, a Lasting Power of Attorney (LPA), and a Memorandum of Wishes.",
          "For high-net-worth clients, estate planning goes beyond a simple will. Blended families, overseas assets, business interests, and digital assets all introduce complexity that basic documents cannot adequately address. As an adviser, your role is to surface these needs early in the client conversation.",
          "A useful framing: think of estate planning as a three-legged stool — legal instruments (will, LPA, trust deed), financial structures (life insurance nominations, joint tenancy, CPF nominations), and relationship management (family communication, trustee selection). All three legs must be stable.",
        ],
      },
      {
        title: "Trust Structures in Singapore",
        body: [
          "A trust is a legal arrangement where one party (the settlor) transfers assets to a trustee to hold and manage for the benefit of named beneficiaries. In Singapore, trusts are governed primarily by the Trustees Act (Cap. 337) and the Trust Companies Act.",
          "Revocable trusts allow the settlor to alter or dissolve the trust during their lifetime, making them flexible for clients who want to retain control. Irrevocable trusts, while less flexible, offer stronger asset protection and may provide tax advantages in certain cross-border situations.",
          "For ultra-high-net-worth clients, a Private Trust Company (PTC) — where the trustee is a company wholly owned by the family — offers maximum control and confidentiality. Singapore's trust law allows PTCs to be established without a Trust Company licence if they administer trusts only for related parties.",
          "Key structures you will encounter: Discretionary trusts (trustees decide when and how much to distribute), Fixed interest trusts (beneficiaries have defined entitlements), Purpose trusts (for charitable or non-charitable purposes), and Protective trusts (which convert if a beneficiary attempts to assign their interest).",
        ],
      },
      {
        title: "Probate: Process and Timeline",
        body: [
          "When a person dies with a valid will, their executor must apply to the Family Justice Courts for a Grant of Probate before administering the estate. If there is no will (intestate), the next-of-kin applies for Letters of Administration instead.",
          "The probate process in Singapore typically takes 3–6 months for straightforward cases, and 1–2 years or more for complex estates involving overseas assets, ongoing litigation, or disputed wills. During this period, assets are frozen — banks will not release funds, and property cannot be transferred.",
          "As an adviser, you should help clients understand that assets with valid nominations (CPF, insurance policies) bypass probate entirely — they transfer directly to nominees. This is a key planning tool. Help clients review all nominations at least every 3 years and after major life events.",
          "Practical client action: Ensure all CPF nominations are current, all life policies name a specific beneficiary (not 'estate'), and the will clearly identifies the executor who is willing and able to act. A corporate executor (licensed trust company) may be preferable for complex estates.",
        ],
      },
      {
        title: "When to Recommend a Trust vs a Will",
        body: [
          "A will is suitable for most clients — it is cost-effective, straightforward, and provides flexibility. However, a trust becomes the better solution in several scenarios: minor beneficiaries who cannot manage assets directly; beneficiaries with disabilities; clients concerned about a beneficiary's spending habits; and situations where the estate includes assets in multiple jurisdictions.",
          "Cross-border estates present particular challenges. A Singapore will has no automatic legal effect overseas — clients with assets in the UK, Australia, or the US will typically need ancillary wills or trust structures in those jurisdictions. For clients with significant overseas holdings, refer to a specialist with cross-border estate planning experience.",
          "The cost-benefit decision: A simple discretionary trust established during a client's lifetime (inter vivos trust) typically costs S$5,000–S$20,000 to set up, plus annual trustee fees. For estates above S$2M, this cost is often justified by the benefits: privacy (trusts are not public record), certainty of distribution, and continuity of management.",
        ],
      },
    ],
    quiz: [
      { q: "Which type of trust allows the settlor to dissolve it during their lifetime?", options: ["Fixed interest trust", "Revocable trust", "Irrevocable trust", "Purpose trust"], answer: 1 },
      { q: "Assets with valid CPF or insurance nominations:", options: ["Go through probate first", "Bypass probate entirely", "Must be declared in the will", "Are frozen for 6 months"], answer: 1 },
      { q: "A Private Trust Company (PTC) in Singapore requires a Trust Company licence when:", options: ["Managing assets above S$5M", "Administering trusts for unrelated parties", "Holding overseas assets", "Managing a discretionary trust"], answer: 1 },
    ],
  },

  "mod-3": {
    format: "Online self-paced modules",
    objectives: [
      "Apply 2026 Budget tax changes to client portfolios",
      "Structure corporate and personal tax efficiently",
      "Identify RSU and ESOP tax planning opportunities",
    ],
    keyTopics: ["YA2027 progressive rates", "Corporate restructuring", "IRAS compliance", "GST thresholds"],
    sections: [
      {
        title: "Singapore Tax System Overview",
        body: [
          "Singapore operates a territorial tax system — individuals and companies are taxed only on income sourced in Singapore, or foreign income remitted to Singapore. This makes Singapore an attractive base for internationally mobile clients, but requires careful planning when income crosses borders.",
          "For Year of Assessment 2027 (income earned in 2026), the top marginal personal income tax rate remains at 24% for chargeable income above S$1,000,000. The corporate tax rate is a flat 17%, though effective rates are often lower due to partial tax exemptions and startup exemptions.",
          "Key exemptions for individuals: the personal relief of S$1,000, earned income relief, and the Working Mother's Child Relief (WMCR) are the most commonly applicable. For clients with significant investment income, advising on optimising their relief mix can meaningfully reduce their tax bill.",
        ],
      },
      {
        title: "2026 Budget Changes and Client Impact",
        body: [
          "The 2026 Budget introduced several changes relevant to your client conversations. The GST rate has been raised to 9% (effective from 1 January 2024 and unchanged in 2026). Importantly, the GST Voucher — CASH component was increased to S$850 for eligible recipients.",
          "For property-owning clients: the Additional Conveyance Duties (ACD) regime for property-holding entities was strengthened. Advise clients with complex shareholding structures in property companies to review their positions with a tax specialist.",
          "The Equities Market Revitalisation Package introduced in Budget 2025 continues to benefit clients invested in Singapore-listed securities, with enhanced tax incentives for funds managed in Singapore. This is particularly relevant for HNW clients whose portfolios include PE or hedge fund structures domiciled locally.",
          "RSU and ESOP taxation: For clients receiving equity compensation, the open market value on the vesting date is taxable as employment income. The key planning opportunity is timing — clients who anticipate a significant salary reduction (e.g., retiring, taking sabbatical) in the next 1–2 years should consider requesting accelerated vesting when possible.",
        ],
      },
      {
        title: "Corporate Tax Structuring",
        body: [
          "For business-owner clients, the choice between drawing a salary versus dividends from their company has tax implications. Salaries are deductible at the corporate level (reducing corporate tax) but taxable at the individual level. Dividends are paid from after-tax profits and are tax-exempt in the hands of shareholders under the one-tier tax system.",
          "The practical recommendation: business owners in the 22–24% personal tax bracket generally benefit from drawing a salary sufficient to maximise CPF contributions (relevant for those under 55) and supplementing with dividends. This balances personal tax efficiency with retirement savings.",
          "Family offices: Singapore's enhanced fund framework (13O and 13U schemes) remain attractive for families with investable assets above S$10M. Both schemes provide full tax exemptions on qualifying income. The minimum AUM for 13O is S$10M (increasing to S$20M after 2 years), and for 13U is S$50M.",
        ],
      },
      {
        title: "IRAS Compliance and Common Pitfalls",
        body: [
          "The most common tax compliance issue for HNW individuals is the incorrect classification of overseas investment income. Under the remittance basis, foreign-sourced dividends, branch profits, and service income are tax-exempt — but only if they have already been subject to tax in the source country. Clients often misunderstand this condition.",
          "For clients with overseas rental income: rental income from overseas properties remitted to Singapore is taxable if the foreign jurisdiction has a headline tax rate below 15%. This catches many clients who hold rental properties in low-tax jurisdictions.",
          "IRAS e-filing deadlines: Employees with employment income only — 18 April (electronic). Self-employed or those with complex income — 15 April (paper) or 18 April (electronic). Imposition of late filing penalties is automatic. Advise clients to file even when they expect a refund or have no tax payable.",
        ],
      },
    ],
    quiz: [
      { q: "Singapore's corporate income tax rate (flat) is:", options: ["15%", "17%", "20%", "22%"], answer: 1 },
      { q: "Foreign-sourced income is tax-exempt in Singapore when:", options: ["It is below S$100,000", "It has been taxed in the source country at headline rate ≥ 15%", "The recipient is a Singapore citizen", "It is not remitted to Singapore in the same year"], answer: 1 },
      { q: "RSU income is taxable in Singapore at:", options: ["Grant date", "Vesting date", "Exercise date", "Sale date"], answer: 1 },
    ],
  },

  "mod-5": {
    format: "Case-based video series",
    objectives: [
      "Compare mortgage packages for HDB and private properties",
      "Advise on refinancing timing and strategies",
    ],
    keyTopics: ["Fixed vs floating rates", "TDSR", "Bridging loans", "CPF usage"],
    sections: [
      {
        title: "The Singapore Property Financing Landscape",
        body: [
          "Singapore's property market is among the most regulated in Asia. For advisers, understanding the key financial ratios — LTV, TDSR, MSR — is essential before any mortgage conversation. Your clients will often receive advice from bank relationship managers who are incentivised differently from an independent adviser.",
          "Loan-to-Value (LTV) limits are set by MAS. For a first residential property with no outstanding loans, the LTV cap is 75% for bank loans. For HDB concessionary loans, the LTV is 80%. If the borrower already has one outstanding loan, the LTV drops to 45% for bank loans — a critical detail for clients upgrading while still holding their first property.",
          "The Total Debt Servicing Ratio (TDSR) caps total monthly debt obligations at 55% of gross monthly income. This includes mortgages, car loans, personal loans, and credit card minimum payments. Advise clients planning to take a mortgage to settle other debts first to maximise their borrowing capacity.",
        ],
      },
      {
        title: "Fixed vs Floating Rate Analysis",
        body: [
          "Fixed rate packages offer certainty — typically for 2 or 3 years. After the fixed period, the package converts to a floating rate, often pegged to the bank's internal board rate or SORA (Singapore Overnight Rate Average). Most banks currently price fixed packages at 3.0–3.5% for a 2-year lock-in.",
          "SORA-pegged packages move with the overnight interbank rate. When rates are falling, SORA packages become more attractive. When rates are rising, fixed packages provide insurance. The breakeven analysis: if you expect SORA to average more than the fixed rate spread over the lock-in period, choose fixed; otherwise, float.",
          "For clients with less than 5 years to full repayment, fixed rates often make sense regardless of the rate environment — the certainty of knowing exactly what they will pay is worth the premium. For clients taking 25-year loans, the rate differential over a 2-year fixed period matters less than their overall financial resilience.",
          "Practical refinancing trigger: advise clients to review their mortgage at the 15-month mark of any fixed period. Refinancing takes approximately 3–4 months, and most packages have a lock-in penalty if you exit before the fixed period ends.",
        ],
      },
      {
        title: "CPF Usage and Retirement Impact",
        body: [
          "CPF funds from the Ordinary Account (OA) can be used to purchase property, pay monthly mortgage instalments, and cover stamp duties. However, every dollar used for property must be refunded to the CPF account (with 2.5% interest) when the property is sold. This accrued interest can significantly reduce the cash proceeds from a property sale.",
          "The retirement risk: clients who fully deplete their CPF OA for property may find themselves with insufficient CPF savings at retirement, particularly if property values stagnate or fall. As a rule of thumb, advise clients to maintain at least 3 years of projected CPF contributions in liquid assets before committing CPF to property.",
          "For HDB upgraders: the Proximity Housing Grant (PHG) and Enhanced CPF Housing Grant (EHG) are available for eligible buyers. These grants are credited directly to the CPF OA and reduce the cash/CPF outlay needed. Ensure your clients have applied for all eligible grants before purchase.",
        ],
      },
    ],
    quiz: [
      { q: "TDSR in Singapore caps total monthly debt at:", options: ["40% of gross income", "55% of gross income", "60% of gross income", "65% of gross income"], answer: 1 },
      { q: "CPF OA funds used for property must be refunded with interest at:", options: ["2.5% per annum", "3.5% per annum", "4% per annum", "SORA rate"], answer: 0 },
      { q: "LTV limit for a first home purchase with a bank loan (no other outstanding loans):", options: ["60%", "70%", "75%", "80%"], answer: 2 },
    ],
  },

  "mod-7": {
    format: "Video + interactive portfolio builder",
    objectives: [
      "Build diversified portfolios suited to client risk profiles",
      "Apply modern portfolio theory in practice",
    ],
    keyTopics: ["Asset allocation", "Correlation", "Factor investing", "Rebalancing"],
    sections: [
      {
        title: "Foundations of Portfolio Construction",
        body: [
          "Modern Portfolio Theory (MPT), introduced by Harry Markowitz in 1952, established the mathematical basis for diversification. The core insight: combining assets with less-than-perfect correlation can reduce portfolio risk without proportionately reducing expected return. The efficient frontier represents the set of portfolios offering the highest expected return for a given level of risk.",
          "In practice, the inputs to MPT — expected returns, standard deviations, and correlations — are estimated from historical data, which is an imperfect predictor of the future. Correlations between asset classes tend to converge towards 1 during market crises (the 'correlation breakdown' problem), precisely when diversification is most needed.",
          "For client portfolios, a pragmatic approach: use MPT as a framework for thinking about diversification, not as a precise optimisation tool. The goal is a portfolio that the client will actually hold through a full market cycle — not the theoretically optimal portfolio they will abandon at the first 20% drawdown.",
        ],
      },
      {
        title: "Asset Allocation Frameworks",
        body: [
          "Strategic asset allocation (SAA) sets a long-term target mix based on client goals, risk tolerance, and time horizon. Tactical asset allocation (TAA) allows short-term deviations from the SAA to exploit perceived market opportunities. Most academic evidence suggests that TAA adds little value net of trading costs and taxes for most retail investors.",
          "Risk tolerance vs risk capacity: these are distinct concepts. Risk tolerance is psychological — how much volatility can the client emotionally bear? Risk capacity is financial — how much loss can the client sustain without derailing their goals? The binding constraint is whichever is lower. A client near retirement may have high tolerance but low capacity.",
          "Common frameworks: The 60/40 portfolio (60% equities, 40% bonds) remains a useful baseline. For clients with longer horizons, a 70/30 or 80/20 tilt is defensible. For clients near or in retirement, a 40/40/20 (equities/bonds/alternatives including annuities) may better address longevity risk.",
          "Singapore-specific allocation considerations: clients often hold concentrated property exposure (a $2M HDB or condo is effectively a leveraged position in local real estate). When constructing investment portfolios for property-owning clients, account for this existing concentration and underweight Singapore REITs and property-related equities.",
        ],
      },
      {
        title: "Factor Investing and Portfolio Tilts",
        body: [
          "Factor investing (also called 'smart beta') systematically tilts portfolios toward specific characteristics — value, size, momentum, quality, low volatility — that have historically been associated with excess returns. These factors are well-documented in academic literature spanning 50+ years.",
          "The most robust factors for retail investors: (1) Value — cheap stocks (low price-to-book, low P/E) have outperformed growth stocks over long periods, though the value premium has been weak in the 2010s. (2) Quality — companies with high profitability, low leverage, and stable earnings. (3) Low volatility — lower-volatility stocks have paradoxically delivered competitive returns with reduced drawdowns.",
          "Implementation: factor ETFs are the most cost-effective vehicle for retail clients. Singapore investors have access to global factor ETFs through platforms like FSMOne, Saxo, and Tiger Brokers. Typical expense ratios range from 0.15% (large-cap value ETFs) to 0.35% (multi-factor ETFs). The factor tilt should be modest — a 20–30% tilt, not a complete replacement of a core allocation.",
        ],
      },
      {
        title: "Rebalancing: When and How",
        body: [
          "Rebalancing restores a portfolio to its target allocation after market movements cause drift. Without rebalancing, a 60/40 portfolio after a strong equity bull market might drift to 75/25 — a meaningfully higher risk profile than the client originally agreed to.",
          "Two primary rebalancing approaches: calendar rebalancing (annually or semi-annually, regardless of drift) and threshold rebalancing (only when an asset class drifts beyond a set band, e.g. ±5%). Research suggests threshold rebalancing is slightly more efficient, but calendar rebalancing requires less monitoring and is easier to communicate to clients.",
          "Tax-aware rebalancing for SRS accounts: SRS assets grow tax-free until withdrawal. When rebalancing involves selling appreciated assets, consider doing so within the SRS account to defer the tax event. For taxable accounts, consider rebalancing using new cash flows (directing contributions to underweight asset classes) rather than selling — this avoids creating a taxable event.",
        ],
      },
    ],
    quiz: [
      { q: "The efficient frontier in Modern Portfolio Theory represents:", options: ["The highest-risk portfolios", "Portfolios with the best return for a given risk level", "Portfolios that maximise correlation", "The lowest-return portfolios"], answer: 1 },
      { q: "Which of the following is a well-documented investment factor?", options: ["Lottery factor", "Political factor", "Momentum factor", "News factor"], answer: 2 },
      { q: "Threshold rebalancing triggers when:", options: ["A year has passed", "An asset class drifts beyond a set band", "The market drops 10%", "A new client money is received"], answer: 1 },
    ],
  },

  "mod-11": {
    format: "Video + retirement planning calculator",
    objectives: [
      "Build retirement income projections for clients aged 50+",
      "Maximise CPF and SRS strategies",
    ],
    keyTopics: ["CPF Retirement Sums", "SRS", "Annuity vs drawdown", "Longevity risk"],
    sections: [
      {
        title: "Understanding the Retirement Income Gap",
        body: [
          "The retirement income gap is the difference between what a client needs to maintain their desired lifestyle and what their current savings trajectory will deliver. For Singapore residents, the gap is typically filled by a combination of CPF LIFE payouts, SRS withdrawals, investment portfolio drawdowns, and property monetisation.",
          "A useful starting framework: identify the client's retirement 'income floor' — the minimum they need for non-discretionary expenses (housing, healthcare, food, utilities). Then layer discretionary spending (travel, dining, gifts to children) on top. Design the retirement plan to guarantee the income floor from low-risk, predictable sources (CPF LIFE, annuities) and fund discretionary spending from more variable sources.",
          "Longevity risk is the central challenge. A 65-year-old Singapore resident has a median life expectancy of approximately 87 (male) to 90 (female). Plan for at least age 95 for conservative planning. Every additional year of longevity without adequate savings increases the probability of outliving assets.",
        ],
      },
      {
        title: "CPF Retirement Sums and LIFE Payouts",
        body: [
          "The CPF system requires members reaching 55 to set aside a Retirement Sum in their Retirement Account (RA), formed by transferring from OA and SA. Three levels: Basic Retirement Sum (BRS) provides S$900–S$1,100/month from age 65; Full Retirement Sum (FRS) provides S$1,650–S$2,000/month; Enhanced Retirement Sum (ERS) provides S$2,200–S$2,600/month. The ERS was raised to 4x BRS in 2025 to allow clients with higher income needs to contribute more.",
          "CPF LIFE (Lifelong Income For the Elderly) converts the RA balance into a monthly payout for life. Standard Plan (higher payouts, lower bequest) vs Basic Plan (lower payouts, higher bequest) — advise clients based on their health status, whether they have dependants, and their attitude toward bequest motives.",
          "Top-up strategies: the Retirement Sum Topping-Up Scheme (RSTU) allows clients to top up their own RA or a family member's SA/RA up to the current ERS. Cash top-ups attract a tax relief of up to S$8,000 per year (own account) plus S$8,000 for family members. For clients in the 22% marginal tax bracket, a S$16,000 top-up generates S$3,520 in immediate tax savings — before the investment return.",
        ],
      },
      {
        title: "SRS: Tax Deferral for High Earners",
        body: [
          "The Supplementary Retirement Scheme (SRS) is a voluntary savings scheme with significant tax advantages. Singapore citizens and PRs may contribute up to S$15,300/year; foreigners up to S$35,700/year. Contributions are fully tax-deductible in the year of contribution.",
          "The SRS withdrawal advantage: withdrawals from age 62 (the SRS retirement age) attract only 50% inclusion for tax purposes. Spreading withdrawals over 10 years after the statutory retirement age can result in very little or no tax paid on accumulated SRS balances — particularly powerful for clients whose taxable income will be lower in retirement.",
          "SRS investment strategy: unlike CPF OA and SA which are invested by the board at 2.5% and 4% respectively, SRS funds must be actively invested by the account holder. Default SRS balances earn only 0.05% per year. Help clients build a diversified portfolio within SRS using unit trusts, ETFs, Singapore equities, or REITs. The long investment horizon of 15–30+ years makes equity allocation within SRS highly appropriate.",
        ],
      },
      {
        title: "Drawdown Strategies in Retirement",
        body: [
          "The classic drawdown framework is the 4% Rule: withdraw 4% of the portfolio in Year 1 of retirement, adjusting for inflation annually. Based on US market data, this rule has a ~90% success rate over 30-year retirements. However, for longer retirements (35+ years) or more conservative portfolios, a 3–3.5% initial withdrawal rate is more robust.",
          "For Singapore clients, a bucket strategy may be more intuitive: Bucket 1 (1–2 years of living expenses in cash/T-bills — immediate liquidity), Bucket 2 (3–7 years of expenses in bonds and balanced funds — stability), Bucket 3 (remaining assets in equities — long-term growth). Refill Bucket 1 annually from Bucket 2, and Bucket 2 from Bucket 3 when markets are favourable.",
          "Healthcare planning is the most underestimated retirement expense. Integrate Shield plan reviews into every retirement planning conversation — a H&S plan with integrated rider can cap annual out-of-pocket expenses to as low as S$3,000 for hospitalisation. Without adequate coverage, a single healthcare event can derail an otherwise well-structured retirement plan.",
        ],
      },
    ],
    quiz: [
      { q: "The Enhanced Retirement Sum (ERS) as of 2025 is set at:", options: ["2× BRS", "3× BRS", "4× BRS", "5× BRS"], answer: 2 },
      { q: "SRS withdrawals from age 62 are taxed on what portion of the amount withdrawn?", options: ["100%", "75%", "50%", "25%"], answer: 2 },
      { q: "In the bucket strategy, Bucket 1 should hold approximately:", options: ["All equity investments", "5–10 years of expenses in bonds", "1–2 years of expenses in cash", "Entire retirement portfolio"], answer: 2 },
    ],
  },

  "mod-13": {
    format: "Mandatory: video + assessment",
    objectives: [
      "Apply MAS FAA fair dealing obligations",
      "Identify and manage conflicts of interest",
    ],
    keyTopics: ["5 fair dealing outcomes", "Suitability", "Complaints handling", "Ethics"],
    sections: [
      {
        title: "MAS Fair Dealing Framework",
        body: [
          "The MAS Guidelines on Fair Dealing (FSG-G01) set out five intended outcomes that all financial advisory firms and representatives must work towards. These are not aspirational — they are the standard against which conduct is measured in supervisory examinations and enforcement actions.",
          "The five outcomes: (1) Customers have confidence that they deal with FIs where fair dealing is central to corporate culture; (2) FIs offer products and services that are suitable for the customer's needs; (3) FIs competently and effectively provide financial advisory services; (4) Customers receive clear, relevant, and timely information to make informed decisions; (5) FIs handle customer complaints fairly and promptly.",
          "For individual representatives, the most directly applicable outcomes are (2), (3), and (4). Outcome (2) — suitability — is the most frequently cited in enforcement actions. Outcome (4) — clear information — is relevant to every client interaction. Outcome (5) — complaints handling — requires escalation protocols most advisers should know by heart.",
        ],
      },
      {
        title: "Suitability Assessment in Practice",
        body: [
          "Before recommending any investment product, you must assess suitability. The FAA requires consideration of the customer's financial objectives, time horizon, risk tolerance, financial situation (income, assets, liabilities), and investment knowledge. This must be documented contemporaneously — a completed FNA (Financial Needs Analysis) form is essential.",
          "The Customer Knowledge Assessment (CKA) applies when recommending Specified Investment Products (SIPs). Customers who fail the CKA or choose not to take it may still purchase the product, but with additional safeguards: they must acknowledge in writing that the product is not suitable based on your assessment, and they must obtain approval from a supervisory representative.",
          "Common suitability failures: recommending a product without completing an FNA; relying on a stale FNA (more than 12 months old) without review; recommending a product that does not match the documented risk profile; and failing to document the reasons for the recommendation.",
        ],
      },
      {
        title: "Managing Conflicts of Interest",
        body: [
          "Conflicts of interest are inherent in the financial advisory business — you receive compensation from product providers, and clients may not always understand this. MAS requires disclosure of all material conflicts. The test: would a reasonable client view this information as relevant to their decision? If yes, disclose it.",
          "The most common conflict: product commissions. Under FAA regulations, you must disclose the commission or fee you receive from recommending a product. This disclosure must be specific (not a range), made before the transaction, and in writing. Failure to disclose is a regulatory breach with serious consequences including revocation of the representative's licence.",
          "Conflict management beyond disclosure: ideally, structure your practice to minimise conflicts (e.g., fee-based advisory for clients where commission structures create misalignment). Where conflicts cannot be eliminated, document your reasoning for the recommendation and ensure the recommendation is genuinely in the client's interest, independently of the commission earned.",
        ],
      },
      {
        title: "Complaints Handling and Escalation",
        body: [
          "Every complaint must be handled promptly and fairly. MAS expects complaints to be acknowledged within 2 business days and substantively responded to within 14 business days. Complex complaints may take longer, but the client must be kept informed of progress.",
          "A complaint is any expression of dissatisfaction — written or oral. You cannot decide that a client's concern is 'not really a complaint' and handle it informally. All complaints must be logged in the firm's complaints register, even if resolved at the first point of contact.",
          "Escalation protocol: if you receive a complaint, immediately inform your supervisor and compliance team. Do not attempt to resolve it independently, particularly if there is any possibility of a regulatory breach being involved. The firm's complaints handling policy takes precedence over your individual judgment.",
          "FIDReC (Financial Industry Disputes Resolution Centre): if a complaint cannot be resolved internally, clients may escalate to FIDReC for independent mediation and adjudication. FIDReC can award compensation up to S$150,000 per claim. Awareness of this avenue is important — informing clients of their right to escalate is itself a fair dealing obligation.",
        ],
      },
    ],
    quiz: [
      { q: "MAS Fair Dealing guidelines specify how many intended outcomes?", options: ["3", "4", "5", "6"], answer: 2 },
      { q: "A Customer Knowledge Assessment (CKA) is required when recommending:", options: ["Life insurance policies", "Specified Investment Products (SIPs)", "CPF top-ups", "Health and Shield plans"], answer: 1 },
      { q: "FIDReC can award compensation per claim up to:", options: ["S$50,000", "S$100,000", "S$150,000", "S$250,000"], answer: 2 },
    ],
  },
};

/* ── Fill in remaining modules with lightweight content ──────────────────── */
const FALLBACK_SECTIONS: Record<string, { title: string }[]> = {
  "mod-2":  [{ title: "Advanced Trust Structures" }, { title: "Cross-Border Inheritance" }, { title: "Digital Asset Planning" }],
  "mod-4":  [{ title: "GST Fundamentals" }, { title: "Cross-Border Transactions" }, { title: "Compliance Obligations" }],
  "mod-6":  [{ title: "Keyman Insurance Concepts" }, { title: "Valuation Methods" }, { title: "Business Continuity" }],
  "mod-8":  [{ title: "Cognitive Biases in Finance" }, { title: "Client Coaching Techniques" }, { title: "Market Psychology" }],
  "mod-9":  [{ title: "Will Drafting Essentials" }, { title: "LPA and Advance Care" }, { title: "Intestacy Rules" }],
  "mod-10": [{ title: "Business Valuation" }, { title: "Shareholder Agreements" }, { title: "Tax-Efficient Transfer" }],
  "mod-12": [{ title: "SRS Mechanics" }, { title: "Investment Options" }, { title: "Withdrawal Planning" }],
  "mod-14": [{ title: "KYC Obligations" }, { title: "AML Red Flags" }, { title: "Record-Keeping" }],
  "mod-15": [{ title: "Discovery Framework" }, { title: "Active Listening" }, { title: "Building Rapport" }],
};

const EXAMPLE_PROMPTS = [
  "Estate planning for high-net-worth families",
  "Retirement income strategies for clients near 60",
  "Tax-efficient wealth transfer",
  "Corporate succession and business continuity",
];

type Tab = "all" | "required" | "optional" | "completed";

/* ── Course Viewer Modal ─────────────────────────────────────────────────── */
function CourseViewer({
  mod,
  onClose,
  onComplete,
}: {
  mod: (typeof modules)[0];
  onClose: () => void;
  onComplete: () => void;
}) {
  const content = MODULE_CONTENT[mod.id];
  const sections = content?.sections ?? (FALLBACK_SECTIONS[mod.id] ?? []).map(s => ({
    title: s.title,
    body: ["Full lesson content coming soon. This section covers key concepts and practical application for financial advisers in Singapore."],
  }));
  const quiz = content?.quiz ?? [];

  const [currentSection, setCurrentSection] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const totalSteps = sections.length + (quiz.length > 0 ? 1 : 0);
  const isLastContent = currentSection === sections.length - 1;

  function score() {
    return quiz.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0);
  }

  const tc = TOPIC_COLORS[mod.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex h-[90vh] w-full max-w-[900px] flex-col overflow-hidden rounded-2xl border border-line shadow-2xl"
        style={{ background: "var(--surface)" }}>

        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-line px-6 py-4"
          style={{ background: "linear-gradient(135deg,#0d1b2a,#0f2233)" }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                style={{ background: tc.bg, color: tc.color }}>{mod.topic}</span>
              {mod.required && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-400">Required</span>}
            </div>
            <h2 className="truncate font-display text-[16px] font-bold text-white">{mod.title}</h2>
          </div>
          <div className="flex items-center gap-3 text-white/50 text-[11px]">
            <span className="flex items-center gap-1"><Clock className="size-3" />{mod.durationMin} min</span>
            <span>+{mod.credits} cr</span>
          </div>
          <button onClick={onClose} className="ml-2 text-white/40 hover:text-white transition-colors">
            <X className="size-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 shrink-0" style={{ background: "var(--line)" }}>
          <div className="h-full transition-[width] duration-500"
            style={{ width: `${((showQuiz ? sections.length : currentSection) / totalSteps) * 100}%`, background: "#2dd4bf" }} />
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar nav */}
          <div className="hidden md:flex w-[200px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-line p-3">
            {sections.map((s, i) => (
              <button key={i} onClick={() => { setCurrentSection(i); setShowQuiz(false); }}
                className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors"
                style={!showQuiz && currentSection === i
                  ? { background: "rgba(45,212,191,0.1)", color: "var(--ink)" }
                  : { color: "var(--ink-faint)" }}>
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                  style={{ background: !showQuiz && currentSection === i ? "#2dd4bf" : "var(--surface-raised)", color: !showQuiz && currentSection === i ? "#fff" : "inherit" }}>
                  {i + 1}
                </span>
                <span className="text-[11px] font-medium leading-snug">{s.title}</span>
              </button>
            ))}
            {quiz.length > 0 && (
              <button onClick={() => setShowQuiz(true)}
                className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors"
                style={showQuiz
                  ? { background: "rgba(45,212,191,0.1)", color: "var(--ink)" }
                  : { color: "var(--ink-faint)" }}>
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full"
                  style={{ background: showQuiz ? "#2dd4bf" : "var(--surface-raised)" }}>
                  <ListChecks className="size-2.5" style={{ color: showQuiz ? "#fff" : "inherit" }} />
                </span>
                <span className="text-[11px] font-medium leading-snug">Knowledge Check</span>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {!showQuiz ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="size-4 text-ink-faint" />
                  <span className="text-[11px] uppercase tracking-wider text-ink-faint">
                    Section {currentSection + 1} of {sections.length}
                  </span>
                </div>
                <h3 className="mb-4 font-display text-[20px] font-bold text-ink">
                  {sections[currentSection].title}
                </h3>
                <div className="flex flex-col gap-4">
                  {sections[currentSection].body.map((para, i) => (
                    <p key={i} className="text-[14px] leading-relaxed text-ink-soft">{para}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ListChecks className="size-4 text-accent-ink" />
                  <span className="text-[11px] uppercase tracking-wider text-ink-faint">Knowledge Check</span>
                </div>
                <h3 className="mb-5 font-display text-[18px] font-bold text-ink">
                  Test your understanding
                </h3>
                {submitted ? (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full"
                      style={{ background: score() === quiz.length ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)" }}>
                      <Award className="size-8" style={{ color: score() === quiz.length ? "#10b981" : "#f59e0b" }} />
                    </div>
                    <p className="font-display text-[22px] font-bold text-ink">{score()} / {quiz.length}</p>
                    <p className="text-[13px] text-ink-faint">
                      {score() === quiz.length ? "Perfect score — excellent work!" : score() >= quiz.length * 0.67 ? "Good result — review the questions you missed." : "Revisit the module content and try again."}
                    </p>
                    {quiz.map((q, qi) => (
                      <div key={qi} className="w-full rounded-xl border p-4 text-left"
                        style={{ borderColor: answers[qi] === q.answer ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)",
                          background: answers[qi] === q.answer ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)" }}>
                        <p className="mb-2 text-[13px] font-semibold text-ink">{q.q}</p>
                        <p className="text-[12px]" style={{ color: answers[qi] === q.answer ? "#10b981" : "#ef4444" }}>
                          Your answer: {q.options[answers[qi] ?? -1] ?? "–"}
                        </p>
                        {answers[qi] !== q.answer && (
                          <p className="text-[12px] text-ok">Correct: {q.options[q.answer]}</p>
                        )}
                      </div>
                    ))}
                    <Button className="mt-2 w-full" style={{ background: "#0f766e", color: "#fff" }} onClick={onComplete}>
                      <CheckCircle2 className="size-4" /> Mark complete &amp; earn {mod.credits} credits
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {quiz.map((q, qi) => (
                      <div key={qi}>
                        <p className="mb-3 text-[14px] font-semibold text-ink">{qi + 1}. {q.q}</p>
                        <div className="flex flex-col gap-2">
                          {q.options.map((opt, oi) => (
                            <button key={oi}
                              onClick={() => setAnswers(prev => ({ ...prev, [qi]: oi }))}
                              className="flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-[13px] transition-colors"
                              style={answers[qi] === oi
                                ? { borderColor: "#2dd4bf", background: "rgba(45,212,191,0.08)", color: "var(--ink)" }
                                : { borderColor: "var(--line)", color: "var(--ink-soft)" }}>
                              <span className="flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px]"
                                style={answers[qi] === oi ? { borderColor: "#2dd4bf", background: "#2dd4bf", color: "#fff" } : { borderColor: "var(--line)" }}>
                                {answers[qi] === oi ? "✓" : ""}
                              </span>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Button
                      className="mt-2 w-full"
                      style={{ background: "#0f766e", color: "#fff" }}
                      disabled={Object.keys(answers).length < quiz.length}
                      onClick={() => setSubmitted(true)}
                    >
                      Submit answers
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer navigation */}
        {!showQuiz && (
          <div className="flex shrink-0 items-center justify-between border-t border-line px-6 py-3">
            <button onClick={() => setCurrentSection(p => Math.max(0, p - 1))}
              disabled={currentSection === 0}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-ink-faint disabled:opacity-30 hover:bg-surface-raised transition-colors">
              <ChevronLeft className="size-3.5" /> Previous
            </button>
            {isLastContent && quiz.length > 0 ? (
              <Button size="sm" style={{ background: "#0f766e", color: "#fff" }} onClick={() => setShowQuiz(true)}>
                Take knowledge check <ChevronRightIcon className="size-3.5" />
              </Button>
            ) : isLastContent ? (
              <Button size="sm" style={{ background: "#0f766e", color: "#fff" }} onClick={onComplete}>
                <CheckCircle2 className="size-3.5" /> Mark complete
              </Button>
            ) : (
              <button onClick={() => setCurrentSection(p => Math.min(sections.length - 1, p + 1))}
                className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-surface-raised transition-colors">
                Next <ChevronRightIcon className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function CpdPage() {
  const { advisorId, completedModuleIds, completeModule } = useStore();
  const cpd = getCpdStatus(advisorId, completedModuleIds);
  const advisor = getAdvisor(advisorId)!;
  const categoryBreakdown = getCpdCategoryBreakdown(advisorId, completedModuleIds);
  const weeklyPicks = getWeeklyPicks(advisorId, completedModuleIds);

  const completed   = modules.filter((m) => completedModuleIds.includes(m.id));
  const available   = modules.filter((m) => !completedModuleIds.includes(m.id));
  const required    = available.filter((m) => m.required);
  const optional    = available.filter((m) => !m.required);

  const urgent      = cpd.remaining > 0 && cpd.daysToDeadline <= 14;
  const tone        = cpd.remaining === 0 ? "ok" : urgent ? "warn" : "accent";
  const statusLabel = cpd.remaining === 0 ? "CPD complete" : urgent ? "At risk" : "On track";

  const [query, setQuery]             = useState("");
  const [searchResults, setSearchResults] = useState<CpdSearchResult[]>([]);
  const [searching, setSearching]     = useState(false);
  const [tab, setTab]                 = useState<Tab>("all");
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [viewingMod, setViewingMod]   = useState<(typeof modules)[0] | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch("/api/cpd/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, top_k: 4, exclude_ids: completedModuleIds }),
      });
      setSearchResults((await res.json()).results ?? []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, [completedModuleIds]);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 380);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const libraryModules =
    tab === "required"  ? required  :
    tab === "optional"  ? optional  :
    tab === "completed" ? completed :
    [...required, ...optional, ...completed];

  return (
    <div className="mx-auto max-w-[900px] px-6 py-8">

      {/* Course viewer modal */}
      {viewingMod && (
        <CourseViewer
          mod={viewingMod}
          onClose={() => setViewingMod(null)}
          onComplete={() => { completeModule(viewingMod.id); setViewingMod(null); setExpandedId(null); }}
        />
      )}

      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div className="relative mb-6 overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: "linear-gradient(135deg, #0d1b2a 0%, #0f2233 60%, #0a2218 100%)" }}>
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #0f766e, transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-20 left-0 size-48 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #b45309, transparent 70%)" }} />

        <div className="relative flex flex-wrap items-center gap-6">
          <ProgressRing value={cpd.pct} tone={tone} size={88} stroke={8}>
            <div className="text-center leading-tight">
              <p className="font-display text-[20px] font-bold text-white">{cpd.earned}</p>
              <p className="text-[10px]" style={{ color: "#94a3b8" }}>/ {cpd.required}</p>
            </div>
          </ProgressRing>

          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <GraduationCap className="size-4" style={{ color: "#5eead4" }} />
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#5eead4" }}>
                MAS FAA-N13
              </span>
            </div>
            <p className="font-display text-[26px] font-bold leading-tight">
              {cpd.remaining === 0 ? "CPD complete — well done!" : `${cpd.remaining} credit${cpd.remaining !== 1 ? "s" : ""} remaining`}
            </p>
            <p className="mt-1 text-[13px]" style={{ color: "#94a3b8" }}>
              Deadline: {fmtDeadline(advisor.cpdDeadline)} · {cpd.daysToDeadline} days away
            </p>
            {urgent && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-semibold"
                style={{ background: "#b45309" }}>
                <AlertTriangle className="size-3.5" />
                Urgent — complete remaining modules to protect your licence
              </div>
            )}
          </div>

          <div className="flex gap-5">
            {[
              { label: "Done",      value: completed.length },
              { label: "Remaining", value: available.length },
              { label: "Progress",  value: `${cpd.pct}%` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="font-display text-[22px] font-bold text-white">{value}</p>
                <p className="text-[11px]" style={{ color: "#64748b" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
          style={{ borderColor: urgent ? "#b45309" : "#0f766e", color: urgent ? "#fbbf24" : "#5eead4" }}>
          <ShieldAlert className="size-3" />
          {statusLabel}
        </div>
      </div>

      {/* ── Category rings ────────────────────────────────────────────────── */}
      <div className="mb-6 overflow-x-auto pb-1">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {categoryBreakdown.filter((c) => c.moduleCount > 0).map((c) => {
            const tc = TOPIC_COLORS[c.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
            const ringTone = c.pct === 100 ? "ok" : c.pct >= 50 ? "accent" : "warn";
            const label = SHORT_LABEL[c.topic] ?? c.topic;
            return (
              <div key={c.topic} className="flex flex-col items-center gap-1.5">
                <ProgressRing value={c.pct} tone={ringTone} size={48} stroke={4}>
                  <span className="text-[9px] font-bold text-ink">{c.pct}%</span>
                </ProgressRing>
                <span className="rounded-md px-1.5 py-0.5 text-center text-[9px] font-semibold whitespace-nowrap"
                  style={{ background: tc.bg, color: tc.color }}>
                  {label}
                </span>
                <span className="text-[9px] text-ink-faint">{c.completedCount}/{c.moduleCount}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── AI Learning Path Generator ────────────────────────────────────── */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-accent-ink" />
          <h2 className="text-[14px] font-semibold text-ink">Learning path generator</h2>
          <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>AI</span>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-sm transition-colors focus-within:border-accent/50">
          {searching
            ? <RefreshCw className="size-4 animate-spin shrink-0 text-ink-faint" />
            : <Search className="size-4 shrink-0 text-ink-faint" />
          }
          <input
            type="text"
            placeholder='Describe a client need — e.g. "estate planning for HNW families"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[12px] text-ink-faint hover:text-ink">clear</button>
          )}
        </div>

        {!query && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((p) => (
              <button key={p} onClick={() => setQuery(p)}
                className="rounded-full border border-line px-3 py-1 text-[11px] text-ink-soft transition-colors hover:border-accent/40 hover:text-ink">
                {p}
              </button>
            ))}
          </div>
        )}

        {query && searchResults.length > 0 && (
          <Card className="mt-3 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-[13px]">
                <Sparkles className="size-3.5 text-accent-ink" />
                AI-curated path for &ldquo;{query}&rdquo;
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              {searchResults.map((r, i) => {
                const tc = TOPIC_COLORS[r.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
                return (
                  <div key={r.id} className="flex items-start gap-3 rounded-xl border border-line p-4">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-ink-faint"
                      style={{ background: "var(--surface-raised)" }}>
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ink">{r.title}</p>
                      <p className="mt-0.5 text-[11px] text-accent-ink">{r.reason}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: tc.bg, color: tc.color }}>{r.topic}</span>
                        <span className="flex items-center gap-1 text-[11px] text-ink-faint"><Clock className="size-3" />{r.durationMin} min</span>
                        <span className="text-[11px] text-ink-faint">+{r.credits} credits</span>
                        {r.required && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">Required</span>}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => {
                      const m = modules.find(mod => mod.id === r.id);
                      if (m) setViewingMod(m);
                    }}>
                      Open <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
        {query && !searching && searchResults.length === 0 && (
          <p className="mt-2 px-1 text-[12px] text-ink-faint">No modules matched — try different keywords or browse the library below.</p>
        )}
      </div>

      {/* ── Recommended module ────────────────────────────────────────────── */}
      {cpd.recommendedModule && !query && (
        <div className="mb-6 flex items-start gap-4 rounded-xl border p-4"
          style={{ borderColor: "#0f766e60", background: "rgba(15,118,110,0.06)" }}>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: "#0f766e" }}>
            <Zap className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-ink">
              Recommended — your clients most need: {cpd.topNeed}
            </p>
            <p className="mt-1 text-[15px] font-bold text-ink">{cpd.recommendedModule.title}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[12px] text-ink-soft">
              <span className="flex items-center gap-1"><Clock className="size-3.5" />{cpd.recommendedModule.durationMin} min</span>
              <span>+{cpd.recommendedModule.credits} credits</span>
              {cpd.recommendedModule.required && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">Required</span>
              )}
            </div>
          </div>
          <Button size="sm" style={{ background: "#0f766e", color: "#fff" }}
            onClick={() => setViewingMod(cpd.recommendedModule!)}>
            Start now <ArrowRight className="size-3.5" />
          </Button>
        </div>
      )}

      {/* ── Weekly picks ─────────────────────────────────────────────────── */}
      {weeklyPicks.length > 0 && !query && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-accent-ink" />
              This week&apos;s picks — matched to your client conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-0">
            {weeklyPicks.map(({ module: mod, reason }) => {
              const tc = TOPIC_COLORS[mod.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
              return (
                <div key={mod.id} className="flex items-start gap-3 rounded-xl border border-line p-4">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(45,212,191,0.1)" }}>
                    <Sparkles className="size-3.5 text-accent-ink" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-ink">{mod.title}</p>
                    <p className="mt-0.5 text-[11px] text-accent-ink">{reason}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: tc.bg, color: tc.color }}>{mod.topic}</span>
                      <span className="flex items-center gap-1 text-[11px] text-ink-faint"><Clock className="size-3" />{mod.durationMin} min</span>
                      <span className="text-[11px] text-ink-faint">+{mod.credits} credits</span>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setViewingMod(mod)}>
                    Open <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Learning library ──────────────────────────────────────────────── */}
      {!query && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-ink-soft" />
              <h2 className="text-[14px] font-semibold text-ink">Learning library</h2>
              <span className="text-[12px] text-ink-faint">({libraryModules.length})</span>
            </div>
            <div className="flex gap-1 rounded-lg border border-line p-0.5" style={{ background: "var(--surface-raised)" }}>
              {(["all", "required", "optional", "completed"] as Tab[]).map((t) => {
                const count = t === "required" ? required.length : t === "optional" ? optional.length : t === "completed" ? completed.length : modules.length;
                return (
                  <button key={t} onClick={() => setTab(t)}
                    className="rounded-md px-3 py-1 text-[11px] font-semibold capitalize transition-all"
                    style={tab === t
                      ? { background: "var(--surface)", color: "var(--ink)", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }
                      : { color: "var(--ink-faint)" }}>
                    {t} <span className="ml-0.5 opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {tab === "required" && required.length > 0 && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-600">
              <AlertTriangle className="size-3.5 shrink-0" />
              {required.length} required module{required.length !== 1 ? "s" : ""} must be completed before the deadline.
            </div>
          )}

          <div className="flex flex-col gap-2">
            {libraryModules.length === 0 && (
              <p className="py-6 text-center text-[13px] text-ink-faint">
                {tab === "completed" ? "No modules completed yet." : "No modules in this category."}
              </p>
            )}
            {libraryModules.map((mod) => {
              const isDone  = completedModuleIds.includes(mod.id);
              const isOpen  = expandedId === mod.id;
              const tc      = TOPIC_COLORS[mod.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
              const content = MODULE_CONTENT[mod.id];
              const hasFull = !!(content?.sections?.length);

              return (
                <div key={mod.id}
                  className={`overflow-hidden rounded-xl border transition-all ${
                    isDone ? "border-line opacity-65" : isOpen ? "border-accent/40" : "border-line hover:border-accent/25"
                  }`}
                  style={{ background: isDone ? "var(--surface-raised)" : isOpen ? "var(--accent-soft)" : "var(--surface)" }}>

                  {/* Row */}
                  <button onClick={() => setExpandedId(isOpen ? null : mod.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <div className="shrink-0">
                      {isDone
                        ? <CheckCircle2 className="size-5 text-ok" />
                        : mod.required
                        ? <AlertTriangle className="size-5 text-warn" />
                        : <BookOpen className="size-5 text-ink-faint" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] font-semibold leading-snug text-ink ${isDone ? "line-through opacity-60" : ""}`}>
                        {mod.title}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: tc.bg, color: tc.color }}>{mod.topic}</span>
                        <span className="flex items-center gap-1 text-[11px] text-ink-faint">
                          <Clock className="size-3" />{mod.durationMin} min
                        </span>
                        <span className="text-[11px] text-ink-faint">
                          {isDone ? `${mod.credits} cr earned` : `+${mod.credits} credits`}
                        </span>
                        {mod.required && !isDone && (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">Required</span>
                        )}
                      </div>
                    </div>
                    <ChevronDown className="size-4 shrink-0 text-ink-faint transition-transform duration-200"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </button>

                  {/* Expanded preview */}
                  {isOpen && (
                    <div className="border-t border-line/60 px-4 pb-4 pt-3">
                      {content ? (
                        <>
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Format</p>
                          <p className="mb-3 text-[12px] text-ink-soft">{content.format}</p>

                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Learning objectives</p>
                          <ul className="mb-3 flex flex-col gap-1">
                            {content.objectives.map((o, i) => (
                              <li key={i} className="flex items-start gap-2 text-[12px] text-ink-soft">
                                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent-ink" />{o}
                              </li>
                            ))}
                          </ul>

                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Topics</p>
                          <div className="mb-4 flex flex-wrap gap-1.5">
                            {content.keyTopics.map((t) => (
                              <span key={t} className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-ink-soft">{t}</span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {(FALLBACK_SECTIONS[mod.id] ?? []).map(s => (
                            <span key={s.title} className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-ink-soft">{s.title}</span>
                          ))}
                        </div>
                      )}

                      {!isDone && (
                        <Button size="sm" className="w-full" style={{ background: "#0f766e", color: "#fff" }}
                          onClick={() => setViewingMod(mod)}>
                          <Play className="size-3.5" />
                          {hasFull ? "Start course" : "Start module"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
