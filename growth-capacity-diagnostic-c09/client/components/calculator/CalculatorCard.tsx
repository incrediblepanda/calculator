import { useState, useMemo, useRef, useEffect } from "react";

// ─── Fixed assumptions (industry norms — not shown to the office) ───────────────
// Mirrors the "Math & Norms" tab of the Growth2 model. These drive every derived
// number so the office only has to enter four operational inputs.
const ASSUMPTIONS = {
  workingDaysPerMonth: 21, // industry norm, ~21
  productionPerCleaningVisit: 150, // includes the doctor exam; PPO norm
  productionPerPerioVisit: 250,
  targetCleaningVisitsPerYear: 2, // every 6 months
  targetPerioVisitsPerYear: 4, // every 3 months
  perioShareOfPanel: 0.25,
  newPatientsPerChairPerMonth: 15,
  kwiklyFillRate: 1.0, // shifts filled with Kwikly
  newPatientValueHorizonYears: 1, // bank one year of recall
  downstreamShare: 0.4, // untreated cleanings with downstream potential
  downstreamRevenuePerCase: 1700,
} as const;

// New-patient loss share by how far out the schedule is booked (weeks).
function newPatientLossRate(weeksOut: number): number {
  if (weeksOut <= 4) return 0;
  if (weeksOut <= 8) return 0.1;
  if (weeksOut <= 13) return 0.2;
  if (weeksOut <= 26) return 0.35;
  return 0.5;
}

