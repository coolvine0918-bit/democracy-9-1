import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Scale,
  Clock,
  Sparkles,
  Flame,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Award,
  ChevronRight,
  Gift,
  HelpCircle,
  Send,
  Volume2,
  VolumeX,
  Play,
  Pause,
  PartyPopper
} from 'lucide-react';
import {
  BALANCE_QUIZ_ITEMS,
  HALLOWEEN_CANDIES,
  BalanceQuizItem,
  HalloweenCandy
} from '../data/balanceQuizData';
import { sounds } from '../utils/audio';
import { submitStudentResult } from '../services/googleSheets';


interface BalanceQuizProps {
  studentId: string;
  studentName: string;
  gasUrl: string;
}

export const BalanceQuiz: React.FC<BalanceQuizProps> = ({
  studentId,
  studentName,
  gasUrl
}) => {
  // Game state
  const TOTAL_TIME_SECONDS = 120; // 2 minutes
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_TIME_SECONDS);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<
    Record<number, { selected: boolean; isCorrect: boolean }>
  >({});
  const [currentSelected, setCurrentSelected] = useState<boolean | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);

  // Streaks
  const [correctStreak, setCorrectStreak] = useState<number>(0);
  const [wrongStreak, setWrongStreak] = useState<number>(0);

  // Candy collection
  const [collectedCandies, setCollectedCandies] = useState<HalloweenCandy[]>([]);
  const [showCandyRewardModal, setShowCandyRewardModal] = useState<HalloweenCandy | null>(null);

  // Reset alert modal when 3 consecutive wrong
  const [showResetAlertModal, setShowResetAlertModal] = useState<boolean>(false);

  // Completion
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isTimeOut, setIsTimeOut] = useState<boolean>(false);

  // Submit to Google Sheets
  const [sheetStatus, setSheetStatus] = useState<{
    status: 'idle' | 'sending' | 'success' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: ''
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (isFinished || isTimeOut || !isTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsTimeOut(true);
          sounds.play('delete');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFinished, isTimeOut, isTimerRunning]);

  const currentItem: BalanceQuizItem = BALANCE_QUIZ_ITEMS[currentIndex];

  // Handle User Choice
  const handleSelectChoice = (choice: boolean) => {
    if (isAnswerRevealed || isFinished || isTimeOut) return;

    sounds.play('select');
    setCurrentSelected(choice);
    setIsAnswerRevealed(true);

    const isCorrect = choice === currentItem.isPolitics;

    // Record answer
    setUserAnswers((prev) => ({
      ...prev,
      [currentItem.id]: { selected: choice, isCorrect }
    }));

    if (isCorrect) {
      sounds.play('connect');
      const nextCorrect = correctStreak + 1;
      setCorrectStreak(nextCorrect);
      setWrongStreak(0);

      // Check 3 consecutive correct!
      if (nextCorrect === 3) {
        // Award Halloween Candy!
        const candyIdx = collectedCandies.length % HALLOWEEN_CANDIES.length;
        const newCandy = HALLOWEEN_CANDIES[candyIdx];
        setCollectedCandies((prev) => [...prev, newCandy]);
        setCorrectStreak(0); // reset streak for the next candy

        // Trigger candy celebration
        sounds.play('complete');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        setShowCandyRewardModal(newCandy);
      }
    } else {
      sounds.play('delete');
      const nextWrong = wrongStreak + 1;
      setWrongStreak(nextWrong);
      setCorrectStreak(0);

      // Check 3 consecutive wrong!
      if (nextWrong === 3) {
        // Penalty: reset to question 1!
        setShowResetAlertModal(true);
      }
    }
  };

  // Close candy modal and continue
  const handleCloseCandyModal = () => {
    setShowCandyRewardModal(null);
  };

  // Close reset modal and reset to question 1
  const handleConfirmResetModal = () => {
    setShowResetAlertModal(false);
    setCurrentIndex(0);
    setCurrentSelected(null);
    setIsAnswerRevealed(false);
    setWrongStreak(0);
    setCorrectStreak(0);
    setUserAnswers({});
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // Move to next question
  const handleNextQuestion = () => {
    if (currentIndex + 1 < BALANCE_QUIZ_ITEMS.length) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentSelected(null);
      setIsAnswerRevealed(false);
    } else {
      // Completed all 10 questions!
      finishQuiz();
    }
  };

  // Finish quiz
  const finishQuiz = () => {
    setIsFinished(true);
    setIsTimerRunning(false);

    let correctCount = 0;
    BALANCE_QUIZ_ITEMS.forEach((item) => {
      if (userAnswers[item.id]?.isCorrect) {
        correctCount += 1;
      }
    });

    const finalScore = correctCount * 10;
    sounds.play('complete');
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 }
    });

    window.scrollTo({ top: 100, behavior: 'smooth' });

    // Send result to Google Sheets
    sendToGoogleSheet(finalScore, correctCount);
  };

  const sendToGoogleSheet = async (finalScore: number, correctCount: number) => {
    setSheetStatus({ status: 'sending', message: '스프레드시트에 2페이지 밸런스 퀴즈 성적 기록 중...' });

    const timeSpent = TOTAL_TIME_SECONDS - timeLeft;
    const details = BALANCE_QUIZ_ITEMS.map((item) => {
      const ans = userAnswers[item.id];
      const selectedText = ans ? (ans.selected ? '정치(O)' : '비정치(X)') : '미응답';
      return `[Q${item.id}] 선택:${selectedText} (${ans?.isCorrect ? 'O' : 'X'})`;
    }).join(' | ');

    try {
      const result = await submitStudentResult(
        2,
        {
          studentId: studentId.trim(),
          studentName: studentName.trim(),
          score: finalScore,
          correctCount: correctCount,
          totalQuestions: 10,
          attemptNumber: 1,
          timeSpent: timeSpent,
          candiesEarned: collectedCandies.length,
          details: `[밸런스퀴즈] 획득캔디:${collectedCandies.length}개 | 소요시간:${timeSpent}초 | ${details}`
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

  // Reset entire quiz to start over
  const handleRestartAll = () => {
    setTimeLeft(TOTAL_TIME_SECONDS);
    setIsTimerRunning(true);
    setCurrentIndex(0);
    setUserAnswers({});
    setCurrentSelected(null);
    setIsAnswerRevealed(false);
    setCorrectStreak(0);
    setWrongStreak(0);
    setCollectedCandies([]);
    setIsFinished(false);
    setIsTimeOut(false);
    setSheetStatus({ status: 'idle', message: '' });
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // Format timer MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  // Calculate final score
  const score = Object.values(userAnswers).filter((a) => a.isCorrect).length * 10;
  const answeredTotal = Object.keys(userAnswers).length;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 pb-20">
      {/* Quiz Top Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-5 sm:p-7 text-white shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-yellow-200 text-xs font-bold tracking-wide mb-2 backdrop-blur-xs">
              <Scale className="w-3.5 h-3.5" />
              <span>2페이지 • 밸런스 퀴즈</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
              <span>정치인가?</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-orange-600 font-extrabold shadow-xs">
                10문항
              </span>
            </h1>
            <p className="text-orange-100 text-xs sm:text-sm mt-1">
              3문제 연속 정답 시 🍬 할로윈 캔디 선물! 단, 3문제 연속 오답 시 1번으로 리셋됩니다.
            </p>
          </div>

          {/* 3-Minute Timer Card */}
          <div className="bg-black/30 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/20 flex items-center gap-4 shrink-0 justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  timeLeft <= 30 ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/20 text-yellow-300'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-orange-200">제한 시간 (2분)</p>
                <p className={`text-xl sm:text-2xl font-black tracking-tight ${timeLeft <= 30 ? 'text-rose-200 animate-pulse' : 'text-white'}`}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>

            {/* Candy Inventory Box */}
            <div className="border-l border-white/20 pl-4 flex items-center gap-2">
              <div className="text-center">
                <p className="text-[10px] font-bold text-yellow-200">획득 캔디</p>
                <p className="text-lg font-black text-white flex items-center justify-center gap-1">
                  <span>🍬</span>
                  <span>{collectedCandies.length}개</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Streaks Indicator Bar */}
        <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Correct Streak */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-orange-100 flex items-center gap-1">
              <Flame className="w-4 h-4 text-yellow-300" />
              <span>연속 정답:</span>
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center transition-all ${
                    correctStreak >= step
                      ? 'bg-yellow-300 text-yellow-950 scale-105 shadow-xs'
                      : 'bg-white/20 text-white/60'
                  }`}
                >
                  {step === 3 && correctStreak >= 3 ? '🍬' : step}
                </div>
              ))}
              <span className="text-[11px] text-yellow-200 ml-1">
                (3연속 시 할로윈 캔디 획득)
              </span>
            </div>
          </div>

          {/* Wrong Streak warning */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-200 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
              <span>연속 오답:</span>
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center transition-all ${
                    wrongStreak >= step
                      ? 'bg-rose-500 text-white scale-105 shadow-xs'
                      : 'bg-white/20 text-white/60'
                  }`}
                >
                  {step}
                </div>
              ))}
              <span className="text-[11px] text-rose-200 ml-1">
                (3연속 오답 시 처음으로 리셋)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Card / Finished Card / TimeOut Card */}
      {isTimeOut ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-md animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">제한 시간 2분이 종료되었습니다!</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            10문제 밸런스 퀴즈 제한 시간(120초)이 모두 지났습니다. 처음부터 다시 도전하여 모든 캔디를 획득해 보세요!
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleRestartAll}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold flex items-center gap-2 transition cursor-pointer shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              <span>처음부터 다시 도전하기</span>
            </button>
          </div>
        </div>
      ) : isFinished ? (
        /* ================= Results Screen ================= */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          <div className="text-center pb-6 border-b border-slate-200">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
              <PartyPopper className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              밸런스 퀴즈 완주 성공!
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              정치와 비정치를 구별하는 10개 상황을 모두 확인했습니다.
            </p>

            {/* Score & Candy summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto mt-5">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <p className="text-xs font-bold text-slate-500">최종 점수</p>
                <p className="text-3xl font-black text-blue-600 mt-1">{score}점</p>
                <p className="text-[11px] text-slate-400">100점 만점</p>
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center">
                <p className="text-xs font-bold text-amber-800">획득 캔디</p>
                <p className="text-3xl font-black text-amber-600 mt-1">
                  🍬 {collectedCandies.length}개
                </p>
                <p className="text-[11px] text-amber-700">3연속 정답 보상</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <p className="text-xs font-bold text-slate-500">소요 시간</p>
                <p className="text-3xl font-black text-slate-800 mt-1">
                  {TOTAL_TIME_SECONDS - timeLeft}초
                </p>
                <p className="text-[11px] text-slate-400">제한시간 120초</p>
              </div>
            </div>

            {sheetStatus.message && (
              <div
                className={`mt-4 max-w-md mx-auto text-xs px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 ${
                  sheetStatus.status === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : sheetStatus.status === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                <span>• {sheetStatus.message}</span>
              </div>
            )}
          </div>

          {/* Collected Candies Showcase */}
          {collectedCandies.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-200">
              <h3 className="text-sm font-extrabold text-purple-900 mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-600" />
                <span>내가 모은 할로윈 달콤 캔디 컬렉션 ({collectedCandies.length}개)</span>
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {collectedCandies.map((candy, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-purple-200 shadow-2xs"
                  >
                    <span className="text-xl">{candy.emoji}</span>
                    <div>
                      <p className="text-xs font-black text-slate-800">{candy.name}</p>
                      <p className="text-[10px] text-slate-500">{candy.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10 Questions Full Review */}
          <div>
            <h3 className="font-extrabold text-slate-900 text-base mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span>10문항 전체 풀이 및 교과서 해설</span>
            </h3>
            <div className="space-y-3">
              {BALANCE_QUIZ_ITEMS.map((item) => {
                const ans = userAnswers[item.id];
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition ${
                      ans?.isCorrect
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                          {item.id}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              {item.category}
                            </span>
                            <span
                              className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                                item.isPolitics
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              정답: {item.explanation}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-900 leading-snug">
                            {item.scenario}
                          </p>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {item.detailReason}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {ans?.isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>정답 (+10점)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>오답</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={handleRestartAll}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>처음부터 다시 도전하기</span>
            </button>
          </div>
        </div>
      ) : (
        /* ================= Active Question Card ================= */
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span className="text-orange-600 font-black">
              문제 {currentIndex + 1} / {BALANCE_QUIZ_ITEMS.length}
            </span>
            <div className="flex items-center gap-1">
              {BALANCE_QUIZ_ITEMS.map((item, idx) => {
                const ans = userAnswers[item.id];
                return (
                  <div
                    key={item.id}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      idx === currentIndex
                        ? 'w-6 bg-orange-500 rounded-lg'
                        : ans
                        ? ans.isCorrect
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                        : 'bg-slate-200'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Scenario Question Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center relative overflow-hidden">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-4">
              <span>{currentItem.category}</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 max-w-2xl mx-auto leading-relaxed mb-6">
              "{currentItem.scenario}"
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 font-bold mb-8">
              위 상황은 <span className="text-blue-600 font-extrabold">정치</span>에 해당할까요, 아니면 <span className="text-orange-600 font-extrabold">정치가 아닐까요</span>?
            </p>

            {/* 2 Big Balance Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              {/* Option 1: 정치다 (O) */}
              <button
                onClick={() => handleSelectChoice(true)}
                disabled={isAnswerRevealed}
                className={`py-6 px-6 rounded-2xl font-black text-base sm:text-lg border-2 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  currentSelected === true
                    ? currentItem.isPolitics
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-md scale-102'
                      : 'border-rose-500 bg-rose-50 text-rose-800 shadow-md scale-102'
                    : isAnswerRevealed && currentItem.isPolitics
                    ? 'border-emerald-400 bg-emerald-50/60 text-emerald-800 ring-2 ring-emerald-300'
                    : 'border-blue-300 bg-blue-50/50 hover:bg-blue-100 text-blue-900 hover:border-blue-500 hover:shadow-md'
                }`}
              >
                <span className="text-3xl">⚖️</span>
                <span className="text-xl tracking-tight">정치다 (O)</span>
              </button>

              {/* Option 2: 정치가 아니다 (X) */}
              <button
                onClick={() => handleSelectChoice(false)}
                disabled={isAnswerRevealed}
                className={`py-6 px-6 rounded-2xl font-black text-base sm:text-lg border-2 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  currentSelected === false
                    ? !currentItem.isPolitics
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-md scale-102'
                      : 'border-rose-500 bg-rose-50 text-rose-800 shadow-md scale-102'
                    : isAnswerRevealed && !currentItem.isPolitics
                    ? 'border-emerald-400 bg-emerald-50/60 text-emerald-800 ring-2 ring-emerald-300'
                    : 'border-orange-300 bg-orange-50/50 hover:bg-orange-100 text-orange-900 hover:border-orange-500 hover:shadow-md'
                }`}
              >
                <span className="text-3xl">🚫</span>
                <span className="text-xl tracking-tight">정치가 아니다 (X)</span>
              </button>
            </div>

            {/* Instant Feedback Banner */}
            {isAnswerRevealed && (
              <div className="mt-8 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-2 mb-2">
                  {currentSelected === currentItem.isPolitics ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>정답입니다! (+10점)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>오답입니다!</span>
                    </span>
                  )}
                  <span className="text-xs font-extrabold text-slate-800">
                    👉 {currentItem.explanation}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2 pl-1">
                  <strong>[이유]</strong> {currentItem.detailReason}
                </p>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <span>
                      {currentIndex + 1 < BALANCE_QUIZ_ITEMS.length ? '다음 문제 풀기' : '최종 결과 확인하기'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          Halloween Candy Reward Modal (3 Consecutive Correct)
         ======================================================== */}
      {showCandyRewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border-4 border-amber-400 relative overflow-hidden animate-in zoom-in-95">
            <div className="text-6xl mb-3 animate-bounce">
              {showCandyRewardModal.emoji}
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>3문제 연속 정답 달성!</span>
            </div>
            <h3 className="text-xl font-black text-slate-900">
              {showCandyRewardModal.name} 선물 획득!
            </h3>
            <p className="text-xs text-slate-600 mt-1 mb-5">
              {showCandyRewardModal.desc}
            </p>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-bold text-amber-900 mb-6">
              🍬 보유한 할로윈 캔디: <strong>{collectedCandies.length}개</strong>
            </div>
            <button
              onClick={handleCloseCandyModal}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md transition cursor-pointer"
            >
              달콤한 캔디 받고 계속 풀기
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          3 Consecutive Wrong Modal (Reset to Question 1)
         ======================================================== */}
      {showResetAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border-4 border-rose-500 relative overflow-hidden animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1">
              3문제 연속 오답 발생!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 mb-6 leading-relaxed">
              정치와 비정치의 개념 구분을 다시 익히기 위해 <br />
              <strong className="text-rose-600 font-extrabold">1번 문제로 돌아가서 다시 시작</strong>합니다.
              <br />
              힘내서 다시 도전해 보세요!
            </p>
            <button
              onClick={handleConfirmResetModal}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-md transition cursor-pointer"
            >
              1번 문제부터 다시 도전하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
