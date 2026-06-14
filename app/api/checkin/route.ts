import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { name, timestamp, lateMinutes, fine } = await req.json();

    if (!name || !timestamp) {
      return NextResponse.json({ error: "필수 값이 없습니다." }, { status: 400 });
    }

    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "SPREADSHEET_ID가 설정되지 않았습니다." }, { status: 500 });
    }

    const now = new Date(timestamp);
    const dateStr = now.toLocaleDateString("ko-KR", { timeZone: "America/New_York" });
    const timeStr = now.toLocaleTimeString("ko-KR", { timeZone: "America/New_York", hour12: false });

    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "출석!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            dateStr,
            timeStr,
            name,
            lateMinutes > 0 ? `${lateMinutes}분 지각` : "정시",
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
