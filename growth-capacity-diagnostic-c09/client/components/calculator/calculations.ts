// ─── Benchmark constants ─────────────────────────────────────────────────────
// Existing diagnostic benchmarks
export const PRODUCTION_PER_SHIFT = 1200; // $ daily hygiene production per chair
export const STANDARD_SHIFT_HOURS = 8; // hours in a standard shift
export const MONTHS = 12;
export const WEEKS = 52;
export const DOWNSTREAM_RATE = 0.35; // % of missed patients needing downstream care
export const AVG_TREATMENT_VALUE = 1700; // $ potential downstream production per patient
export const STAFFING_COST_PER_DAY = 550; // $ benchmark cost per staffed chair per day
export const CLINICAL_COVERAGE = 0.9; // Kwikly hygiene fill-rate benchmark (90%)

// Devin recall-interval backlog model
export const PERIO_PATIENT_SHARE = 0.25; // 25% of patient base is perio
export const PERIO_RECALL_MONTHS = 3; // perio recall interval
export const AVG_PERIO_REVENUE = 250; // $ avg revenue per perio visit
export const PROPHY_RECALL_MONTHS = 6; // prophy recall interval
export const AVG_PROPHY_REVENUE = 150; // $ avg revenue per prophy visit

// Patient-base derivation (capacity formula, validated against Devin's 2,000 example)
export const WORKING_DAYS_PER_YEAR = 250;
export const AVG_HYGIENE_VISITS_PER_PATIENT = 2;
// totalPatients = chairs × patientsPerDay × (250 / 2) = chairs × patientsPerDay × 125
export const PATIENTS_PER_CHAIR_DAY_MULTIPLIER =
  WORKING_DAYS_PER_YEAR / AVG_HYGIENE_VISITS_PER_PATIENT;

// Layer 3 hidden benchmarks (previous defaults, now fixed assumptions)
export const BENCHMARK_EXTENDED_HOURS_PER_DAY = 2;
export const BENCHMARK_EXTENDED_DAYS_PER_WEEK = 3;
export const BENCHMARK_EXTRA_DAYS_PER_MONTH = 2;

// Weeks → months conversion for the backlog formula
export const WEEKS_PER_MONTH = 4.33;

// ─── Types ───────────────────────────────────────────────────────────────────
export interface CalculatorInputs {
  chairs: number;
  patientsPerChairPerDay: number;
  missedShiftsPerMonth: number;
  bookingWeeksOut: number;
}

export interface ProtectionResult {
  annualLeakage: number;
  annualMissedVisits: number;
  delayedCases: number;
  treatmentAtRisk: number;
}

export interface BacklogResult {
  backlogMonths: number;
  perioLost: number;
  prophyLost: number;
  recoverableRevenue: number;
}

export interface ActivationResult {
  additionalPatientsEnabled: number;
  additionalProductionGenerated: number;
  downstreamTreatmentOpportunity: number;
  monthlyGrowthPotential: number;
}

export interface SummaryResult {
  productionAtRisk: number;
  recoverableRevenue: number;
  growthActivated: number;
  totalProductionOpportunity: number;
  staffingInvestment: number;
  roiMultiple: number;
}

// ─── Derived patient base ────────────────────────────────────────────────────
export function deriveTotalPatients(
  chairs: number,
  patientsPerChairPerDay: number,
): number {
  return chairs * patientsPerChairPerDay * PATIENTS_PER_CHAIR_DAY_MULTIPLIER;
}

// ─── Layer 1 — Growth Protection ─────────────────────────────────────────────
export function calcProtection(inputs: CalculatorInputs): ProtectionResult {
  const { missedShiftsPerMonth, patientsPerChairPerDay } = inputs;
  const annualLeakage = missedShiftsPerMonth * MONTHS * PRODUCTION_PER_SHIFT;
  const annualMissedVisits =
    missedShiftsPerMonth * MONTHS * patientsPerChairPerDay;
  const delayedCases = Math.round(annualMissedVisits * DOWNSTREAM_RATE);
  const treatmentAtRisk = delayedCases * AVG_TREATMENT_VALUE;
  return { annualLeakage, annualMissedVisits, delayedCases, treatmentAtRisk };
}

