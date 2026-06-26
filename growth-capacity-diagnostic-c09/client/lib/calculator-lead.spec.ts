import { describe, expect, it } from "vitest";
import { CALC_PAYLOAD_COOKIE_NAME } from "@shared/api";
import { buildCalculatorPayload, getEnrollmentUrl } from "./calculator-lead";

describe("calc_payload cookie name", () => {
  it("is calc_payload", () => {
    expect(CALC_PAYLOAD_COOKIE_NAME).toBe("calc_payload");
  });
});

describe("buildCalculatorPayload", () => {
  it("rounds dollar fields and maps inputs", () => {
    const payload = buildCalculatorPayload(
      {
        hygieneChairs: 2,
        patientsPerChairPerDay: 8,
        shiftsUnworkedPerMonth: 2,
        weeksOut: 14,
      },
      {
        totalOpportunityCore: 117000.4,
        protectedRevenue: 72000.6,
        newPatientRevenueLost: 18000.2,
        recurringLeftOnTable: 27000.8,
      },
    );

    expect(payload.utm_source).toBe("calculator");
    expect(payload.inputs.hygiene_chairs).toBe(2);
    expect(payload.opportunity.total).toBe(117000);
    expect(payload.opportunity.production_protected).toBe(72001);
  });
});

describe("getEnrollmentUrl", () => {
  it("includes only utm_source=calculator", () => {
    const url = new URL(getEnrollmentUrl());
    expect(url.searchParams.get("utm_source")).toBe("calculator");
    expect(url.pathname).toContain("/enrollment/office");
    expect(url.searchParams.has("hc")).toBe(false);
    expect(url.searchParams.has("opp")).toBe(false);
  });
});
