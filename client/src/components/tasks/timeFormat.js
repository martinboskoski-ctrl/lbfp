// Quick picks for "how long did it take" (minutes).
export const TIME_PRESETS = [15, 30, 60, 120, 240, 480];

// 150 → "2ч 30м" / "2h 30m"
export const formatMinutes = (minutes, t) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h && t('time.h', { count: h }), m && t('time.m', { count: m })].filter(Boolean).join(' ');
};
