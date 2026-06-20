/**
 * Unit tests — BriefingBand component
 * (src/components/advisor/BriefingBand.tsx)
 *
 * Focuses on:
 *   - Section marker parsing ([CALENDAR], [FOLLOWUPS], [LD])
 *   - Correct colour-coded border classes per section
 *   - Skeleton loading state
 *   - Error state
 *   - Streaming cursor visibility
 *   - Draft follow-up button appearance
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BriefingBand } from "../../../frontend/src/components/advisor/BriefingBand";

// Mock fetch for draftFollowup API call
global.fetch = jest.fn();

const FULL_BRIEFING = `[CALENDAR]
• 09:30 — Lawrence Goh — portfolio & trust review (In person)
• 11:00 — Serena Koh — pre-retirement check-in (Video)
[FOLLOWUPS]
• Serena Koh — asked about SRS top-up. Urgency: medium.
[LD]
Complete Module 14 (Trust Structures) — 3 clients discussed trust needs.`;

describe("BriefingBand — skeleton state", () => {
  it("shows skeleton when no content and not streaming", () => {
    render(
      <BriefingBand tokens="" isStreaming={false} error={null} />
    );
    // Skeleton divs have animate-pulse class
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("uses fallback text when tokens is empty", () => {
    render(
      <BriefingBand
        tokens=""
        isStreaming={false}
        error={null}
        fallbackText={FULL_BRIEFING}
      />
    );
    expect(screen.getByText(/Lawrence Goh/)).toBeInTheDocument();
  });
});

describe("BriefingBand — error state", () => {
  it("renders error message when error prop is set", () => {
    render(
      <BriefingBand
        tokens=""
        isStreaming={false}
        error="Briefing unavailable — please refresh"
      />
    );
    expect(screen.getByText(/Briefing unavailable/)).toBeInTheDocument();
  });

  it("does not show skeleton when error is present", () => {
    render(
      <BriefingBand tokens="" isStreaming={false} error="Something went wrong" />
    );
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(0);
  });
});

describe("BriefingBand — section parsing", () => {
  it("renders CALENDAR section label", () => {
    render(<BriefingBand tokens={FULL_BRIEFING} isStreaming={false} error={null} />);
    expect(screen.getByText("Today's Calendar")).toBeInTheDocument();
  });

  it("renders FOLLOWUPS section label", () => {
    render(<BriefingBand tokens={FULL_BRIEFING} isStreaming={false} error={null} />);
    expect(screen.getByText("Follow-ups")).toBeInTheDocument();
  });

  it("renders LD section label", () => {
    render(<BriefingBand tokens={FULL_BRIEFING} isStreaming={false} error={null} />);
    expect(screen.getByText("Learning & Development")).toBeInTheDocument();
  });

  it("renders CALENDAR content", () => {
    render(<BriefingBand tokens={FULL_BRIEFING} isStreaming={false} error={null} />);
    expect(screen.getByText(/Lawrence Goh/)).toBeInTheDocument();
  });

  it("renders FOLLOWUPS content", () => {
    render(<BriefingBand tokens={FULL_BRIEFING} isStreaming={false} error={null} />);
    expect(screen.getByText(/Serena Koh/)).toBeInTheDocument();
  });

  it("renders LD content", () => {
    render(<BriefingBand tokens={FULL_BRIEFING} isStreaming={false} error={null} />);
    expect(screen.getByText(/Module 14/)).toBeInTheDocument();
  });

  it("applies teal border class to CALENDAR section", () => {
    render(<BriefingBand tokens={FULL_BRIEFING} isStreaming={false} error={null} />);
    const calSection = document.querySelector(".border-teal-500");
    expect(calSection).toBeInTheDocument();
  });

  it("applies amber border class to FOLLOWUPS section", () => {
    render(<BriefingBand tokens={FULL_BRIEFING} isStreaming={false} error={null} />);
    const followSection = document.querySelector(".border-amber-500");
    expect(followSection).toBeInTheDocument();
  });

  it("applies purple border class to LD section", () => {
    render(<BriefingBand tokens={FULL_BRIEFING} isStreaming={false} error={null} />);
    const ldSection = document.querySelector(".border-purple-500");
    expect(ldSection).toBeInTheDocument();
  });

  it("handles briefing with only CALENDAR section", () => {
    render(
      <BriefingBand
        tokens="[CALENDAR]\n• 09:30 — Test meeting"
        isStreaming={false}
        error={null}
      />
    );
    expect(screen.getByText("Today's Calendar")).toBeInTheDocument();
    expect(screen.queryByText("Follow-ups")).not.toBeInTheDocument();
  });
});

describe("BriefingBand — streaming state", () => {
  it("shows streaming pulse indicator when isStreaming=true and has content", () => {
    render(
      <BriefingBand tokens={FULL_BRIEFING} isStreaming={true} error={null} />
    );
    // Streaming cursor is an animate-pulse span inside the content area
    const cursors = document.querySelectorAll(".animate-pulse");
    expect(cursors.length).toBeGreaterThan(0);
  });

  it("does not show streaming cursor when isDone (isStreaming=false)", () => {
    const { container } = render(
      <BriefingBand tokens={FULL_BRIEFING} isStreaming={false} error={null} />
    );
    // No animate-pulse elements in the content area
    const pulsers = container.querySelectorAll(".animate-pulse");
    expect(pulsers.length).toBe(0);
  });
});

describe("BriefingBand — draft follow-up button", () => {
  it("renders draft button for follow-up lines with a client name and token", () => {
    render(
      <BriefingBand
        tokens={FULL_BRIEFING}
        isStreaming={false}
        error={null}
        token="test-jwt-token"
      />
    );
    // The MessageSquare icon button should appear for FOLLOWUPS lines with a parsed name
    const draftButtons = document.querySelectorAll("button[title='Draft follow-up message']");
    expect(draftButtons.length).toBeGreaterThan(0);
  });

  it("does not render draft button when token prop is absent", () => {
    render(
      <BriefingBand tokens={FULL_BRIEFING} isStreaming={false} error={null} />
    );
    const draftButtons = document.querySelectorAll("button[title='Draft follow-up message']");
    expect(draftButtons.length).toBe(0);
  });
});
