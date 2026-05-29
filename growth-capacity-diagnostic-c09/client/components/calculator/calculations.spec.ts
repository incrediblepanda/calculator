import { describe, it, expect } from "vitest";
import {
  WEEKS_PER_MONTH,
  deriveTotalPatients,
  calcBacklogLoss,
  calcProtection,
  type CalculatorInputs,
} from "./calculations";

// Helper: build inputs whose backlog converts cleanly to a whole number of months.
function inputsForBacklogMonths(
  months: number,
  chairs = 2,
  patientsPerChairPerDay = 8,
): CalculatorInputs {
  return {
    chairs,
    patientsPerChairPerDay,
    missedShiftsPerMonth: 1,
    bookingWeeksOut: months * WEEKS_PER_MONTH,
  };
}

describe("deriveTotalPatients", () => {
  it("derives 2,000 patients from 2 chairs at 8 patients/day", () => {
    expect(deriveTotalPatients(2, 8)).toBe(2000);
  });
});

describe("calcBacklogLoss - perio (Devin's example)", () => {
  it("matches Devin's 4-month-backlog example (~$41,625; exact $41,666.67)", () => {
    const { perioLost } = calcBacklogLoss(inputsForBacklogMonths(4));
    expect(perioLost).toBeCloseTo(41666.67, 1);
  });

  it("returns 0 perio loss at or below the 3-month recall interval", () => {
    expect(calcBacklogLoss(inputsForBacklogMonths(3)).perioLost).toBe(0);
    expect(calcBacklogLoss(inputsForBacklogMonths(2)).perioLost).toBe(0);
  });
});

describe("calcBacklogLoss - prophy (Devin's example)", () => {
  it("matches Devin's 7-month-backlog example (~$50,100; exact $50,000)", () => {
    const { prophyLost } = calcBacklogLoss(inputsForBacklogMonths(7));
    expect(prophyLost).toBeCloseTo(50000, 1);
  });

  it("returns 0 prophy loss at or below the 6-month recall interval", () => {
    expect(calcBacklogLoss(inputsForBacklogMonths(6)).prophyLost).toBe(0);
    expect(calcBacklogLoss(inputsForBacklogMonths(5)).prophyLost).toBe(0);
  });
});

describe("calcBacklogLoss - weeks-to-months conversion", () => {
  it("converts 26 weeks to ~6 months of backlog", () => {
    const result = calcBacklogLoss({
      chairs: 2,
      patientsPerChairPerDay: 8,
      missedShiftsPerMonth: 1,
      bookingWeeksOut: 26,
    });
    expect(result.backlogMonths).toBeCloseTo(6.0, 1);
    // At ~6 months, prophy is only just crossing its 6-month threshold (near-zero),
    // while perio (3-month recall) is well past threshold and carries the loss.
    expect(result.prophyLost).toBeLessThan(500);
    expect(result.perioLost).toBeGreaterThan(0);
  });

  it("returns zero loss when patients are booked within both recall intervals", () => {
    const result = calcBacklogLoss({
      chairs: 2,
      patientsPerChairPerDay: 8,
      missedShiftsPerMonth: 1,
      bookingWeeksOut: 8, // ~1.85 months, inside both recall windows
    });
    expect(result.recoverableRevenue).toBe(0);
  });
});

describe("calcProtection", () => {
  it("computes annual leakage from missed shifts", () => {
    const result = calcProtection({
      chairs: 2,
      patientsPerChairPerDay: 8,
      missedShiftsPerMonth: 1,
      bookingWeeksOut: 26,
    });
    expect(result.annualLeakage).toBe(14400); // 1 × 12 × 1200
    expect(result.annualMissedVisits).toBe(96); // 1 × 12 × 8
  });
});
