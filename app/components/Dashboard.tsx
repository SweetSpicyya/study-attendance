"use client";

import { useEffect, useState } from "react";
import { MEMBERS } from "../lib/members";

type AttendanceRecord = {
  date: string; // yyyy-MM-dd
  time: string;
  name: string;
  lateText: string;
  fine: string;
};

type DayStatus = "present" | "late" | "absent" | "vacation" | "pending";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekDates(today: Date): Date[] {
  const day = today.getDay(); // 0=일 ... 6=토
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const STATUS_STYLE: Record<string, string> = {
  present: "bg-emerald-500",
  late: "bg-orange-500",
  absent: "bg-red-500",
  vacation: "bg-sky-500",
  pending: "bg-gray-200",
};

function parseFine(fine: string): number {
  const n = Number(fine.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export default function Dashboard() {
  const [records, setRecords] = useState<AttendanceRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/checkin")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setRecords(data.records);
      })
      .catch(() => setError("대시보드 데이터를 불러오지 못했습니다."));
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekDates = getWeekDates(today);

  function statusFor(memberName: string, date: Date): DayStatus {
    const iso = toISODate(date);
    const record = records?.find((r) => r.date === iso && r.name === memberName);
    if (record) {
      if (record.lateText === "휴가") return "vacation";
      return record.lateText === "정시" ? "present" : "late";
    }
    if (date < today) return "absent";
    return "pending";
  }

  const weekStartISO = toISODate(weekDates[0]);
  const weekEndISO = toISODate(weekDates[6]);

  function weeklyFine(memberName: string): number {
    if (!records) return 0;
    return records
      .filter((r) => r.name === memberName && r.date >= weekStartISO && r.date <= weekEndISO)
      .reduce((sum, r) => sum + parseFine(r.fine), 0);
  }

  function totalFine(memberName: string): number {
    if (!records) return 0;
    return records.filter((r) => r.name === memberName).reduce((sum, r) => sum + parseFine(r.fine), 0);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
      <h2 className="text-xl font-bold text-gray-900 text-center">이번 주 출근 현황</h2>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {!error && !records && (
        <p className="text-gray-400 text-sm text-center">불러오는 중...</p>
      )}

      {records && (
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-gray-500 pb-2">이름</th>
                {DAY_LABELS.map((label, i) => (
                  <th key={label} className="text-sm font-medium text-gray-500 pb-2">
                    {label}
                    <div className="text-xs text-gray-400">{weekDates[i].getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEMBERS.map((member) => (
                <tr key={member.name}>
                  <td className="text-left text-sm font-medium text-gray-700 py-1.5">
                    {member.name}
                  </td>
                  {weekDates.map((date) => {
                    const status = statusFor(member.name, date);
                    return (
                      <td key={date.toISOString()} className="py-1.5">
                        <span
                          className={`inline-block w-5 h-5 rounded-full ${STATUS_STYLE[status]}`}
                          title={status}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-center gap-4 mt-5 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> 정상출근
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> 지각
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> 미출근
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" /> 휴가
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" /> 예정
            </span>
          </div>

          <table className="w-full text-center border-collapse mt-8">
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-gray-500 pb-2">이름</th>
                <th className="text-sm font-medium text-gray-500 pb-2">이번 주 벌금</th>
                <th className="text-sm font-medium text-gray-500 pb-2">총 누적 벌금</th>
              </tr>
            </thead>
            <tbody>
              {MEMBERS.map((member) => (
                <tr key={member.name} className="border-t border-gray-100">
                  <td className="text-left text-sm font-medium text-gray-700 py-2">{member.name}</td>
                  <td className="text-sm text-orange-600 font-semibold py-2">${weeklyFine(member.name)}</td>
                  <td className="text-sm text-gray-900 font-bold py-2">${totalFine(member.name)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
