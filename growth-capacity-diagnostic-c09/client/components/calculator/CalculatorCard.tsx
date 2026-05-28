import { useState, useMemo, useRef, useEffect } from "react";

// ─── Constants ─────────────────────────────────────────────────────────────────
const PRODUCTION_PER_SHIFT = 1200;           // $ daily hygiene production per column
const STANDARD_SHIFT_HOURS = 8;              // hours in a standard shift
const MONTHS = 12;
const WEEKS = 52;
const DOWNSTREAM_RATE = 0.35;               // % of missed patients needing downstream care
const AVG_TREATMENT_VALUE = 1700;           // $ potential downstream production per patient
const STAFFING_COST_PER_DAY = 550;          // $ benchmark cost per staffed column per day
const CLINICAL_COVERAGE = 0.90;             // Clinical coverage improvement (constant 90%)

// ─── Formatters ────────────────────────────────────────────────────────────────
function fmtCurrency(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}
function fmtNum(n: number) {
  return Math.round(n).toLocaleString("en-US");
}
function fmtMultiple(n: number) {
  return `${n.toFixed(1)}x`;
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

// ─── Layer header ──────────────────────────────────────────────────────────────
function LayerHeader({
  step, title, description,
}: {
  step: string; title: string; description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="shrink-0 w-9 h-9 rounded-full bg-coral-50 border-2 border-coral-200 flex items-center justify-center">
        <span className="text-[10px] font-black text-coral-500">{step}</span>
      </div>
      <div>
        <h3 className="text-base font-semibold text-navy-900">{title}</h3>
        <p className="text-xs text-gray-500 font-medium mt-0.5 leading-snug">{description}</p>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function CalculatorCard() {
  // ── Shared inputs ──────────────────────────────────────────────────────────
  const [locations, setLocations] = useState(1);
  const [patientsPerShift, setPatientsPerShift] = useState(8);

  // ── Accordion state ───────────────────────────────────────────────────────
  const [layer2Open, setLayer2Open] = useState(false);
  const [layer3Open, setLayer3Open] = useState(false);

  // ── Layer 1 inputs ─────────────────────────────────────────────────────────
  const [unfilledShifts, setUnfilledShifts] = useState(1); // per month per location

  // ── Layer 2 inputs ─────────────────────────────────────────────────────────
  const [activePatients, setActivePatients] = useState(2000);
  const [newPatientsPerMonth, setNewPatientsPerMonth] = useState(30);
  const [bookingDelayMonths, setBookingDelayMonths] = useState(6);  // months

  // ── Layer 3 inputs ─────────────────────────────────────────────────────────
  const [additionalHoursPerDay, setAdditionalHoursPerDay] = useState(2);
  const [daysPerWeekExtended, setDaysPerWeekExtended] = useState(3);
  const [additionalDaysPerMonth, setAdditionalDaysPerMonth] = useState(2);

  // ── Layer 1 calculations ───────────────────────────────────────────────────
  // annualLeakage       = unfilledShifts * locations * PRODUCTION_PER_SHIFT * 52
  // annualMissedVisits  = unfilledShifts * locations * patientsPerShift * 52
  // delayedCases        = round(annualMissedVisits * 0.35)
  // treatmentAtRisk     = delayedCases * AVG_TREATMENT_VALUE
  const l1 = useMemo(() => {
    const annualLeakage      = unfilledShifts * locations * PRODUCTION_PER_SHIFT * MONTHS;
    const annualMissedVisits = unfilledShifts * locations * patientsPerShift * MONTHS;
    const delayedCases       = Math.round(annualMissedVisits * DOWNSTREAM_RATE);
    const treatmentAtRisk    = delayedCases * AVG_TREATMENT_VALUE;
    return { annualLeakage, annualMissedVisits, delayedCases, treatmentAtRisk };
  }, [unfilledShifts, locations, patientsPerShift]);

  // ── Layer 2 calculations (3 models - NOT factored into summary) ─────────
  const l2 = useMemo(() => {
    // When bookingDelayMonths is 0, 1, or 2, all values are 0 (no perio impact)
    if (bookingDelayMonths <= 2) {
      return {
        monthlyChurn: 0,
        lossRate: 0,
        lostPatientsPerMonth: 0,
        annualRevenueLoss: 0,
        trueGrowthPatients: 0,
        perioPatients: 0,
        missedPerioPatients: 0,
        srpLoss: 0,
        maintenanceLoss: 0,
        utilizationPct: 0,
        hygieneCapacityPatients: 0,
        totalHygieneLoss: 0,
        recoverableRevenue: 0,
      };
    }

    // MODEL 1 — Net New Patient Loss
    const monthlyChurn = activePatients * 0.15 / 12;
    const lossRate = bookingDelayMonths < 2 ? 0.05
      : bookingDelayMonths <= 4 ? 0.15
      : bookingDelayMonths <= 8 ? 0.30
      : 0.50;
    const lostPatientsPerMonth = newPatientsPerMonth * lossRate;
    const annualRevenueLoss = lostPatientsPerMonth * 12 * 1000;
    const trueGrowthPatients = newPatientsPerMonth - monthlyChurn;

    // MODEL 2 — Perio Suppression
    const perioPatients = activePatients * 0.25;
    const missedPerioPatients = perioPatients * 0.30;
    const srpLoss = missedPerioPatients * 1000;
    const maintenanceLoss = missedPerioPatients * 250 * 3;

    // MODEL 3 — Hygiene Compression
    // Loss percentage based on booking delay months
    const getLossPercentage = (months: number): number => {
      if (months <= 6) return 0;
      if (months === 7) return 0.14;
      if (months === 8) return 0.25;
      if (months === 9) return 0.33;
      if (months === 10) return 0.40;
      if (months === 11) return 0.45;
      if (months === 12) return 0.50;
      if (months === 13) return 0.54;
      if (months === 14) return 0.57;
      if (months === 15) return 0.60;
      if (months === 16) return 0.63;
      return 0.65; // cap at 65% for months > 16
    };

    const lossPercentage = getLossPercentage(bookingDelayMonths);
    const hygieneCapacityPatients = activePatients * lossPercentage; // Number of patients affected
    const totalHygieneLoss = hygieneCapacityPatients * 300; // Currency: patients × $300 per patient per year
    const utilizationPct = bookingDelayMonths <= 6 ? 1.0 : (1 - lossPercentage);

    const recoverableRevenue = annualRevenueLoss + srpLoss + maintenanceLoss + totalHygieneLoss;

    return {
      monthlyChurn, lossRate, lostPatientsPerMonth, annualRevenueLoss, trueGrowthPatients,
      perioPatients, missedPerioPatients, srpLoss, maintenanceLoss,
      utilizationPct, hygieneCapacityPatients, totalHygieneLoss, recoverableRevenue,
    };
  }, [activePatients, newPatientsPerMonth, bookingDelayMonths]);

  // ── Layer 3 calculations ───────────────────────────────────────────────────
  // Lever 1 - Expand Clinical Time:
  //   extendedHoursPatients = ((patientsPerShift * (additionalHoursPerDay / 8)) * daysPerWeekExtended * 52) * locations
  //     (Only if additionalHoursPerDay > 0)
  //   additionalDaysPatients = (additionalDaysPerMonth * patientsPerShift * 12) * locations
  //
  // Lever 2 - Improve Clinical Coverage:
  //   prodFromCoverage = l1.annualLeakage * CLINICAL_COVERAGE
  //   patientsRecoveredFromCoverage = round(l1.annualMissedVisits * CLINICAL_COVERAGE)
  //     (Only if Lever 1 is being used)
  //
  // Combined:
  //   additionalPatientsEnabled = extendedHoursPatients + additionalDaysPatients + patientsRecoveredFromCoverage
  //   additionalProductionGenerated = (extendedHoursPatients + additionalDaysPatients) * PRODUCTION_PER_SHIFT + prodFromCoverage
  //   downstreamTreatmentOpportunity = round(additionalPatientsEnabled * DOWNSTREAM_RATE) * AVG_TREATMENT_VALUE
  const l3 = useMemo(() => {
    // Lever 1 - Extended hours patients (only if additionalHoursPerDay > 0)
    // Formula: (Additional Clinical Hours per Day * (Avg. Patients / Hygienist Shift / 8) * Days per Week with Extended Hours * 52 weeks) * Number of Locations
    const extendedHoursPatients = additionalHoursPerDay > 0
      ? (additionalHoursPerDay * (patientsPerShift / STANDARD_SHIFT_HOURS) * daysPerWeekExtended * WEEKS) * locations
      : 0;

    // Lever 1 - Additional days patients
    // Formula: Additional Clinical Days per Month × Avg. Patients / Hygienist Shift × Number of Locations × 12
    const additionalDaysPatients = additionalDaysPerMonth * patientsPerShift * locations * MONTHS;

    // Total patients from Lever 1 (production expansion)
    const lever1Patients = extendedHoursPatients + additionalDaysPatients;

    // Lever 2 - Clinical coverage only applies if Extended Hours are being actively used (hours AND days > 0)
    const hasExtendedHours = additionalHoursPerDay > 0 && daysPerWeekExtended > 0;
    const effectiveClinicalCoverage = hasExtendedHours ? CLINICAL_COVERAGE : 0;
    const prodFromCoverage               = l1.annualLeakage * effectiveClinicalCoverage;
    const patientsRecoveredFromCoverage  = Math.round(l1.annualMissedVisits * effectiveClinicalCoverage);

    // Combined
    const additionalPatientsEnabled       = Math.round(lever1Patients);
    // Monetary values are 0 if no actual lever 1 patients are being created
    const additionalProductionGenerated   = lever1Patients > 0 ? ((lever1Patients * PRODUCTION_PER_SHIFT) + prodFromCoverage) : 0;
    const downstreamTreatmentOpportunity  = lever1Patients > 0 ? (Math.round(additionalPatientsEnabled * DOWNSTREAM_RATE) * AVG_TREATMENT_VALUE) : 0;
    const monthlyGrowthPotential          = lever1Patients > 0 ? ((additionalProductionGenerated + downstreamTreatmentOpportunity) / MONTHS) : 0;

    return {
      extendedHoursPatients,
      additionalDaysPatients,
      lever1Patients,
      prodFromCoverage,
      patientsRecoveredFromCoverage,
      additionalPatientsEnabled,
      additionalProductionGenerated,
      downstreamTreatmentOpportunity,
      monthlyGrowthPotential,
    };
  }, [additionalHoursPerDay, daysPerWeekExtended, additionalDaysPerMonth, l1, locations, patientsPerShift]);

  // ── Summary calculations (Layer 2 is NOT included) ─────────────────────────
  // totalProductionOpportunity = l3.additionalProductionGenerated (Layer 3 only)
  // staffingInvestment = (l3.additionalProductionGenerated / PRODUCTION_PER_SHIFT) * STAFFING_COST_PER_DAY
  // roiMultiple = totalProductionOpportunity / staffingInvestment
  const summary = useMemo(() => {
    const totalProductionEnabled = l3.additionalProductionGenerated;
    const totalFilledDays        = l3.additionalProductionGenerated / PRODUCTION_PER_SHIFT;
    const staffingInvestment     = totalFilledDays * STAFFING_COST_PER_DAY;
    const roiMultiple            = staffingInvestment > 0 ? totalProductionEnabled / staffingInvestment : 0;
    return { totalProductionEnabled, staffingInvestment, roiMultiple };
  }, [l3]);

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
          This 1-minute diagnostic shows where you're losing capacity and how to get it back.
        </p>
      </div>

      {/* ── Shared inputs bar ──────────────────────────────────────────────── */}
      <div className="px-6 sm:px-8 py-4 bg-gray-50/60 border-b border-gray-100">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-3">
          Practice Overview · applies to all layers
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-12">
          <Slider
            label="Number of Locations"
            value={locations}
            onChange={setLocations}
            min={1} max={150}
            showRange
          />
          <Slider
            label="Avg. Patients / Hygienist Shift"
            value={patientsPerShift}
            onChange={setPatientsPerShift}
            min={1} max={15}
            showRange
          />
        </div>
      </div>

      {/* ══ LAYER 1: Protect Production ═══════════════════════════════════════ */}
      <div className="px-6 sm:px-8 py-4 border-b border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-0 lg:divide-x lg:divide-gray-100">
          {/* Left: header + inputs */}
          <div className="space-y-4 lg:pr-8">
            <LayerHeader
              step="01"
              title="Growth Protection"
              description="Unstaffed hygiene operatories reduce production and delay patient care."
            />
            <Slider
              label="Unstaffed Hygiene Operatories / Month (per location)"
              description="How many hygiene operatories per location go unstaffed each month (Sick days, PTO, FMLA leave)"
              value={unfilledShifts}
              onChange={setUnfilledShifts}
              min={0} max={80}
            />
            <p className="text-[11px] text-gray-400 leading-relaxed">
              <span className="font-semibold text-gray-500">
                {unfilledShifts} operatories x {locations} location{locations !== 1 ? 's' : ''} x $1,200 x 12 months
              </span>
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              <span className="font-semibold uppercase tracking-wide text-gray-400">Benchmark</span> · $1,200 daily hygiene · $1,700 downstream
            </p>
          </div>
          {/* Right: outputs */}
          <div className="grid grid-cols-2 gap-2 lg:pl-8">
            <div className="col-span-2">
              <Metric
                label="Annual Production Leakage"
                value={fmtCurrency(l1.annualLeakage)}
                sub="Estimated production loss from unstaffed hygiene operatories"
                accent="red"
              />
            </div>
            <Metric
              label="Number of Unseen Patients Due to hygiene gaps"
              value={fmtNum(l1.annualMissedVisits)}
              accent="red"
            />
            <Metric
              label="Delayed Treatment Opportunities"
              value={fmtNum(l1.delayedCases)}
              sub="Patients whose treatment is delayed due to missed hygiene visits"
              accent="red"
            />
            <div className="col-span-2">
              <Metric
                label="Downstream Treatment Opportunity"
                value={fmtCurrency(l1.treatmentAtRisk)}
                sub="Treatment not diagnosed or scheduled due to missed hygiene visits"
                accent="red"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══ LAYER 2: Growth Potential ══════════════════════════════════════════ */}
      <div className="px-6 sm:px-8 py-4 border-b border-gray-100">
        <LayerHeader
          step="02"
          title="Growth Potential"
          description="Revenue Being Left on the Table - Total recoverable revenue by removing your full backlog restrictions"
        />
        {!layer2Open ? (
          <button
            onClick={() => setLayer2Open(true)}
            className="mt-6 flex flex-col items-center gap-1.5 w-full group transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 group-hover:text-coral-400 transition-colors">Next: Step 2</span>
            <span className="text-sm font-semibold text-gray-400 group-hover:text-[#023661] transition-colors">
              Quantify Your Growth Potential
            </span>
            <span className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-medium text-gray-300 group-hover:text-coral-400 transition-colors">Click to expand</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gray-300 group-hover:text-coral-400 group-hover:translate-y-1 transition-all duration-200">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
        ) : (
          <div className="mt-5 space-y-4 divide-y divide-gray-100">
            {/* Row 1: Active Patients → Perio Suppression */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-0 lg:divide-x lg:divide-gray-100 lg:items-center">
              <div className="lg:pr-8">
                <Slider
                label="Active Patients"
                description="Total active patients in your practice"
                value={activePatients}
                onChange={setActivePatients}
                min={50} max={5000} step={100}
              />
              </div>
              <div className="grid grid-cols-2 gap-2 lg:pl-8">
                <Metric
                  label="Perio Patients Untreated"
                  value={fmtNum(l2.missedPerioPatients)}
                  sub={`${fmtCurrency(l2.srpLoss)} immediate`}
                  accent="red"
                />
                <Metric
                  label="Perio Recurring Loss"
                  value={fmtCurrency(l2.maintenanceLoss)}
                  sub="$250 x 3 visits/year"
                  accent="red"
                />
              </div>
            </div>

            {/* Row 2: New Patients → Net New Patient Loss */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-0 lg:divide-x lg:divide-gray-100 lg:items-center pt-4">
              <div className="lg:pr-8">
                <Slider
                  label="New Patient Goal / Month"
                  description="Average new patients acquired monthly"
                  value={newPatientsPerMonth}
                  onChange={setNewPatientsPerMonth}
                  min={0} max={200}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 lg:pl-8">
                <Metric
                  label="New Patients Lost / Month"
                  value={String(Math.round(l2.lostPatientsPerMonth))}
                  sub={`Loss rate: ${Math.round(l2.lossRate * 100)}%`}
                  accent="red"
                />
                <Metric
                  label="Annual Revenue Loss"
                  value={fmtCurrency(l2.annualRevenueLoss)}
                  sub="Net new patient loss"
                  accent="red"
                />
              </div>
            </div>

            {/* Row 3: Hygiene Booking Delay → Hygiene Compression */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-0 lg:divide-x lg:divide-gray-100 lg:items-center pt-4">
              <div className="lg:pr-8">
                <Slider
                  label="Hygiene Booking Delay (Months)"
                  description="How far out are hygiene visits booked?"
                  value={bookingDelayMonths}
                  onChange={setBookingDelayMonths}
                  min={0} max={52}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 lg:pl-8">
                <Metric
                  label="Total Hygiene Patients Lost"
                  value={String(Math.round(l2.hygieneCapacityPatients))}
                  sub={bookingDelayMonths <= 6 ? "Operating at 100% capacity" : `Operating at ${Math.round(l2.utilizationPct * 100)}% capacity`}
                  accent={bookingDelayMonths <= 6 ? "emerald" : "red"}
                />
                <Metric
                  label="Total Hygiene Loss"
                  value={fmtCurrency(l2.totalHygieneLoss)}
                  sub={bookingDelayMonths <= 6 ? "No loss" : "Patient capacity loss"}
                  accent={bookingDelayMonths <= 6 ? "emerald" : "red"}
                />
              </div>
            </div>

            {/* Bottom row: Total Patients at Risk */}
            <div className="pt-4 -mb-px">
              <p className="text-sm font-semibold text-center text-navy-800 mb-2">Monthly Risk Assessment</p>
              <div className="flex justify-center mt-2">
                <div className="w-full sm:w-2/3">
                  <Metric
                    label="Total Patients at Risk"
                    value={String(Math.round((l2.missedPerioPatients / 12) + l2.lostPatientsPerMonth + (l2.hygieneCapacityPatients / 12)))}
                    sub="(Perio Untreated/12) + New Lost/Month + (Hygiene Capacity/12)"
                    accent="red"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ LAYER 3: Activate Growth ══════════════════════════════════════════ */}
      <div className="px-6 sm:px-8 py-4 border-b border-gray-100">
        <LayerHeader
          step="03"
          title="Growth Activation"
          description="How you can start recovering your lost revenue by removing operational restrictions"
        />
        {!layer3Open ? (
          <button
            onClick={() => setLayer3Open(true)}
            className="mt-6 flex flex-col items-center gap-1.5 w-full group transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 group-hover:text-coral-400 transition-colors">Next: Step 3</span>
            <span className="text-sm font-semibold text-gray-400 group-hover:text-[#023661] transition-colors">
              Model Your Growth Potential
            </span>
            <span className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-medium text-gray-300 group-hover:text-coral-400 transition-colors">Click to expand</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gray-300 group-hover:text-coral-400 group-hover:translate-y-1 transition-all duration-200">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
        ) : (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-0 lg:divide-x lg:divide-gray-100">
            {/* Left: inputs */}
            <div className="space-y-5 lg:pr-8">
              {/* Lever 1 */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">
                  Lever 1 - Additional Hours
                </p>
                <Slider
                  label="Days per Week with Extended Hours"
                  value={daysPerWeekExtended}
                  onChange={setDaysPerWeekExtended}
                  min={0} max={7}
                  unit=" days"
                />
                <Slider
                  label="Additional Clinical Hours per Day"
                  description="e.g. early morning / evening hours"
                  value={additionalHoursPerDay}
                  onChange={setAdditionalHoursPerDay}
                  min={0} max={8}
                  unit=" hrs"
                />
              </div>
              {/* Lever 2 */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">
                  Lever 2 - Additional Chair
                </p>
                <Slider
                  label="Additional Clinical Days per Month"
                  description="e.g. Most common Fridays and Saturdays"
                  value={additionalDaysPerMonth}
                  onChange={setAdditionalDaysPerMonth}
                  min={0} max={20}
                  unit=" days"
                />
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Clinical coverage is set to <span className="font-bold text-navy-700">90%</span>. Kwikly customers average a <span className="font-bold text-navy-700">90%+ hygiene fill rate</span>,
                  turning chronic staffing gaps into a predictable, managed system.
                </p>
              </div>
            </div>
            {/* Right: outputs */}
            <div className="grid grid-cols-2 gap-2 content-start lg:pl-8">
              <div className="col-span-2">
                <Metric
                  label="Additional Patients Seen/Treated"
                  value={fmtNum(l3.additionalPatientsEnabled)}
                  sub="Expanded hours + improved coverage"
                  accent="emerald"
                />
              </div>
              <Metric
                label="Additional Production Generated"
                value={fmtCurrency(l3.additionalProductionGenerated)}
                sub="Clinical time + coverage combined"
                accent="emerald"
              />
              <Metric
                label="Downstream Treatment Opportunity"
                value={fmtCurrency(l3.downstreamTreatmentOpportunity)}
                sub="At $1,700 per patient"
                accent="emerald"
              />
              <div className="col-span-2">
                <Metric
                  label="Monthly Growth Potential"
                  value={fmtCurrency(l3.monthlyGrowthPotential)}
                  sub="Average additional production per month"
                  accent="navy"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ GROWTH OPPORTUNITY SUMMARY ════════════════════════════════════════ */}
      <div style={{ backgroundColor: "#023661" }} className="px-6 sm:px-8 py-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 mb-4">
          Growth Opportunity Summary
        </p>

        {(() => {
          const allOpen = layer3Open;
          const placeholder = <span className="italic font-normal text-red-400 text-base">Inputs Needed</span>;
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8">
              {/* Left: story summary cards */}
              <div className="space-y-2">
                {/* Production at Risk */}
                <div className="rounded-xl px-4 py-3 bg-white/8 border border-white/10">
                  <div className="text-xl font-black tabular-nums leading-none text-red-400">
                    {fmtCurrency(l1.annualLeakage)} <span className="text-sm font-semibold">Protected</span>
                  </div>
                  <div className="text-xs font-bold mt-1.5 text-white/80">Production at Risk</div>
                  <div className="text-[11px] text-white/40 mt-0.5">Avoid cancellations / gaps</div>
                </div>
                {/* Recoverable Revenue Opportunity */}
                <div className="rounded-xl px-4 py-3 bg-white/8 border border-white/10">
                  <div className="text-xl font-black tabular-nums leading-none text-[#60a5fa]">
                    {layer2Open ? <>{fmtCurrency(l2.recoverableRevenue)} <span className="text-sm font-semibold">Recoverable</span></> : placeholder}
                  </div>
                  <div className="text-xs font-bold mt-1.5 text-white/80">Recoverable Revenue Opportunity</div>
                  <div className="text-[11px] text-white/40 mt-0.5">Net New Loss + Perio Loss + Hygiene Loss</div>
                </div>
                {/* Growth Activated */}
                <div className="rounded-xl px-4 py-3 bg-white/8 border border-white/10">
                  <div className="text-xl font-black tabular-nums leading-none text-emerald-400">
                    {allOpen ? <>{fmtCurrency(l3.additionalProductionGenerated)} <span className="text-sm font-semibold">Achievable</span></> : placeholder}
                  </div>
                  <div className="text-xs font-bold mt-1.5 text-white/80">Growth Activated</div>
                  <div className="text-[11px] text-white/40 mt-0.5">Expanded hours + improved coverage</div>
                </div>
              </div>

              {/* Right: business impact */}
              <div className="flex flex-col justify-between gap-4">
                {/* Total Production Enabled — largest metric */}
                <div className="rounded-xl px-5 py-4 bg-white/15 border border-white/20 flex-1 flex flex-col justify-center">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50 mb-1">
                    Total Production Opportunity
                  </div>
                  <div className="text-4xl sm:text-5xl font-black tabular-nums leading-none text-emerald-400">
                    {allOpen ? fmtCurrency(summary.totalProductionEnabled) : placeholder}
                  </div>
                  <div className="text-[11px] text-white/40 mt-1.5">Production at Risk + Growth Activated</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Staffing Investment */}
                  <div className="rounded-xl px-4 py-3 bg-white/8 border border-white/10">
                    <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40 mb-1">
                      Staffing Investment
                    </div>
                    <div className="text-xl font-black tabular-nums leading-none text-white/80">
                      {allOpen ? fmtCurrency(summary.staffingInvestment) : placeholder}
                    </div>
                    <div className="text-[11px] text-white/35 mt-0.5">Est. at $550/day benchmark</div>
                  </div>
                  {/* ROI Multiple */}
                  <div className="rounded-xl px-4 py-3 bg-emerald-500/20 border border-emerald-400/30">
                    <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-300/70 mb-1">
                      ROI Multiple
                    </div>
                    <div className="text-xl font-black tabular-nums leading-none text-emerald-300">
                      {allOpen ? fmtMultiple(summary.roiMultiple) : placeholder}
                    </div>
                    <div className="text-[11px] text-emerald-300/50 mt-0.5">Return on staffing investment</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
