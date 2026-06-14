import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  return new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
}

function formatLate(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분 지각`;
  if (m === 0) return `${h}시간 지각`;
  return `${h}시간 ${m}분 지각`;
}

export async function POST(req: NextRequest) {
  try {
    const { name, dateStr, timeStr, lateMinutes, fine } = await req.json();

    if (!name || !dateStr || !timeStr) {
      return NextResponse.json({ error: "필수 값이 없습니다." }, { status: 400 });
    }

    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "SPREADSHEET_ID가 설정되지 않았습니다." }, { status: 500 });
    }

    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "출석!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            dateStr,
            timeStr,
            name,
            lateMinutes > 0 ? formatLate(lateMinutes) : "정시",
            lateMinutes > 0 ? `$${fine}` : "$0",
          ],
        ],
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "시트 저장에 실패했습니다." }, { status: 500 });
  }
}
