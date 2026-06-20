/**
 * Unit tests for pure functions in data.ts
 *
 * HOW TO RUN:
 *   1. Install dependencies:  npm install
 *   2. Add Jest + ts-jest to devDependencies:
 *        npm install --save-dev jest ts-jest @types/jest
 *   3. Add to package.json:
 *        "jest": { "preset": "ts-jest", "testEnvironment": "node" }
 *   4. Add test script to package.json:  "test": "jest"
 *   5. Run:  npm test
 *
 *   Alternatively, use Vitest (already compatible with Next.js):
 *        npm install --save-dev vitest
 *        npx vitest run src/lib/data.test.ts
 *
 * NOTE: No mocks are required. All functions operate on in-file static arrays.
 */

import {
  getCpdStatus,
  getCpdCategoryBreakdown,
  getWeeklyPicks,
  searchModules,
  getOrgCpdCompliance,
  getMorningBriefing,
  getAdvisorStats,
  advisors,
  modules,
  seedReferrals,
} from "./data";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sum credits for a list of module ids. */
function creditsForIds(ids: string[]): number {
  return modules.filter((m) => ids.includes(m.id)).reduce((s, m) => s + m.credits, 0);
}

/** All module ids completed by adv-1 in static seed data. */
const ADV1_STATIC_COMPLETED = modules
  .filter((m) => m.completedByAdvisor.includes("adv-1"))
  .map((m) => m.id);

// adv-1 static seed: mod-7, mod-8, mod-13, mod-14, mod-15 → 3+1+2+1+1 = 8 credits
// adv-1 cpdEarned in seed = 18 (static field, not derived from modules)
// When completedIds is passed, earned = sum of those module credits.

// ---------------------------------------------------------------------------
// getCpdStatus
// ---------------------------------------------------------------------------

