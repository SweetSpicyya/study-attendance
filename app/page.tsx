"use client";

import { useState } from "react";
import { MEMBERS, getTargetTime, isOnVacation } from "./lib/members";
import Dashboard from "./components/Dashboard";

const NAMES = ["이름을 선택하세요", ...MEMBERS.map((m) => m.name)];

function formatLate(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분 지각`;
  if (m === 0) return `${h}시간 지각`;
  return `${h}시간 ${m}분 지각`;
}

function calcFine(nowMs: number, targetHH: number, targetMM: number): { lateMinutes: number; fine: number } {
  const now = new Date(nowMs);
  const target = new Date(now);
  target.setHours(targetHH, targetMM, 0, 0);

  const diffMs = now.getTime() - target.getTime();
  if (diffMs <= 0) return { lateMinutes: 0, fine: 0 };

  const lateMinutes = Math.floor(diffMs / 60000);
  const fine = 5 + Math.floor(lateMinutes / 10) * 2;
  return { lateMinutes, fine };
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Home() {
  const [name, setName] = useState(NAMES[0]);
  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    fine?: number;
    lateMinutes?: number;
    isVacation?: boolean;
  } | null>(null);

  const targetTime = name === NAMES[0] ? getTargetTime(MEMBERS[0].name) : getTargetTime(name);
  const [hh, mm] = targetTime.split(":").map(Number);

  async function handleCheckIn() {
    if (name === NAMES[0]) {
      setResult({ success: false, message: "이름을 선택해 주세요." });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const nowMs = Date.now();
      const now = new Date(nowMs);
      const dateStr = toISODate(now);
      const vacation = isOnVacation(name, dateStr);
      const { lateMinutes, fine } = vacation ? { lateMinutes: 0, fine: 0 } : calcFine(nowMs, hh, mm);
      const timeStr = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dateStr, timeStr, lateMinutes, fine, isVacation: vacation }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: "출근 완료!", lateMinutes, fine, isVacation: vacation });
        setCheckedIn(true);
      } else {
        setResult({ success: false, message: data.error ?? "오류가 발생했습니다." });
      }
    } catch {
      setResult({ success: false, message: "서버 연결에 실패했습니다." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-10 gap-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">스터디 출근체크</h1>
          {!checkedIn && (
            <p className="mt-2 text-gray-500 text-base">
              출근 기준시간:{" "}
              <span className="font-semibold text-gray-700">{targetTime}</span>
            </p>
          )}
        </div>

        {/* Check-in card */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            checkedIn ? "max-h-0 opacity-0 -translate-y-8" : "max-h-[600px] opacity-100 translate-y-0"
          }`}
        >
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
            {/* Name selector */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">이름</label>
              <div className="relative">
                <select
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setResult(null);
                  }}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition cursor-pointer"
                >
                  {NAMES.map((n) => (
                    <option key={n} value={n} disabled={n === NAMES[0]}>
                      {n}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Check-in button */}
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full py-5 rounded-2xl bg-gray-900 text-white text-xl font-semibold tracking-wide hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  기록 중...
                </span>
              ) : (
                "출근하기"
              )}
            </button>

            {/* Result */}
            {result && !result.success && (
              <div className="rounded-xl p-4 text-center bg-red-50 border border-red-100">
                <p className="text-red-600 text-base font-medium">{result.message}</p>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            지각 시 $5 + 10분당 $2 추가
          </p>
        </div>

        {/* Post check-in result */}
        {checkedIn && result?.success && (
          <div className="rounded-xl p-4 text-center bg-emerald-50 border border-emerald-100 mb-6">
            <p className="text-emerald-700 font-semibold text-lg">{result.message}</p>
            {result.isVacation ? (
              <p className="text-sky-600 text-base mt-1">휴가 처리 🌴 벌금 없음</p>
            ) : result.lateMinutes === 0 ? (
              <p className="text-emerald-600 text-base mt-1">정시 출근 🎉 벌금 없음</p>
            ) : (
              <div className="mt-1 space-y-0.5">
                <p className="text-orange-600 text-base font-medium">{formatLate(result.lateMinutes!)}</p>
                <p className="text-orange-700 font-bold text-2xl">${result.fine} 벌금</p>
              </div>
            )}
          </div>
        )}
      </div>

      {checkedIn && (
        <div className="w-full max-w-2xl">
          <Dashboard />
        </div>
      )}
    </main>
  );
}
