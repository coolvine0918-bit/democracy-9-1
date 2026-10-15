import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Network,
  ExternalLink,
  Copy,
  Check,
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  Send,
  HelpCircle,
  GraduationCap,
  Layers,
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import {
  MINDMAP_QUIZ_ITEMS,
  MindmapQuizItem
} from '../data/mindmapQuizData';
import { sounds } from '../utils/audio';
import { submitStudentResult } from '../services/googleSheets';


export const NOTEBOOK_LM_URL =
  'https://notebook.google.com/notebook/0be60e82-984e-4268-994d-d9d7fa03a726/artifact/eb1ea4a8-0c68-4132-8467-7f7be202cfab?utm_source=nlm_web_share&utm_medium=google_oo&utm_campaign=art_share_1&utm_content=&utm_smc=nlm_web_share_google_oo_art_share_1_';

interface MindmapPageProps {
  studentId?: string;
  studentName?: string;
  gasUrl?: string;
}

export const MindmapPage: React.FC<MindmapPageProps> = ({
  studentId = '',
  studentName = '',
  gasUrl = ''
}) => {
  const [copied, setCopied] = useState(false);
  const [hasOpenedMindmap, setHasOpenedMindmap] = useState(false);

  // Quiz State
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const [sheetStatus, setSheetStatus] = useState<{
    status: 'idle' | 'sending' | 'success' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: ''
  });

  const CIRCLE_NUMBERS = ['①', '②', '③', '④'];

  const handleCopy = () => {
    navigator.clipboard.writeText(NOTEBOOK_LM_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExternal = () => {
    sounds.play('success');
    setHasOpenedMindmap(true);
    window.open(NOTEBOOK_LM_URL, '_blank', 'noopener,noreferrer');
  };

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (isSubmitted) return;
    sounds.play('select');
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx + 1
    }));
  };

  const answeredCount = Object.keys(userAnswers).length;
  const totalCount = MINDMAP_QUIZ_ITEMS.length;

  // Grade Quiz
  const handleSubmit = () => {
    if (answeredCount < totalCount) {
      const confirmSubmit = window.confirm(
        `아직 풀지 않은 문제가 있습니다. (${answeredCount}/${totalCount} 문항 완료)\n이대로 제출하시겠습니까?`
      );
      if (!confirmSubmit) return;
    }

    sounds.play('complete');

    let correct = 0;
    const detailsArr: string[] = [];

    MINDMAP_QUIZ_ITEMS.forEach((item) => {
      const selected = userAnswers[item.id];
      const isCorrect = selected === item.answer;
      if (isCorrect) correct += 1;
      detailsArr.push(
        `[Q${item.id}] 선택:${selected ? CIRCLE_NUMBERS[selected - 1] : '미응답'} (정답:${CIRCLE_NUMBERS[item.answer - 1]}) ${isCorrect ? 'O' : 'X'}`
      );
    });

    const calculatedScore = correct * 10;
    setCorrectCount(correct);
    setScore(calculatedScore);
    setIsSubmitted(true);

    if (calculatedScore >= 80) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    }

    // Smooth scroll down to quiz results banner
    const quizSection = document.getElementById('mindmap-quiz-results');
    if (quizSection) {
      quizSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Send to Google Sheets if gasUrl is available
    sendToGoogleSheet(calculatedScore, correct, detailsArr.join(' | '));
  };

  const sendToGoogleSheet = async (
    finalScore: number,
    correct: number,
    detailsStr: string
  ) => {
    setSheetStatus({ status: 'sending', message: '스프레드시트에 3페이지 마인드맵 성적 기록 중...' });

    try {
      const result = await submitStudentResult(
        3,
        {
          studentId: studentId.trim(),
          studentName: studentName.trim(),
          score: finalScore,
          correctCount: correct,
          totalQuestions: totalCount,
          details: `[마인드맵 퀴즈] 점수:${finalScore}점 (${correct}/10) | ${detailsStr}`
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
    if (window.confirm('마인드맵 퀴즈 답안을 모두 지우고 다시 풀까요?')) {
      sounds.play('delete');
      setUserAnswers({});
      setIsSubmitted(false);
      setScore(0);
      setCorrectCount(0);
      setSheetStatus({ status: 'idle', message: '' });
      const quizSection = document.getElementById('mindmap-quiz-anchor');
      if (quizSection) {
        quizSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 rounded-3xl p-5 sm:p-7 text-white shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-teal-100 text-xs font-bold tracking-wide mb-2 backdrop-blur-xs">
              <Network className="w-3.5 h-3.5" />
              <span>3페이지 • 개념 시각화 및 마인드맵 점검</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
              <span>정치와 민주주의 마인드맵 & 퀴즈</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-teal-700 font-extrabold shadow-xs">
                10문항
              </span>
            </h1>
            <p className="text-teal-100 text-xs sm:text-sm mt-1">
              아래 마인드맵의 5대 핵심 가지를 살펴보고, 하단에 배치된 개념 완성 퀴즈 10문항을 풀어보세요.
            </p>
          </div>

          {/* Quick Action Button to NotebookLM with High Emphasis */}
          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
            {/* Directing bouncing indicator */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 text-amber-950 font-black text-xs shadow-md animate-bounce border border-yellow-200">
              <span className="text-sm">👇</span>
              <span>반드시 클릭하여 마인드맵 확인!</span>
              <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-black animate-pulse">
                필수
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative group">
                {/* Glowing radiant aura behind button */}
                <div
                  className={`absolute -inset-1 rounded-2xl blur-sm transition duration-300 ${
                    hasOpenedMindmap
                      ? 'bg-emerald-400 opacity-60'
                      : 'bg-gradient-to-r from-yellow-300 via-amber-400 to-rose-400 opacity-95 group-hover:opacity-100 animate-pulse'
                  }`}
                />

                <a
                  href={NOTEBOOK_LM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleOpenExternal}
                  className={`relative px-5 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-xl transition-all duration-200 flex items-center gap-2.5 cursor-pointer select-none border-2 hover:scale-105 active:scale-95 ${
                    hasOpenedMindmap
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white border-emerald-300 shadow-teal-500/20'
                      : 'bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-200 hover:from-yellow-200 hover:to-amber-200 text-amber-950 border-yellow-400 shadow-amber-500/40 ring-4 ring-yellow-400/40'
                  }`}
                  title="새 창에서 구글 노트북 원본 마인드맵 열기 (필수 클릭)"
                >
                  <span className="relative flex h-3.5 w-3.5 shrink-0">
                    {!hasOpenedMindmap && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                        hasOpenedMindmap ? 'bg-white' : 'bg-orange-500'
                      }`}
                    ></span>
                  </span>

                  <ExternalLink
                    className={`w-4 h-4 shrink-0 ${hasOpenedMindmap ? 'text-white' : 'text-amber-950'}`}
                  />
                  <span className="tracking-tight text-sm font-black whitespace-nowrap">
                    {hasOpenedMindmap
                      ? '✓ 구글 노트북 마인드맵 확인 완료 (다시 열기)'
                      : '구글 노트북 마인드맵 열기'}
                  </span>

                  {!hasOpenedMindmap && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-black animate-pulse shadow-xs">
                      클릭 필수!
                    </span>
                  )}
                </a>
              </div>

              <button
                onClick={handleCopy}
                className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition border border-white/30 cursor-pointer shadow-md"
                title="노트북 마인드맵 링크 복사"
              >
                {copied ? <Check className="w-5 h-5 text-yellow-300" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          1. 9-1. 정치와 민주주의 마인드맵 핵심 계통도 (Mindmap Canvas)
         ======================================================== */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 text-xs font-bold mb-1 border border-teal-200">
              <BookOpen className="w-3.5 h-3.5" />
              <span>교과서 164~167쪽 연계</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Network className="w-5 h-5 text-teal-600" />
              <span>단원 9-1. 정치와 민주주의 마인드맵 핵심 구조</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              마인드맵의 5대 가지(정치의 의미, 역할, 민주주의의 두 측면, 민주적 태도, 다수결 원리)를 정독하세요.
            </p>
          </div>

        </div>

        {/* Mindmap Nodes Grid / Hierarchy */}
        <div className="space-y-8">
          {/* Central Core Node */}
          <div className="flex justify-center">
            <div className="px-6 py-4 rounded-3xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black text-lg sm:text-xl shadow-lg border-4 border-teal-200 text-center max-w-md w-full">
              <p className="text-xs uppercase tracking-wider text-teal-100 font-bold mb-1">
                중학교 사회 ① Ⅸ단원 (9-1)
              </p>
              <h3 className="text-xl sm:text-2xl font-black">정치와 민주주의</h3>
              <p className="text-xs text-teal-100 mt-1">
                정치의 의미 • 역할 • 민주주의의 이념 • 민주적 의사 결정
              </p>
            </div>
          </div>

          {/* 5 Main Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Branch 1: 정치의 의미 */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                  1
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  정치의 의미 (2가지 관점)
                </h4>
              </div>
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <strong className="text-blue-700 block font-bold mb-1">
                    • 좁은 의미의 정치 (국가 차원)
                  </strong>
                  <p className="leading-relaxed text-slate-600">
                    정치권력을 획득하고 행사하는 국가기관의 활동 (예: 국회의 법률 제·개정, 정부의 정책 수립·집행, 국무회의)
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <strong className="text-emerald-700 block font-bold mb-1">
                    • 넓은 의미의 정치 (사회 전반)
                  </strong>
                  <p className="leading-relaxed text-slate-600">
                    사회 집단 안에서 구성원 간의 대립과 갈등을 조정하여 합의를 이루어 내는 모든 과정 (예: 학급 회의, 가족회의, 동아리 회의)
                  </p>
                </div>
              </div>
            </div>

            {/* Branch 2: 정치의 역할과 기능 */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-xs">
                  2
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  정치의 역할과 필요성
                </h4>
              </div>
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <strong className="text-teal-800 block font-bold mb-1">
                    • 희소한 가치와 갈등 조정
                  </strong>
                  <p className="leading-relaxed text-slate-600">
                    자원과 가치가 유한(희소)하기 때문에 발생하는 공동체 구성원 간의 대립과 갈등을 평화롭게 조정함
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <strong className="text-teal-800 block font-bold mb-1">
                    • 사회 통합 및 질서 유지
                  </strong>
                  <p className="leading-relaxed text-slate-600">
                    사회적 혼란을 방지하고 모든 구성원이 안전하고 안정적인 생활을 누릴 수 있도록 사회 질서를 확립함
                  </p>
                </div>
              </div>
            </div>

            {/* Branch 3: 민주주의의 두 얼굴 */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                  3
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  민주주의의 의미
                </h4>
              </div>
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <strong className="text-indigo-800 block font-bold mb-1">
                    • 정치 형태로서의 민주주의
                  </strong>
                  <p className="leading-relaxed text-slate-600">
                    소수의 지배자가 아닌 모든 국민이 국가의 주인으로서 주권을 갖고 스스로 나라를 다스리는 통치 방식
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <strong className="text-indigo-800 block font-bold mb-1">
                    • 생활양식으로서의 민주주의
                  </strong>
                  <p className="leading-relaxed text-slate-600">
                    일상의 크고 작은 문제들을 자유롭고 평등한 입장에서 대화와 토론을 통해 해결하려는 삶의 태도
                  </p>
                </div>
              </div>
            </div>

            {/* Branch 4: 민주적 의사 결정의 태도 3가지 */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xs">
                  4
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  민주적 의사 결정 태도 (3대 핵심)
                </h4>
              </div>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[11px] mr-1.5">
                    관용
                  </span>
                  <span>나와 다른 가치관과 생각을 편견 없이 인정하고 포용하는 태도</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-extrabold text-[11px] mr-1.5">
                    비판
                  </span>
                  <span>감정적 비난이 아닌, 합리적 근거를 바탕으로 옳고 그름을 따지는 태도</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-extrabold text-[11px] mr-1.5">
                    타협
                  </span>
                  <span>서로 한 걸음씩 양보하여 모두가 납득할 수 있는 합의점을 찾아가는 태도</span>
                </div>
              </div>
            </div>

            {/* Branch 5: 의사 결정 원리와 주의점 */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all shadow-2xs md:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-black text-xs">
                  5
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  의사 결정 원리: 다수결의 원칙과 소수의견 존중
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block font-bold mb-1">
                    • 다수결의 원칙 (신속성과 효율성)
                  </strong>
                  <p className="leading-relaxed text-slate-600">
                    대화와 토론으로 만장일치가 어려울 때, 다수의 의사에 따라 집단의 결정을 내리는 효율적인 원칙
                  </p>
                </div>
                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
                  <strong className="text-amber-900 block font-bold mb-1">
                    ★ 소수의견 존중 (필수 전제 조건)
                  </strong>
                  <p className="leading-relaxed text-amber-800">
                    다수결의 횡포를 방지하고 기본권을 지키기 위해, 결정 전 충분한 토론을 거치고 소수의 의견을 반드시 배려해야 함
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. 마인드맵 연계 개념 퀴즈 10문항 (Quiz Section)
         ======================================================== */}
      <section id="mindmap-quiz-anchor" className="space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold mb-1.5 border border-teal-200">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>마인드맵 기반 개념 점검</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>마인드맵 연계 형성평가 10문항</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-extrabold">
                  {answeredCount} / {totalCount} 완료
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                위 마인드맵의 5가지 가지를 참고하여 문제를 읽고 알맞은 답을 선택한 후 답안을 제출하세요.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-500">
                배점: 각 10점 (총 100점 만점)
              </span>
            </div>
          </div>

          {/* NotebookLM Reminder Box if not opened yet */}
          {!hasOpenedMindmap && (
            <div className="mb-6 p-3.5 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-950 font-bold">
                <span className="text-base">💡</span>
                <span>
                  퀴즈를 풀기 전, 상단의 <strong className="text-amber-800 underline underline-offset-2">[구글 노트북 마인드맵 열기]</strong>를 눌러 전체 구조를 먼저 확인해보세요!
                </span>
              </div>
              <a
                href={NOTEBOOK_LM_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenExternal}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition hover:scale-105 active:scale-95"
              >
                <span>지금 마인드맵 열기</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Results Summary Banner when Submitted */}
          {isSubmitted && (
            <div
              id="mindmap-quiz-results"
              className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 text-white shadow-md animate-in fade-in"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs shrink-0">
                    <Award className="w-7 h-7 text-yellow-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider font-extrabold text-teal-200">
                        마인드맵 퀴즈 채점 결과
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-yellow-400 text-yellow-950">
                        {score >= 90
                          ? '★ 성취도 매우 우수'
                          : score >= 70
                          ? '성취도 우수'
                          : score >= 50
                          ? '보통 (마인드맵 재확인 권장)'
                          : '기초 개념 보충 필요'}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black tracking-tight mt-0.5">
                      {studentName ? `${studentName} 학생: ` : ''}
                      <span className="text-yellow-300">{score}점</span> / 100점
                      <span className="text-sm font-semibold text-teal-100 ml-2">
                        ({correctCount} / {totalCount} 정답)
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs transition border border-white/30 cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>다시 풀기</span>
                  </button>
                </div>
              </div>

              {sheetStatus.message && (
                <div
                  className={`mt-3 text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 ${
                    sheetStatus.status === 'success'
                      ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30'
                      : sheetStatus.status === 'error'
                      ? 'bg-rose-500/20 text-rose-100 border border-rose-400/30'
                      : 'bg-white/20 text-teal-100'
                  }`}
                >
                  <span>• {sheetStatus.message}</span>
                </div>
              )}
            </div>
          )}

          {/* 10 Questions List */}
          <div className="space-y-6">
            {MINDMAP_QUIZ_ITEMS.map((item) => {
              const selectedOpt = userAnswers[item.id];
              const isCorrect = selectedOpt === item.answer;

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isSubmitted
                      ? isCorrect
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : 'bg-rose-50/40 border-rose-300'
                      : 'bg-slate-50/70 border-slate-200 hover:border-teal-300'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                        {item.id}
                      </span>
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[11px] font-bold mb-1">
                          연계: {item.branch}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                          {item.question}
                        </h4>
                      </div>
                    </div>

                    {isSubmitted && (
                      <span className="shrink-0">
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>정답 (+10점)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>오답 (정답: {CIRCLE_NUMBERS[item.answer - 1]})</span>
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                    {item.options.map((opt, optIdx) => {
                      const isThisSelected = selectedOpt === optIdx + 1;
                      const isThisAnswer = item.answer === optIdx + 1;

                      let btnStyle = 'border-slate-200 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-50/30';

                      if (isSubmitted) {
                        if (isThisAnswer) {
                          btnStyle = 'border-emerald-500 bg-emerald-100/70 text-emerald-950 font-bold ring-2 ring-emerald-300';
                        } else if (isThisSelected) {
                          btnStyle = 'border-rose-400 bg-rose-100 text-rose-950 line-through';
                        } else {
                          btnStyle = 'border-slate-200 bg-white/70 text-slate-400 opacity-70';
                        }
                      } else if (isThisSelected) {
                        btnStyle = 'border-teal-600 bg-teal-50 text-teal-900 font-bold shadow-xs ring-2 ring-teal-200';
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(item.id, optIdx)}
                          disabled={isSubmitted}
                          className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center gap-2.5 cursor-pointer ${btnStyle}`}
                        >
                          <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-current">
                            {CIRCLE_NUMBERS[optIdx]}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Explanation */}
                  {isSubmitted && (
                    <div className="mt-3.5 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed animate-in fade-in">
                      <div className="flex items-center gap-1.5 font-bold text-teal-900 mb-1">
                        <Lightbulb className="w-3.5 h-3.5 text-teal-600" />
                        <span>[마인드맵 연계 해설]</span>
                        <span className="ml-auto text-[11px] font-semibold text-slate-400">
                          핵심어: {item.mindmapKeyword}
                        </span>
                      </div>
                      <p>{item.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Submit Controls */}
          <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              {isSubmitted ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> 채점이 완료되었습니다. 상단 마인드맵과 해설을 다시 비교해 보세요.
                </span>
              ) : (
                <span>
                  전체 10문항 중 <strong>{answeredCount}</strong>개 응답 완료
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isSubmitted && (
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition flex-1 sm:flex-none cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>다시 풀기</span>
                </button>
              )}

              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition flex-1 sm:flex-none cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitted ? '답안 다시 제출하기' : '답안 제출 및 자동 채점 (100점 만점)'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