describe("getCpdStatus", () => {
  test("returns correct advisor object", () => {
    const result = getCpdStatus("adv-1");
    expect(result.advisor.id).toBe("adv-1");
  });

  test("without completedIds uses advisor.cpdEarned from seed", () => {
    const advisor = advisors.find((a) => a.id === "adv-1")!;
    const result = getCpdStatus("adv-1");
    expect(result.earned).toBe(advisor.cpdEarned); // 18
  });

  test("with empty completedIds earns 0 credits", () => {
    const result = getCpdStatus("adv-1", []);
    expect(result.earned).toBe(0);
  });

  test("with empty completedIds remaining equals cpdRequired", () => {
    const advisor = advisors.find((a) => a.id === "adv-1")!;
    const result = getCpdStatus("adv-1", []);
    expect(result.remaining).toBe(advisor.cpdRequired); // 20
  });

  test("with empty completedIds pct is 0", () => {
    const result = getCpdStatus("adv-1", []);
    expect(result.pct).toBe(0);
  });

  test("with completedIds credits are summed from those modules", () => {
    // mod-7 = 3 credits, mod-13 = 2 credits → 5 total
    const result = getCpdStatus("adv-1", ["mod-7", "mod-13"]);
    expect(result.earned).toBe(5);
  });

  test("earned and remaining are complementary and sum to cpdRequired when not overflowing", () => {
    const advisor = advisors.find((a) => a.id === "adv-1")!;
    const result = getCpdStatus("adv-1", ["mod-7", "mod-13"]); // 5 earned
    expect(result.remaining).toBe(advisor.cpdRequired - 5); // 15
  });

  test("remaining is 0 when enough completedIds to meet requirement", () => {
    // Build a set of ids whose credits sum to >= 20
    const enough: string[] = [];
    let total = 0;
    for (const mod of modules) {
      enough.push(mod.id);
      total += mod.credits;
      if (total >= 20) break;
    }
    const result = getCpdStatus("adv-1", enough);
    expect(result.remaining).toBe(0);
  });

  test("pct is capped at 100 when credits exceed requirement", () => {
    // Pass all module ids → credits >> 20
    const allIds = modules.map((m) => m.id);
    const result = getCpdStatus("adv-1", allIds);
    expect(result.pct).toBe(100);
  });

  test("recommendedModule is defined when there are incomplete modules", () => {
    const result = getCpdStatus("adv-1", []);
    expect(result.recommendedModule).toBeDefined();
  });

  test("recommendedModule is not in completedIds", () => {
    const completed = ["mod-1", "mod-7", "mod-8", "mod-13", "mod-14", "mod-15"];
    const result = getCpdStatus("adv-1", completed);
    if (result.recommendedModule) {
      expect(completed).not.toContain(result.recommendedModule.id);
    }
  });

  test("recommendedModule is undefined when all modules are completed", () => {
    const allIds = modules.map((m) => m.id);
    const result = getCpdStatus("adv-1", allIds);
    // No module is both uncompleted and matching — should be undefined
    expect(result.recommendedModule).toBeUndefined();
  });

  test("daysToDeadline is a finite number", () => {
    const result = getCpdStatus("adv-1");
    expect(Number.isFinite(result.daysToDeadline)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getCpdCategoryBreakdown
// ---------------------------------------------------------------------------

describe("getCpdCategoryBreakdown", () => {
  test("returns an array", () => {
    const result = getCpdCategoryBreakdown("adv-1");
    expect(Array.isArray(result)).toBe(true);
  });

  test("each entry has required fields", () => {
    const result = getCpdCategoryBreakdown("adv-1");
    for (const row of result) {
      expect(row).toHaveProperty("topic");
      expect(row).toHaveProperty("totalCredits");
      expect(row).toHaveProperty("earnedCredits");
      expect(row).toHaveProperty("pct");
      expect(row).toHaveProperty("moduleCount");
      expect(row).toHaveProperty("completedCount");
    }
  });

  test("with empty completedIds earnedCredits is 0 for all topics", () => {
    const result = getCpdCategoryBreakdown("adv-1", []);
    for (const row of result) {
      expect(row.earnedCredits).toBe(0);
    }
  });

  test("with completedIds only those modules count as earned", () => {
    // mod-11 is Retirement · 2 credits
    const result = getCpdCategoryBreakdown("adv-1", ["mod-11"]);
    const retirement = result.find((r) => r.topic === "Retirement");
    expect(retirement).toBeDefined();
    expect(retirement!.earnedCredits).toBe(2);
  });

  test("pct is 0 when earnedCredits is 0", () => {
    const result = getCpdCategoryBreakdown("adv-1", []);
    for (const row of result) {
      expect(row.pct).toBe(0);
    }
  });

  test("pct is 100 for a topic when all modules in it are completed", () => {
    // Practice topic has only mod-15 (1 credit)
    const result = getCpdCategoryBreakdown("adv-1", ["mod-15"]);
    const practice = result.find((r) => r.topic === "Practice");
    expect(practice).toBeDefined();
    expect(practice!.pct).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// getWeeklyPicks
// ---------------------------------------------------------------------------

describe("getWeeklyPicks", () => {
  test("returns at most 3 picks", () => {
    const picks = getWeeklyPicks("adv-1");
    expect(picks.length).toBeLessThanOrEqual(3);
  });

  test("each pick has module and reason", () => {
    const picks = getWeeklyPicks("adv-1");
    for (const pick of picks) {
      expect(pick).toHaveProperty("module");
      expect(pick).toHaveProperty("reason");
      expect(typeof pick.reason).toBe("string");
    }
  });

  test("with all modules completed returns no picks", () => {
    const allIds = modules.map((m) => m.id);
    const picks = getWeeklyPicks("adv-1", allIds);
    expect(picks.length).toBe(0);
  });

  test("completed modules do not appear in picks", () => {
    const allIds = modules.map((m) => m.id);
    // Remove one module to leave exactly one candidate
    const oneLeft = allIds.filter((id) => id !== "mod-10");
    const picks = getWeeklyPicks("adv-1", oneLeft);
    // mod-10 is Business Succession; check if adv-1 has such clients
    const pickedIds = picks.map((p) => p.module.id);
    for (const id of oneLeft) {
      expect(pickedIds).not.toContain(id);
    }
  });
});

// ---------------------------------------------------------------------------
// searchModules
// ---------------------------------------------------------------------------

describe("searchModules", () => {
  test("empty query returns empty array", () => {
    expect(searchModules("", "adv-1")).toEqual([]);
  });

  test("whitespace-only query returns empty array", () => {
    expect(searchModules("   ", "adv-1")).toEqual([]);
  });

  test("stop-word-only query returns empty array (BUG regression)", () => {
    // "the" is a STOP_WORD — after filtering, tokens is empty → must return []
    expect(searchModules("the", "adv-1")).toEqual([]);
    expect(searchModules("for the and", "adv-1")).toEqual([]);
  });

  test("query matching a module title returns that module with score > 0", () => {
    const results = searchModules("trust probate", "adv-1");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThan(0);
    // mod-1 title contains "Trust" and "Probate"
    const titles = results.map((r) => r.module.title);
    expect(titles.some((t) => t.toLowerCase().includes("trust"))).toBe(true);
  });

  test("topic match scores higher weight than title match alone", () => {
    // "estate" appears in mod-1 title AND topic "Estate & Trust" → score includes +3 for topic
    const results = searchModules("estate", "adv-1");
    const estateTopicModule = results.find((r) =>
      r.module.topic.toLowerCase().includes("estate"),
    );
    expect(estateTopicModule).toBeDefined();
  });

  test("returns at most 3 results", () => {
    const results = searchModules("planning", "adv-1");
    expect(results.length).toBeLessThanOrEqual(3);
  });

  test("results have required fields", () => {
    const results = searchModules("retirement", "adv-1");
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r).toHaveProperty("module");
      expect(r).toHaveProperty("score");
      expect(r).toHaveProperty("reason");
      expect(r).toHaveProperty("completed");
    }
  });

  test("with completedIds excludes completed modules from results", () => {
    // Complete all Retirement modules
    const retirementIds = modules
      .filter((m) => m.topic === "Retirement")
      .map((m) => m.id); // mod-11, mod-12

    const results = searchModules("retirement", "adv-1", retirementIds);
    const returnedIds = results.map((r) => r.module.id);
    for (const id of retirementIds) {
      expect(returnedIds).not.toContain(id);
    }
  });

  test("without completedIds includes modules already in static seed data for that advisor", () => {
    // adv-2 has completed mod-7 in static data; searching "portfolio" should NOT return mod-7 for adv-2
    // (because score += 2 for !completed is factored in, but the module isn't filtered out entirely)
    // Actually the function does NOT filter out completed modules; it marks them as completed=true.
    // Let's verify the completed flag is set correctly.
    const results = searchModules("portfolio construction", "adv-2");
    const mod7Result = results.find((r) => r.module.id === "mod-7");
    if (mod7Result) {
      expect(mod7Result.completed).toBe(true);
    }
  });

  test("with completedIds, completed flag reflects the passed ids", () => {
    const results = searchModules("ethics compliance", "adv-1", ["mod-13"]);
    const mod13 = results.find((r) => r.module.id === "mod-13");
    // mod-13 scores well for "ethics compliance" — if returned, it should show completed=true
    // but since score += 2 for incomplete (not present) and the module IS complete,
    // it may or may not appear; if it does, completed must be true
    if (mod13) {
      expect(mod13.completed).toBe(true);
    }
  });

  test("short tokens (2 chars or fewer) are ignored", () => {
    // "be" and "at" are 2 chars — not stop words but filtered by length >2
    const results = searchModules("be at", "adv-1");
    expect(results).toEqual([]);
  });

  test("results are sorted descending by score", () => {
    const results = searchModules("compliance ethics AML", "adv-1");
    if (results.length > 1) {
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// getOrgCpdCompliance  (BUG-6 regression)
// ---------------------------------------------------------------------------

describe("getOrgCpdCompliance", () => {
  test("returns an array with one entry per advisor", () => {
    const result = getOrgCpdCompliance();
    expect(result.length).toBe(advisors.length);
  });

  test("each entry has advisor, daysToDeadline, status fields", () => {
    const result = getOrgCpdCompliance();
    for (const row of result) {
      expect(row).toHaveProperty("advisor");
      expect(row).toHaveProperty("daysToDeadline");
      expect(row).toHaveProperty("status");
    }
  });

  test("status is one of the three valid values", () => {
    const result = getOrgCpdCompliance();
    const valid = new Set(["complete", "at_risk", "on_track"]);
    for (const row of result) {
      expect(valid.has(row.status)).toBe(true);
    }
  });

  test("without activeAdvisorId uses static cpdEarned for all advisors", () => {
    const result = getOrgCpdCompliance();
    for (const row of result) {
      const staticAdvisor = advisors.find((a) => a.id === row.advisor.id)!;
      expect(row.advisor.cpdEarned).toBe(staticAdvisor.cpdEarned);
    }
  });

  test("BUG-6: active advisor status updates when completedIds grows", () => {
    // adv-3 (Lim Wei Jie) has cpdEarned=14, cpdRequired=20 → not complete by default
    const baseResult = getOrgCpdCompliance("adv-3", []);
    const adv3Base = baseResult.find((r) => r.advisor.id === "adv-3")!;
    expect(adv3Base.advisor.cpdEarned).toBe(0); // completedIds=[] → 0 earned
    expect(adv3Base.status).not.toBe("complete");

    // Now pass completedIds that yield >= 20 credits
    const enough: string[] = [];
    let total = 0;
    for (const mod of modules) {
      enough.push(mod.id);
      total += mod.credits;
      if (total >= 20) break;
    }
    const updatedResult = getOrgCpdCompliance("adv-3", enough);
    const adv3Updated = updatedResult.find((r) => r.advisor.id === "adv-3")!;
    expect(adv3Updated.advisor.cpdEarned).toBeGreaterThanOrEqual(20);
    expect(adv3Updated.status).toBe("complete");
  });

  test("BUG-6: non-active advisors are unaffected by completedIds", () => {
    const enough = modules.map((m) => m.id); // all modules
    const result = getOrgCpdCompliance("adv-3", enough);

    // adv-1 (not active) should still use static cpdEarned=18
    const adv1Row = result.find((r) => r.advisor.id === "adv-1")!;
    expect(adv1Row.advisor.cpdEarned).toBe(
      advisors.find((a) => a.id === "adv-1")!.cpdEarned,
    );
  });

  test("advisor with cpdEarned >= cpdRequired in seed data has status complete", () => {
    // adv-2: cpdEarned=22, cpdRequired=20 → complete
    const result = getOrgCpdCompliance();
    const adv2 = result.find((r) => r.advisor.id === "adv-2")!;
    expect(adv2.status).toBe("complete");
  });

  test("daysToDeadline is a number (can be negative if deadline passed)", () => {
    const result = getOrgCpdCompliance();
    for (const row of result) {
      expect(typeof row.daysToDeadline).toBe("number");
    }
  });
});

// ---------------------------------------------------------------------------
// getMorningBriefing  (BUG-9 regression)
// ---------------------------------------------------------------------------

describe("getMorningBriefing", () => {
  test("returns object with expected keys", () => {
    const result = getMorningBriefing("adv-1", seedReferrals);
    expect(result).toHaveProperty("advisor");
    expect(result).toHaveProperty("meetings");
    expect(result).toHaveProperty("suggestions");
    expect(result).toHaveProperty("cpd");
    expect(result).toHaveProperty("briefingText");
    expect(result).toHaveProperty("stats");
  });

  test("briefingText is a non-empty string", () => {
    const result = getMorningBriefing("adv-1", seedReferrals);
    expect(typeof result.briefingText).toBe("string");
    expect(result.briefingText.length).toBeGreaterThan(0);
  });

  test("BUG-9: with empty completedIds, briefingText reflects 20 credits remaining", () => {
    // adv-1 cpdRequired=20, completedIds=[] → earned=0, remaining=20
    const result = getMorningBriefing("adv-1", seedReferrals, []);
    expect(result.cpd.remaining).toBe(20);
    expect(result.briefingText).toContain("20 CPD credits short");
  });

  test("BUG-9: with enough completedIds, remaining becomes 0 and briefingText reflects it", () => {
    const enough: string[] = [];
    let total = 0;
    for (const mod of modules) {
      enough.push(mod.id);
      total += mod.credits;
      if (total >= 20) break;
    }
    const result = getMorningBriefing("adv-1", seedReferrals, enough);
    expect(result.cpd.remaining).toBe(0);
    expect(result.briefingText).toContain("0 CPD credits short");
  });

  test("BUG-9: CPD credits in briefing reflect passed completedIds not static advisor field", () => {
    // adv-1 static cpdEarned=18 (remaining=2). Passing completedIds=[] gives remaining=20.
    const defaultResult = getMorningBriefing("adv-1", seedReferrals);
    const overrideResult = getMorningBriefing("adv-1", seedReferrals, []);
    // They should differ because one uses static (18 earned) vs live (0 earned)
    expect(defaultResult.cpd.remaining).not.toBe(overrideResult.cpd.remaining);
    expect(defaultResult.cpd.earned).toBe(18);
    expect(overrideResult.cpd.earned).toBe(0);
  });

  test("briefingText includes advisor first name", () => {
    const result = getMorningBriefing("adv-1", seedReferrals);
    expect(result.briefingText).toContain("Marcus");
  });

  test("meetings array is filtered to this advisor only", () => {
    const result = getMorningBriefing("adv-1", seedReferrals);
    for (const meeting of result.meetings) {
      expect(meeting.advisorId).toBe("adv-1");
    }
  });
});

// ---------------------------------------------------------------------------
// getAdvisorStats  (BUG-9 regression)
// ---------------------------------------------------------------------------

describe("getAdvisorStats", () => {
  test("returns object with activeClients, openReferrals, cpd", () => {
    const result = getAdvisorStats("adv-1", seedReferrals);
    expect(result).toHaveProperty("activeClients");
    expect(result).toHaveProperty("openReferrals");
    expect(result).toHaveProperty("cpd");
  });

  test("activeClients count excludes dormant clients", () => {
    // adv-1 has cli-7 (Hafiz, dormant) — should not count
    const result = getAdvisorStats("adv-1", seedReferrals);
    expect(result.activeClients).toBeGreaterThan(0);
    // adv-1 has 8 clients total, 1 dormant → 7 active
    expect(result.activeClients).toBe(7);
  });

  test("openReferrals counts introduced + in_progress + suggested", () => {
    const result = getAdvisorStats("adv-1", seedReferrals);
    const adv1Referrals = seedReferrals.filter((r) => r.advisorId === "adv-1");
    const expectedOpen = adv1Referrals.filter(
      (r) => r.status === "introduced" || r.status === "in_progress" || r.status === "suggested",
    ).length;
    expect(result.openReferrals).toBe(expectedOpen);
  });

  test("BUG-9: cpd.earned reflects passed completedIds, not static advisor field", () => {
    // adv-1 static cpdEarned=18
    const staticResult = getAdvisorStats("adv-1", seedReferrals);
    expect(staticResult.cpd.earned).toBe(18); // no completedIds → uses advisor.cpdEarned

    // mod-7 = 3 credits, mod-13 = 2 credits → 5 earned
    const liveResult = getAdvisorStats("adv-1", seedReferrals, ["mod-7", "mod-13"]);
    expect(liveResult.cpd.earned).toBe(5);
  });

  test("BUG-9: cpd.remaining decreases when completedIds grows", () => {
    const before = getAdvisorStats("adv-1", seedReferrals, []);
    const after = getAdvisorStats("adv-1", seedReferrals, ["mod-7", "mod-13"]); // +5 credits
    expect(before.cpd.remaining).toBeGreaterThan(after.cpd.remaining);
    expect(before.cpd.remaining - after.cpd.remaining).toBe(5);
  });

  test("BUG-9: cpd.pct is 100 when completedIds satisfy all credits", () => {
    const allIds = modules.map((m) => m.id);
    const result = getAdvisorStats("adv-1", seedReferrals, allIds);
    expect(result.cpd.pct).toBe(100);
    expect(result.cpd.remaining).toBe(0);
  });

  test("openReferrals does not include closed or declined referrals", () => {
    const result = getAdvisorStats("adv-1", seedReferrals);
    const adv1Referrals = seedReferrals.filter((r) => r.advisorId === "adv-1");
    const closedAndDeclined = adv1Referrals.filter(
      (r) => r.status === "closed" || r.status === "declined",
    ).length;
    // openReferrals + closedAndDeclined should equal total adv-1 referrals
    expect(result.openReferrals + closedAndDeclined).toBe(adv1Referrals.length);
  });
});

// ---------------------------------------------------------------------------
// completeModule deduplication logic  (BUG-2 regression — pure logic only)
// The store uses React hooks so we test the pure logic inline here.
// ---------------------------------------------------------------------------

describe("completeModule deduplication logic (BUG-2 regression)", () => {
  /**
   * Simulates the pure state-transition logic extracted from completeModule:
   *   if (prev.includes(moduleId)) return prev;   ← BUG-2 fix
   *   return [...prev, moduleId];
   */
  function simulateCompleteModule(
    completedIds: string[],
    moduleId: string,
  ): { nextIds: string[]; isNew: boolean } {
    if (completedIds.includes(moduleId)) {
      return { nextIds: completedIds, isNew: false };
    }
    return { nextIds: [...completedIds, moduleId], isNew: true };
  }

  test("completing a new module adds it to completedIds", () => {
    const { nextIds, isNew } = simulateCompleteModule([], "mod-1");
    expect(nextIds).toContain("mod-1");
    expect(isNew).toBe(true);
  });

  test("completing an already-completed module does not duplicate it", () => {
    const { nextIds, isNew } = simulateCompleteModule(["mod-1"], "mod-1");
    const occurrences = nextIds.filter((id) => id === "mod-1").length;
    expect(occurrences).toBe(1);
    expect(isNew).toBe(false);
  });

  test("calling completeModule twice returns isNew=false on second call", () => {
    let ids: string[] = [];
    const first = simulateCompleteModule(ids, "mod-7");
    ids = first.nextIds;
    const second = simulateCompleteModule(ids, "mod-7");

    expect(first.isNew).toBe(true);
    expect(second.isNew).toBe(false);
  });

  test("toast fires once: isNew is true exactly once across two identical calls", () => {
    let ids: string[] = [];
    let toastCount = 0;

    const r1 = simulateCompleteModule(ids, "mod-5");
    ids = r1.nextIds;
    if (r1.isNew) toastCount++;

    const r2 = simulateCompleteModule(ids, "mod-5");
    ids = r2.nextIds;
    if (r2.isNew) toastCount++;

    expect(toastCount).toBe(1); // BUG-2: previously would be 2
  });

  test("completedIds length increments by 1 on first call only", () => {
    let ids: string[] = [];
    const r1 = simulateCompleteModule(ids, "mod-3");
    ids = r1.nextIds;
    const r2 = simulateCompleteModule(ids, "mod-3");
    ids = r2.nextIds;

    expect(ids.length).toBe(1); // not 2
  });

  test("completing different modules increments completedIds correctly", () => {
    let ids: string[] = [];
    const r1 = simulateCompleteModule(ids, "mod-1");
    ids = r1.nextIds;
    const r2 = simulateCompleteModule(ids, "mod-2");
    ids = r2.nextIds;

    expect(ids).toContain("mod-1");
    expect(ids).toContain("mod-2");
    expect(ids.length).toBe(2);
  });
});
