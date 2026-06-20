/* ── CPD module content ────────────────────────────────────────────────────
   Shared by the CPD overview page and the individual course route.
   MODULE_CONTENT holds full rich content; FALLBACK_SECTIONS covers
   modules that don't yet have authored content.
── */

export type CourseSection = { title: string; body: string[] };
export type QuizItem = { q: string; options: string[]; answer: number };
export type ModuleContent = {
  objectives: string[];
  keyTopics: string[];
  format: string;
  sections: CourseSection[];
  quiz: QuizItem[];
};

/* ── Semantic token colours — dark-mode safe ─────────────────────────────── */
export const TOPIC_TOKEN: Record<string, { bg: string; color: string }> = {
  "Estate & Trust":      { bg: "var(--ok-soft)",        color: "var(--ok)" },
  "Investments":         { bg: "var(--accent-soft)",     color: "var(--accent-ink)" },
  "Retirement":          { bg: "var(--accent-soft)",     color: "var(--accent-ink)" },
  "Tax Planning":        { bg: "var(--warn-soft)",       color: "var(--warn)" },
  "Business Succession": { bg: "var(--warn-soft)",       color: "var(--warn)" },
  "Legal / Will":        { bg: "var(--alert-soft)",      color: "var(--alert)" },
  "Mortgage":            { bg: "var(--surface-raised)",  color: "var(--ink-soft)" },
  "Corporate Insurance": { bg: "var(--surface-raised)",  color: "var(--ink-soft)" },
  "Compliance":          { bg: "var(--surface-raised)",  color: "var(--ink-soft)" },
  "Practice":            { bg: "var(--surface-raised)",  color: "var(--ink-soft)" },
};

export const SHORT_LABEL: Record<string, string> = {
  "Estate & Trust":      "Estate",
  "Tax Planning":        "Tax",
  "Corporate Insurance": "Corp. Ins.",
  "Legal / Will":        "Legal",
  "Business Succession": "Succession",
  "Investments":         "Investing",
};

