import { useState, useMemo } from "react";
import Slider from "@/components/calculator/Slider";
import {
  AVG_PERIO_REVENUE,
  AVG_PROPHY_REVENUE,
  AVG_TREATMENT_VALUE,
  PERIO_PATIENT_SHARE,
  PERIO_RECALL_MONTHS,
  PRODUCTION_PER_SHIFT,
  PROPHY_RECALL_MONTHS,
  STAFFING_COST_PER_DAY,
  calcActivation,
  calcBacklogLoss,
  calcProtection,
  calcSummary,
  deriveTotalPatients,
} from "@/components/calculator/calculations";

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

// ─── Metric tile ───────────────────────────────────────────────────────────────
function Metric({
  label,
  value,
  sub,
  accent = "emerald",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "red" | "navy" | "emerald" | "neutral";
}) {
  const valueColor = {
    red: "text-red-500",
    navy: "text-[#023661]",
    emerald: "text-emerald-600",
    neutral: "text-navy-900",
  }[accent];

  return (
    <div className="bg-gray-50 rounded-xl px-3 py-3 border border-gray-100">
      <div
        className={`text-xl sm:text-2xl font-black tabular-nums leading-none ${valueColor}`}
      >
        {value}
      </div>
      <div className="text-[11px] font-semibold text-gray-500 mt-1.5 leading-snug">
        {label}
      </div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Layer header ──────────────────────────────────────────────────────────────
function LayerHeader({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="shrink-0 w-9 h-9 rounded-full bg-coral-50 border-2 border-coral-200 flex items-center justify-center">
        <span className="text-[10px] font-black text-coral-500">{step}</span>
      </div>
      <div>
        <h3 className="text-base font-semibold text-navy-900">{title}</h3>
        <p className="text-xs text-gray-500 font-medium mt-0.5 leading-snug">
          {description}
        </p>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function CalculatorCard() {
  // ── The four simplified inputs ─────────────────────────────────────────────
  const [chairs, setChairs] = useState(2);
  const [patientsPerChairPerDay, setPatientsPerChairPerDay] = useState(8);
  const [missedShiftsPerMonth, setMissedShiftsPerMonth] = useState(1);
  const [bookingWeeksOut, setBookingWeeksOut] = useState(26);

  const [assumptionsOpen, setAssumptionsOpen] = useState(false);

  const inputs = useMemo(
    () => ({
      chairs,
      patientsPerChairPerDay,
      missedShiftsPerMonth,
      bookingWeeksOut,
    }),
    [chairs, patientsPerChairPerDay, missedShiftsPerMonth, bookingWeeksOut],
  );

  const totalPatients = useMemo(
    () => deriveTotalPatients(chairs, patientsPerChairPerDay),
    [chairs, patientsPerChairPerDay],
  );

  const l1 = useMemo(() => calcProtection(inputs), [inputs]);
  const l2 = useMemo(() => calcBacklogLoss(inputs), [inputs]);
  const l3 = useMemo(() => calcActivation(inputs, l1), [inputs, l1]);
  const summary = useMemo(() => calcSummary(l1, l2, l3), [l1, l2, l3]);

  return (
    <div className="rounded-2xl overflow-hidden shadow-card-lg border border-gray-100 bg-white">
      {/* ── Card header ────────────────────────────────────────────────────── */}
      <div
        style={{ backgroundColor: "#003561" }}
        className="px-6 sm:px-8 py-6 border-b border-white/10 text-center"
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-coral-500 mb-1">
          Clinical Capacity &amp; Growth Diagnostic
        </p>
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
          See how much production you're losing to open chairs and a booked-out
          schedule.
        </h2>
        <p className="text-xs text-white/60 font-medium leading-relaxed max-w-xl mx-auto">
          Answer 4 quick questions. We use industry benchmarks for everything
          else.
        </p>
      </div>

      {/* ── The four inputs ────────────────────────────────────────────────── */}
      <div className="px-6 sm:px-8 py-5 bg-gray-50/60 border-b border-gray-100">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-4">
          Your Practice · 4 questions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-12 sm:gap-y-5">
          <Slider
            label="Number of hygiene chairs"
            value={chairs}
            onChange={setChairs}
            min={1}
            max={150}
            showRange
          />
          <Slider
            label="Patients per chair per day"
            value={patientsPerChairPerDay}
            onChange={setPatientsPerChairPerDay}
            min={1}
            max={15}
            showRange
          />
          <Slider
            label="Unworked hygiene shifts per month"
            description="Shifts lost to sick days, PTO, FMLA, and turnover"
            value={missedShiftsPerMonth}
            onChange={setMissedShiftsPerMonth}
            min={0}
            max={80}
          />
          <Slider
            label="Weeks out booking new hygiene patients"
            description="How far out new hygiene/perio patients are scheduled"
            value={bookingWeeksOut}
            onChange={setBookingWeeksOut}
            min={0}
            max={52}
            unit=" wks"
          />
        </div>
        <p className="text-[11px] text-gray-400 mt-4">
          <span className="font-semibold text-gray-500">
            Estimated active patient base: {fmtNum(totalPatients)}
          </span>{" "}
          · based on {chairs} chair{chairs !== 1 ? "s" : ""} ×{" "}
          {patientsPerChairPerDay} patients/day × industry capacity benchmark
        </p>
      </div>

      {/* ══ LAYER 1: Growth Protection ════════════════════════════════════════ */}
      <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-0 lg:divide-x lg:divide-gray-100">
          <div className="space-y-3 lg:pr-8">
            <LayerHeader
              step="01"
              title="Growth Protection"
              description="Unstaffed hygiene chairs reduce production and delay patient care."
            />
            <p className="text-[11px] text-gray-400 leading-relaxed">
              <span className="font-semibold text-gray-500">
                {missedShiftsPerMonth} unworked shift
                {missedShiftsPerMonth !== 1 ? "s" : ""} × 12 months × $1,200
                daily hygiene production
              </span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:pl-8">
            <div className="col-span-2">
              <Metric
                label="Annual Production Leakage"
                value={fmtCurrency(l1.annualLeakage)}
                sub="Production lost to unstaffed hygiene chairs"
                accent="red"
              />
            </div>
            <Metric
              label="Unseen Patients Due to Hygiene Gaps"
              value={fmtNum(l1.annualMissedVisits)}
              accent="red"
            />
            <Metric
              label="Delayed Treatment Opportunities"
              value={fmtNum(l1.delayedCases)}
              sub="Treatment delayed due to missed hygiene visits"
              accent="red"
            />
            <div className="col-span-2">
              <Metric
                label="Downstream Treatment Opportunity"
                value={fmtCurrency(l1.treatmentAtRisk)}
                sub="Treatment not diagnosed or scheduled due to missed visits"
                accent="red"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══ LAYER 2: Growth Potential (backlog loss) ══════════════════════════ */}
      <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-0 lg:divide-x lg:divide-gray-100">
          <div className="space-y-3 lg:pr-8">
            <LayerHeader
              step="02"
              title="Growth Potential"
              description="Patients booked past their recall interval represent lost visit capacity."
            />
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Booked{" "}
              <span className="font-semibold text-gray-500">
                {l2.backlogMonths.toFixed(1)} months
              </span>{" "}
              out. For every month beyond the recall interval, the practice loses
              a proportional share of the annual visit opportunity.
            </p>
            {l2.recoverableRevenue === 0 && (
              <p className="text-[11px] font-semibold text-emerald-600 leading-relaxed">
                You're scheduling within both recall intervals — no backlog loss.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 lg:pl-8">
            <Metric
              label="Perio Revenue at Risk"
              value={fmtCurrency(l2.perioLost)}
              sub={`25% of base · 3-mo recall · $${AVG_PERIO_REVENUE}/visit`}
              accent={l2.perioLost > 0 ? "red" : "emerald"}
            />
            <Metric
              label="Prophy Revenue at Risk"
              value={fmtCurrency(l2.prophyLost)}
              sub={`Full base · 6-mo recall · $${AVG_PROPHY_REVENUE}/visit`}
              accent={l2.prophyLost > 0 ? "red" : "emerald"}
            />
            <div className="col-span-2">
              <Metric
                label="Total Recoverable Revenue"
                value={fmtCurrency(l2.recoverableRevenue)}
                sub="Captured by booking patients within recall intervals"
                accent={l2.recoverableRevenue > 0 ? "red" : "emerald"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══ LAYER 3: Growth Activation (benchmark-based) ══════════════════════ */}
      <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-0 lg:divide-x lg:divide-gray-100">
          <div className="space-y-3 lg:pr-8">
            <LayerHeader
              step="03"
              title="Growth Activation"
              description="How much production you can recover by closing staffing gaps and expanding access."
            />
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Modeled on industry-typical expanded hours and added chair days,
              plus a{" "}
              <span className="font-bold text-navy-700">
                90% hygiene fill rate
              </span>{" "}
              — the Kwikly customer average — turning chronic staffing gaps into a
              predictable, managed system.
            </p>
          </div>
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
              sub={`At $${AVG_TREATMENT_VALUE.toLocaleString("en-US")} per patient`}
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
      </div>

      {/* ══ Assumptions ═══════════════════════════════════════════════════════ */}
      <div className="px-6 sm:px-8 py-3 border-b border-gray-100 bg-gray-50/40">
        <button
          onClick={() => setAssumptionsOpen((v) => !v)}
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400 hover:text-coral-500 transition-colors"
        >
          Benchmarks &amp; assumptions
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`w-3.5 h-3.5 transition-transform ${assumptionsOpen ? "rotate-180" : ""}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {assumptionsOpen && (
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-[11px] text-gray-500 leading-relaxed">
            <li>
              Patient base ={" "}
              <span className="font-semibold">chairs × patients/day × 125</span>{" "}
              (250 working days ÷ 2 hygiene visits/yr)
            </li>
            <li>
              Daily hygiene production:{" "}
              <span className="font-semibold">
                ${PRODUCTION_PER_SHIFT.toLocaleString("en-US")}/shift
              </span>
            </li>
            <li>
              Perio: <span className="font-semibold">25% of base</span>,{" "}
              {PERIO_RECALL_MONTHS}-month recall, ${AVG_PERIO_REVENUE}/visit
            </li>
            <li>
              Prophy: <span className="font-semibold">100% of base</span>,{" "}
              {PROPHY_RECALL_MONTHS}-month recall, ${AVG_PROPHY_REVENUE}/visit
            </li>
            <li>
              Downstream treatment: 35% of missed patients at $
              {AVG_TREATMENT_VALUE.toLocaleString("en-US")}
            </li>
            <li>
              Activation: industry-typical expanded hours/days + 90% Kwikly fill
              rate
            </li>
            <li>
              Staffing investment estimated at ${STAFFING_COST_PER_DAY}/chair/day
            </li>
          </ul>
        )}
      </div>

      {/* ══ GROWTH OPPORTUNITY SUMMARY ════════════════════════════════════════ */}
      <div style={{ backgroundColor: "#023661" }} className="px-6 sm:px-8 py-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 mb-4">
          Growth Opportunity Summary
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8">
          {/* Left: story summary cards */}
          <div className="space-y-2">
            <div className="rounded-xl px-4 py-3 bg-white/8 border border-white/10">
              <div className="text-xl font-black tabular-nums leading-none text-red-400">
                {fmtCurrency(summary.productionAtRisk)}{" "}
                <span className="text-sm font-semibold">Protected</span>
              </div>
              <div className="text-xs font-bold mt-1.5 text-white/80">
                Production at Risk
              </div>
              <div className="text-[11px] text-white/40 mt-0.5">
                Avoid cancellations / staffing gaps
              </div>
            </div>
            <div className="rounded-xl px-4 py-3 bg-white/8 border border-white/10">
              <div className="text-xl font-black tabular-nums leading-none text-[#60a5fa]">
                {fmtCurrency(summary.recoverableRevenue)}{" "}
                <span className="text-sm font-semibold">Recoverable</span>
              </div>
              <div className="text-xs font-bold mt-1.5 text-white/80">
                Recoverable Revenue Opportunity
              </div>
              <div className="text-[11px] text-white/40 mt-0.5">
                Perio backlog + Prophy backlog
              </div>
            </div>
            <div className="rounded-xl px-4 py-3 bg-white/8 border border-white/10">
              <div className="text-xl font-black tabular-nums leading-none text-emerald-400">
                {fmtCurrency(summary.growthActivated)}{" "}
                <span className="text-sm font-semibold">Achievable</span>
              </div>
              <div className="text-xs font-bold mt-1.5 text-white/80">
                Growth Activated
              </div>
              <div className="text-[11px] text-white/40 mt-0.5">
                Expanded hours + improved coverage
              </div>
            </div>
          </div>

          {/* Right: business impact */}
          <div className="flex flex-col justify-between gap-4">
            <div className="rounded-xl px-5 py-4 bg-white/15 border border-white/20 flex-1 flex flex-col justify-center">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50 mb-1">
                Total Production Opportunity
              </div>
              <div className="text-4xl sm:text-5xl font-black tabular-nums leading-none text-emerald-400">
                {fmtCurrency(summary.totalProductionOpportunity)}
              </div>
              <div className="text-[11px] text-white/40 mt-1.5">
                Production at Risk + Recoverable Revenue + Growth Activated
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl px-4 py-3 bg-white/8 border border-white/10">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40 mb-1">
                  Staffing Investment
                </div>
                <div className="text-xl font-black tabular-nums leading-none text-white/80">
                  {fmtCurrency(summary.staffingInvestment)}
                </div>
                <div className="text-[11px] text-white/35 mt-0.5">
                  Est. at ${STAFFING_COST_PER_DAY}/day benchmark
                </div>
              </div>
              <div className="rounded-xl px-4 py-3 bg-emerald-500/20 border border-emerald-400/30">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-300/70 mb-1">
                  ROI Multiple
                </div>
                <div className="text-xl font-black tabular-nums leading-none text-emerald-300">
                  {fmtMultiple(summary.roiMultiple)}
                </div>
                <div className="text-[11px] text-emerald-300/50 mt-0.5">
                  Return on staffing investment
                </div>
              </div>
            </div>
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
