/**
 * Google Apps Script Templates for Democracy 9-1 Web App
 * Target Spreadsheet: 1TKfYUXXOivesX99cY8xYS69w8eAL61h9eyK16DMkDzQ
 */

export const CODE_GS_TEMPLATE = `/**
 * ====================================================================
 * 정치와 민주주의 (9-1) 통합 학습 웹앱 - Google Apps Script 백엔드 (Code.gs)
 * 대상 스프레드시트: 1TKfYUXXOivesX99cY8xYS69w8eAL61h9eyK16DMkDzQ
 * 
 * [5대 페이지별 시트 구성]
 * - [시트1]: 1페이지 - 개념 빈칸 학습지 (형성평가)
 * - [시트2]: 2페이지 - 정치인가? 밸런스 퀴즈 (10문항 & 캔디)
 * - [시트3]: 3페이지 - 마인드맵 형성평가 (10문항)
 * - [시트4]: 4페이지 - 버블버블 15제 (15문항)
 * - [시트5]: 5페이지 - 숲속 미로 탐험 10제 (10문항, 2분/3분 도전)
 * ====================================================================
 */

var TARGET_SPREADSHEET_ID = '1TKfYUXXOivesX99cY8xYS69w8eAL61h9eyK16DMkDzQ';

function getSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    try {
      ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
    } catch (e) {
      Logger.log('openById error: ' + e);
    }
  }
  return ss;
}

// [테스트 실행용 함수] Apps Script 편집기에서 'testRun' 선택 후 [실행]을 누르면 안전하게 권한 승인 및 시트 연동을 테스트할 수 있습니다.
function testRun() {
  Logger.log('정치와 민주주의 시트 연동 테스트를 시작합니다...');
  var res = submitPage1({
    studentId: '00000',
    studentName: '선생님테스트',
    score: 100,
    correctCount: 100,
    totalQuestions: 100,
    details: 'Google Apps Script 정상 연동 확인 테스트'
  });
  Logger.log('테스트 결과: ' + JSON.stringify(res));
  return res;
}

// 1. GET 요청 처리 (브라우저 직접 접속, 최근 기록 조회 및 GET 전송 지원)
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    
    if (params.action === 'readRecent' || params.action === 'getRecords') {
      return ContentService.createTextOutput(JSON.stringify(getRecentRecords(params.page || 1, params.limit || 10)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (params.studentId || params.studentName || params.type || params.sheet || params.targetSheet) {
      var result = routeSubmission(params);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // URL로 직접 브라우저 접속 시: 자체 내장 HTML 상태 페이지 렌더링 (Index.html 불필요!)
    return HtmlService.createHtmlOutput([
      '<!DOCTYPE html>',
      '<html><head><meta charset="utf-8"><title>정치와 민주주의 학생 기록 시스템</title>',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<style>',
      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }',
      '.card { background: white; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; max-width: 520px; width: 100%; padding: 32px; text-align: center; }',
      '.badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: #dcfce7; color: #15803d; border-radius: 9999px; font-size: 13px; font-weight: 700; margin-bottom: 16px; }',
      'h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; }',
      'p { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 20px 0; }',
      '.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; background: #2563eb; color: white; border-radius: 12px; font-size: 14px; font-weight: 700; text-decoration: none; }',
      '</style></head><body>',
      '<div class="card">',
      '  <div class="badge">● 서버 정상 작동 중</div>',
      '  <h1>정치와 민주주의 학생 기록 백엔드</h1>',
      '  <p>1페이지부터 5페이지까지 학생들의 퀴즈 참여 및 수행 평가 데이터가 선생님의 구글 스프레드시트에 안전하게 자동 기록됩니다.</p>',
      '  <a class="btn" href="https://docs.google.com/spreadsheets/d/' + TARGET_SPREADSHEET_ID + '/edit" target="_blank">📊 연결된 구글 시트 확인하기</a>',
      '</div>',
      '</body></html>'
    ].join('\\n')).setTitle('정치와 민주주의 학생 기록 시스템').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 2. POST 요청 수신 및 분기
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err1) {
        try {
          data = JSON.parse(decodeURIComponent(e.postData.contents));
        } catch (err2) {
          data = e.parameter || {};
        }
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    
    if (e && e.parameter) {
      for (var k in e.parameter) {
        if (!data[k]) data[k] = e.parameter[k];
      }
    }
    
    var result = routeSubmission(data);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 3. 제출 데이터 페이지별 분기
function routeSubmission(data) {
  var sheetTarget = String(data.targetSheet || data.sheet || data.type || data.quizType || '');
  var pageNum = Number(data.pageNum || data.page || 0);

  if (pageNum === 5 || sheetTarget.indexOf('5') !== -1 || sheetTarget.indexOf('forest') !== -1 || sheetTarget.indexOf('maze') !== -1) {
    return submitPage5(data);
  } else if (pageNum === 4 || sheetTarget.indexOf('4') !== -1 || sheetTarget.indexOf('bubble') !== -1) {
    return submitPage4(data);
  } else if (pageNum === 3 || sheetTarget.indexOf('3') !== -1 || sheetTarget.indexOf('mindmap') !== -1) {
    return submitPage3(data);
  } else if (pageNum === 2 || sheetTarget.indexOf('2') !== -1 || sheetTarget.indexOf('balance') !== -1 || data.timeSpent !== undefined) {
    return submitPage2(data);
  } else {
    return submitPage1(data);
  }
}

function getOrCreateSheet(sheetName, headers, headerColor) {
  var ss = getSpreadsheet();
  if (!ss) {
    throw new Error('스프레드시트를 찾을 수 없습니다. (ID: ' + TARGET_SPREADSHEET_ID + ')');
  }
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    var existing = ss.getSheets();
    if (sheetName === '시트1' && existing.length > 0) {
      sheet = existing[0];
      sheet.setName('시트1');
    } else {
      sheet = ss.insertSheet(sheetName);
    }
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground(headerColor || '#2563eb');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

function submitPage1(data) {
  try {
    var sheet = getOrCreateSheet('시트1', ['학번', '이름', '총점', '제출일시', '정답수', '세부 채점 내역'], '#3b82f6');
    var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var studentId = String(data.studentId || '').trim();
    var studentName = String(data.studentName || '').trim();
    var score = Number(data.score) || 0;
    var correctCount = Number(data.correctCount) || score;
    var totalQuestions = Number(data.totalQuestions) || 100;
    var details = String(data.details || '');
    
    sheet.appendRow([studentId, studentName, score, timestamp, correctCount + ' / ' + totalQuestions, details]);
    sheet.autoResizeColumns(1, 6);
    return { success: true, target: '시트1', message: '1페이지 학습지 제출이 성공적으로 기록되었습니다.' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function submitPage2(data) {
  try {
    var sheet = getOrCreateSheet('시트2', ['학번', '이름', '점수', '도전회차', '맞힌 개수', '소요 시간(초)', '제출일시', '세부 채점 내역'], '#f97316');
    var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var studentId = String(data.studentId || '').trim();
    var studentName = String(data.studentName || '').trim();
    var score = Number(data.score) || 0;
    var correctCount = Number(data.correctCount) || 0;
    var totalQuestions = Number(data.totalQuestions) || 10;
    var attemptNumber = String(data.attemptNumber || 1);
    if (attemptNumber.indexOf('차') === -1) attemptNumber += '차 도전';
    var timeSpent = String(data.timeSpent || 0);
    if (timeSpent.indexOf('초') === -1) timeSpent += '초';
    var details = String(data.details || '');
    
    sheet.appendRow([studentId, studentName, score, attemptNumber, correctCount + ' / ' + totalQuestions, timeSpent, timestamp, details]);
    sheet.autoResizeColumns(1, 8);
    return { success: true, target: '시트2', message: '2페이지 밸런스 퀴즈 결과가 성공적으로 기록되었습니다.' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function submitPage3(data) {
  try {
    var sheet = getOrCreateSheet('시트3', ['학번', '이름', '점수', '제출일시', '맞힌 개수', '세부 채점 내역'], '#0d9488');
    var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var studentId = String(data.studentId || '').trim();
    var studentName = String(data.studentName || '').trim();
    var score = Number(data.score) || 0;
    var correctCount = Number(data.correctCount) || 0;
    var totalQuestions = Number(data.totalQuestions) || 10;
    var details = String(data.details || '');
    
    sheet.appendRow([studentId, studentName, score, timestamp, correctCount + ' / ' + totalQuestions, details]);
    sheet.autoResizeColumns(1, 6);
    return { success: true, target: '시트3', message: '3페이지 마인드맵 퀴즈 결과가 성공적으로 기록되었습니다.' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function submitPage4(data) {
  try {
    var sheet = getOrCreateSheet('시트4', ['학번', '이름', '점수', '제출일시', '맞힌 개수', '세부 채점 내역'], '#8b5cf6');
    var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var studentId = String(data.studentId || '').trim();
    var studentName = String(data.studentName || '').trim();
    var score = Number(data.score) || 0;
    var correctCount = Number(data.correctCount) || 0;
    var totalQuestions = Number(data.totalQuestions) || 15;
    var details = String(data.details || '');
    
    sheet.appendRow([studentId, studentName, score, timestamp, correctCount + ' / ' + totalQuestions, details]);
    sheet.autoResizeColumns(1, 6);
    return { success: true, target: '시트4', message: '4페이지 버블 퀴즈 결과가 성공적으로 기록되었습니다.' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function submitPage5(data) {
  try {
    var sheet = getOrCreateSheet('시트5', ['학번', '이름', '점수', '도전회차', '남은시간', '획득간식', '선택캐릭터', '제출일시', '맞힌 개수', '세부 채점 내역'], '#059669');
    var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var studentId = String(data.studentId || '').trim();
    var studentName = String(data.studentName || '').trim();
    var score = Number(data.score) || 0;
    var correctCount = Number(data.solvedCount || data.correctCount) || 0;
    var totalQuestions = Number(data.totalQuestions) || 10;
    var attemptNumber = Number(data.attemptNumber) === 2 ? '2차 재도전 (3분)' : '1차 도전 (2분)';
    var timeRemaining = String(data.timeRemaining || '0:00');
    var snacks = String(data.snacks !== undefined ? data.snacks + '개' : '0개');
    var character = String(data.character || '기본');
    var details = String(data.details || '');
    
    sheet.appendRow([studentId, studentName, score, attemptNumber, timeRemaining, snacks, character, timestamp, correctCount + ' / ' + totalQuestions, details]);
    sheet.autoResizeColumns(1, 10);
    return { success: true, target: '시트5', message: '5페이지 숲속 미로 탐험 결과가 성공적으로 기록되었습니다.' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function getRecentRecords(pageNum, limit) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { success: false, error: '시트를 열 수 없습니다.' };
    var sheetName = '시트' + pageNum;
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: true, sheetName: sheetName, headers: [], rows: [] };
    }
    
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    var rowCount = Math.min(Number(limit) || 10, lastRow - 1);
    var startRow = Math.max(2, lastRow - rowCount + 1);
    var rows = sheet.getRange(startRow, 1, rowCount, lastCol).getValues();
    
    return {
      success: true,
      sheetName: sheetName,
      headers: headers,
      rows: rows.reverse()
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}`;

export const INDEX_HTML_TEMPLATE = ``;