export const FALLBACK_SECTIONS: Record<string, { title: string }[]> = {
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

export const MODULE_CONTENT: Record<string, ModuleContent> = {
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
          "The cost-benefit decision: A simple discretionary trust established during a client's lifetime (inter vivos trust) typically costs RM5,000–RM20,000 to set up, plus annual trustee fees. For estates above RM2M, this cost is often justified by the benefits: privacy (trusts are not public record), certainty of distribution, and continuity of management.",
        ],
      },
    ],
    quiz: [
      { q: "Which type of trust allows the settlor to dissolve it during their lifetime?", options: ["Fixed interest trust", "Revocable trust", "Irrevocable trust", "Purpose trust"], answer: 1 },
      { q: "Assets with valid CPF or insurance nominations:", options: ["Go through probate first", "Bypass probate entirely", "Must be declared in the will", "Are frozen for 6 months"], answer: 1 },
      { q: "A Private Trust Company (PTC) in Singapore requires a Trust Company licence when:", options: ["Managing assets above RM5M", "Administering trusts for unrelated parties", "Holding overseas assets", "Managing a discretionary trust"], answer: 1 },
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
          "For Year of Assessment 2027 (income earned in 2026), the top marginal personal income tax rate remains at 24% for chargeable income above RM1,000,000. The corporate tax rate is a flat 17%, though effective rates are often lower due to partial tax exemptions and startup exemptions.",
          "Key exemptions for individuals: the personal relief of RM1,000, earned income relief, and the Working Mother's Child Relief (WMCR) are the most commonly applicable. For clients with significant investment income, advising on optimising their relief mix can meaningfully reduce their tax bill.",
        ],
      },
      {
        title: "2026 Budget Changes and Client Impact",
        body: [
          "The 2026 Budget introduced several changes relevant to your client conversations. The GST rate has been raised to 9% (effective from 1 January 2024 and unchanged in 2026). Importantly, the GST Voucher — CASH component was increased to RM850 for eligible recipients.",
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
          "Family offices: Singapore's enhanced fund framework (13O and 13U schemes) remain attractive for families with investable assets above RM10M. Both schemes provide full tax exemptions on qualifying income. The minimum AUM for 13O is RM10M (increasing to RM20M after 2 years), and for 13U is RM50M.",
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
      { q: "Foreign-sourced income is tax-exempt in Singapore when:", options: ["It is below RM100,000", "It has been taxed in the source country at headline rate ≥ 15%", "The recipient is a Singapore citizen", "It is not remitted to Singapore in the same year"], answer: 1 },
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
          "The CPF system requires members reaching 55 to set aside a Retirement Sum in their Retirement Account (RA), formed by transferring from OA and SA. Three levels: Basic Retirement Sum (BRS) provides RM900–RM1,100/month from age 65; Full Retirement Sum (FRS) provides RM1,650–RM2,000/month; Enhanced Retirement Sum (ERS) provides RM2,200–RM2,600/month. The ERS was raised to 4x BRS in 2025 to allow clients with higher income needs to contribute more.",
          "CPF LIFE (Lifelong Income For the Elderly) converts the RA balance into a monthly payout for life. Standard Plan (higher payouts, lower bequest) vs Basic Plan (lower payouts, higher bequest) — advise clients based on their health status, whether they have dependants, and their attitude toward bequest motives.",
          "Top-up strategies: the Retirement Sum Topping-Up Scheme (RSTU) allows clients to top up their own RA or a family member's SA/RA up to the current ERS. Cash top-ups attract a tax relief of up to RM8,000 per year (own account) plus RM8,000 for family members. For clients in the 22% marginal tax bracket, a RM16,000 top-up generates RM3,520 in immediate tax savings — before the investment return.",
        ],
      },
      {
        title: "SRS: Tax Deferral for High Earners",
        body: [
          "The Supplementary Retirement Scheme (SRS) is a voluntary savings scheme with significant tax advantages. Singapore citizens and PRs may contribute up to RM15,300/year; foreigners up to RM35,700/year. Contributions are fully tax-deductible in the year of contribution.",
          "The SRS withdrawal advantage: withdrawals from age 62 (the SRS retirement age) attract only 50% inclusion for tax purposes. Spreading withdrawals over 10 years after the statutory retirement age can result in very little or no tax paid on accumulated SRS balances — particularly powerful for clients whose taxable income will be lower in retirement.",
          "SRS investment strategy: unlike CPF OA and SA which are invested by the board at 2.5% and 4% respectively, SRS funds must be actively invested by the account holder. Default SRS balances earn only 0.05% per year. Help clients build a diversified portfolio within SRS using unit trusts, ETFs, Singapore equities, or REITs. The long investment horizon of 15–30+ years makes equity allocation within SRS highly appropriate.",
        ],
      },
      {
        title: "Drawdown Strategies in Retirement",
        body: [
          "The classic drawdown framework is the 4% Rule: withdraw 4% of the portfolio in Year 1 of retirement, adjusting for inflation annually. Based on US market data, this rule has a ~90% success rate over 30-year retirements. However, for longer retirements (35+ years) or more conservative portfolios, a 3–3.5% initial withdrawal rate is more robust.",
          "For Singapore clients, a bucket strategy may be more intuitive: Bucket 1 (1–2 years of living expenses in cash/T-bills — immediate liquidity), Bucket 2 (3–7 years of expenses in bonds and balanced funds — stability), Bucket 3 (remaining assets in equities — long-term growth). Refill Bucket 1 annually from Bucket 2, and Bucket 2 from Bucket 3 when markets are favourable.",
          "Healthcare planning is the most underestimated retirement expense. Integrate Shield plan reviews into every retirement planning conversation — a H&S plan with integrated rider can cap annual out-of-pocket expenses to as low as RM3,000 for hospitalisation. Without adequate coverage, a single healthcare event can derail an otherwise well-structured retirement plan.",
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
          "FIDReC (Financial Industry Disputes Resolution Centre): if a complaint cannot be resolved internally, clients may escalate to FIDReC for independent mediation and adjudication. FIDReC can award compensation up to RM150,000 per claim. Awareness of this avenue is important — informing clients of their right to escalate is itself a fair dealing obligation.",
        ],
      },
    ],
    quiz: [
      { q: "MAS Fair Dealing guidelines specify how many intended outcomes?", options: ["3", "4", "5", "6"], answer: 2 },
      { q: "A Customer Knowledge Assessment (CKA) is required when recommending:", options: ["Life insurance policies", "Specified Investment Products (SIPs)", "CPF top-ups", "Health and Shield plans"], answer: 1 },
      { q: "FIDReC can award compensation per claim up to:", options: ["RM50,000", "RM100,000", "RM150,000", "RM250,000"], answer: 2 },
    ],
  },
};
