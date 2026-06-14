"use client";

import { useState } from "react";

const MEMBERS = ["이름을 선택하세요", "유림", "레이첼"];

// 출석 기준 시간 (HH:MM) — .env.local의 NEXT_PUBLIC_TARGET_TIME 또는 여기 수정
const TARGET_TIME = process.env.NEXT_PUBLIC_TARGET_TIME ?? "10:00";

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

export default function Home() {
  const [name, setName] = useState(MEMBERS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    fine?: number;
    lateMinutes?: number;
  } | null>(null);

  const [hh, mm] = TARGET_TIME.split(":").map(Number);

  async function handleCheckIn() {
    if (name === MEMBERS[0]) {
      setResult({ success: false, message: "이름을 선택해 주세요." });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const nowMs = Date.now();
      const { lateMinutes, fine } = calcFine(nowMs, hh, mm);
      const now = new Date(nowMs);
      const dateStr = now.toLocaleDateString("ko-KR");
      const timeStr = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dateStr, timeStr, lateMinutes, fine }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: "출석 완료!", lateMinutes, fine });
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
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">스터디 출석체크</h1>
          <p className="mt-2 text-gray-500 text-base">
            출석 기준시간:{" "}
            <span className="font-semibold text-gray-700">{TARGET_TIME}</span>
          </p>
        </div>

        {/* Card */}
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
                {MEMBERS.map((m) => (
                  <option key={m} value={m} disabled={m === MEMBERS[0]}>
                    {m}
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
              "출석하기"
            )}
          </button>

          {/* Result */}
          {result && (
            <div
              className={`rounded-xl p-4 text-center ${
                result.success
                  ? "bg-emerald-50 border border-emerald-100"
                  : "bg-red-50 border border-red-100"
              }`}
            >
              {result.success ? (
                <>
                  <p className="text-emerald-700 font-semibold text-lg">{result.message}</p>
                  {result.lateMinutes === 0 ? (
                    <p className="text-emerald-600 text-base mt-1">정시 출석 🎉 벌금 없음</p>
                  ) : (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-orange-600 text-base font-medium">
                        {formatLate(result.lateMinutes!)}
                      </p>
                      <p className="text-orange-700 font-bold text-2xl">${result.fine} 벌금</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-red-600 text-base font-medium">{result.message}</p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          지각 시 $5 + 10분당 $2 추가
        </p>
      </div>
    </main>
  );
}
