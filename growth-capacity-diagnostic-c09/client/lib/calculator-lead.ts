import {
  CALC_PAYLOAD_COOKIE_NAME,
  CALCULATOR_COOKIE_DOMAIN,
  CALCULATOR_COOKIE_MAX_AGE_SECONDS,
  CALCULATOR_UTM_SOURCE,
  DEFAULT_ENROLLMENT_BASE_URL,
  type CalculatorHubSpotPayload,
} from "@shared/api";

export interface CalculatorInputs {
  hygieneChairs: number;
  patientsPerChairPerDay: number;
  shiftsUnworkedPerMonth: number;
  weeksOut: number;
}

export interface CalculatorOpportunityMetrics {
  totalOpportunityCore: number;
  protectedRevenue: number;
  newPatientRevenueLost: number;
  recurringLeftOnTable: number;
}

function enrollmentBaseUrl(): string {
  return import.meta.env.VITE_ENROLLMENT_BASE_URL ?? DEFAULT_ENROLLMENT_BASE_URL;
}

export function buildCalculatorPayload(
  inputs: CalculatorInputs,
  metrics: CalculatorOpportunityMetrics,
): CalculatorHubSpotPayload {
  return {
    utm_source: CALCULATOR_UTM_SOURCE,
    inputs: {
      hygiene_chairs: inputs.hygieneChairs,
      patients_per_chair_per_day: inputs.patientsPerChairPerDay,
      shifts_unworked_per_month: inputs.shiftsUnworkedPerMonth,
      weeks_out_booking: inputs.weeksOut,
    },
    opportunity: {
      total: Math.round(metrics.totalOpportunityCore),
      production_protected: Math.round(metrics.protectedRevenue),
      new_patients_lost: Math.round(metrics.newPatientRevenueLost),
      recurring_left_on_table: Math.round(metrics.recurringLeftOnTable),
    },
  };
}

export function getEnrollmentUrl(): string {
  const url = new URL(enrollmentBaseUrl());
  url.searchParams.set("utm_source", CALCULATOR_UTM_SOURCE);
  return url.toString();
}

export function setCalculatorCookie(payload: CalculatorHubSpotPayload): void {
  const value = encodeURIComponent(JSON.stringify(payload));
  const parts = [
    `${CALC_PAYLOAD_COOKIE_NAME}=${value}`,
    `Domain=${CALCULATOR_COOKIE_DOMAIN}`,
    "Path=/",
    `Max-Age=${CALCULATOR_COOKIE_MAX_AGE_SECONDS}`,
    "Secure",
    "SameSite=Lax",
  ];
  document.cookie = parts.join("; ");
}

export function navigateToEnrollment(
  inputs: CalculatorInputs,
  metrics: CalculatorOpportunityMetrics,
): void {
  const payload = buildCalculatorPayload(inputs, metrics);
  setCalculatorCookie(payload);
  window.open(getEnrollmentUrl(), "_blank", "noopener,noreferrer");
}
