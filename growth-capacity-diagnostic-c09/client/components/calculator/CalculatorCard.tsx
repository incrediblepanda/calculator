import { useState, useMemo } from "react";
import Slider from "./Slider";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

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
function fmtDec(n: number, digits = 1) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits });
}
function fmtPct(n: number) {
  return `${(n * 100).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
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

// ─── Drawer line item ──────────────────────────────────────────────────────────
function Row({
  label, value, formula, strong = false,
}: {
  label: string; value: string; formula?: string; strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
      <div className="min-w-0">
        <div className={`text-[13px] ${strong ? "font-bold text-navy-900" : "font-medium text-gray-600"}`}>{label}</div>
        {formula && <div className="text-[11px] text-gray-400 mt-0.5">{formula}</div>}
      </div>
      <div className={`shrink-0 tabular-nums ${strong ? "text-base font-black text-navy-900" : "text-sm font-bold text-navy-800"}`}>
        {value}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-coral-500 mt-5 mb-1.5 first:mt-0">
      {children}
    </p>
  );
}

// ─── Stacked "opportunity makeup" bar (renders on the dark summary band) ────────
function OpportunityBar({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const shown = segments.filter((s) => s.value > 0);
  if (total <= 0 || shown.length === 0) return null;

  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-white/10">
        {shown.map((s) => (
          <div
            key={s.label}
            className="h-full"
            style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
            title={`${s.label}: ${fmtCurrency(s.value)}`}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2">
        {shown.map((s) => (
          <div key={s.label} className="flex items-start gap-2">
            <span className="w-2.5 h-2.5 mt-0.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-white/70 leading-tight">{s.label}</div>
              <div className="text-sm font-black tabular-nums text-white leading-tight mt-0.5">
                {fmtCurrency(s.value)}{" "}
                <span className="text-white/40 font-semibold text-[11px]">
                  · {Math.round((s.value / total) * 100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function CalculatorCard() {
  // ── The four office inputs ───────────────────────────────────────────────────
  const [hygieneChairs, setHygieneChairs] = useState(2);
  const [patientsPerChairPerDay, setPatientsPerChairPerDay] = useState(8);
  const [shiftsUnworkedPerMonth, setShiftsUnworkedPerMonth] = useState(2);
  const [weeksOut, setWeeksOut] = useState(14);

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

    // Staffing gaps (protect) — assume Kwikly covers 100% of unworked shifts
    const productionAtRisk = shiftsUnworkedPerMonth * 12 * prodPerChairDay;
    const protectedRevenue = productionAtRisk;

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
      // Derived norms
      cleaningShare,
      cleaningRecallInterval,
      perioRecallInterval,
      activePanel,
      prodPerChairDay,
      backlogMonths,
      valuePerNewPatient,
      // Staffing gaps
      productionAtRisk,
      protectedRevenue,
      // Backlog — existing patients
      perioLossFactor,
      lostPerioVisits,
      perioRevenueLost,
      cleaningLossFactor,
      lostCleaningVisits,
      cleaningRevenueLost,
      recurringLeftOnTable,
      // Backlog — new patients
      newPatientsPerYear,
      lossRate,
      newPatientsLostPerYear,
      newPatientRevenueLost,
      // Totals
      backlogCore,
      totalOpportunityCore,
      // Recommended shifts
      shiftsToCoverGaps,
      digOutVisits,
      digOutShiftsPerMonth,
      recommendedShiftsPerMonth,
      // Rep-only:
      untreatedCleaningVisits,
      withDownstreamPotential,
      downstreamRevenue,
      totalOpportunityWithDownstream,
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
            description="Sick days, PTO, callouts, and open shifts you can't fill"
            value={shiftsUnworkedPerMonth}
            onChange={setShiftsUnworkedPerMonth}
            min={0} max={40}
          />
          <Slider
            label="Weeks out booking patients"
            description="How far out the schedule is booked"
            value={weeksOut}
            onChange={setWeeksOut}
            min={0} max={52}
          />
        </div>
      </div>

      {/* ── Outputs: what the office sees ──────────────────────────────────── */}
      <div className="px-6 sm:px-8 py-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
            What your office sees
          </p>
          <Drawer>
            <DrawerTrigger className="inline-flex items-center gap-1.5 text-[11px] font-bold text-navy-700 hover:text-coral-500 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6m3 6v-4m3 4v-8M3 4h18M5 4v16a1 1 0 001 1h12a1 1 0 001-1V4" />
              </svg>
              See the detailed calculations
            </DrawerTrigger>
            <DrawerContent className="max-h-[88vh]">
              <DrawerHeader className="border-b border-gray-100">
                <DrawerTitle className="text-navy-900">Behind the scenes: the math</DrawerTitle>
                <DrawerDescription>
                  You enter four numbers. Everything below is derived from fixed dental industry benchmarks.
                </DrawerDescription>
              </DrawerHeader>

              <div className="overflow-y-auto px-5 sm:px-6 py-4">
                <div className="mx-auto max-w-2xl">
                  <SectionTitle>What you entered</SectionTitle>
                  <Row label="Hygiene chairs" value={fmtNum(hygieneChairs)} />
                  <Row label="Hygiene patients per chair, per day" value={fmtNum(patientsPerChairPerDay)} />
                  <Row label="Shifts unworked per month" value={fmtNum(shiftsUnworkedPerMonth)} />
                  <Row label="Weeks out booking new patients" value={fmtNum(weeksOut)} />

                  <SectionTitle>Benchmarks (industry norms, held constant)</SectionTitle>
                  <Row label="Working days per month" value={fmtNum(ASSUMPTIONS.workingDaysPerMonth)} />
                  <Row label="Production per cleaning visit" value={fmtCurrency(ASSUMPTIONS.productionPerCleaningVisit)} />
                  <Row label="Production per perio visit" value={fmtCurrency(ASSUMPTIONS.productionPerPerioVisit)} />
                  <Row label="Target cleaning visits per year" value={fmtNum(ASSUMPTIONS.targetCleaningVisitsPerYear)} formula="Every 6 months" />
                  <Row label="Target perio visits per year" value={fmtNum(ASSUMPTIONS.targetPerioVisitsPerYear)} formula="Every 3 months" />
                  <Row label="Perio share of patient panel" value={fmtPct(ASSUMPTIONS.perioShareOfPanel)} />
                  <Row label="New patients per chair per month" value={fmtNum(ASSUMPTIONS.newPatientsPerChairPerMonth)} />
                  <Row label="New patient value horizon" value={`${fmtNum(ASSUMPTIONS.newPatientValueHorizonYears)} yr`} />

                  <SectionTitle>Derived from your inputs</SectionTitle>
                  <Row label="Active patient panel" value={fmtNum(m.activePanel)} formula="chairs x patients/day x 21 days x 12 / 2" strong />
                  <Row label="Production per chair per day" value={fmtCurrency(m.prodPerChairDay)} formula="patients/day x $150" />
                  <Row label="Backlog in months" value={`${fmtDec(m.backlogMonths, 2)} mo`} formula="weeks out x 12 / 52" />
                  <Row label="Value per new patient" value={fmtCurrency(m.valuePerNewPatient)} formula="2 cleanings x $150 x 1 yr" />

                  {m.productionAtRisk > 0 && (
                    <>
                      <SectionTitle>Staffing gaps (protect)</SectionTitle>
                      <Row label="Currently lost to staffing gaps / yr" value={fmtCurrency(m.productionAtRisk)} formula="shifts unworked x 12 x prod per chair/day" strong />
                      <Row label="Booked revenue you protect / yr" value={fmtCurrency(m.protectedRevenue)} formula="Kwikly covers 100% of unworked shifts" strong />
                    </>
                  )}

                  {m.recurringLeftOnTable > 0 && (
                    <>
                      <SectionTitle>Backlog: existing patients</SectionTitle>
                      {m.perioRevenueLost > 0 && (
                        <>
                          <Row label="Perio loss factor" value={fmtDec(m.perioLossFactor, 3)} formula="clamp((backlog - 3) / 3, 0, 4)" />
                          <Row label="Lost perio visits / yr" value={fmtDec(m.lostPerioVisits)} formula="factor x panel x 25%" />
                          <Row label="Perio revenue lost" value={fmtCurrency(m.perioRevenueLost)} formula="x $250 per perio visit" />
                        </>
                      )}
                      {m.cleaningRevenueLost > 0 && (
                        <>
                          <Row label="Cleaning loss factor" value={fmtDec(m.cleaningLossFactor, 3)} formula="clamp((backlog - 6) / 6, 0, 2)" />
                          <Row label="Lost cleaning visits / yr" value={fmtDec(m.lostCleaningVisits)} formula="factor x panel x 75%" />
                          <Row label="Cleaning revenue lost" value={fmtCurrency(m.cleaningRevenueLost)} formula="x $150 per cleaning visit" />
                        </>
                      )}
                      <Row label="Recurring revenue left on the table" value={fmtCurrency(m.recurringLeftOnTable)} formula="perio lost + cleaning lost" strong />
                    </>
                  )}

                  <SectionTitle>Backlog: new patients</SectionTitle>
                  <Row label="New patients per year" value={fmtNum(m.newPatientsPerYear)} formula="15 x chairs x 12" />
                  <Row label="Loss rate at this booking distance" value={fmtPct(m.lossRate)} formula="looked up from weeks-out table" />
                  {m.newPatientRevenueLost > 0 && (
                    <>
                      <Row label="New patients lost per year" value={fmtDec(m.newPatientsLostPerYear)} formula="new patients x loss rate" />
                      <Row label="New patient revenue lost" value={fmtCurrency(m.newPatientRevenueLost)} formula="x $300 value per new patient" strong />
                    </>
                  )}

                  <SectionTitle>Totals</SectionTitle>
                  {m.backlogCore > 0 && (
                    <Row label="Stuck in your backlog (core)" value={fmtCurrency(m.backlogCore)} formula="recurring + new patient loss" strong />
                  )}
                  <Row label="Your opportunity with Kwikly" value={fmtCurrency(m.totalOpportunityCore)} formula="protected + backlog core" strong />

                  <SectionTitle>Recommended per diem shifts</SectionTitle>
                  <Row label="Shifts to cover gaps" value={fmtNum(m.shiftsToCoverGaps)} formula="rounded shifts unworked" />
                  {m.digOutVisits > 0 && (
                    <>
                      <Row label="Lost visits to dig out" value={fmtDec(m.digOutVisits)} formula="perio + cleaning + new patient cleanings" />
                      <Row label="Dig-out shifts per month" value={fmtDec(m.digOutShiftsPerMonth, 2)} formula="lost visits / patients per day / 12" />
                    </>
                  )}
                  <Row label="Recommended per diem shifts / month" value={fmtNum(m.recommendedShiftsPerMonth)} formula="cover gaps + dig out" strong />

                  {m.downstreamRevenue > 0 && (
                    <>
                      <SectionTitle>Downstream treatment</SectionTitle>
                      <Row label="Untreated cleaning visits / yr" value={fmtDec(m.untreatedCleaningVisits)} formula="lost cleanings + new patient cleanings" />
                      <Row label="With downstream potential" value={fmtDec(m.withDownstreamPotential)} formula="x 40% share" />
                      <Row label="Downstream revenue at stake" value={fmtCurrency(m.downstreamRevenue)} formula="x $1,700 per case" strong />
                      <Row label="Total opportunity incl. downstream" value={fmtCurrency(m.totalOpportunityWithDownstream)} formula="core + downstream" strong />
                    </>
                  )}
                </div>
              </div>

              <DrawerClose className="m-4 mt-2 inline-flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-navy-800 font-bold text-sm py-3 transition-colors">
                Close
              </DrawerClose>
            </DrawerContent>
          </Drawer>
        </div>

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
            sub={
              Math.round(m.digOutShiftsPerMonth) > 0
                ? `${m.shiftsToCoverGaps} to cover unworked shifts + ${Math.round(m.digOutShiftsPerMonth)} to work down the backlog`
                : `${m.shiftsToCoverGaps} to cover your unworked shifts`
            }
            accent="navy"
          />
        </div>

        {/* Backlog breakdown */}
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-navy-800">Stuck in your backlog (per year)</div>
              <div className="text-[11px] text-gray-500 mt-0.5 max-w-md">
                {m.backlogCore > 0 ? (
                  <>Booked <span className="font-semibold text-navy-700">{weeksOut} weeks out</span>, new patients go elsewhere and current patients fall behind on recall.</>
                ) : (
                  <>At <span className="font-semibold text-navy-700">{weeksOut} weeks out</span>, patients still get in on time, so nothing's stuck yet.</>
                )}
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums text-red-500 shrink-0">
              {fmtCurrency(m.backlogCore)}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-white rounded-lg border border-gray-100 px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold text-navy-800">New patients who go elsewhere</span>
                <span className="text-sm font-black tabular-nums text-red-500 shrink-0">{fmtCurrency(m.newPatientRevenueLost)}</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                New patients won't wait {weeksOut} weeks, so they book elsewhere. This is their first-year value.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold text-navy-800">Recurring revenue left on the table</span>
                <span className="text-sm font-black tabular-nums text-red-500 shrink-0">{fmtCurrency(m.recurringLeftOnTable)}</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                Existing patients, especially perio, slip past their 3-month recall when the schedule is full, so you bill fewer visits than planned.
              </p>
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

        {m.totalOpportunityCore > 0 && (
          <div className="mt-4 rounded-xl px-5 py-4 bg-white/8 border border-white/10">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50 mb-3">
              What makes up your opportunity
            </div>
            <OpportunityBar
              segments={[
                { label: "Production you protect", value: m.protectedRevenue, color: "#34d399" },
                { label: "New patients who go elsewhere", value: m.newPatientRevenueLost, color: "#fb7185" },
                { label: "Recurring revenue left on the table", value: m.recurringLeftOnTable, color: "#fbbf24" },
              ]}
            />
          </div>
        )}

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
