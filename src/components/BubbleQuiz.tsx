import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flame,
  Award,
  Zap,
  Target,
  ArrowRight,
  Shuffle,
  Info
} from 'lucide-react';
import { BUBBLE_QUIZ_ITEMS } from '../data/bubbleQuizData';
import { sounds } from '../utils/audio';
import { submitStudentResult } from '../services/googleSheets';


interface BubbleQuizProps {
  studentId: string;
  studentName: string;
  gasUrl: string;
}

// 5 Vibrant Bubble Colors with Glass Sheen & Glowing Borders
const BUBBLE_COLORS = [
  {
    id: 'red',
    name: '빨강',
    bg: 'from-rose-400 via-rose-500 to-red-600',
    ring: 'ring-rose-400',
    shadow: 'shadow-rose-500/50',
    glow: 'rgba(244, 63, 94, 0.7)',
    text: 'text-rose-500',
    border: 'border-rose-300/80',
    badge: 'bg-rose-500'
  },
  {
    id: 'blue',
    name: '파랑',
    bg: 'from-sky-300 via-sky-500 to-blue-600',
    ring: 'ring-sky-400',
    shadow: 'shadow-blue-500/50',
    glow: 'rgba(14, 165, 233, 0.7)',
    text: 'text-blue-500',
    border: 'border-sky-200/80',
    badge: 'bg-sky-500'
  },
  {
    id: 'green',
    name: '초록',
    bg: 'from-emerald-300 via-emerald-500 to-green-600',
    ring: 'ring-emerald-400',
    shadow: 'shadow-emerald-500/50',
    glow: 'rgba(168, 255, 120, 0.7)',
    text: 'text-emerald-500',
    border: 'border-emerald-200/80',
    badge: 'bg-emerald-500'
  },
  {
    id: 'yellow',
    name: '노랑',
    bg: 'from-amber-200 via-amber-400 to-yellow-500',
    ring: 'ring-amber-300',
    shadow: 'shadow-amber-500/50',
    glow: 'rgba(245, 158, 11, 0.7)',
    text: 'text-amber-500',
    border: 'border-amber-100',
    badge: 'bg-amber-500'
  },
  {
    id: 'purple',
    name: '보라',
    bg: 'from-purple-300 via-purple-500 to-indigo-600',
    ring: 'ring-purple-400',
    shadow: 'shadow-purple-500/50',
    glow: 'rgba(168, 85, 247, 0.7)',
    text: 'text-purple-500',
    border: 'border-purple-200/80',
    badge: 'bg-purple-500'
  }
];

const GRID_ROWS = 6;
const GRID_COLS = 6;
const TOTAL_CELLS = GRID_ROWS * GRID_COLS;
const REQUIRED_STREAK = 5;

interface BubbleCell {
  id: number;
  colorIndex: number;
  popping?: boolean;
  shaking?: boolean;
}

interface DragState {
  idx: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  dx: number;
  dy: number;
  targetIdx: number | null;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

export const BubbleQuiz: React.FC<BubbleQuizProps> = ({
  studentId,
  studentName,
  gasUrl
}) => {
  // Current Stage: 1, 2, or 3
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);

  // Phase: 'bubble-game' | 'quiz' | 'stage-result' | 'all-cleared'
  const [stagePhase, setStagePhase] = useState<
    'bubble-game' | 'quiz' | 'stage-result' | 'all-cleared'
  >('bubble-game');

  // Bubble Match-3 Game State
  const [bubbleGrid, setBubbleGrid] = useState<BubbleCell[]>([]);
  const [bubbleStreak, setBubbleStreak] = useState<number>(0); // Target: 5 consecutive successful matches
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [poppingNotice, setPoppingNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Active Drag / Swipe State (Smooth real-time visual feedback)
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  // Quiz State for current stage (5 questions)
  const [stageAnswers, setStageAnswers] = useState<Record<number, number>>({});
  const [stageCorrectCount, setStageCorrectCount] = useState<number>(0);
  const [isStagePassed, setIsStagePassed] = useState<boolean>(false);

  // Overall results across stages
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [allAnswers, setAllAnswers] = useState<Record<number, number>>({});

  const [sheetStatus, setSheetStatus] = useState<{
    status: 'idle' | 'sending' | 'success' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: ''
  });

  // Current stage questions (5 questions)
  const currentQuestions = BUBBLE_QUIZ_ITEMS.filter((q) => q.stage === currentStage);

