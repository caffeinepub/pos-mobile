const WORK_DATE_KEY = "pos_work_date";

export function getWorkDate(): string {
  return (
    localStorage.getItem(WORK_DATE_KEY) ?? new Date().toISOString().slice(0, 10)
  );
}

export function advanceWorkDate(): string {
  // Advance to tomorrow from the current work date
  const current = new Date(`${getWorkDate()}T00:00:00`);
  current.setDate(current.getDate() + 1);
  // But don't go beyond today's real date
  const today = new Date();
  const next = current > today ? today : current;
  const nextStr = next.toISOString().slice(0, 10);
  localStorage.setItem(WORK_DATE_KEY, nextStr);
  return nextStr;
}

export function resetWorkDateToToday(): string {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(WORK_DATE_KEY, today);
  return today;
}
