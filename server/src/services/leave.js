// Annual leave: each calendar year's entitlement can be used until 30 June of the
// next year. Leave taken January–June uses up the previous year's remaining days
// first, then the current year's.
//
// `LeaveBalance.usedDays` predates individual entries; it is kept as days already
// used in that year ("recorded earlier").
export const DEFAULT_ENTITLEMENT = 20;

const lastValidDay = (year) => new Date(Date.UTC(year + 1, 5, 30, 23, 59, 59));
const inCarryOverWindow = (date) => date.getUTCMonth() < 6; // Jan–Jun

/**
 * @param {{ balances: Array<{year, totalDays, usedDays}>, entries: Array<{_id, from, days}>, today?: Date }}
 * @returns {{ years: Array, entries: Array, remaining: number }}
 *   years — the buckets still relevant today (current year, and last year while it is valid),
 *   entries — every entry with `allocation: [{ year, days }]`, newest first,
 *   remaining — days the employee can still take today.
 */
export const summarizeLeave = ({ balances, entries, today = new Date() }) => {
  const balanceByYear = new Map(balances.map((b) => [b.year, b]));
  const buckets = new Map();
  const bucket = (year) => {
    if (!buckets.has(year)) {
      const b = balanceByYear.get(year);
      buckets.set(year, {
        year,
        total: b?.totalDays ?? DEFAULT_ENTITLEMENT,
        isDefault: !b,
        recordedEarlier: b?.usedDays || 0,
        usedInYear: b?.usedDays || 0,   // taken during the year itself
        usedNextYear: 0,                // taken Jan–Jun of the following year
        validUntil: lastValidDay(year),
      });
    }
    return buckets.get(year);
  };
  const left = (b) => b.total - b.usedInYear - b.usedNextYear;

  const allocated = [...entries]
    .sort((a, b) => new Date(a.from) - new Date(b.from))
    .map((e) => {
      const from = new Date(e.from);
      const year = from.getUTCFullYear();
      let days = e.days;
      const allocation = [];
      if (inCarryOverWindow(from) && balanceByYear.has(year - 1)) {
        const prev = bucket(year - 1);
        const take = Math.min(Math.max(left(prev), 0), days);
        if (take > 0) {
          prev.usedNextYear += take;
          days -= take;
          allocation.push({ year: year - 1, days: take });
        }
      }
      if (days > 0) {
        bucket(year).usedInYear += days;
        allocation.push({ year, days });
      }
      return { ...e, allocation };
    })
    .reverse();

  const thisYear = today.getUTCFullYear();
  const shown = [bucket(thisYear)];
  const prev = buckets.get(thisYear - 1) || (balanceByYear.has(thisYear - 1) ? bucket(thisYear - 1) : null);
  if (prev && today <= prev.validUntil) shown.push(prev);

  const years = shown.map((b) => ({ ...b, remaining: left(b) }));
  return {
    years,
    entries: allocated,
    remaining: years.reduce((n, b) => n + Math.max(b.remaining, 0), 0),
  };
};
