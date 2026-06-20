// 멤버 목록, 출근 기준 시간(HH:MM, 24시간제), 휴가 기간(yyyy-MM-dd ~ yyyy-MM-dd) — 코드에서 직접 수정하세요.
export type VacationRange = { start: string; end: string }; // 양 끝 날짜 포함

export const MEMBERS = [
  {
    name: "유림",
    targetTime: "10:00",
    vacations: [] as VacationRange[], // 예: [{ start: "2026-06-22", end: "2026-06-25" }]
  },
  {
    name: "레이첼",
    targetTime: "10:00",
    vacations: [] as VacationRange[],
  },
];

export type Member = (typeof MEMBERS)[number];

export function getTargetTime(name: string): string {
  return MEMBERS.find((m) => m.name === name)?.targetTime ?? "10:00";
}

export function isOnVacation(name: string, dateISO: string): boolean {
  const vacations = MEMBERS.find((m) => m.name === name)?.vacations ?? [];
  return vacations.some((v) => dateISO >= v.start && dateISO <= v.end);
}