  // Find 3-in-a-row or 3-in-a-column matches on board
  const findMatches = (grid: BubbleCell[]): Set<number> => {
    const matched = new Set<number>();

    // Horizontal check
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS - 2; c++) {
        const i1 = r * GRID_COLS + c;
        const i2 = r * GRID_COLS + c + 1;
        const i3 = r * GRID_COLS + c + 2;
        if (
          grid[i1] &&
          grid[i2] &&
          grid[i3] &&
          grid[i1].colorIndex === grid[i2].colorIndex &&
          grid[i2].colorIndex === grid[i3].colorIndex
        ) {
          matched.add(i1);
          matched.add(i2);
          matched.add(i3);
          // Check 4th or 5th
          let nextCol = c + 3;
          while (nextCol < GRID_COLS) {
            const nextIdx = r * GRID_COLS + nextCol;
            if (grid[nextIdx]?.colorIndex === grid[i1].colorIndex) {
              matched.add(nextIdx);
              nextCol++;
            } else {
              break;
            }
          }
        }
      }
    }

    // Vertical check
    for (let c = 0; c < GRID_COLS; c++) {
      for (let r = 0; r < GRID_ROWS - 2; r++) {
        const i1 = r * GRID_COLS + c;
        const i2 = (r + 1) * GRID_COLS + c;
        const i3 = (r + 2) * GRID_COLS + c;
        if (
          grid[i1] &&
          grid[i2] &&
          grid[i3] &&
          grid[i1].colorIndex === grid[i2].colorIndex &&
          grid[i2].colorIndex === grid[i3].colorIndex
        ) {
          matched.add(i1);
          matched.add(i2);
          matched.add(i3);
          let nextRow = r + 3;
          while (nextRow < GRID_ROWS) {
            const nextIdx = nextRow * GRID_COLS + c;
            if (grid[nextIdx]?.colorIndex === grid[i1].colorIndex) {
              matched.add(nextIdx);
              nextRow++;
            } else {
              break;
            }
          }
        }
      }
    }

    return matched;
  };

  // Generate a board without initial matches
  const generateCleanBoard = (): BubbleCell[] => {
    let newGrid: BubbleCell[] = [];
    let attempts = 0;
    while (attempts < 50) {
      newGrid = [];
      for (let i = 0; i < TOTAL_CELLS; i++) {
        const r = Math.floor(i / GRID_COLS);
        const c = i % GRID_COLS;
        const forbidden: number[] = [];
        if (c >= 2) {
          const left1 = newGrid[r * GRID_COLS + c - 1].colorIndex;
          const left2 = newGrid[r * GRID_COLS + c - 2].colorIndex;
          if (left1 === left2) forbidden.push(left1);
        }
        if (r >= 2) {
          const up1 = newGrid[(r - 1) * GRID_COLS + c].colorIndex;
          const up2 = newGrid[(r - 2) * GRID_COLS + c].colorIndex;
          if (up1 === up2) forbidden.push(up1);
        }

        const allowed = [0, 1, 2, 3, 4].filter((col) => !forbidden.includes(col));
        const chosenColor = allowed.length > 0
          ? allowed[Math.floor(Math.random() * allowed.length)]
          : Math.floor(Math.random() * 5);

        newGrid.push({ id: i, colorIndex: chosenColor });
      }

      if (findMatches(newGrid).size === 0) {
        return newGrid;
      }
      attempts++;
    }
    return newGrid;
  };

  // Initialize Bubble Board when stage starts
  useEffect(() => {
    initBubbleBoard();
  }, [currentStage]);

  const initBubbleBoard = () => {
    const board = generateCleanBoard();
    setBubbleGrid(board);
    setBubbleStreak(0);
    setSelectedIdx(null);
    setIsProcessing(false);
    setPoppingNotice(null);
  };

  // Check if two cells are adjacent
  const areAdjacent = (idx1: number, idx2: number) => {
    const r1 = Math.floor(idx1 / GRID_COLS);
    const c1 = idx1 % GRID_COLS;
    const r2 = Math.floor(idx2 / GRID_COLS);
    const c2 = idx2 % GRID_COLS;
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
  };

  // Perform Swap and Check Match with smooth visual feedback
  const executeSwap = (idx1: number, idx2: number) => {
    if (isProcessing) return;
    if (!areAdjacent(idx1, idx2)) {
      setSelectedIdx(idx2);
      sounds.play('select');
      return;
    }

    setIsProcessing(true);
    setSelectedIdx(null);

    // Swap in temporary grid and display immediately so user sees the bubbles exchange
    const tempGrid = [...bubbleGrid];
    const color1 = tempGrid[idx1].colorIndex;
    const color2 = tempGrid[idx2].colorIndex;

    tempGrid[idx1] = { ...tempGrid[idx1], colorIndex: color2 };
    tempGrid[idx2] = { ...tempGrid[idx2], colorIndex: color1 };
    setBubbleGrid(tempGrid);

    const matches = findMatches(tempGrid);

    if (matches.size > 0) {
      // SUCCESSFUL MATCH!
      sounds.play('connect');
      const nextStreak = bubbleStreak + 1;
      setBubbleStreak(nextStreak);
      setPoppingNotice(`🎉 팡! 같은 색 공 3개 이상 연속 매치 성공! (연속 ${nextStreak}/${REQUIRED_STREAK}회 달성)`);

      confetti({
        particleCount: 35,
        spread: 65,
        origin: { y: 0.65 }
      });

      // Show popping burst animation on matched cells
      setTimeout(() => {
        const poppingGrid = tempGrid.map((b, i) =>
          matches.has(i) ? { ...b, popping: true } : b
        );
        setBubbleGrid(poppingGrid);

        // Check if 5 consecutive matches reached!
        if (nextStreak >= REQUIRED_STREAK) {
          sounds.play('complete');
          confetti({
            particleCount: 130,
            spread: 95,
            origin: { y: 0.5 }
          });
          setPoppingNotice(`🏆 축하합니다! 5연속 매치 대성공! ${currentStage}단계 퀴즈(5문제)가 열렸습니다!`);

          setTimeout(() => {
            setStagePhase('quiz');
            setStageAnswers({});
            setIsProcessing(false);
            window.scrollTo({ top: 120, behavior: 'smooth' });
          }, 950);
          return;
        }

        // Drop and refill board after popping
        setTimeout(() => {
          refillBoardAfterPop(tempGrid, matches);
        }, 320);
      }, 160);
    } else {
      // INVALID MOVE - SWAP BACK AFTER BRIEF PAUSE AND RESET STREAK
      setTimeout(() => {
        sounds.play('delete');
        setBubbleStreak(0);
        setPoppingNotice('앗! 3개가 연속되지 않아 원래대로 돌아갔습니다. (연속 카운트가 0으로 초기화되었습니다)');

        // Swap back with shake
        const swappedBack = tempGrid.map((b, i) => {
          if (i === idx1) return { ...b, colorIndex: color1, shaking: true };
          if (i === idx2) return { ...b, colorIndex: color2, shaking: true };
          return b;
        });
        setBubbleGrid(swappedBack);

        setTimeout(() => {
          setBubbleGrid((prev) => prev.map((b) => ({ ...b, shaking: false })));
          setIsProcessing(false);
        }, 360);
      }, 220);
    }
  };

  // Refill board with gravity drop
  const refillBoardAfterPop = (grid: BubbleCell[], poppedIndices: Set<number>) => {
    const newBoard = [...grid];

    // For each column, shift unpopped bubbles down and create new ones at top
    for (let c = 0; c < GRID_COLS; c++) {
      const survivingColors: number[] = [];
      for (let r = 0; r < GRID_ROWS; r++) {
        const idx = r * GRID_COLS + c;
        if (!poppedIndices.has(idx)) {
          survivingColors.push(newBoard[idx].colorIndex);
        }
      }

      const missingCount = GRID_ROWS - survivingColors.length;
      const newColors: number[] = [];
      for (let m = 0; m < missingCount; m++) {
        newColors.push(Math.floor(Math.random() * 5));
      }

      const colColors = [...newColors, ...survivingColors];
      for (let r = 0; r < GRID_ROWS; r++) {
        const idx = r * GRID_COLS + c;
        newBoard[idx] = {
          id: Math.random(),
          colorIndex: colColors[r],
          popping: false,
          shaking: false
        };
      }
    }

    setBubbleGrid(newBoard);
    setIsProcessing(false);
  };

  // Click on a bubble (Tap to select & swap)
  const handleBubbleClick = (idx: number) => {
    if (isProcessing || stagePhase !== 'bubble-game') return;

    if (selectedIdx === null) {
      sounds.play('select');
      setSelectedIdx(idx);
    } else if (selectedIdx === idx) {
      setSelectedIdx(null);
    } else {
      executeSwap(selectedIdx, idx);
    }
  };

  // Real-time Pointer & Swipe Drag Handling
  const handlePointerDown = (idx: number, e: React.PointerEvent) => {
    if (isProcessing || stagePhase !== 'bubble-game') return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const state: DragState = {
      idx,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      dx: 0,
      dy: 0,
      targetIdx: null,
      direction: null
    };
    dragStateRef.current = state;
    setDragState(state);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const current = dragStateRef.current;
    if (!current || isProcessing) return;

    const dx = e.clientX - current.startX;
    const dy = e.clientY - current.startY;
    const dist = Math.hypot(dx, dy);

    let direction: 'left' | 'right' | 'up' | 'down' | null = null;
    let targetIdx: number | null = null;

    const r = Math.floor(current.idx / GRID_COLS);
    const c = current.idx % GRID_COLS;

    if (dist > 8) {
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && c < GRID_COLS - 1) {
          direction = 'right';
          targetIdx = r * GRID_COLS + c + 1;
        } else if (dx < 0 && c > 0) {
          direction = 'left';
          targetIdx = r * GRID_COLS + c - 1;
        }
      } else {
        if (dy > 0 && r < GRID_ROWS - 1) {
          direction = 'down';
          targetIdx = (r + 1) * GRID_COLS + c;
        } else if (dy < 0 && r > 0) {
          direction = 'up';
          targetIdx = (r - 1) * GRID_COLS + c;
        }
      }
    }

    // Fast completion threshold: when dragged far enough (>= 32px), trigger immediately
    if (dist >= 32 && targetIdx !== null) {
      dragStateRef.current = null;
      setDragState(null);
      executeSwap(current.idx, targetIdx);
      return;
    }

    const updated: DragState = {
      ...current,
      currentX: e.clientX,
      currentY: e.clientY,
      dx,
      dy,
      direction,
      targetIdx
    };
    dragStateRef.current = updated;
    setDragState(updated);
  };

  const handlePointerUp = () => {
    const current = dragStateRef.current;
    dragStateRef.current = null;
    setDragState(null);

    if (!current || isProcessing) return;

    const dist = Math.hypot(current.dx, current.dy);

    if (dist >= 20 && current.targetIdx !== null) {
      executeSwap(current.idx, current.targetIdx);
    } else if (dist < 10) {
      handleBubbleClick(current.idx);
    }
  };

  // Manual Shuffle board
  const handleShuffleBoard = () => {
    sounds.play('select');
    const board = generateCleanBoard();
    setBubbleGrid(board);
    setSelectedIdx(null);
    setPoppingNotice('🎲 판을 새로 섞었습니다! 같은 색 3개를 연속으로 맞춰보세요.');
  };

  // Quiz Answer Selection
  const handleSelectAnswer = (qId: number, ansIdx: number) => {
    sounds.play('select');
    setStageAnswers((prev) => ({
      ...prev,
      [qId]: ansIdx
    }));
  };

  // Submit Stage Quiz (5 questions)
  const handleSubmitStageQuiz = () => {
    const answeredCount = Object.keys(stageAnswers).length;
    if (answeredCount < 5) {
      alert(`5문제를 모두 선택해 주세요! (현재 ${answeredCount}/5 완료)`);
      return;
    }

    let correct = 0;
    currentQuestions.forEach((q) => {
      if (stageAnswers[q.id] === q.answer) {
        correct += 1;
      }
    });

    setStageCorrectCount(correct);
    const passed = correct >= 3;
    setIsStagePassed(passed);

    // Save answers
    setAllAnswers((prev) => ({ ...prev, ...stageAnswers }));

    if (passed) {
      sounds.play('complete');
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.5 }
      });
      if (!completedStages.includes(currentStage)) {
        setCompletedStages((prev) => [...prev, currentStage]);
      }
    } else {
      sounds.play('delete');
    }

    setStagePhase('stage-result');
    window.scrollTo({ top: 120, behavior: 'smooth' });

    // If passed Stage 3 -> All Cleared!
    if (passed && currentStage === 3) {
      setTimeout(() => {
        setStagePhase('all-cleared');
        sendAllToGoogleSheets();
      }, 1500);
    }
  };

  // Retry the 5 questions for the current stage
  const handleRetryCurrentStage = () => {
    sounds.play('select');
    setStageAnswers({});
    setStagePhase('quiz');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Move to next stage
  const handleGoToNextStage = () => {
    sounds.play('select');
    const nextSt = (currentStage + 1) as 2 | 3;
    setCurrentStage(nextSt);
    setStagePhase('bubble-game');
    setBubbleStreak(0);
    setStageAnswers({});
    initBubbleBoard();
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // Restart everything
  const handleRestartEntireGame = () => {
    if (confirm('처음(1단계)부터 모든 퀴즈와 버블 게임을 다시 시작할까요?')) {
      sounds.play('delete');
      setCurrentStage(1);
      setStagePhase('bubble-game');
      setCompletedStages([]);
      setAllAnswers({});
      setStageAnswers({});
      initBubbleBoard();
      setSheetStatus({ status: 'idle', message: '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Send results to Google Sheets
  const sendAllToGoogleSheets = async () => {
    setSheetStatus({ status: 'sending', message: '스프레드시트에 4페이지 버블 퀴즈 성적 기록 중...' });

    let totalCorrect = 0;
    BUBBLE_QUIZ_ITEMS.forEach((q) => {
      if (allAnswers[q.id] === q.answer) totalCorrect += 1;
    });

    const calculatedScore = Math.round((totalCorrect / 15) * 100);

    try {
      const result = await submitStudentResult(
        4,
        {
          studentId: studentId.trim(),
          studentName: studentName.trim(),
          score: calculatedScore,
          correctCount: totalCorrect,
          totalQuestions: 15,
          details: `[버블버블 15제] 3개 스테이지 ALL CLEAR | 맞힌 개수:${totalCorrect}/15`
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

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 rounded-3xl p-5 sm:p-7 text-white shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-indigo-100 text-xs font-bold tracking-wide mb-2 backdrop-blur-xs">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span>4페이지 • 버블버블 3매치 스와이프 & 정치 퀴즈 15제</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
              <span>버블버블 스와이프 5연속 팡! & 퀴즈 15제</span>
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm mt-1">
              같은 색 공이 3개 연속되도록 스와이프하여 터트리기를 <strong>연속 5번 성공</strong>하면 퀴즈 5문제가 열립니다!
            </p>
          </div>

          {/* Stage Progress Badges */}
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/20 self-start sm:self-auto shrink-0">
            {[1, 2, 3].map((st) => (
              <div
                key={st}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black transition ${
                  currentStage === st
                    ? 'bg-yellow-400 text-yellow-950 shadow-sm scale-105'
                    : completedStages.includes(st)
                    ? 'bg-emerald-500/80 text-white'
                    : 'bg-white/15 text-white/60'
                }`}
              >
                <span>{st}단계</span>
                {completedStages.includes(st) ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                ) : (
                  <span className="text-[10px]">({(st - 1) * 5 + 1}~{st * 5}번)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================
          PHASE 1: Bubble Swap Match-3 Mini-Game
         ======================================================== */}
      {stagePhase === 'bubble-game' && (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm text-center animate-in fade-in">
          <div className="max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-extrabold mb-3">
              <Target className="w-4 h-4 text-violet-600" />
              <span>{currentStage}단계 퀴즈 잠금 해제 미니게임</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              같은 색 공 3개 연속 맞히기 (스와이프 5연속 팡!)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
              화면의 공을 상·하·좌·우로 <strong>스와이프(밀기)</strong>하거나 <strong>클릭하여 인접한 공과 위치를 변경</strong>하세요!<br />
              같은 색 공이 3개 이상 연속되면 터집니다. <strong>연속 5번 성공</strong>하면 <strong>{currentStage}단계 퀴즈 5문제</strong>가 열립니다.
            </p>

            {/* Streak Gauge (Target 5) */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200/80 mb-5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span>연속 매치 성공 카운트:</span>
                </span>
                <span className="text-xs font-black text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                  {bubbleStreak} / {REQUIRED_STREAK} 회
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((step) => {
                  const isDone = bubbleStreak >= step;
                  return (
                    <div
                      key={step}
                      className={`h-10 rounded-xl font-black text-xs flex flex-col items-center justify-center transition-all ${
                        isDone
                          ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md scale-105 ring-2 ring-amber-300'
                          : 'bg-white/80 text-slate-400 border border-slate-200'
                      }`}
                    >
                      <span>{step === 5 ? (isDone ? '🔓 성공' : '5회 🔒') : `${step}회`}</span>
                      <span className="text-[9px] opacity-80">{isDone ? '✔' : ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notice / Feedback Text */}
            {poppingNotice && (
              <div className="mb-4 text-xs sm:text-sm font-bold p-3 rounded-2xl bg-indigo-50 text-indigo-900 border border-indigo-200 animate-in fade-in shadow-xs">
                {poppingNotice}
              </div>
            )}

            {/* Bubble Match-3 Grid Arena (6 rows x 6 cols) */}
            <div
              className="bg-slate-900 p-3.5 sm:p-5 rounded-3xl shadow-2xl border-4 border-slate-800 relative select-none touch-none max-w-sm sm:max-w-md mx-auto"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* Floating Real-time Drag / Swipe Indicator - High visibility banner */}
              {dragState && bubbleGrid[dragState.idx] && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none bg-slate-900/95 backdrop-blur-md px-4 py-1.5 rounded-full border-2 border-yellow-400 text-white text-xs font-black shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 whitespace-nowrap">
                  <div
                    className={`w-4 h-4 rounded-full bg-gradient-to-br ${BUBBLE_COLORS[bubbleGrid[dragState.idx].colorIndex].bg} ring-2 ring-white shadow-sm`}
                  />
                  <span className="text-yellow-300 font-extrabold">
                    {BUBBLE_COLORS[bubbleGrid[dragState.idx].colorIndex].name} 버블
                  </span>
                  <span className="text-white/90">
                    {dragState.direction === 'right' && '👉 오른쪽으로 이동'}
                    {dragState.direction === 'left' && '👈 왼쪽으로 이동'}
                    {dragState.direction === 'up' && '👆 위쪽으로 이동'}
                    {dragState.direction === 'down' && '👇 아래쪽으로 이동'}
                    {!dragState.direction && '밀어서 인접 버블과 교체'}
                  </span>
                  {dragState.targetIdx !== null && bubbleGrid[dragState.targetIdx] && (
                    <span className="text-sky-300 font-bold bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-400/50 text-[10px]">
                      ⇆ {BUBBLE_COLORS[bubbleGrid[dragState.targetIdx].colorIndex].name}와 교체
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-6 gap-2 sm:gap-2.5 aspect-square relative">
                {bubbleGrid.map((bubble, idx) => {
                  const colorObj = BUBBLE_COLORS[bubble.colorIndex] || BUBBLE_COLORS[0];
                  const isBeingDragged = dragState?.idx === idx;
                  const isTargetOfDrag = dragState?.targetIdx === idx;
                  const isSelected = selectedIdx === idx;
                  const isNeighborToSelected =
                    selectedIdx !== null && areAdjacent(selectedIdx, idx);

                  // Keep drag translation visible and lift slightly above finger (-16px) on touch
                  const maxDragOffset = 44;
                  const dragDx = isBeingDragged
                    ? Math.max(-maxDragOffset, Math.min(maxDragOffset, dragState.dx))
                    : 0;
                  const dragDy = isBeingDragged
                    ? Math.max(-maxDragOffset, Math.min(maxDragOffset, dragState.dy))
                    : 0;

                  return (
                    <div
                      key={bubble.id}
                      onPointerDown={(e) => handlePointerDown(idx, e)}
                      className={`relative aspect-square rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150 ${
                        bubble.shaking ? 'animate-shake' : ''
                      } ${bubble.popping ? 'scale-110 brightness-150 duration-300' : ''}`}
                    >
                      {/* Origin Slot Background (shown when bubble is being dragged away) */}
                      {isBeingDragged && (
                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/40 bg-white/5 flex items-center justify-center pointer-events-none">
                          <span className="text-white/40 text-[10px] font-bold">출발</span>
                        </div>
                      )}

                      {/* Swap Target Slot Highlight */}
                      {isTargetOfDrag && (
                        <div className="absolute inset-0 rounded-full border-2 border-yellow-400 bg-yellow-400/20 ring-4 ring-yellow-400/40 animate-pulse pointer-events-none z-10 flex items-center justify-center">
                          <span className="text-yellow-200 text-xs font-black drop-shadow">
                            ⇆
                          </span>
                        </div>
                      )}

                      {/* 3D Spherical Bubble with Glass Sheen and Dynamic Drag Transform */}
                      <div
                        className={`w-full h-full rounded-full bg-gradient-to-br ${colorObj.bg} shadow-lg ${colorObj.shadow} flex items-center justify-center relative overflow-hidden transition-all duration-100 border-2 ${colorObj.border} ${
                          isBeingDragged
                            ? 'ring-4 ring-yellow-300 ring-offset-2 ring-offset-slate-900 shadow-2xl brightness-115'
                            : isSelected
                            ? 'scale-110 ring-4 ring-yellow-300 ring-offset-2 ring-offset-slate-900 shadow-xl z-20 animate-pulse'
                            : isNeighborToSelected
                            ? 'hover:scale-105 ring-2 ring-white/60'
                            : 'hover:scale-105 active:scale-95'
                        }`}
                        style={
                          isBeingDragged
                            ? {
                                transform: `translate(${dragDx}px, ${dragDy - 18}px) scale(1.22)`,
                                zIndex: 40,
                                boxShadow: `0 0 28px ${colorObj.glow}`
                              }
                            : undefined
                        }
                        title={`${colorObj.name} 버블 (스와이프 또는 클릭)`}
                      >
                        {/* 3D Glass Inner Depth */}
                        <div className="absolute inset-0 rounded-full bg-radial from-white/35 via-transparent to-black/35 pointer-events-none" />

                        {/* Top-Left Specular Gloss Reflection */}
                        <span className="absolute top-1 left-1.5 w-3.5 h-2.5 bg-white/85 rounded-full rotate-[-35deg] blur-[0.3px] pointer-events-none" />
                        <span className="absolute top-1.5 left-2 w-1.5 h-1 bg-white rounded-full pointer-events-none" />

                        {/* Bottom-Right Bounce Light */}
                        <span className="absolute bottom-1 right-1.5 w-2.5 h-1.5 bg-white/35 rounded-full blur-[0.5px] pointer-events-none" />

                        {/* In-Bubble Visual State Indicators */}
                        {isBeingDragged && (
                          <span className="text-white text-xs font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] z-20 animate-bounce">
                            {dragState.direction === 'right' && '→'}
                            {dragState.direction === 'left' && '←'}
                            {dragState.direction === 'up' && '↑'}
                            {dragState.direction === 'down' && '↓'}
                            {!dragState.direction && '✦'}
                          </span>
                        )}
                        {isSelected && !isBeingDragged && (
                          <span className="text-white text-xs font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] z-10">
                            ↔
                          </span>
                        )}
                        {isNeighborToSelected && !isSelected && !isBeingDragged && (
                          <span className="text-white/80 text-[10px] font-black z-10">
                            •
                          </span>
                        )}

                        {/* Matched Pop Effect Overlay */}
                        {bubble.popping && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/40 rounded-full z-30">
                            <span className="text-xl drop-shadow animate-ping">💥</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Help and Shuffle Button */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-left text-slate-300 text-[11px] px-1">
                <span>
                  👆 <strong>스와이프(밀기)</strong> 또는 <strong>공 2개 연속 클릭</strong>으로 위치 교체
                </span>
                <button
                  type="button"
                  onClick={handleShuffleBoard}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1 cursor-pointer transition"
                >
                  <Shuffle className="w-3 h-3 text-amber-400" />
                  <span>새로 섞기</span>
                </button>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              💡 팁: 가로 또는 세로로 같은 색 공이 3개 이어지도록 인접한 두 공을 맞바꿔 보세요! 실패 시 연속 카운트가 초기화됩니다.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PHASE 2: Quiz Stage (5 Questions)
         ======================================================== */}
      {stagePhase === 'quiz' && (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>5연속 매치 대성공! {currentStage}단계 퀴즈 도전</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {currentStage}단계: 좁은 의미 vs 넓은 의미 정치 판별 (5문항)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                ※ 5문제 중 <strong>3문제 이상</strong>을 맞혀야 이 단계를 CLEAR할 수 있습니다. (2문제 이하 시 재도전)
              </p>
            </div>

            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
              응답: {Object.keys(stageAnswers).length} / 5 완료
            </span>
          </div>

          {/* 5 Questions */}
          <div className="space-y-6">
            {currentQuestions.map((q, idx) => {
              const selectedAns = stageAnswers[q.id];
              return (
                <div
                  key={q.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 transition-all hover:bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-xl bg-indigo-600 text-white text-xs font-black flex items-center justify-center mt-0.5 shadow-xs">
                      {q.id}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {q.question}
                      </p>

                      {/* Options: 1) 좁은 의미의 정치, 2) 넓은 의미의 정치 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3.5">
                        {q.options.map((opt, optIdx) => {
                          const optionNumber = optIdx + 1;
                          const isSelected = selectedAns === optionNumber;
                          return (
                            <button
                              key={optionNumber}
                              type="button"
                              onClick={() => handleSelectAnswer(q.id, optionNumber)}
                              className={`p-3 rounded-xl border text-left font-bold text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.01]'
                                  : 'bg-white hover:bg-indigo-50/60 text-slate-700 border-slate-200 hover:border-indigo-300'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center ${
                                    isSelected
                                      ? 'bg-white text-indigo-600'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {optionNumber}
                                </span>
                                <span>{opt}</span>
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="mt-8 pt-5 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleSubmitStageQuiz}
              className="px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm sm:text-base shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <span>{currentStage}단계 답안 제출 & 채점하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          PHASE 3: Stage Result Feedback (Pass vs Fail)
         ======================================================== */}
      {stagePhase === 'stage-result' && (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm animate-in fade-in space-y-6">
          <div
            className={`p-5 sm:p-6 rounded-2xl text-center border ${
              isStagePassed
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/80 border-rose-200 text-rose-950'
            }`}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-md">
              {isStagePassed ? (
                <div className="bg-emerald-500 text-white w-full h-full rounded-2xl flex items-center justify-center">
                  <Award className="w-8 h-8" />
                </div>
              ) : (
                <div className="bg-rose-500 text-white w-full h-full rounded-2xl flex items-center justify-center">
                  <XCircle className="w-8 h-8" />
                </div>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black">
              {isStagePassed
                ? `🎉 ${currentStage}단계 통과 (CLEAR)!`
                : `😢 ${currentStage}단계 통과 실패`}
            </h3>

            <p className="text-xs sm:text-sm mt-1 font-semibold">
              5문제 중 <strong>{stageCorrectCount}문제</strong>를 맞혔습니다.{' '}
              {isStagePassed
                ? '3문제 이상 정답 기준을 통과했습니다!'
                : '통과 기준은 3문제 이상입니다. 오답 해설을 확인하고 5문제를 다시 풀어보세요!'}
            </p>
          </div>

          {/* Feedback & Explanations */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>{currentStage}단계 문항별 정오답 및 상세 해설</span>
            </h4>

            {currentQuestions.map((q) => {
              const userAns = stageAnswers[q.id];
              const isCorrect = userAns === q.answer;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border text-left transition ${
                    isCorrect
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center mt-0.5 shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {q.id}
                      </span>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {q.question}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-md ${
                              isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            내 선택: {userAns ? q.options[userAns - 1] : '미응답'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                            정답: {q.options[q.answer - 1]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 text-xs font-black px-2 py-1 rounded-lg">
                      {isCorrect ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> 정답
                        </span>
                      ) : (
                        <span className="text-rose-700 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> 오답
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Explanation */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-xs text-slate-700 leading-relaxed bg-white/70 p-2.5 rounded-xl">
                    <strong className="text-indigo-700">해설: </strong>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-center gap-3">
            {isStagePassed ? (
              currentStage < 3 ? (
                <button
                  onClick={handleGoToNextStage}
                  className="px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <span>{currentStage + 1}단계 버블 챌린지 도전하기</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setStagePhase('all-cleared')}
                  className="px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Trophy className="w-4 h-4" />
                  <span>전체 최종 결과 확인하기</span>
                </button>
              )
            ) : (
              <button
                onClick={handleRetryCurrentStage}
                className="px-7 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{currentStage}단계 5문제 다시 풀기</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          PHASE 4: All Cleared Screen (15/15 Completed)
         ======================================================== */}
      {stagePhase === 'all-cleared' && (
        <div className="bg-white rounded-3xl p-6 sm:p-9 border border-slate-200 shadow-sm text-center animate-in fade-in space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-yellow-400 via-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg">
            <Trophy className="w-10 h-10" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-900 text-xs font-black">
              ★ 좁은 의미 vs 넓은 의미 정치 완전 정복
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              버블버블 15제 ALL CLEAR 완료!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              버블 5연속 매치와 3개 스테이지(총 15문제)를 모두 훌륭하게 통과했습니다!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-md mx-auto text-left">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-500">클리어 단계</span>
              <p className="text-2xl font-black text-indigo-600 mt-0.5">3 / 3 단계</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-500">총 문항 수</span>
              <p className="text-2xl font-black text-slate-800 mt-0.5">15 문항</p>
            </div>
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-center">
              <span className="text-[11px] font-bold text-emerald-800">성취 수준</span>
              <p className="text-2xl font-black text-emerald-600 mt-0.5">마스터 👑</p>
            </div>
          </div>

          {sheetStatus.message && (
            <div
              className={`max-w-md mx-auto text-xs px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 ${
                sheetStatus.status === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              <span>• {sheetStatus.message}</span>
            </div>
          )}

          <div className="pt-4 flex justify-center">
            <button
              onClick={handleRestartEntireGame}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>처음부터 다시 도전하기</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
