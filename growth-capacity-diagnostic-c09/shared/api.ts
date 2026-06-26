/**
 * Shared code between client and server.
 * Calculator → Rails enrollment contract (cookie on .joinkwikly.com).
 *
 * On CTA click the calculator sets calc_payload (Domain=.joinkwikly.com), then
 * navigates to enrollment with ?utm_source=calculator only. Metrics travel in
 * the cookie — not URL query params.
 *
 * Rails reads calc_payload on GET /enrollment/office, validates ranges, stores
 * in session, clears cookie, and maps to HubSpot on enrollment completion.
 *
 * Validation ranges (Rails):
 *   hygiene_chairs              1–20
 *   patients_per_chair_per_day  1–15
 *   shifts_unworked_per_month     0–40
 *   weeks_out_booking           0–52
 *   opportunity dollar fields   integers ≥ 0
 */

export const CALC_PAYLOAD_COOKIE_NAME = "calc_payload";

export const CALCULATOR_COOKIE_DOMAIN = ".joinkwikly.com";
export const CALCULATOR_COOKIE_MAX_AGE_SECONDS = 3600;

export const CALCULATOR_UTM_SOURCE = "calculator" as const;

export const DEFAULT_ENROLLMENT_BASE_URL =
  "https://dashboard.joinkwikly.com/enrollment/office";

/** JSON stored in calc_payload cookie. */
export interface CalculatorHubSpotPayload {
  utm_source: typeof CALCULATOR_UTM_SOURCE;
  inputs: {
    hygiene_chairs: number;
    patients_per_chair_per_day: number;
    shifts_unworked_per_month: number;
    weeks_out_booking: number;
  };
  opportunity: {
    total: number;
    production_protected: number;
    new_patients_lost: number;
    recurring_left_on_table: number;
  };
}

/** HubSpot custom property names mapped from calculator payload. */
export const CALCULATOR_HUBSPOT_PROPERTIES = {
  utm_source: "utm_source",
  hygiene_chairs: "calc_hygiene_chairs",
  patients_per_chair_per_day: "calc_patients_per_chair_per_day",
  shifts_unworked_per_month: "calc_shifts_unworked_per_month",
  weeks_out_booking: "calc_weeks_out_booking",
  total_opportunity: "calc_total_opportunity",
  production_protected: "calc_production_protected",
  new_patients_lost_revenue: "calc_new_patients_lost_revenue",
  recurring_left_on_table: "calc_recurring_left_on_table",
} as const;

export interface DemoResponse {
  message: string;
}
