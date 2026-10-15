import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  BookOpen,
  Send,
  Award,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Check,
  Flame,
  AlertTriangle,
  GraduationCap
} from 'lucide-react';
import {
  BLANK_QUESTIONS,
  ANALYSIS_QUESTIONS,
  ATTITUDE_ITEMS,
  OX_QUESTIONS,
  TEXTBOOK_CONCEPTS_SUMMARY
} from '../data/worksheet9_1Data';
import { sounds } from '../utils/audio';
import { submitStudentResult } from '../services/googleSheets';


interface Worksheet9_1Props {
  studentId: string;
  studentName: string;
  gasUrl: string;
  onStudentIdChange?: (val: string) => void;
  onStudentNameChange?: (val: string) => void;
}

export const Worksheet9_1: React.FC<Worksheet9_1Props> = ({
  studentId,
  studentName,
  gasUrl,
  onStudentIdChange,
  onStudentNameChange
}) => {
  // Input states for Part I: Blank answers
  const [blankInputs, setBlankInputs] = useState<Record<string, string>>({
    blank_ga: '',
    blank_na: '',
    blank_da: '',
    blank_ra: '',
    blank_ma: '',
    blank_ba: '',
    blank_sa: ''
  });

  // Input states for Part II-1: Analysis answers
  const [analysisInputs, setAnalysisInputs] = useState<Record<string, string>>({
    case_ga: '',
    case_na: ''
  });

  // Input states for Part II-2: 3 Attitudes and meanings
  const [attitudeInputs, setAttitudeInputs] = useState<{
    item1: { name: string; meaning: string };
    item2: { name: string; meaning: string };
    item3: { name: string; meaning: string };
  }>({
    item1: { name: '', meaning: '' },
    item2: { name: '', meaning: '' },
    item3: { name: '', meaning: '' }
  });

  // Input states for Part III: OX
  const [oxAnswers, setOxAnswers] = useState<Record<number, 'O' | 'X' | null>>({
    1: null,
    2: null,
    3: null
  });

  // Submission & Scoring State
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showModelAnswers, setShowModelAnswers] = useState(false);
  const [showConceptNotes, setShowConceptNotes] = useState(false);

  // Detailed scores
  const [scores, setScores] = useState({
    totalScore: 0,
    blankScore: 0,
    analysisScore: 0,
    attitudeScore: 0,
    oxScore: 0,
    blankResults: {} as Record<string, { isCorrect: boolean; matchedAnswer: string; earned: number }>,
    analysisResults: {} as Record<string, { isCorrect: boolean; isPartial: boolean; earned: number; feedback: string }>,
    attitudeResults: [] as Array<{ name: string; earnedName: number; earnedMeaning: number; feedback: string }>,
    oxResults: {} as Record<number, { isCorrect: boolean; earned: number }>
  });

  const [sheetStatus, setSheetStatus] = useState<{
    status: 'idle' | 'sending' | 'success' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: ''
  });

  // Text normalization helper
  const cleanStr = (s: string) => s.replace(/\s+/g, '').toLowerCase().trim();

  // Handlers for inputs
  const handleBlankChange = (id: string, value: string) => {
    if (isSubmitted) return;
    setBlankInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleAnalysisChange = (id: string, value: string) => {
    if (isSubmitted) return;
    setAnalysisInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleAttitudeChange = (
    itemKey: 'item1' | 'item2' | 'item3',
    field: 'name' | 'meaning',
    val: string
  ) => {
    if (isSubmitted) return;
    setAttitudeInputs((prev) => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        [field]: val
      }
    }));
  };

  const handleOxSelect = (id: number, val: 'O' | 'X') => {
    if (isSubmitted) return;
    sounds.play('select');
    setOxAnswers((prev) => ({ ...prev, [id]: val }));
  };

  // Grade All Function
  const handleGrade = () => {
    // 1. Grade Part I: Blanks
    let blankScore = 0;
    const blankResults: Record<string, { isCorrect: boolean; matchedAnswer: string; earned: number }> = {};

    BLANK_QUESTIONS.forEach((q) => {
      const userVal = cleanStr(blankInputs[q.id] || '');
      const isMatch = q.correctAnswers.some((ans) => {
        const cleanedAns = cleanStr(ans);
        return userVal === cleanedAns || (cleanedAns.length >= 2 && userVal.includes(cleanedAns));
      });

      const earned = isMatch ? q.points : 0;
      blankScore += earned;
      blankResults[q.id] = {
        isCorrect: isMatch,
        matchedAnswer: q.correctAnswers[0],
        earned
      };
    });

    // 2. Grade Part II-1: Analysis Questions
    let analysisScore = 0;
    const analysisResults: Record<string, { isCorrect: boolean; isPartial: boolean; earned: number; feedback: string }> = {};

    ANALYSIS_QUESTIONS.forEach((q) => {
      const userVal = cleanStr(analysisInputs[q.id] || '');
      let earned = 0;
      let isCorrect = false;
      let isPartial = false;
      let feedback = '';

      if (q.id === 'case_ga') {
        // Expected: 좁은 의미의 정치
        if (userVal.includes('좁은')) {
          earned = 10;
          isCorrect = true;
          feedback = '정답입니다! 국가기관이 정치권력을 행사하는 ‘좁은 의미의 정치’를 정확히 파악했습니다.';
        } else if (userVal.includes('정치권력') || userVal.includes('국가')) {
          earned = 5;
          isPartial = true;
          feedback = '부분 점수입니다. 핵심 성격은 맞으나 ‘좁은 의미의 정치’ 개념 명칭을 명확히 제시해야 합니다.';
        } else {
          feedback = '오답입니다. 국회의 예산 심의는 국가기관의 권력 행사 활동이므로 ‘좁은 의미의 정치’입니다.';
        }
      } else {
        // Expected: 넓은 의미의 정치
        if (userVal.includes('넓은')) {
          earned = 10;
          isCorrect = true;
          feedback = '정답입니다! 사회 집단에서 갈등을 조정하고 합의하는 ‘넓은 의미의 정치’를 정확히 파악했습니다.';
        } else if (userVal.includes('갈등') || userVal.includes('조정') || userVal.includes('학급') || userVal.includes('집단')) {
          earned = 5;
          isPartial = true;
          feedback = '부분 점수입니다. 핵심 활동은 맞으나 ‘넓은 의미의 정치’ 개념 명칭을 명확히 제시해야 합니다.';
        } else {
          feedback = '오답입니다. 학급 회의는 일상 사회 집단의 갈등 조정이므로 ‘넓은 의미의 정치’입니다.';
        }
      }

      analysisScore += earned;
      analysisResults[q.id] = { isCorrect, isPartial, earned, feedback };
    });

    // 3. Grade Part II-2: 3 Attitudes and meanings
    let attitudeScore = 0;
    const attitudeResults: Array<{ name: string; earnedName: number; earnedMeaning: number; feedback: string }> = [];

    const userRows = [attitudeInputs.item1, attitudeInputs.item2, attitudeInputs.item3];
    const evaluatedAttitudes = new Set<string>();

    userRows.forEach((row, idx) => {
      const cleanName = cleanStr(row.name);
      const cleanMeaning = cleanStr(row.meaning);

      // Match which target attitude this is
      let matchedTarget = ATTITUDE_ITEMS.find(
        (target) => !evaluatedAttitudes.has(target.key) && target.nameKeywords.some((k) => cleanName.includes(cleanStr(k)))
      );

      // If name wasn't found by keywords, try checking if meaning matches one
      if (!matchedTarget) {
        matchedTarget = ATTITUDE_ITEMS.find(
          (target) => !evaluatedAttitudes.has(target.key) && target.meaningKeywords.some((k) => cleanMeaning.includes(cleanStr(k)))
        );
      }

      if (matchedTarget) {
        evaluatedAttitudes.add(matchedTarget.key);
        // Name score
        const hasName = matchedTarget.nameKeywords.some((k) => cleanName.includes(cleanStr(k)));
        const namePts = hasName ? matchedTarget.pointsName : 0;

        // Meaning score: count matched keywords
        const matchCount = matchedTarget.meaningKeywords.filter((k) => cleanMeaning.includes(cleanStr(k))).length;
        let meaningPts = 0;
        let note = '';

        if (matchCount >= 2 || (hasName && cleanMeaning.length >= 8)) {
          meaningPts = matchedTarget.pointsMeaning;
          note = `핵심 키워드가 잘 반영되었습니다. (${matchedTarget.name}: ${matchedTarget.modelMeaning})`;
        } else if (matchCount === 1 || cleanMeaning.length >= 4) {
          meaningPts = Math.round(matchedTarget.pointsMeaning / 2);
          note = `부분 인정되었습니다. (모범 답안: ${matchedTarget.modelMeaning})`;
        } else {
          meaningPts = 0;
          note = `의미 설명이 부족합니다. (모범 답안: ${matchedTarget.modelMeaning})`;
        }

        attitudeScore += namePts + meaningPts;
        attitudeResults.push({
          name: matchedTarget.name,
          earnedName: namePts,
          earnedMeaning: meaningPts,
          feedback: note
        });
      } else {
        // No match
        attitudeResults.push({
          name: row.name || `태도 ${idx + 1}`,
          earnedName: 0,
          earnedMeaning: 0,
          feedback: '관용, 비판, 타협 중 하나를 쓰고 알맞은 의미를 서술해야 합니다.'
        });
      }
    });

    // 4. Grade Part III: OX Questions
    let oxScore = 0;
    const oxResults: Record<number, { isCorrect: boolean; earned: number }> = {};

    OX_QUESTIONS.forEach((q) => {
      const userAns = oxAnswers[q.id];
      const isCorrect = userAns === q.answer;
      const earned = isCorrect ? q.points : 0;
      oxScore += earned;
      oxResults[q.id] = { isCorrect, earned };
    });

    const totalScore = blankScore + analysisScore + attitudeScore + oxScore;

    setScores({
      totalScore,
      blankScore,
      analysisScore,
      attitudeScore,
      oxScore,
      blankResults,
      analysisResults,
      attitudeResults,
      oxResults
    });

    setIsSubmitted(true);
    setShowModelAnswers(true);

    if (totalScore >= 80) {
      sounds.play('complete');
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    } else {
      sounds.play('success');
    }

    // Scroll to results summary smoothly
    window.scrollTo({ top: 120, behavior: 'smooth' });

    // Send to Google Sheets if gasUrl is available
    submitToGoogleSheet(totalScore, blankScore, analysisScore, attitudeScore, oxScore);
  };

  const submitToGoogleSheet = async (
    total: number,
    bScore: number,
    aScore: number,
    attScore: number,
    oScore: number
  ) => {
    setSheetStatus({ status: 'sending', message: '스프레드시트에 1페이지 학습지 성적 기록 중...' });

    const blanksSummary = BLANK_QUESTIONS.map(
      (b) => `${b.label}:${blankInputs[b.id] || '(공란)'}`
    ).join(' | ');

    const details = `[9-1 학습지] 총점:${total}점(빈칸:${bScore}/35, 분석:${aScore}/20, 태도:${attScore}/30, OX:${oScore}/15) | 빈칸답안[${blanksSummary}]`;

    try {
      const result = await submitStudentResult(
        1,
        {
          studentId: studentId.trim(),
          studentName: studentName.trim(),
          score: total,
          correctCount: total,
          totalQuestions: 100,
          details
        },
        gasUrl
      );
      setSheetStatus({ status: 'success', message: result.message });
    } catch (err: any) {
      setSheetStatus({
        status: 'error',
        message: err.message || '시트 전송 실패 (상단 Google 로그인을 확인하세요).'
      });
    }
  };

  const handleReset = () => {
    if (confirm('학습지 답안을 모두 지우고 처음부터 다시 풀까요?')) {
      sounds.play('delete');
      setBlankInputs({
        blank_ga: '',
        blank_na: '',
        blank_da: '',
        blank_ra: '',
        blank_ma: '',
        blank_ba: '',
        blank_sa: ''
      });
      setAnalysisInputs({
        case_ga: '',
        case_na: ''
      });
      setAttitudeInputs({
        item1: { name: '', meaning: '' },
        item2: { name: '', meaning: '' },
        item3: { name: '', meaning: '' }
      });
      setOxAnswers({ 1: null, 2: null, 3: null });
      setIsSubmitted(false);
      setShowModelAnswers(false);
      setSheetStatus({ status: 'idle', message: '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 pb-20 print:p-0 print:max-w-none">
      {/* Worksheet Header Paper Style */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7 mb-6 print:border-none print:shadow-none print:p-2">
        <div className="border-b-2 border-slate-900 pb-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 text-xs font-bold mb-1.5 border border-blue-200">
                <BookOpen className="w-3.5 h-3.5" />
                <span>중학교 사회 ① | Ⅸ. 민주주의와 시민</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>01. 정치와 민주주의 형성평가 빈칸 학습지</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  교과서 164~167쪽
                </span>
              </h1>
            </div>

            {/* Student metadata box */}
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 print:bg-white print:border-black shrink-0">
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                <span>학번:</span>
                <input
                  type="text"
                  placeholder="예: 20315"
                  value={studentId}
                  onChange={(e) => onStudentIdChange?.(e.target.value)}
                  className="w-20 px-2 py-1 text-xs bg-white rounded border border-slate-300 font-bold text-center focus:outline-blue-500"
                />
              </div>
              <div className="w-px h-5 bg-slate-200" />
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                <span>이름:</span>
                <input
                  type="text"
                  placeholder="예: 홍길동"
                  value={studentName}
                  onChange={(e) => onStudentNameChange?.(e.target.value)}
                  className="w-20 px-2 py-1 text-xs bg-white rounded border border-slate-300 font-bold text-center focus:outline-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Concept Toggle Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConceptNotes(!showConceptNotes)}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold flex items-center gap-1.5 transition border border-indigo-200 print:hidden cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-indigo-600" />
              <span>교과서 핵심 요약 노트 {showConceptNotes ? '접기' : '펼치기'}</span>
              {showConceptNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {isSubmitted && (
              <button
                onClick={() => setShowModelAnswers(!showModelAnswers)}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1.5 transition border border-emerald-200 print:hidden cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{showModelAnswers ? '해설 닫기' : '모범 답안 및 해설 보기'}</span>
              </button>
            )}
          </div>

          {isSubmitted && (
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold flex items-center gap-1.5 transition border border-rose-200 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>다시 풀기</span>
              </button>
            </div>
          )}
        </div>

        {/* Collapsible Concept Summary */}
        {showConceptNotes && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-3 animate-in fade-in duration-200">
            <h4 className="font-bold text-indigo-900 flex items-center gap-1.5 text-sm">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>[교과서 164~167쪽 핵심 개념 한눈에 보기]</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TEXTBOOK_CONCEPTS_SUMMARY.map((sec, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs">
                  <p className="font-extrabold text-indigo-800 mb-2">{sec.title}</p>
                  <ul className="space-y-1.5 text-slate-700">
                    {sec.items.map((item, iIdx) => (
                      <li key={iIdx} className="leading-relaxed">
                        <strong className="text-slate-900 font-bold">• {item.term}:</strong> {item.desc}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real-time score banner when submitted */}
        {isSubmitted && (
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs shrink-0">
                  <Award className="w-7 h-7 text-yellow-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-extrabold text-blue-200">
                      자동 채점 결과
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-yellow-400 text-yellow-950">
                      {scores.totalScore >= 90
                        ? '★ 성취도 매우 우수'
                        : scores.totalScore >= 70
                        ? '성취도 우수'
                        : scores.totalScore >= 50
                        ? '보통 (복습 권장)'
                        : '기초 개념 보충 필요'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight mt-0.5">
                    {studentName ? `${studentName} 학생: ` : ''}
                    <span className="text-yellow-300">{scores.totalScore}</span> / 100점
                  </h3>
                </div>
              </div>

              {/* Sub-scores badges */}
              <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                <div className="bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
                  <span className="text-blue-100">개념 빈칸: </span>
                  <span className="text-white font-black">{scores.blankScore}/35점</span>
                </div>
                <div className="bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
                  <span className="text-blue-100">자료 분석: </span>
                  <span className="text-white font-black">{scores.analysisScore}/20점</span>
                </div>
                <div className="bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
                  <span className="text-blue-100">태도 서술형: </span>
                  <span className="text-white font-black">{scores.attitudeScore}/30점</span>
                </div>
                <div className="bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
                  <span className="text-blue-100">교과서 OX: </span>
                  <span className="text-white font-black">{scores.oxScore}/15점</span>
                </div>
              </div>
            </div>

            {sheetStatus.message && (
              <div
                className={`mt-3 text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 ${
                  sheetStatus.status === 'success'
                    ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30'
                    : sheetStatus.status === 'error'
                    ? 'bg-rose-500/20 text-rose-100 border border-rose-400/30'
                    : 'bg-white/20 text-blue-100'
                }`}
              >
                <span>• {sheetStatus.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Worksheet Body */}
      <div className="space-y-6">
        {/* ========================================================
            PART I. 개념 빈칸 채우기
           ======================================================== */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                I
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                개념 빈칸 채우기
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              총 7문항 • 배점 각 5점 (총 35점)
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
            ※ 교과서 164~166쪽 본문 내용을 바탕으로 괄호 안의 기호에 알맞은 핵심 단어를 정확히 작성하시오.
          </p>

          <div className="space-y-5 text-sm sm:text-base leading-relaxed text-slate-800">
            {/* 1번 문항: ㉠, ㉡ */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 transition">
              <div className="flex items-start gap-2.5">
                <span className="font-black text-blue-700 shrink-0 mt-0.5">1.</span>
                <div className="flex-1 leading-loose">
                  (
                  <InlineBlankInput
                    label="㉠"
                    value={blankInputs.blank_ga}
                    onChange={(v) => handleBlankChange('blank_ga', v)}
                    isSubmitted={isSubmitted}
                    result={scores.blankResults['blank_ga']}
                    modelAnswer={BLANK_QUESTIONS[0].correctAnswers[0]}
                  />
                  )이란 국가가 정치적 기능을 수행하고자 행사하는 강제력 있는 힘을 말하며, 국회에서 법률을 제정하거나 정부가 정책을 집행하는 활동은 (
                  <InlineBlankInput
                    label="㉡"
                    value={blankInputs.blank_na}
                    onChange={(v) => handleBlankChange('blank_na', v)}
                    isSubmitted={isSubmitted}
                    result={scores.blankResults['blank_na']}
                    modelAnswer={BLANK_QUESTIONS[1].correctAnswers[0]}
                  />
                  ) 의미의 정치에 해당한다.
                </div>
              </div>
              {isSubmitted && showModelAnswers && (
                <div className="mt-2.5 text-xs text-slate-600 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-blue-900">[해설] </span>
                    ㉠: <strong>정치권력</strong> (국가가 정치적 기능을 위해 행사하는 힘) / ㉡: <strong>좁은</strong> (국가기관의 정치 활동)
                  </div>
                </div>
              )}
            </div>

            {/* 2번 문항: ㉢ */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 transition">
              <div className="flex items-start gap-2.5">
                <span className="font-black text-blue-700 shrink-0 mt-0.5">2.</span>
                <div className="flex-1 leading-loose">
                  사회 집단 안에서 한정된 가치를 둘러싼 대립과 갈등을 조정하여 합의를 이루어 내는 과정을 (
                  <InlineBlankInput
                    label="㉢"
                    value={blankInputs.blank_da}
                    onChange={(v) => handleBlankChange('blank_da', v)}
                    isSubmitted={isSubmitted}
                    result={scores.blankResults['blank_da']}
                    modelAnswer={BLANK_QUESTIONS[2].correctAnswers[0]}
                  />
                  ) 의미의 정치라고 한다.
                </div>
              </div>
              {isSubmitted && showModelAnswers && (
                <div className="mt-2.5 text-xs text-slate-600 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-blue-900">[해설] </span>
                    ㉢: <strong>넓은</strong> (학교, 가족, 지역 등 사회 집단의 갈등 조정 및 합의 과정)
                  </div>
                </div>
              )}
            </div>

            {/* 3번 문항: ㉣ */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 transition">
              <div className="flex items-start gap-2.5">
                <span className="font-black text-blue-700 shrink-0 mt-0.5">3.</span>
                <div className="flex-1 leading-loose">
                  정치는 공동체 구성원 간의 갈등을 조정함으로써 사회를 통합하고 (
                  <InlineBlankInput
                    label="㉣"
                    value={blankInputs.blank_ra}
                    onChange={(v) => handleBlankChange('blank_ra', v)}
                    isSubmitted={isSubmitted}
                    result={scores.blankResults['blank_ra']}
                    modelAnswer={BLANK_QUESTIONS[3].correctAnswers[0]}
                  />
                  )를 유지하는 역할을 수행한다.
                </div>
              </div>
              {isSubmitted && showModelAnswers && (
                <div className="mt-2.5 text-xs text-slate-600 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-blue-900">[해설] </span>
                    ㉣: <strong>사회 질서</strong> (정치의 핵심 기능: 사회 통합 및 사회 질서 유지)
                  </div>
                </div>
              )}
            </div>

            {/* 4번 문항: ㉤ */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 transition">
              <div className="flex items-start gap-2.5">
                <span className="font-black text-blue-700 shrink-0 mt-0.5">4.</span>
                <div className="flex-1 leading-loose">
                  모든 국민이 국가의 주인으로서 권리를 가지고 나라를 다스리는 통치 방식을 (
                  <InlineBlankInput
                    label="㉤"
                    value={blankInputs.blank_ma}
                    onChange={(v) => handleBlankChange('blank_ma', v)}
                    isSubmitted={isSubmitted}
                    result={scores.blankResults['blank_ma']}
                    modelAnswer={BLANK_QUESTIONS[4].correctAnswers[0]}
                  />
                  )으로서의 민주주의라고 한다.
                </div>
              </div>
              {isSubmitted && showModelAnswers && (
                <div className="mt-2.5 text-xs text-slate-600 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-blue-900">[해설] </span>
                    ㉤: <strong>정치 형태</strong> (생활양식으로서의 민주주의와 구별되는 통치 방식)
                  </div>
                </div>
              )}
            </div>

            {/* 5번 문항: ㉥, ㉦ */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 transition">
              <div className="flex items-start gap-2.5">
                <span className="font-black text-blue-700 shrink-0 mt-0.5">5.</span>
                <div className="flex-1 leading-loose">
                  일상생활에서 다수의 의견에 따라 의사를 결정할 때에는 (
                  <InlineBlankInput
                    label="㉥"
                    value={blankInputs.blank_ba}
                    onChange={(v) => handleBlankChange('blank_ba', v)}
                    isSubmitted={isSubmitted}
                    result={scores.blankResults['blank_ba']}
                    modelAnswer={BLANK_QUESTIONS[5].correctAnswers[0]}
                  />
                  )의 원칙을 적용하되, 반드시 (
                  <InlineBlankInput
                    label="㉦"
                    value={blankInputs.blank_sa}
                    onChange={(v) => handleBlankChange('blank_sa', v)}
                    isSubmitted={isSubmitted}
                    result={scores.blankResults['blank_sa']}
                    modelAnswer={BLANK_QUESTIONS[6].correctAnswers[0]}
                  />
                  )의 의견을 존중하고 배려해야 한다.
                </div>
              </div>
              {isSubmitted && showModelAnswers && (
                <div className="mt-2.5 text-xs text-slate-600 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-blue-900">[해설] </span>
                    ㉥: <strong>다수결</strong> (다수결의 원칙) / ㉦: <strong>소수</strong> (소수의견 존중 및 배려)
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================
            PART II. 자료 분석 및 서술형 문제
           ======================================================== */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                II
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                자료 분석 및 서술형 문제
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              총 2문항 (50점)
            </span>
          </div>

          {/* [자료 1] 박스 */}
          <div className="mb-6 rounded-2xl bg-slate-900 text-white p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2.5">
              <FileText className="w-4 h-4" />
              <span>[자료 1] 교과서 164~165쪽 활동 사례</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-black text-xs shrink-0 mt-0.5 border border-blue-400/30">
                  (가)
                </span>
                <p className="text-slate-100 font-medium leading-relaxed">
                  국회에서 예산안을 심의하여 확정하고 공포하는 활동
                </p>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-black text-xs shrink-0 mt-0.5 border border-emerald-400/30">
                  (나)
                </span>
                <p className="text-slate-100 font-medium leading-relaxed">
                  학급 회의에서 체육대회 단체 티셔츠 색상을 정하기 위해 토의하는 활동
                </p>
              </div>
            </div>
          </div>

          {/* 1번 분석 문제 */}
          <div className="mb-8 p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                  1
                </span>
                <span>[분석 문제] (가)와 (나)에 해당하는 정치의 의미를 각각 쓰시오.</span>
              </h3>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                각 10점 (총 20점)
              </span>
            </div>

            <div className="space-y-4 text-sm mt-3">
              {/* (가) 작성란 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span className="text-blue-600 font-black">• (가):</span>
                    <span className="text-xs text-slate-500 font-normal">
                      국회의 예산안 심의·확정 활동
                    </span>
                  </label>
                  {isSubmitted && scores.analysisResults['case_ga'] && (
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        scores.analysisResults['case_ga'].isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : scores.analysisResults['case_ga'].isPartial
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {scores.analysisResults['case_ga'].earned} / 10점
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder=""
                  value={analysisInputs.case_ga}
                  onChange={(e) => handleAnalysisChange('case_ga', e.target.value)}
                  disabled={isSubmitted}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border transition ${
                    isSubmitted
                      ? scores.analysisResults['case_ga']?.isCorrect
                        ? 'border-emerald-500 bg-emerald-50/30'
                        : scores.analysisResults['case_ga']?.isPartial
                        ? 'border-amber-500 bg-amber-50/30'
                        : 'border-rose-400 bg-rose-50/30'
                      : 'border-slate-300 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100'
                  }`}
                />
                {isSubmitted && (
                  <div className="mt-1.5 text-xs">
                    <p className="text-slate-600">{scores.analysisResults['case_ga']?.feedback}</p>
                    {showModelAnswers && (
                      <p className="text-indigo-700 font-bold mt-1">
                        ✓ 모범 답안: {ANALYSIS_QUESTIONS[0].modelAnswer}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* (나) 작성란 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span className="text-emerald-600 font-black">• (나):</span>
                    <span className="text-xs text-slate-500 font-normal">
                      학급 회의의 단체 티셔츠 색상 토의 활동
                    </span>
                  </label>
                  {isSubmitted && scores.analysisResults['case_na'] && (
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        scores.analysisResults['case_na'].isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : scores.analysisResults['case_na'].isPartial
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {scores.analysisResults['case_na'].earned} / 10점
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder=""
                  value={analysisInputs.case_na}
                  onChange={(e) => handleAnalysisChange('case_na', e.target.value)}
                  disabled={isSubmitted}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border transition ${
                    isSubmitted
                      ? scores.analysisResults['case_na']?.isCorrect
                        ? 'border-emerald-500 bg-emerald-50/30'
                        : scores.analysisResults['case_na']?.isPartial
                        ? 'border-amber-500 bg-amber-50/30'
                        : 'border-rose-400 bg-rose-50/30'
                      : 'border-slate-300 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100'
                  }`}
                />
                {isSubmitted && (
                  <div className="mt-1.5 text-xs">
                    <p className="text-slate-600">{scores.analysisResults['case_na']?.feedback}</p>
                    {showModelAnswers && (
                      <p className="text-indigo-700 font-bold mt-1">
                        ✓ 모범 답안: {ANALYSIS_QUESTIONS[1].modelAnswer}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2번 서술형 문제 */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                  2
                </span>
                <span>
                  [서술형 문제] 공동체 문제 해결을 위한 민주적 의사 결정 과정에서 필요한 태도 3가지를 쓰고, 각각의 의미를 설명하시오.
                </span>
              </h3>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                각 10점 (총 30점)
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              ※ 교과서 166쪽 본문에 제시된 세 가지 민주적 태도(명칭 4점 + 의미 설명 6점)를 각각 바르게 작성하시오.
            </p>

            {/* 3 Attitude Cards */}
            <div className="space-y-3.5">
              {/* 태도 1 */}
              <AttitudeInputRow
                index={1}
                label="첫 번째 태도"
                nameValue={attitudeInputs.item1.name}
                meaningValue={attitudeInputs.item1.meaning}
                onNameChange={(val) => handleAttitudeChange('item1', 'name', val)}
                onMeaningChange={(val) => handleAttitudeChange('item1', 'meaning', val)}
                isSubmitted={isSubmitted}
                result={scores.attitudeResults[0]}
                modelTarget={ATTITUDE_ITEMS[0]}
                showModelAnswer={showModelAnswers}
                placeholderName=""
                placeholderMeaning=""
              />

              {/* 태도 2 */}
              <AttitudeInputRow
                index={2}
                label="두 번째 태도"
                nameValue={attitudeInputs.item2.name}
                meaningValue={attitudeInputs.item2.meaning}
                onNameChange={(val) => handleAttitudeChange('item2', 'name', val)}
                onMeaningChange={(val) => handleAttitudeChange('item2', 'meaning', val)}
                isSubmitted={isSubmitted}
                result={scores.attitudeResults[1]}
                modelTarget={ATTITUDE_ITEMS[1]}
                showModelAnswer={showModelAnswers}
                placeholderName=""
                placeholderMeaning=""
              />

              {/* 태도 3 */}
              <AttitudeInputRow
                index={3}
                label="세 번째 태도"
                nameValue={attitudeInputs.item3.name}
                meaningValue={attitudeInputs.item3.meaning}
                onNameChange={(val) => handleAttitudeChange('item3', 'name', val)}
                onMeaningChange={(val) => handleAttitudeChange('item3', 'meaning', val)}
                isSubmitted={isSubmitted}
                result={scores.attitudeResults[2]}
                modelTarget={ATTITUDE_ITEMS[2]}
                showModelAnswer={showModelAnswers}
                placeholderName=""
                placeholderMeaning=""
              />
            </div>
          </div>
        </section>

        {/* ========================================================
            PART III. 교과서 연계 [스스로 확인하기 & 오류 바로잡기]
           ======================================================== */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                III
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                교과서 연계 스스로 확인하기 (167쪽)
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              총 3문항 • 각 5점 (총 15점)
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 mb-4">
            다음 문장을 읽고 내용이 맞으면 <strong>O</strong>, 틀리면 <strong>X</strong>를 선택하시오.
          </p>

          <div className="space-y-3">
            {OX_QUESTIONS.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-2.5 flex-1">
                  <span className="font-black text-emerald-700 shrink-0 mt-0.5">
                    {item.id}.
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-800 leading-relaxed">
                      {item.question}
                    </p>
                    {isSubmitted && showModelAnswers && (
                      <p className="text-xs text-slate-500 mt-1">
                        <strong className="text-emerald-700">[해설]</strong> 정답은 <strong>({item.answer})</strong> : {item.explanation}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {(['O', 'X'] as const).map((choice) => {
                    const isSelected = oxAnswers[item.id] === choice;
                    const isCorrectChoice = item.answer === choice;
                    let btnStyle = 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100';

                    if (isSubmitted) {
                      if (isSelected) {
                        btnStyle = isCorrectChoice
                          ? 'border-emerald-500 bg-emerald-600 text-white shadow-xs'
                          : 'border-rose-500 bg-rose-600 text-white shadow-xs';
                      } else if (isCorrectChoice) {
                        btnStyle = 'border-emerald-400 bg-emerald-50 text-emerald-700 font-extrabold';
                      }
                    } else if (isSelected) {
                      btnStyle = 'border-emerald-600 bg-emerald-600 text-white shadow-xs';
                    }

                    return (
                      <button
                        key={choice}
                        onClick={() => handleOxSelect(item.id, choice)}
                        disabled={isSubmitted}
                        className={`w-9 h-9 rounded-xl border text-sm font-black transition cursor-pointer flex items-center justify-center ${btnStyle}`}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 소수의견 존중 말풍선 안내 카드 */}
          <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-extrabold text-amber-950">
                [주의 깊게 살펴보기 • 교과서 167쪽 말풍선 오류]
              </strong>
              <p className="mt-1 leading-relaxed">
                "다수결의 원칙에 따라 문제를 해결할 때에는 소수의 의견은 신경 쓰지 않아도 돼." (X) → <br />
                <strong>올바른 태도:</strong> 다수결의 원칙을 적용하더라도 반드시 <strong>소수의 의견을 경청하고 존중·배려</strong>해야 다수의 횡포를 방지하고 진정한 민주주의를 이룰 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* Submit & Action Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="text-xs text-slate-600">
            {!studentName.trim() ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> 상단에 학번과 이름을 입력한 후 제출해 주세요.
              </span>
            ) : isSubmitted ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 채점이 완료되었습니다. 모범 답안과 피드백을 확인해 보세요.
              </span>
            ) : (
              <span className="text-slate-600">
                모든 빈칸과 서술형 답안을 작성한 후 아래 [답안 제출 및 자동 채점] 버튼을 누르세요.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isSubmitted && (
              <button
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition flex-1 sm:flex-none cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>다시 풀기</span>
              </button>
            )}

            <button
              onClick={handleGrade}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm transition flex-1 sm:flex-none cursor-pointer ${
                isSubmitted
                  ? 'bg-slate-800 hover:bg-slate-900 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitted ? '답안 다시 채점하기' : '답안 제출 및 자동 채점 (100점 만점)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Inline Blank Input Sub-component
interface InlineBlankInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  isSubmitted: boolean;
  result?: { isCorrect: boolean; matchedAnswer: string; earned: number };
  modelAnswer: string;
}

const InlineBlankInput: React.FC<InlineBlankInputProps> = ({
  label,
  value,
  onChange,
  isSubmitted,
  result,
  modelAnswer
}) => {
  return (
    <span className="inline-flex items-center gap-1 mx-1.5 align-middle">
      <span className="text-xs font-bold text-blue-600">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isSubmitted}
        placeholder=""
        className={`w-28 sm:w-32 px-2.5 py-1 text-center font-bold text-xs sm:text-sm rounded-lg border transition ${
          isSubmitted
            ? result?.isCorrect
              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
              : 'border-rose-400 bg-rose-50 text-rose-800'
            : 'border-slate-300 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-900'
        }`}
      />
      {isSubmitted && (
        <span className="text-xs">
          {result?.isCorrect ? (
            <span className="text-emerald-600 font-extrabold inline-flex items-center">
              ✓
            </span>
          ) : (
            <span className="text-rose-600 font-bold inline-flex items-center gap-0.5">
              ✗ <span className="text-[11px] underline">({modelAnswer})</span>
            </span>
          )}
        </span>
      )}
    </span>
  );
};

// Attitude Sub-row Component
interface AttitudeInputRowProps {
  index: number;
  label: string;
  nameValue: string;
  meaningValue: string;
  onNameChange: (val: string) => void;
  onMeaningChange: (val: string) => void;
  isSubmitted: boolean;
  result?: { name: string; earnedName: number; earnedMeaning: number; feedback: string };
  modelTarget: { name: string; fullModelAnswer: string; modelMeaning: string };
  showModelAnswer: boolean;
  placeholderName: string;
  placeholderMeaning: string;
}

const AttitudeInputRow: React.FC<AttitudeInputRowProps> = ({
  index,
  label,
  nameValue,
  meaningValue,
  onNameChange,
  onMeaningChange,
  isSubmitted,
  result,
  modelTarget,
  showModelAnswer,
  placeholderName,
  placeholderMeaning
}) => {
  const totalEarned = (result?.earnedName || 0) + (result?.earnedMeaning || 0);

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black">
            {index}
          </span>
          <span>{label}</span>
        </span>

        {isSubmitted && result && (
          <span
            className={`text-xs font-black px-2 py-0.5 rounded-full ${
              totalEarned === 10
                ? 'bg-emerald-100 text-emerald-800'
                : totalEarned > 0
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {totalEarned} / 10점 (명칭 {result.earnedName}점 + 설명 {result.earnedMeaning}점)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <div className="sm:col-span-1">
          <label className="block text-[11px] font-bold text-slate-500 mb-1">
            태도 명칭 (4점)
          </label>
          <input
            type="text"
            placeholder={placeholderName}
            value={nameValue}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={isSubmitted}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-bold focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="block text-[11px] font-bold text-slate-500 mb-1">
            태도의 의미 설명 (6점)
          </label>
          <input
            type="text"
            placeholder={placeholderMeaning}
            value={meaningValue}
            onChange={(e) => onMeaningChange(e.target.value)}
            disabled={isSubmitted}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {isSubmitted && (
        <div className="mt-2 text-xs">
          <p className="text-slate-600">{result?.feedback}</p>
          {showModelAnswer && (
            <p className="text-indigo-700 font-bold mt-0.5">
              ✓ 모범 답안: {modelTarget.fullModelAnswer}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
