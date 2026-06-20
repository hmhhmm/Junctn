"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, CheckCircle2, ListChecks,
  FileText, Award, Clock, AlertTriangle,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { modules, getModule } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { MODULE_CONTENT, FALLBACK_SECTIONS, TOPIC_TOKEN } from "@/lib/cpd-content";

const STORAGE_KEY = (id: string) => `cpd-progress-${id}`;

export default function CoursePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { completedModuleIds, completeModule } = useStore();

  const mod = getModule(params.id) ?? modules.find((m) => m.id === params.id) ?? null;

  const content = mod ? MODULE_CONTENT[mod.id] : null;
  const sections = content?.sections ?? (mod ? (FALLBACK_SECTIONS[mod.id] ?? []).map((s) => ({
    title: s.title,
    body: ["Full lesson content coming soon. This section covers key concepts and practical application for financial advisers in Singapore."],
  })) : []);
  const quiz = content?.quiz ?? [];
  const totalSteps = sections.length + (quiz.length > 0 ? 1 : 0);

  const [currentSection, setCurrentSection] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  // Restore saved progress from localStorage
  useEffect(() => {
    if (!mod) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY(mod.id));
      if (saved) {
        const { section, inQuiz } = JSON.parse(saved) as { section: number; inQuiz: boolean };
        setCurrentSection(section);
        setShowQuiz(inQuiz);
      }
    } catch { /* ignore */ }
  }, [mod]);

  // Persist progress to localStorage on change
  useEffect(() => {
    if (!mod) return;
    try {
      localStorage.setItem(STORAGE_KEY(mod.id), JSON.stringify({ section: currentSection, inQuiz: showQuiz }));
    } catch { /* ignore */ }
  }, [mod, currentSection, showQuiz]);

  // Esc key — navigate back (with confirm if mid-module)
  const handleBack = useCallback(() => {
    const hasProgress = currentSection > 0 || showQuiz || Object.keys(answers).length > 0;
    if (hasProgress && !submitted) {
      const ok = window.confirm("Leave this module? Your progress will be saved and you can resume later.");
      if (!ok) return;
    }
    router.back();
  }, [currentSection, showQuiz, answers, submitted, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleBack]);

  if (!mod) {
    return (
      <div className="flex h-full items-center justify-center text-ink-faint">
        <div className="text-center">
          <p className="text-[15px] font-semibold text-ink">Module not found</p>
          <button onClick={() => router.push("/advisor/cpd")} className="mt-3 text-[13px] text-accent-ink underline">
            Back to CPD
          </button>
        </div>
      </div>
    );
  }

  const isDone = completedModuleIds.includes(mod.id);
  const tc = TOPIC_TOKEN[mod.topic] ?? { bg: "var(--surface-raised)", color: "var(--ink-soft)" };
  const progressPct = ((showQuiz ? sections.length : currentSection) / totalSteps) * 100;

  function score() {
    return quiz.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0);
  }

  function handleComplete() {
    if (!mod) return;
    completeModule(mod.id);
    try { localStorage.removeItem(STORAGE_KEY(mod.id)); } catch { /* ignore */ }
    router.push("/advisor/cpd");
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <button
          onClick={handleBack}
          aria-label="Back to CPD overview"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-raised hover:text-ink"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          CPD
        </button>

        <div className="h-4 w-px bg-line" aria-hidden="true" />

        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span
            className="hidden shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold sm:inline"
            style={{ background: tc.bg, color: tc.color }}
          >
            {mod.topic}
          </span>
          <h1 className="truncate text-[14px] font-semibold text-ink">{mod.title}</h1>
          {mod.required && (
            <span className="hidden shrink-0 rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-semibold text-warn sm:inline">
              Required
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 text-[12px] text-ink-faint">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {mod.durationMin} min
          </span>
          <span>+{mod.credits} cr</span>
        </div>
      </div>

      {/* ── Progress bar ───────────────────────────────────────────────────── */}
      <div className="h-0.5 shrink-0 bg-line" role="progressbar" aria-valuenow={Math.round(progressPct)} aria-valuemin={0} aria-valuemax={100} aria-label="Module progress">
        <div
          className="h-full transition-[width] duration-500"
          style={{ width: `${progressPct}%`, background: "var(--accent-ink)" }}
        />
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar nav */}
        <nav
          aria-label="Module sections"
          className="hidden w-[200px] shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-line p-3 md:flex"
        >
          {sections.map((s, i) => {
            const active = !showQuiz && currentSection === i;
            return (
              <button
                key={i}
                onClick={() => { setCurrentSection(i); setShowQuiz(false); }}
                aria-current={active ? "step" : undefined}
                className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors"
                style={active
                  ? { background: "var(--accent-soft)", color: "var(--ink)" }
                  : { color: "var(--ink-faint)" }}
              >
                <span
                  className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                  style={active
                    ? { background: "var(--accent-ink)", color: "#fff" }
                    : { background: "var(--surface-raised)", color: "inherit" }}
                >
                  {i + 1}
                </span>
                <span className="text-[11px] font-medium leading-snug">{s.title}</span>
              </button>
            );
          })}
          {quiz.length > 0 && (
            <button
              onClick={() => setShowQuiz(true)}
              aria-current={showQuiz ? "step" : undefined}
              className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors"
              style={showQuiz
                ? { background: "var(--accent-soft)", color: "var(--ink)" }
                : { color: "var(--ink-faint)" }}
            >
              <span
                className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full"
                style={showQuiz
                  ? { background: "var(--accent-ink)" }
                  : { background: "var(--surface-raised)" }}
              >
                <ListChecks className="size-2.5" style={{ color: showQuiz ? "#fff" : "inherit" }} aria-hidden="true" />
              </span>
              <span className="text-[11px] font-medium leading-snug">Knowledge check</span>
            </button>
          )}
        </nav>

        {/* Content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-10">

            {!showQuiz ? (
              <article aria-label={`Section ${currentSection + 1}: ${sections[currentSection]?.title}`}>
                <p className="mb-3 text-[12px] text-ink-faint">
                  Section {currentSection + 1} of {sections.length}
                </p>
                <h2 className="mb-5 font-display text-[22px] font-bold leading-tight text-ink">
                  {sections[currentSection]?.title}
                </h2>
                <div className="flex flex-col gap-4">
                  {sections[currentSection]?.body.map((para, i) => (
                    <p key={i} className="max-w-[65ch] text-[14px] leading-relaxed text-ink-soft">{para}</p>
                  ))}
                </div>
              </article>
            ) : (
              <div>
                <p className="mb-3 text-[12px] text-ink-faint">Knowledge check</p>
                <h2 className="mb-6 font-display text-[20px] font-bold text-ink">Test your understanding</h2>

                {submitted ? (
                  <div className="flex flex-col items-center gap-5 py-4 text-center">
                    <div
                      className="flex size-16 items-center justify-center rounded-full"
                      style={{ background: score() === quiz.length ? "var(--ok-soft)" : "var(--warn-soft)" }}
                    >
                      <Award
                        className="size-8"
                        style={{ color: score() === quiz.length ? "var(--ok)" : "var(--warn)" }}
                        aria-hidden="true"
                      />
                    </div>
                    <p className="font-display text-[24px] font-bold text-ink">{score()} / {quiz.length}</p>
                    <p className="text-[13px] text-ink-faint">
                      {score() === quiz.length
                        ? "Perfect score — excellent work!"
                        : score() >= quiz.length * 0.67
                        ? "Good result — review the questions you missed."
                        : "Revisit the module content and try again."}
                    </p>

                    <div className="flex w-full max-w-[540px] flex-col gap-3 text-left">
                      {quiz.map((q, qi) => {
                        const correct = answers[qi] === q.answer;
                        return (
                          <div
                            key={qi}
                            className="rounded-xl border p-4"
                            style={{
                              borderColor: correct ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)",
                              background: correct ? "var(--ok-soft)" : "var(--alert-soft)",
                            }}
                          >
                            <p className="mb-2 text-[13px] font-semibold text-ink">{q.q}</p>
                            <p className="text-[12px]" style={{ color: correct ? "var(--ok)" : "var(--alert)" }}>
                              Your answer: {q.options[answers[qi] ?? -1] ?? "–"}
                            </p>
                            {!correct && (
                              <p className="text-[12px] text-ok">Correct: {q.options[q.answer]}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {isDone ? (
                      <button
                        onClick={() => router.push("/advisor/cpd")}
                        className="mt-2 flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-raised"
                      >
                        <ChevronLeft className="size-4" aria-hidden="true" />
                        Back to CPD
                      </button>
                    ) : (
                      <Button
                        className="mt-2 px-6"
                        style={{ background: "var(--accent-ink)", color: "#fff" }}
                        onClick={handleComplete}
                      >
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                        Mark complete — earn {mod.credits} credits
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {quiz.map((q, qi) => (
                      <div key={qi}>
                        <p className="mb-3 text-[14px] font-semibold text-ink">{qi + 1}. {q.q}</p>
                        <div className="flex flex-col gap-2">
                          {q.options.map((opt, oi) => {
                            const selected = answers[qi] === oi;
                            return (
                              <button
                                key={oi}
                                onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                                className="flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-[13px] transition-colors"
                                style={selected
                                  ? { borderColor: "var(--accent-ink)", background: "var(--accent-soft)", color: "var(--ink)" }
                                  : { borderColor: "var(--line)", color: "var(--ink-soft)" }}
                              >
                                <span
                                  className="flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px]"
                                  style={selected
                                    ? { borderColor: "var(--accent-ink)", background: "var(--accent-ink)", color: "#fff" }
                                    : { borderColor: "var(--line)" }}
                                  aria-hidden="true"
                                >
                                  {selected ? "✓" : ""}
                                </span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <Button
                      style={{ background: "var(--accent-ink)", color: "#fff" }}
                      disabled={Object.keys(answers).length < quiz.length}
                      onClick={() => setSubmitted(true)}
                      className="mt-1"
                    >
                      Submit answers
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer nav */}
          {!showQuiz && (
            <div className="flex shrink-0 items-center justify-between border-t border-line px-6 py-4">
              <button
                onClick={() => {
                  if (currentSection > 0) setCurrentSection((n) => n - 1);
                }}
                disabled={currentSection === 0}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-raised hover:text-ink disabled:opacity-30"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Previous
              </button>

              {isDone && (
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-ok">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Completed
                </div>
              )}

              {!isDone && currentSection < sections.length - 1 ? (
                <button
                  onClick={() => setCurrentSection((n) => n + 1)}
                  className="flex items-center gap-1.5 rounded-lg bg-surface-raised px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-surface-hover"
                >
                  Next
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              ) : !isDone && quiz.length > 0 ? (
                <button
                  onClick={() => setShowQuiz(true)}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: "var(--accent-ink)" }}
                >
                  Knowledge check
                  <ListChecks className="size-4" aria-hidden="true" />
                </button>
              ) : !isDone ? (
                <Button
                  style={{ background: "var(--accent-ink)", color: "#fff" }}
                  onClick={handleComplete}
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Mark complete
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Urgent deadline warning */}
      {mod.required && !isDone && (
        <div
          className="flex shrink-0 items-center gap-2 border-t border-warn/20 px-5 py-2.5 text-[12px] font-medium"
          style={{ background: "var(--warn-soft)", color: "var(--warn)" }}
        >
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
          Required module — must be completed before your CPD deadline.
        </div>
      )}
    </div>
  );
}