// ─── Layer 2 — Backlog Loss (Devin's recall-interval model) ──────────────────
export function calcBacklogLoss(inputs: CalculatorInputs): BacklogResult {
  const { chairs, patientsPerChairPerDay, bookingWeeksOut } = inputs;
  const totalPatients = deriveTotalPatients(chairs, patientsPerChairPerDay);
  const backlogMonths = bookingWeeksOut / WEEKS_PER_MONTH;

  const perioLost =
    backlogMonths > PERIO_RECALL_MONTHS
      ? totalPatients *
        PERIO_PATIENT_SHARE *
        ((backlogMonths - PERIO_RECALL_MONTHS) / PERIO_RECALL_MONTHS) *
        AVG_PERIO_REVENUE
      : 0;

  const prophyLost =
    backlogMonths > PROPHY_RECALL_MONTHS
      ? totalPatients *
        ((backlogMonths - PROPHY_RECALL_MONTHS) / PROPHY_RECALL_MONTHS) *
        AVG_PROPHY_REVENUE
      : 0;

  return {
    backlogMonths,
    perioLost,
    prophyLost,
    recoverableRevenue: perioLost + prophyLost,
  };
}

// ─── Layer 3 — Growth Activation (benchmark-based, no user inputs) ───────────
export function calcActivation(
  inputs: CalculatorInputs,
  protection: ProtectionResult,
): ActivationResult {
  const { chairs, patientsPerChairPerDay } = inputs;

  const extendedHoursPatients =
    BENCHMARK_EXTENDED_HOURS_PER_DAY *
    (patientsPerChairPerDay / STANDARD_SHIFT_HOURS) *
    BENCHMARK_EXTENDED_DAYS_PER_WEEK *
    WEEKS *
    chairs;

  const additionalDaysPatients =
    BENCHMARK_EXTRA_DAYS_PER_MONTH * patientsPerChairPerDay * chairs * MONTHS;

  const lever1Patients = extendedHoursPatients + additionalDaysPatients;
  const prodFromCoverage = protection.annualLeakage * CLINICAL_COVERAGE;

  const additionalPatientsEnabled = Math.round(lever1Patients);
  const additionalProductionGenerated =
    lever1Patients * PRODUCTION_PER_SHIFT + prodFromCoverage;
  const downstreamTreatmentOpportunity =
    Math.round(additionalPatientsEnabled * DOWNSTREAM_RATE) *
    AVG_TREATMENT_VALUE;
  const monthlyGrowthPotential =
    (additionalProductionGenerated + downstreamTreatmentOpportunity) / MONTHS;

  return {
    additionalPatientsEnabled,
    additionalProductionGenerated,
    downstreamTreatmentOpportunity,
    monthlyGrowthPotential,
  };
}

// ─── Summary ─────────────────────────────────────────────────────────────────
export function calcSummary(
  protection: ProtectionResult,
  backlog: BacklogResult,
  activation: ActivationResult,
): SummaryResult {
  const productionAtRisk = protection.annualLeakage;
  const recoverableRevenue = backlog.recoverableRevenue;
  const growthActivated = activation.additionalProductionGenerated;
  const totalProductionOpportunity =
    productionAtRisk + recoverableRevenue + growthActivated;

  const filledDays = growthActivated / PRODUCTION_PER_SHIFT;
  const staffingInvestment = filledDays * STAFFING_COST_PER_DAY;
  const roiMultiple =
    staffingInvestment > 0 ? growthActivated / staffingInvestment : 0;

  return {
    productionAtRisk,
    recoverableRevenue,
    growthActivated,
    totalProductionOpportunity,
    staffingInvestment,
    roiMultiple,
  };
}
