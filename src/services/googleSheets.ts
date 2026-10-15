/**
 * Google Apps Script backend integration service for democracy-9-1 app
 * Target Spreadsheet: 1TKfYUXXOivesX99cY8xYS69w8eAL61h9eyK16DMkDzQ
 *
 * This architecture secures the spreadsheet:
 * 1. The spreadsheet remains completely private to the teacher.
 * 2. Students don't need Google Accounts or OAuth login popups.
 * 3. Apps Script runs with teacher credentials and appends student records securely.
 */

export const SPREADSHEET_ID = '1TKfYUXXOivesX99cY8xYS69w8eAL61h9eyK16DMkDzQ';
export const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;

export interface SubmissionPayload {
  studentId: string;
  studentName: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  details?: string;
  attemptNumber?: number | string;
  timeSpent?: number | string;
  timeRemaining?: string;
  candiesEarned?: number;
  snacks?: number;
  character?: string;
  steps?: number;
  maxStreak?: number;
}

export const PAGE_SHEET_INFO: Record<
  number,
  { name: string; title: string; headers: string[] }
> = {
  1: {
    name: '시트1',
    title: '1페이지 개념 빈칸 학습지',
    headers: ['학번', '이름', '총점', '제출일시', '정답수', '세부 채점 내역']
  },
  2: {
    name: '시트2',
    title: '2페이지 정치인가? 밸런스 퀴즈',
    headers: ['학번', '이름', '점수', '도전회차', '맞힌 개수', '소요 시간(초)', '제출일시', '세부 채점 내역']
  },
  3: {
    name: '시트3',
    title: '3페이지 마인드맵 형성평가',
    headers: ['학번', '이름', '점수', '제출일시', '맞힌 개수', '세부 채점 내역']
  },
  4: {
    name: '시트4',
    title: '4페이지 버블버블 15제',
    headers: ['학번', '이름', '점수', '제출일시', '맞힌 개수', '세부 채점 내역']
  },
  5: {
    name: '시트5',
    title: '5페이지 숲속 미로 탐험 10제',
    headers: ['학번', '이름', '점수', '도전회차', '남은시간', '획득간식', '선택캐릭터', '제출일시', '맞힌 개수', '세부 채점 내역']
  }
};

/**
 * Submit student participation and quiz records to Google Apps Script
 */
export async function submitStudentResult(
  pageNum: number,
  payload: SubmissionPayload,
  gasUrl: string
): Promise<{ success: boolean; message: string }> {
  if (!gasUrl) {
    throw new Error('Google Apps Script 웹 앱 URL이 설정되지 않았습니다.');
  }

  const targetSheet = `시트${pageNum}`;
  const requestBody = {
    ...payload,
    pageNum,
    targetSheet,
    sheet: targetSheet,
    timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  };

  const urlWithParams = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}pageNum=${pageNum}&targetSheet=${encodeURIComponent(
    targetSheet
  )}&studentId=${encodeURIComponent(payload.studentId)}&studentName=${encodeURIComponent(
    payload.studentName
  )}&score=${payload.score}&correctCount=${payload.correctCount}&totalQuestions=${
    payload.totalQuestions
  }&details=${encodeURIComponent(payload.details || '')}`;

  try {
    // 1st attempt: POST request with text/plain (CORS safelisted, prevents preflight errors)
    await fetch(gasUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(requestBody)
    });
    return {
      success: true,
      message: `구글 스프레드시트 [${targetSheet}]에 성공적으로 기록되었습니다!`
    };
  } catch (postErr) {
    console.warn('POST failed, attempting GET fallback:', postErr);
    try {
      // 2nd attempt: GET request with query params
      await fetch(urlWithParams, { method: 'GET', mode: 'no-cors' });
      return {
        success: true,
        message: `구글 스프레드시트 [${targetSheet}]에 전송되었습니다.`
      };
    } catch (err: any) {
      throw new Error(`시트 전송 실패: ${err?.message || '네트워크 상태 및 웹 앱 URL을 확인해 주세요.'}`);
    }
  }
}

/**
 * Fetch recent records from Google Apps Script if supported
 */
export async function fetchRecentRecordsFromGas(
  gasUrl: string,
  pageNum: number,
  limit: number = 10
): Promise<{ success: boolean; sheetName: string; headers: string[]; rows: any[][] }> {
  if (!gasUrl) {
    return {
      success: false,
      sheetName: `시트${pageNum}`,
      headers: PAGE_SHEET_INFO[pageNum].headers,
      rows: []
    };
  }

  const url = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}action=readRecent&page=${pageNum}&limit=${limit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      success: true,
      sheetName: data.sheetName || `시트${pageNum}`,
      headers: data.headers || PAGE_SHEET_INFO[pageNum].headers,
      rows: data.rows || []
    };
  } catch (err) {
    // Expected if GAS doesn't have CORS enabled for GET or if offline
    return {
      success: false,
      sheetName: `시트${pageNum}`,
      headers: PAGE_SHEET_INFO[pageNum].headers,
      rows: []
    };
  }
}
