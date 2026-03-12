function isRegularMarketOpen() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(now);

  const get = (type) => parts.find(p => p.type === type)?.value;

  const weekday = get("weekday"); // Mon, Tue, Wed...
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));

  const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };
  const dayNum = dayMap[weekday] || 0;

  if (dayNum < 1 || dayNum > 5) return false;

  const minutesSinceMidnight = hour * 60 + minute;
  const open = 9 * 60 + 30;   // 9:30 AM ET
  const close = 16 * 60;      // 4:00 PM ET

  return minutesSinceMidnight >= open && minutesSinceMidnight < close;
}
