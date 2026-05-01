import { describe, expect, it, vi } from "vitest";

import { normalizeGlobalScoreEntry, todayISODate } from "../services/firebase";

describe("firebase service helpers", () => {
  it("formats ISO dates for leaderboard payloads", () => {
    expect(todayISODate(new Date("2026-05-01T10:15:00.000Z"))).toBe("2026-05-01");
  });

  it("normalizes global score entries before writing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T00:00:00.000Z"));

    expect(normalizeGlobalScoreEntry({
      score: 1000000.8,
      initials: "Bad<Name>!!!",
      date: "not-a-date",
      mode: "evolve",
      badge: "legend_badge<script>",
    })).toEqual({
      score: 99999,
      initials: "BadName",
      date: "2026-05-01",
      mode: "evolve",
      badge: "legend_badgescript",
    });

    vi.useRealTimers();
  });
});