// ─── Formatters ────────────────────────────────────────────────────────────────
function fmtCurrency(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}
function fmtNum(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

// ─── Shared number input with stepper ─────────────────────────────────────────
function Slider({
  label, description, value, onChange, min, max, step = 1, unit = "", showRange = false,
}: {
  label: string; description?: string; value: number;
  onChange: (v: number) => void; min: number; max: number;
  step?: number; unit?: string; showRange?: boolean;
}) {
  const rangeRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (rangeRef.current)
      rangeRef.current.style.setProperty("--range-progress", `${((value - min) / (max - min)) * 100}%`);
  }, [value, min, max]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-bold text-navy-800">{label}</span>
          {description && <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>}
        </div>
        <div className="flex items-start gap-1 shrink-0 w-[120px] justify-end">
          <button
            onClick={() => onChange(Math.max(min, value - step))}
            className="w-7 h-7 mt-[1px] flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-base leading-none transition-colors select-none"
            aria-label="Decrease"
          >-</button>
          <div className="flex flex-col items-center">
            <input
              type="number" value={value} min={min} max={max} step={step}
              onChange={(e) => { const v = Number(e.target.value); if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v))); }}
              className="w-16 text-center text-sm font-black text-navy-900 bg-white border-2 border-navy-200 rounded-lg py-1 px-1 focus:outline-none focus:border-coral-500 tabular-nums transition-colors"
              style={{ textAlign: "center" }}
            />
            {unit && <span className="text-[11px] text-gray-400/60 font-medium italic mt-0.5">{unit}</span>}
          </div>
          <button
            onClick={() => onChange(Math.min(max, value + step))}
            className="w-7 h-7 mt-[1px] flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-base leading-none transition-colors select-none"
            aria-label="Increase"
          >+</button>
        </div>
      </div>
      {showRange && (
        <input
          ref={rangeRef} type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="input-range w-full"
          style={{ "--range-progress": `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties}
        />
      )}
    </div>
  );
}

// ─── Metric tile ───────────────────────────────────────────────────────────────
function Metric({
  label, value, sub, accent = "emerald",
}: {
  label: string; value: string; sub?: string; accent?: "red" | "navy" | "emerald" | "neutral";
}) {
  const valueColor = {
    red: "text-red-500",
    navy: "text-[#023661]",
    emerald: "text-emerald-600",
    neutral: "text-navy-900",
  }[accent];

  return (
    <div className="bg-gray-50 rounded-xl px-3 py-3 border border-gray-100">
      <div className={`text-xl sm:text-2xl font-black tabular-nums leading-none ${valueColor}`}>
        {value}
      </div>
      <div className="text-[11px] font-semibold text-gray-500 mt-1.5 leading-snug">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function CalculatorCard() {
  // ── The four office inputs ───────────────────────────────────────────────────
  const [hygieneChairs, setHygieneChairs] = useState(2);
  const [patientsPerChairPerDay, setPatientsPerChairPerDay] = useState(8);
  const [shiftsUnworkedPerMonth, setShiftsUnworkedPerMonth] = useState(2);
  const [weeksOut, setWeeksOut] = useState(16);

  // ── Everything else is derived from the assumptions above ───────────────────
  const m = useMemo(() => {
    const A = ASSUMPTIONS;

    // Derived norms
    const cleaningShare = 1 - A.perioShareOfPanel; // 0.75
    const cleaningRecallInterval = 12 / A.targetCleaningVisitsPerYear; // 6 months
    const perioRecallInterval = 12 / A.targetPerioVisitsPerYear; // 3 months
    const activePanel =
      (hygieneChairs * patientsPerChairPerDay * A.workingDaysPerMonth * 12) / 2;
    const prodPerChairDay = patientsPerChairPerDay * A.productionPerCleaningVisit;
    const backlogMonths = (weeksOut * 12) / 52;
    const valuePerNewPatient =
      A.targetCleaningVisitsPerYear * A.productionPerCleaningVisit * A.newPatientValueHorizonYears; // $300

    // Staffing gaps (protect)
    const productionAtRisk = shiftsUnworkedPerMonth * 12 * prodPerChairDay;
    const protectedRevenue = productionAtRisk * A.kwiklyFillRate;

    // Backlog — existing patients
    const perioLossFactor =
      backlogMonths > perioRecallInterval
        ? Math.min((backlogMonths - perioRecallInterval) / perioRecallInterval, A.targetPerioVisitsPerYear)
        : 0;
    const lostPerioVisits = perioLossFactor * activePanel * A.perioShareOfPanel;
    const perioRevenueLost = lostPerioVisits * A.productionPerPerioVisit;

    const cleaningLossFactor =
      backlogMonths > cleaningRecallInterval
        ? Math.min((backlogMonths - cleaningRecallInterval) / cleaningRecallInterval, A.targetCleaningVisitsPerYear)
        : 0;
    const lostCleaningVisits = cleaningLossFactor * activePanel * cleaningShare;
    const cleaningRevenueLost = lostCleaningVisits * A.productionPerCleaningVisit;

    const recurringLeftOnTable = perioRevenueLost + cleaningRevenueLost;

    // Backlog — new patients
    const newPatientsPerYear = A.newPatientsPerChairPerMonth * hygieneChairs * 12;
    const lossRate = newPatientLossRate(weeksOut);
    const newPatientsLostPerYear = newPatientsPerYear * lossRate;
    const newPatientRevenueLost = newPatientsLostPerYear * valuePerNewPatient;

    // Downstream treatment (rep talking point — computed, not shown to office)
    const untreatedCleaningVisits =
      lostCleaningVisits + newPatientsLostPerYear * A.targetCleaningVisitsPerYear;
    const withDownstreamPotential = untreatedCleaningVisits * A.downstreamShare;
    const downstreamRevenue = withDownstreamPotential * A.downstreamRevenuePerCase;

    // Totals
    const backlogCore = recurringLeftOnTable + newPatientRevenueLost;
    const totalOpportunityCore = protectedRevenue + backlogCore;
    const totalOpportunityWithDownstream = totalOpportunityCore + downstreamRevenue;

    // Recommended per diem shifts
    const shiftsToCoverGaps = Math.round(shiftsUnworkedPerMonth);
    const digOutVisits =
      lostPerioVisits + lostCleaningVisits + newPatientsLostPerYear * A.targetCleaningVisitsPerYear;
    const digOutShiftsPerMonth =
      patientsPerChairPerDay > 0 ? digOutVisits / patientsPerChairPerDay / 12 : 0;
    const recommendedShiftsPerMonth = shiftsToCoverGaps + Math.round(digOutShiftsPerMonth);

    return {
      activePanel,
      productionAtRisk,
      protectedRevenue,
      recurringLeftOnTable,
      newPatientRevenueLost,
      backlogCore,
      totalOpportunityCore,
      // Rep-only (not rendered):
      downstreamRevenue,
      totalOpportunityWithDownstream,
      recommendedShiftsPerMonth,
    };
  }, [hygieneChairs, patientsPerChairPerDay, shiftsUnworkedPerMonth, weeksOut]);

  return (
    <div className="rounded-2xl overflow-hidden shadow-card-lg border border-gray-100 bg-white">

      {/* ── Card header ────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: "#003561" }} className="px-6 sm:px-8 py-6 border-b border-white/10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-coral-500 mb-1">
          Clinical Capacity &amp; Growth Diagnostic
        </p>
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
          See how much production you're losing to open chairs and staffing gaps.
        </h2>
        <p className="text-xs text-white/60 font-medium leading-relaxed max-w-xl mx-auto">
          Enter four numbers about your hygiene schedule. We handle the rest using dental industry benchmarks.
        </p>
      </div>

      {/* ── Inputs: what the office enters ─────────────────────────────────── */}
      <div className="px-6 sm:px-8 py-5 bg-gray-50/60 border-b border-gray-100">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-4">
          What your office enters
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-x-12 sm:gap-y-6">
          <Slider
            label="Hygiene chairs"
            value={hygieneChairs}
            onChange={setHygieneChairs}
            min={1} max={20}
            showRange
          />
          <Slider
            label="Hygiene patients per chair, per day"
            value={patientsPerChairPerDay}
            onChange={setPatientsPerChairPerDay}
            min={1} max={15}
            showRange
          />
          <Slider
            label="Shifts unworked per month"
            description="How often a hygiene chair sits empty"
            value={shiftsUnworkedPerMonth}
            onChange={setShiftsUnworkedPerMonth}
            min={0} max={40}
          />
          <Slider
            label="Weeks out booking new patients"
            description="How far out the schedule is booked"
            value={weeksOut}
            onChange={setWeeksOut}
            min={0} max={52}
          />
        </div>
      </div>

      {/* ── Outputs: what the office sees ──────────────────────────────────── */}
      <div className="px-6 sm:px-8 py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-4">
          What your office sees
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Metric
            label="Active patients (estimated)"
            value={fmtNum(m.activePanel)}
            sub="Derived from chairs and patients per day"
            accent="neutral"
          />
          <Metric
            label="Currently lost to staffing gaps (per year)"
            value={fmtCurrency(m.productionAtRisk)}
            sub="Before Kwikly coverage"
            accent="red"
          />
          <Metric
            label="Booked revenue you protect (per year)"
            value={fmtCurrency(m.protectedRevenue)}
            sub="Reliable coverage locks it back in"
            accent="emerald"
          />
          <Metric
            label="Recommended per diem shifts per month"
            value={fmtNum(m.recommendedShiftsPerMonth)}
            sub="Cover gaps plus dig out the backlog"
            accent="navy"
          />
        </div>

        {/* Backlog breakdown */}
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-navy-800">Stuck in your backlog (per year)</div>
              <div className="text-[11px] text-gray-400 mt-0.5">New patients lost plus revenue left on the table</div>
            </div>
            <div className="text-2xl font-black tabular-nums text-red-500 shrink-0">
              {fmtCurrency(m.backlogCore)}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-baseline justify-between gap-2 bg-white rounded-lg border border-gray-100 px-3 py-2">
              <span className="text-[11px] font-semibold text-gray-500">New patients who go elsewhere</span>
              <span className="text-sm font-black tabular-nums text-red-500">{fmtCurrency(m.newPatientRevenueLost)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2 bg-white rounded-lg border border-gray-100 px-3 py-2">
              <span className="text-[11px] font-semibold text-gray-500">Recurring revenue left on the table</span>
              <span className="text-sm font-black tabular-nums text-red-500">{fmtCurrency(m.recurringLeftOnTable)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Opportunity summary ─────────────────────────────────────────────── */}
      <div style={{ backgroundColor: "#023661" }} className="px-6 sm:px-8 py-6">
        <div className="rounded-xl px-5 py-5 bg-white/15 border border-white/20 text-center">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50 mb-1">
            Your opportunity with Kwikly (per year)
          </div>
          <div className="text-4xl sm:text-5xl font-black tabular-nums leading-none text-emerald-400">
            {fmtCurrency(m.totalOpportunityCore)}
          </div>
          <div className="text-[11px] text-white/40 mt-2">
            Production you protect plus backlog you dig out
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <a
            href="https://joinkwikly.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm py-3.5 rounded-lg transition-colors"
          >
            See How Kwikly Unlocks This Growth
          </a>
          <a
            href="https://joinkwikly.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm py-3.5 rounded-lg transition-colors"
          >
            Save My Results &amp; Talk to Our Team
          </a>
        </div>
      </div>
    </div>
  );
}
