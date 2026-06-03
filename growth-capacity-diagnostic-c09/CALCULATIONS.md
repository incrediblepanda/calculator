# Growth Diagnostic — Calculations (Simplified Model)

**Audience:** Revenue leadership and reps
**Purpose:** How the simplified tool turns four operational inputs into a sized growth opportunity — mirrors the "Growth2 / Devin's Model" spreadsheet.

---

## What the tool does

The office enters **four numbers**. Everything else is derived from fixed dental
industry benchmarks, so the user never has to know the underlying specifics.

All math runs in the browser. Benchmarks are fixed assumptions, not live practice data.

---

## What the office enters (the only inputs)

| Input | Default |
|-------|---------|
| Hygiene chairs | 2 |
| Hygiene patients per chair, per day | 8 |
| Shifts unworked per month (a chair sits empty) | 2 |
| Weeks out booking new patients | 16 |

---

## Benchmarks and norms (held constant)

| Assumption | Value | Role |
|------------|-------|------|
| Working days per month | 21 | Annualizes daily figures |
| Production per cleaning visit | $150 | Cleaning revenue (includes doctor exam) |
| Production per perio visit | $250 | Perio revenue |
| Target cleaning visits per year | 2 | Every 6 months |
| Target perio visits per year | 4 | Every 3 months |
| Perio share of patient panel | 25% | Splits panel perio vs. cleaning |
| New patients per chair per month | 15 | New-patient demand |
| Kwikly fill rate | 100% | Share of unworked shifts protected |
| New patient value horizon | 1 year | Recall value banked |
| Untreated cleanings with downstream potential | 40% | Links missed visits to treatment (rep only) |
| Downstream revenue per case | $1,700 | Treatment value (rep only) |

**New-patient loss share by booking distance (weeks out):**

| Weeks out | Share lost |
|-----------|------------|
| 4 or less | 0% |
| 5 to 8 | 10% |
| 9 to 13 | 20% |
| 14 to 26 | 35% |
| 27 or more | 50% |

---

## Derived values

- **Active patient panel** = chairs × patients/day × 21 working days × 12 ÷ 2
- **Production per chair per day** = patients/day × $150
- **Backlog in months** = weeks out × 12 ÷ 52
- **Value per new patient** = 2 cleaning visits × $150 × 1 year horizon = $300

---

## Staffing gaps (protect)

- **Currently lost to staffing gaps (per year)** = shifts unworked × 12 × production per chair per day
- **Booked revenue you protect (per year)** = production at risk × Kwikly fill rate

---

## Backlog — existing patients

- **Perio loss factor** = clamp((backlog months − 3) ÷ 3, 0, 4) — counts time past the 3-month perio interval
- **Perio revenue lost** = perio loss factor × panel × 25% × $250
- **Cleaning loss factor** = clamp((backlog months − 6) ÷ 6, 0, 2) — counts time past the 6-month cleaning interval
- **Cleaning revenue lost** = cleaning loss factor × panel × 75% × $150
- **Recurring revenue left on the table** = perio lost + cleaning lost

## Backlog — new patients

- **New patients per year** = 15 × chairs × 12
- **Loss rate** = looked up from the weeks-out table above
- **New patient revenue lost** = new patients/yr × loss rate × $300

---

## Totals (what the office sees)

| Line | Source |
|------|--------|
| Active patients (estimated) | Derived panel |
| Currently lost to staffing gaps (per year) | Production at risk |
| Booked revenue you protect (per year) | Production at risk × fill rate |
| **Stuck in your backlog (per year)** | Recurring left on table + new patient revenue lost |
| — New patients who go elsewhere | New patient revenue lost |
| — Recurring revenue left on the table | Perio + cleaning lost |
| **Your opportunity with Kwikly (per year)** | Protected + backlog core |
| Recommended per diem shifts per month | Cover gaps + dig out (below) |

**Recommended per diem shifts per month** = round(shifts unworked) + round(dig-out shifts), where
dig-out shifts = (lost perio visits + lost cleaning visits + new patient cleanings) ÷ patients per day ÷ 12.

---

## Rep talking point (computed, not shown on the page)

- **Downstream treatment at stake (per year)** = (lost cleaning visits + new patient cleanings) × 40% × $1,700
- **Total opportunity including downstream** = core opportunity + downstream

These two lines are calculated but intentionally hidden from the customer-facing
view; they are rep-only context.

---

## Reference numbers (default inputs)

With 2 chairs, 8 patients/chair/day, 2 shifts unworked, 16 weeks out:

- Active patients: **2,016**
- Booked revenue you protect: **$28,800**
- Currently lost to staffing gaps: **$28,800**
- Stuck in your backlog: **$66,877** ($37,800 new + $29,077 recurring)
- Your opportunity with Kwikly: **$95,677**
- Recommended per diem shifts: **6**
- (Rep only) Downstream at stake: **$171,360**; total with downstream: **$267,037**
