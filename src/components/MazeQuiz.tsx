import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Compass,
  Trophy,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Layers,
  ChevronRight,
  BookOpen,
  Footprints,
  Star,
  Zap,
  Volume2,
  VolumeX,
  TreePine,
  Leaf,
  Shield,
  Flame,
  Bomb,
  AlertTriangle,
  Eye,
  Clock,
  Hourglass
} from 'lucide-react';
import {
  CHARACTERS,
  CharacterInfo,
  MAZE_QUESTIONS,
  MazeQuestion,
  INITIAL_MAZE_MAP,
  MAZE_GRID_SIZE,
  QUESTION_POSITIONS,
  TilePos
} from '../data/mazeQuizData';
import { sounds } from '../utils/audio';
import { CharacterSelect } from './CharacterSelect';
import { submitStudentResult } from '../services/googleSheets';


interface MazeQuizProps {
  studentId?: string;
  studentName?: string;
  gasUrl?: string;
}

// Time Limit Constants: 1차 2분 (120초), 2차 3분 (180초)
const TIME_LIMIT_ATTEMPT_1 = 120; // 2 minutes in seconds
const TIME_LIMIT_ATTEMPT_2 = 180; // 3 minutes in seconds

interface InGameToast {
  title: string;
  message: string;
  type: 'compass' | 'shield' | 'mine' | 'combo' | 'info' | 'teleport';
}

export const MazeQuiz: React.FC<MazeQuizProps> = ({
  studentId: initialStudentId = '',
  studentName: initialStudentName = '',
  gasUrl = ''
}) => {
  // Character Selection: 'cat' | 'dog' | 'shark'
  const [selectedCharId, setSelectedCharId] = useState<'cat' | 'dog' | 'shark'>('cat');
  // Entrance state: false shows CharacterSelect, true enters the Forest Maze
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  // Time Limit & Challenge Attempts (1차: 2분, 2차: 3분, 미완료 시 도전 실패)
  const [attemptNumber, setAttemptNumber] = useState<1 | 2>(1); // 1 = 1차 도전 (2분), 2 = 2차 재도전 (3분)
  const [timeLeft, setTimeLeft] = useState<number>(TIME_LIMIT_ATTEMPT_1); // 남은 시간 (초)
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState<boolean>(false); // 1차 2분 초과 모달 (재도전 기회 3분 부여)
  const [isFailedModalOpen, setIsFailedModalOpen] = useState<boolean>(false); // 1차/2차 모두 초과 모달 ('도전 실패')

  // Student Info for evaluation & submission
  const [studentId, setStudentId] = useState(initialStudentId);
  const [studentName, setStudentName] = useState(initialStudentName);

  // Maze state
  const [mazeGrid, setMazeGrid] = useState<number[][]>(() =>
    INITIAL_MAZE_MAP.map((row) => [...row])
  );
  const [playerPos, setPlayerPos] = useState<TilePos>({ x: 1, y: 1 });
  const [facingRight, setFacingRight] = useState<boolean>(true);
  const [snacksCollected, setSnacksCollected] = useState<number>(0);
  const [stepsCount, setStepsCount] = useState<number>(0);

  // Streak & Buff States (Consecutive correct answers & in-game perks)
  const [streak, setStreak] = useState<number>(0); // 현재 연속 정답 콤보
  const [maxStreak, setMaxStreak] = useState<number>(0); // 최고 연속 정답 기록
  const [canTeleport, setCanTeleport] = useState<boolean>(false); // 3연속 정답 보상: 원하는 자리로 바로 이동 (자유 순간이동)
  const [isTeleportMode, setIsTeleportMode] = useState<boolean>(false); // 순간이동 타일 선택 모드 활성화 상태

  // 2연속 정답 보상: 숲속 요정의 나침반 (황금 발자국 3초 가이드)
  const [compassPath, setCompassPath] = useState<TilePos[]>([]);
  const [showFootprints, setShowFootprints] = useState<boolean>(false);
  const footprintTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Landmine explosion animation states
  const [isBoardShaking, setIsBoardShaking] = useState<boolean>(false);
  const [mineExplosionPos, setMineExplosionPos] = useState<TilePos | null>(null);

  // In-Game Notification Banner Toast
  const [inGameToast, setInGameToast] = useState<InGameToast | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Quiz progress: questionId -> { selectedOption: number, isCorrect: boolean, attempts: number }
  const [solvedQuestions, setSolvedQuestions] = useState<
    Record<number, { selectedOption: number; isCorrect: boolean; attempts: number }>
  >({});

  // Active question modal
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Completion
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Sound toggle
  const [soundOn, setSoundOn] = useState<boolean>(true);

  // Touch Swipe tracking for tablets & touchscreens
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const character = CHARACTERS.find((c) => c.id === selectedCharId) || CHARACTERS[0];
  const totalQuestions = MAZE_QUESTIONS.length;
  const solvedCount = Object.keys(solvedQuestions).filter(
    (qid) => solvedQuestions[Number(qid)].isCorrect
  ).length;
  const totalScore = solvedCount * 10;

  // Show floating in-game toast helper
  const triggerToast = useCallback((toast: InGameToast) => {
    setInGameToast(toast);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setInGameToast(null);
    }, 3800);
  }, []);

  // Sync initial student info if props change
  useEffect(() => {
    if (initialStudentId) setStudentId(initialStudentId);
    if (initialStudentName) setStudentName(initialStudentName);
  }, [initialStudentId, initialStudentName]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (footprintTimerRef.current) clearTimeout(footprintTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Timer countdown: 1차 2분(120초), 2차 3분(180초)
  useEffect(() => {
    if (!hasStarted || isCompleted || isTimeoutModalOpen || isFailedModalOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setActiveQuestionId(null);
          sounds.play('fail');

          if (attemptNumber === 1) {
            // 1차 2분 종료 -> 재도전 기회(3분) 모달 표시
            setIsTimeoutModalOpen(true);
          } else {
            // 2차 3분까지 종료 -> '도전 실패' 모달 표시
            setIsFailedModalOpen(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, isCompleted, isTimeoutModalOpen, isFailedModalOpen, attemptNumber]);

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Helper to generate SVG pie wedge path (starts at 12 o'clock, clockwise)
  const getPiePath = (cx: number, cy: number, r: number, ratio: number) => {
    if (ratio >= 0.999) {
      return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`;
    }
    if (ratio <= 0.001) return '';
    const angle = ratio * 360;
    const radians = ((angle - 90) * Math.PI) / 180;
    const x = cx + r * Math.cos(radians);
    const y = cy + r * Math.sin(radians);
    const largeArcFlag = angle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${largeArcFlag} 1 ${x} ${y} Z`;
  };

  // BFS Algorithm: Find shortest path from given start to nearest unsolved question node
  const findShortestPathToNearestQuestion = useCallback(
    (
      start: TilePos,
      currentSolved: Record<number, { isCorrect: boolean }>,
      grid: number[][]
    ): { targetQId: number | null; path: TilePos[] } => {
      const unsolvedQIds = MAZE_QUESTIONS.map((q) => q.id).filter(
        (qid) => !currentSolved[qid]?.isCorrect
      );

      if (unsolvedQIds.length === 0) return { targetQId: null, path: [] };

      const targetLookup = new Map<string, number>();
      unsolvedQIds.forEach((qid) => {
        const pos = QUESTION_POSITIONS[qid];
        if (pos) {
          targetLookup.set(`${pos.x},${pos.y}`, qid);
        }
      });

      const queue: { pos: TilePos; path: TilePos[] }[] = [{ pos: start, path: [] }];
      const visited = new Set<string>();
      visited.add(`${start.x},${start.y}`);

      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
      ];

      while (queue.length > 0) {
        const { pos, path } = queue.shift()!;
        const key = `${pos.x},${pos.y}`;

        // If target reached
        if (targetLookup.has(key) && path.length > 0) {
          return {
            targetQId: targetLookup.get(key) || null,
            path
          };
        }

        for (const d of directions) {
          const nx = pos.x + d.dx;
          const ny = pos.y + d.dy;
          const nKey = `${nx},${ny}`;

          if (
            nx >= 0 &&
            nx < MAZE_GRID_SIZE &&
            ny >= 0 &&
            ny < MAZE_GRID_SIZE &&
            !visited.has(nKey)
          ) {
            // Walkable if not wall (1)
            if (grid[ny][nx] !== 1) {
              visited.add(nKey);
              queue.push({
                pos: { x: nx, y: ny },
                path: [...path, { x: nx, y: ny }]
              });
            }
          }
        }
      }

      return { targetQId: null, path: [] };
    },
    []
  );

  // Trigger Fairy Compass Footprints (황금 발자국 3초 가이드)
  const triggerCompassFootprints = useCallback(
    (customStart?: TilePos) => {
      const start = customStart || playerPos;
      const { targetQId, path } = findShortestPathToNearestQuestion(
        start,
        solvedQuestions,
        mazeGrid
      );

      if (path.length > 0) {
        setCompassPath(path);
        setShowFootprints(true);
        sounds.play('connect');

        if (footprintTimerRef.current) clearTimeout(footprintTimerRef.current);
        footprintTimerRef.current = setTimeout(() => {
          setShowFootprints(false);
        }, 3200); // 3.2초 동안 발자국 표시

        triggerToast({
          title: '🧭 숲속 요정의 나침반 발동!',
          message: targetQId
            ? `Q${targetQId} 제단까지의 최단 경로가 황금 발자국으로 3초간 표시됩니다!`
            : '다음 제단까지 황금 발자국이 길을 안내합니다!',
          type: 'compass'
        });
      } else {
        triggerToast({
          title: '🧭 모든 문제를 이미 찾았습니다!',
          message: '숲속 출구(민주주의 전당 🏛️)를 향해 나아가세요!',
          type: 'info'
        });
      }
    },
    [playerPos, solvedQuestions, mazeGrid, findShortestPathToNearestQuestion, triggerToast]
  );

  // Handle Movement logic
  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      if (activeQuestionId !== null || isCompleted) return;

      const nextX = playerPos.x + dx;
      const nextY = playerPos.y + dy;

      if (
        nextX < 0 ||
        nextX >= MAZE_GRID_SIZE ||
        nextY < 0 ||
        nextY >= MAZE_GRID_SIZE
      ) {
        return;
      }

      const targetTile = mazeGrid[nextY][nextX];
      // 1 = Hedge/Wall -> Cannot pass
      if (targetTile === 1) {
        sounds.play('delete');
        return;
      }

      // Update character facing direction
      if (dx > 0) setFacingRight(true);
      if (dx < 0) setFacingRight(false);

      setPlayerPos({ x: nextX, y: nextY });

      // Check Landmine (301 ~ 308) - 💥 밟으면 걸음 수 +10걸음 증가 및 폭발
      if (targetTile >= 301 && targetTile <= 308) {
        sounds.play('explosion');
        setIsBoardShaking(true);
        setTimeout(() => setIsBoardShaking(false), 600);

        // Steps count + 10걸음 증가 (총 +11)
        setStepsCount((prev) => prev + 10);
        setMineExplosionPos({ x: nextX, y: nextY });
        setTimeout(() => setMineExplosionPos(null), 900);

        // Deactivate mine into 399 (그을린 흔적)
        setMazeGrid((prev) => {
          const clone = prev.map((r) => [...r]);
          clone[nextY][nextX] = 399;
          return clone;
        });

        triggerToast({
          title: '💣 콰쾅! 숲속 지뢰 폭발!',
          message: '위험한 지뢰를 밟았습니다! 이동 걸음 수가 10걸음 증가했습니다! (+10걸음)',
          type: 'mine'
        });
      } else {
        // Standard single step
        setStepsCount((prev) => prev + 1);
      }

      // Check snack pickup (201 ~ 208)
      if (targetTile >= 200 && targetTile < 300) {
        sounds.play('connect');
        setSnacksCollected((prev) => prev + 1);
        setMazeGrid((prev) => {
          const clone = prev.map((r) => [...r]);
          clone[nextY][nextX] = 0; // consumed
          return clone;
        });
      }

      // Check Question Station (101 ~ 110)
      if (targetTile >= 101 && targetTile <= 110) {
        const qId = targetTile - 100;
        sounds.play('select');
        setActiveQuestionId(qId);
        setSelectedOption(null);
        setShowExplanation(false);
      }

      // Check Exit gate (3)
      if (targetTile === 3) {
        if (solvedCount >= totalQuestions) {
          handleGameFinish();
        } else {
          sounds.play('select');
          triggerToast({
            title: '🏛️ 민주주의 전당 문이 닫혀 있습니다!',
            message: `숲속 제단 10문제를 모두 풀어야 전당에 입장할 수 있습니다! (현재 ${solvedCount}/10)`,
            type: 'info'
          });
        }
      }
    },
    [playerPos, mazeGrid, activeQuestionId, isCompleted, solvedCount, totalQuestions, triggerToast]
  );

  // Keyboard navigation listener (Laptop/PC & tablet keyboards)
  useEffect(() => {
    if (!hasStarted || activeQuestionId !== null || isCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        movePlayer(0, -1);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        movePlayer(0, 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        movePlayer(-1, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        movePlayer(1, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, activeQuestionId, isCompleted, movePlayer]);

  // Touch Swipe Handlers for Tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current || activeQuestionId !== null || isCompleted) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    touchStartPos.current = null;

    const minSwipeDistance = 22; // threshold in px
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > minSwipeDistance) {
        if (dx > 0) movePlayer(1, 0);
        else movePlayer(-1, 0);
      }
    } else {
      if (Math.abs(dy) > minSwipeDistance) {
        if (dy > 0) movePlayer(0, 1);
        else movePlayer(0, -1);
      }
    }
  };

  // Jump to question station (Accessibility / Quick play on tablet)
  const jumpToQuestion = (qId: number) => {
    const pos = QUESTION_POSITIONS[qId];
    if (pos) {
      setPlayerPos({ x: pos.x, y: pos.y });
      setActiveQuestionId(qId);
      setSelectedOption(null);
      setShowExplanation(false);
      sounds.play('select');
    }
  };

  // 🌀 3연속 정답 보상: 플레이어가 원하는 자리로 바로 이동 (자유 순간이동)
  const handleTeleportToTile = (targetX: number, targetY: number) => {
    if (!canTeleport && !isTeleportMode) return;

    // 덤불 벽(1)으로는 순간이동 불가
    if (mazeGrid[targetY]?.[targetX] === 1) {
      triggerToast({
        title: '🚫 이동 불가',
        message: '빽빽한 덤불 벽으로는 이동할 수 없습니다. 열린 오솔길이나 제단, 출구를 선택하세요!',
        type: 'info'
      });
      return;
    }

    // 플레이어 좌표 즉시 이동!
    setPlayerPos({ x: targetX, y: targetY });
    sounds.play('teleport');
    confetti({
      particleCount: 55,
      spread: 75,
      origin: { y: 0.55 }
    });

    const cellType = mazeGrid[targetY][targetX];

    // 1) 숲속 제단 문제 도착 시 바로 문제 열기
    if (cellType >= 101 && cellType <= 110) {
      const qNum = cellType - 100;
      setActiveQuestionId(qNum);
      setSelectedOption(null);
      setShowExplanation(false);
    }
    // 2) 간식 획득
    else if (cellType >= 200 && cellType < 300) {
      setSnacksCollected((prev) => prev + 1);
      setMazeGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[targetY][targetX] = 0;
        return next;
      });
      sounds.play('connect');
    }
    // 3) 지뢰 칸에 착지 시: 신비한 마법으로 지뢰 안전 해체!
    else if (cellType >= 301 && cellType <= 308) {
      setMazeGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[targetY][targetX] = 399; // 폭발/해체된 잔해로 표시
        return next;
      });
      triggerToast({
        title: '⚡ 지뢰 안전 해체!',
        message: '순간이동의 신비한 마법으로 지뢰를 밟지 않고 안전하게 제거했습니다!',
        type: 'info'
      });
    }
    // 4) 출구(13, 13) 도착
    else if (targetX === 13 && targetY === 13) {
      if (solvedCount >= totalQuestions) {
        handleGameFinish();
      }
    }

    // 순간이동 보상 소모 및 모드 종료
    setCanTeleport(false);
    setIsTeleportMode(false);

    triggerToast({
      title: '🌀 순간이동 완료!',
      message: `원하는 자리 (${targetX}, ${targetY})로 번개처럼 이동했습니다!`,
      type: 'teleport'
    });
  };

  // Submit Answer to Active Question
  const handleAnswerSubmit = (optionIndex: number) => {
    if (!activeQuestionId) return;
    const currentQ = MAZE_QUESTIONS.find((q) => q.id === activeQuestionId);
    if (!currentQ) return;

    setSelectedOption(optionIndex);
    setShowExplanation(true);

    const isCorrect = optionIndex === currentQ.correctAnswer;

    setSolvedQuestions((prev) => {
      const prevAttempts = prev[activeQuestionId]?.attempts || 0;
      return {
        ...prev,
        [activeQuestionId]: {
          selectedOption: optionIndex,
          isCorrect: prev[activeQuestionId]?.isCorrect || isCorrect,
          attempts: prevAttempts + 1
        }
      };
    });

    if (isCorrect) {
      sounds.play('success');
      confetti({
        particleCount: 45,
        spread: 70,
        origin: { y: 0.6 }
      });

      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak((prev) => Math.max(prev, newStreak));

      // 2연속 정답 ➔ 🧭 숲속 요정의 나침반 발동
      if (newStreak === 2) {
        setTimeout(() => {
          triggerCompassFootprints();
        }, 400);
        triggerToast({
          title: '🧭 2연속 정답! [숲속 요정의 나침반 획득]',
          message: '다음 제단까지 최단 경로가 황금 발자국으로 3초간 안내됩니다!',
          type: 'compass'
        });
      } else if (newStreak > 2) {
        // 3+ streak continues to trigger compass guidance
        setTimeout(() => {
          triggerCompassFootprints();
        }, 400);
      }

      // 3연속 정답 ➔ 🌀 원하는 자리로 바로 이동할 수 있는 [자유 순간이동] 획득!
      if (newStreak >= 3) {
        setCanTeleport(true);
        setIsTeleportMode(true);
        sounds.play('teleport');
        triggerToast({
          title: '🌀 3연속 정답! [자유 순간이동 획득]',
          message: '미로의 원하는 곳(오솔길/제단/출구)을 터치하면 그 자리로 즉시 이동합니다!',
          type: 'teleport'
        });
      }
    } else {
      // 오답 선택 시: 콤보 초기화
      sounds.play('delete');
      setStreak(0);
    }
  };

  // Close question modal
  const handleCloseModal = () => {
    setActiveQuestionId(null);
    setSelectedOption(null);
    setShowExplanation(false);

    // If all questions are solved, check if completion triggers
    const newSolvedCount = Object.keys(solvedQuestions).filter(
      (qid) => solvedQuestions[Number(qid)].isCorrect
    ).length;

    if (newSolvedCount >= totalQuestions) {
      handleGameFinish();
    }
  };

  // Game Finish Handler
  const handleGameFinish = () => {
    setIsCompleted(true);
    sounds.play('complete');
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 }
    });
  };

  // Restart Maze & Reset all states
  const handleRestart = (customTime?: number | unknown) => {
    setMazeGrid(INITIAL_MAZE_MAP.map((r) => [...r]));
    setPlayerPos({ x: 1, y: 1 });
    setFacingRight(true);
    setSnacksCollected(0);
    setStepsCount(0);
    setSolvedQuestions({});
    setActiveQuestionId(null);
    setIsCompleted(false);
    setIsTimeoutModalOpen(false);
    setIsFailedModalOpen(false);
    setSubmitStatus('idle');
    setStreak(0);
    setCanTeleport(false);
    setIsTeleportMode(false);
    setShowFootprints(false);
    setCompassPath([]);
    setMineExplosionPos(null);
    setIsBoardShaking(false);
    const validTime = typeof customTime === 'number' ? customTime : undefined;
    setTimeLeft(validTime ?? (attemptNumber === 1 ? TIME_LIMIT_ATTEMPT_1 : TIME_LIMIT_ATTEMPT_2));
  };

  // 1차 2분 초과 후 2차 3분 재도전 시작
  const handleStartRetry = () => {
    setIsTimeoutModalOpen(false);
    setIsFailedModalOpen(false);
    setAttemptNumber(2);
    handleRestart(TIME_LIMIT_ATTEMPT_2);
    sounds.play('connect');

    triggerToast({
      title: '⏱️ 2차 재도전 시작! (제한시간 3분)',
      message: '3분의 추가 시간이 주어졌습니다! 10문제를 모두 풀고 민주주의 전당으로!',
      type: 'info'
    });
  };

  // 1차/2차 모두 초과 후 처음부터 (1차 2분) 재도전
  const handleRestartFromBeginning = () => {
    setIsFailedModalOpen(false);
    setIsTimeoutModalOpen(false);
    setAttemptNumber(1);
    handleRestart(TIME_LIMIT_ATTEMPT_1);
    sounds.play('select');

    triggerToast({
      title: '🔄 1차 도전 처음부터 재시작 (제한시간 2분)',
      message: '2분 제한시간이 새롭게 시작됩니다!',
      type: 'info'
    });
  };

  // 캐릭터 선택 화면으로 이동
  const handleGoToCharacterSelect = () => {
    setIsTimeoutModalOpen(false);
    setIsFailedModalOpen(false);
    setAttemptNumber(1);
    handleRestart(TIME_LIMIT_ATTEMPT_1);
    setHasStarted(false);
  };

  // Submit to Google Sheets (Direct API + Webhook fallback)
  const handleSubmitResults = async () => {
    if (!studentId.trim() || !studentName.trim()) {
      alert('학번과 이름을 모두 입력해 주세요!');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const result = await submitStudentResult(
        5,
        {
          studentId: studentId.trim(),
          studentName: studentName.trim(),
          score: totalScore,
          correctCount: solvedCount,
          totalQuestions: totalQuestions,
          attemptNumber: attemptNumber,
          timeRemaining: formatTime(timeLeft),
          snacks: snacksCollected,
          character: `${character.name} (${character.koreanName})`,
          details: `[5페이지 숲속미로] 캐릭터:${character.koreanName} | 간식:${snacksCollected}개 | 이동:${stepsCount}보 | 최대연속:${maxStreak} | 시도:${attemptNumber}차 (${formatTime(timeLeft)} 남음)`
        },
        gasUrl
      );
      setSubmitStatus('success');
      sounds.play('complete');
      confetti({ particleCount: 60, spread: 80 });
    } catch (err: any) {
      setSubmitStatus('error');
      setErrorMessage(err.message || '전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Active Question Object
  const currentQuestion = activeQuestionId
    ? MAZE_QUESTIONS.find((q) => q.id === activeQuestionId)
    : null;

  // ========================================================
  // VIEW 1: CHARACTER SELECTION SCREEN (Before Entering Maze)
  // ========================================================
  if (!hasStarted) {
    return (
      <CharacterSelect
        selectedCharId={selectedCharId}
        onSelectChar={(id) => setSelectedCharId(id)}
        onStartGame={() => {
          setAttemptNumber(1);
          handleRestart(TIME_LIMIT_ATTEMPT_1);
          setHasStarted(true);
        }}
        studentId={studentId}
        studentName={studentName}
        onUpdateStudentId={setStudentId}
        onUpdateStudentName={setStudentName}
      />
    );
  }

  // ========================================================
  // VIEW 2: FOREST MAZE EXPLORATION (Tablet Optimized)
  // ========================================================
  // Current time metrics for Pie Progress Timer
  const currentTotalTime = attemptNumber === 1 ? TIME_LIMIT_ATTEMPT_1 : TIME_LIMIT_ATTEMPT_2;
  const timeRatio = Math.max(0, Math.min(1, timeLeft / currentTotalTime));
  const timePercent = Math.round(timeRatio * 100);

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6">
      {/* Board Shake CSS Keyframes */}
      <style>{`
        @keyframes boardShakeAnim {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          15% { transform: translate(-7px, 5px) rotate(-1.5deg); }
          35% { transform: translate(7px, -5px) rotate(1.5deg); }
          55% { transform: translate(-6px, 3px) rotate(-1deg); }
          75% { transform: translate(6px, -3px) rotate(1deg); }
          90% { transform: translate(-2px, 1px) rotate(0deg); }
        }
        .animate-board-shake {
          animation: boardShakeAnim 0.55s ease-in-out;
        }
      `}</style>

      {/* Floating In-Game Toast Banner */}
      {inGameToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-200 pointer-events-none max-w-md w-[92%]">
          <div
            className={`p-3.5 rounded-2xl shadow-2xl border-2 flex items-center gap-3 backdrop-blur-md ${
              inGameToast.type === 'mine'
                ? 'bg-rose-950/95 border-rose-500 text-white'
                : inGameToast.type === 'teleport'
                ? 'bg-gradient-to-r from-cyan-950/95 via-indigo-950/95 to-purple-950/95 border-cyan-400 text-white shadow-cyan-500/20'
                : inGameToast.type === 'shield'
                ? 'bg-cyan-950/95 border-cyan-400 text-white'
                : inGameToast.type === 'compass'
                ? 'bg-amber-950/95 border-amber-400 text-white'
                : 'bg-emerald-950/95 border-emerald-400 text-white'
            }`}
          >
            <div className="text-2xl shrink-0">
              {inGameToast.type === 'mine' && '💣'}
              {inGameToast.type === 'teleport' && '🌀'}
              {inGameToast.type === 'shield' && '🛡️'}
              {inGameToast.type === 'compass' && '🧭'}
              {inGameToast.type === 'combo' && '🔥'}
              {inGameToast.type === 'info' && '💡'}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-black tracking-tight">{inGameToast.title}</h4>
              <p className="text-[11px] sm:text-xs opacity-90 leading-tight mt-0.5">
                {inGameToast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Forest HUD & Exploration Status Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 border border-emerald-800/50 rounded-3xl p-4 sm:p-5 text-white shadow-xl mb-4 sm:mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Companion & Stage Badge */}
          <div className="flex items-center gap-3">
            <div
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr ${character.bgColor} flex items-center justify-center text-2xl sm:text-3xl shadow-lg ring-2 ring-emerald-400/40 shrink-0`}
            >
              {character.emoji}
              {/* Teleport aura mini icon if active */}
              {(canTeleport || isTeleportMode) && (
                <span className="absolute -top-1.5 -right-1.5 text-xs bg-cyan-500 text-white rounded-full p-0.5 shadow-md animate-bounce">
                  🌀
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <TreePine className="w-3.5 h-3.5" />
                  <span>신비의 숲속 미로 탐험 10제</span>
                </span>
                <button
                  onClick={() => setHasStarted(false)}
                  className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
                  title="다른 캐릭터로 변경"
                >
                  [캐릭터 변경]
                </button>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white mt-0.5">
                탐험 파트너: {character.name} ({character.koreanName})
              </h2>
            </div>
          </div>

          {/* Center/Right: Progress & Status Badges */}
          <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
            {/* Timer Countdown Badge with Animated Pie Progress Gauge */}
            <div
              className={`px-3 py-1.5 rounded-2xl border flex items-center gap-2.5 sm:gap-3 transition-all select-none shadow-md ${
                timeLeft <= 15
                  ? 'bg-rose-950/90 border-rose-500 shadow-rose-950/70 ring-2 ring-rose-500/70 animate-pulse'
                  : timeLeft <= 30
                  ? 'bg-amber-950/85 border-amber-400/90 ring-1 ring-amber-400/40 shadow-amber-950/50'
                  : 'bg-emerald-950/70 border-emerald-700/60 shadow-black/30'
              }`}
              title={`제한 시간: ${attemptNumber === 1 ? '1차 2분' : '2차 3분'} (남은 시간: ${formatTime(timeLeft)}, ${timePercent}%)`}
            >
              {/* Circular Pie Gauge (Clockwise from 12 o'clock) */}
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full drop-shadow-sm" viewBox="0 0 44 44">
                  {/* Outer Background Track */}
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    className="stroke-slate-800/90 fill-slate-900/90"
                    strokeWidth="3.5"
                  />
                  {/* Inner Translucent Pie Wedge */}
                  <path
                    d={getPiePath(22, 22, 16.5, timeRatio)}
                    className={`transition-all duration-300 ${
                      timeLeft <= 15
                        ? 'fill-rose-500/45'
                        : timeLeft <= 30
                        ? 'fill-amber-400/35'
                        : 'fill-emerald-400/30'
                    }`}
                  />
                  {/* Outer Circular Progress Ring (Stroke drains clockwise) */}
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="transparent"
                    strokeWidth="3.5"
                    strokeDasharray={113.1}
                    strokeDashoffset={113.1 * (1 - timeRatio)}
                    strokeLinecap="round"
                    transform="rotate(-90 22 22)"
                    className={`transition-all duration-300 ${
                      timeLeft <= 15
                        ? 'stroke-rose-400'
                        : timeLeft <= 30
                        ? 'stroke-amber-400'
                        : 'stroke-emerald-400'
                    }`}
                  />
                </svg>

                {/* Center Icon Indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Clock
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                      timeLeft <= 15
                        ? 'text-rose-200 animate-spin'
                        : timeLeft <= 30
                        ? 'text-amber-200 animate-pulse'
                        : 'text-emerald-300'
                    }`}
                  />
                </div>
              </div>

              {/* Text Info (Attempt title, remaining %, and mm:ss digital clock) */}
              <div className="flex flex-col text-left justify-center">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-extrabold ${
                      timeLeft <= 15
                        ? 'text-rose-300'
                        : timeLeft <= 30
                        ? 'text-amber-200'
                        : 'text-emerald-300'
                    }`}
                  >
                    {attemptNumber === 1 ? '1차 제한 (2분)' : '2차 재도전 (3분)'}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                      timeLeft <= 15
                        ? 'bg-rose-500 text-white animate-bounce'
                        : timeLeft <= 30
                        ? 'bg-amber-500/30 text-amber-200'
                        : 'bg-emerald-500/25 text-emerald-300'
                    }`}
                  >
                    {timeLeft <= 15 ? '임박!' : `${timePercent}%`}
                  </span>
                </div>
                <span
                  className={`text-base sm:text-lg font-black tracking-wider leading-none mt-0.5 ${
                    timeLeft <= 15
                      ? 'text-rose-300 font-mono drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                      : timeLeft <= 30
                      ? 'text-amber-300 font-mono drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                      : 'text-white font-mono'
                  }`}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {/* Streak / Combo Badge */}
            <div
              className={`px-3 py-1.5 rounded-xl text-center border transition-all ${
                streak >= 2
                  ? 'bg-gradient-to-r from-amber-600/60 to-rose-600/60 border-amber-400 shadow-md scale-105'
                  : 'bg-emerald-900/60 border-emerald-700/50'
              }`}
            >
              <span className="text-[10px] text-amber-200 font-bold block flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-amber-300 inline" />
                <span>연속 정답</span>
              </span>
              <span className="text-base sm:text-lg font-black text-white">
                {streak}
                <span className="text-xs text-amber-200">연속</span>
              </span>
            </div>

            {/* Solved Count */}
            <div className="bg-emerald-900/60 border border-emerald-700/50 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[10px] text-emerald-300 font-bold block">정답 완료</span>
              <span className="text-base sm:text-lg font-black text-white">
                {solvedCount} <span className="text-xs text-emerald-300">/ 10</span>
              </span>
            </div>

            {/* Score */}
            <div className="bg-emerald-900/60 border border-emerald-700/50 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[10px] text-emerald-300 font-bold block">획득 점수</span>
              <span className="text-base sm:text-lg font-black text-amber-300">
                {totalScore}점
              </span>
            </div>

            {/* Snack */}
            <div className="bg-emerald-900/60 border border-emerald-700/50 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[10px] text-emerald-300 font-bold block">
                {character.snackName}
              </span>
              <span className="text-base sm:text-lg font-black text-white flex items-center justify-center gap-1">
                <span>{character.snackEmoji}</span>
                <span>{snacksCollected}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sounds.enabled = !soundOn;
                  setSoundOn(!soundOn);
                }}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                title="소리 켜기/끄기"
              >
                {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                <span className="hidden sm:inline">{soundOn ? '음향 ON' : '음향 OFF'}</span>
              </button>

              <button
                onClick={() => handleRestart()}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                title="미로 초기화"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">재시작</span>
              </button>
            </div>
          </div>
        </div>

        {/* In-Game Consecutive Buff HUD Bar (Compass & Shield & Mines) */}
        <div className="mt-3.5 pt-3.5 border-t border-emerald-800/40 grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {/* Buff 1: 🧭 Fairy Compass */}
          <div
            className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 transition ${
              streak >= 2
                ? 'bg-amber-900/40 border-amber-500/80 shadow-xs'
                : 'bg-emerald-950/40 border-emerald-900/60 opacity-60'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-lg shrink-0">
                🧭
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-black text-amber-300 block truncate">
                  2연속 보상: 요정의 나침반
                </span>
                <span className="text-[10px] text-slate-300 block leading-tight">
                  {streak >= 2 ? '황금 발자국 3초 길안내 활성' : '2문제 연속 정답 시 해금'}
                </span>
              </div>
            </div>
            {streak >= 2 && (
              <button
                onClick={() => triggerCompassFootprints()}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-amber-950 text-[11px] font-black shadow-xs transition cursor-pointer shrink-0"
                title="다음 제단까지 3초간 황금 발자국 재표시"
              >
                {showFootprints ? '🐾 안내 중...' : '🧭 길안내'}
              </button>
            )}
          </div>

          {/* Buff 2: 🌀 Free Teleportation (자유 순간이동 - 원하는 자리로 바로 이동) */}
          <div
            className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 transition ${
              canTeleport || isTeleportMode
                ? 'bg-gradient-to-r from-cyan-950/80 via-indigo-950/80 to-purple-950/80 border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                : streak >= 3
                ? 'bg-cyan-900/40 border-cyan-400 shadow-xs'
                : 'bg-emerald-950/40 border-emerald-900/60 opacity-60'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                  canTeleport || isTeleportMode
                    ? 'bg-cyan-500/30 text-cyan-200 animate-spin'
                    : 'bg-cyan-500/20 text-cyan-300'
                }`}
                style={{ animationDuration: '6s' }}
              >
                🌀
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black text-cyan-300 block truncate">
                    3연속 보상: 자유 순간이동
                  </span>
                  {canTeleport && (
                    <span className="px-1.5 py-0.2 rounded-full bg-cyan-400 text-cyan-950 text-[9px] font-black animate-pulse">
                      사용 가능
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-300 block leading-tight">
                  {canTeleport
                    ? isTeleportMode
                      ? '미로에서 원하는 자리를 터치하세요!'
                      : '버튼을 눌러 원하는 위치로 즉시 워프'
                    : '3문제 연속 정답 시 원하는 자리로 바로 이동!'}
                </span>
              </div>
            </div>
            {canTeleport && (
              <button
                onClick={() => setIsTeleportMode(!isTeleportMode)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black shadow-xs transition cursor-pointer shrink-0 active:scale-95 flex items-center gap-1 ${
                  isTeleportMode
                    ? 'bg-cyan-400 hover:bg-cyan-300 text-cyan-950 ring-2 ring-white animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
                title="순간이동 타일 선택 모드 켜기/끄기"
              >
                <span>🌀</span>
                <span>{isTeleportMode ? '워프 선택 중' : '워프 켜기'}</span>
              </button>
            )}
          </div>

          {/* Trap: 💣 Forest Landmine Alert */}
          <div className="p-2.5 rounded-2xl border bg-rose-950/30 border-rose-800/60 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center text-lg shrink-0 animate-pulse">
              💣
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-black text-rose-300 block">
                숲속 지뢰 주의보 (+10걸음)
              </span>
              <span className="text-[10px] text-rose-200/80 block leading-tight">
                지뢰(💣)를 밟으면 콰쾅! 이동 걸음 수가 10걸음 증가합니다.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Forest Maze Board & Side Checklist (Tablet 2-Column or Stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left: Forest Maze Viewport & Touch D-Pad */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-3 sm:p-5 md:p-6 border border-emerald-200/80 shadow-md flex flex-col items-center">
          {/* Forest Atmosphere Subtitle */}
          <div className="w-full flex items-center justify-between mb-2 text-xs text-slate-500 px-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                <Footprints className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-extrabold">{stepsCount} 걸음</span>
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                화면 스와이프 • 키보드 • D-Pad 터치로 이동
              </span>
            </div>
            <div className="flex items-center gap-2">
              {showFootprints && (
                <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300 animate-pulse flex items-center gap-1">
                  <span>🐾 황금 발자국 길안내 중 (3초)</span>
                </span>
              )}
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <span>🌲 신비의 초록 덤불 숲속</span>
              </span>
            </div>
          </div>

          {/* Active Free Teleportation Mode Banner (3-Streak Reward) */}
          {(canTeleport || isTeleportMode) && (
            <div className="w-full max-w-[460px] sm:max-w-[520px] md:max-w-[560px] mb-3 p-3 rounded-2xl bg-gradient-to-r from-cyan-950/95 via-indigo-950/95 to-purple-950/95 border-2 border-cyan-400 text-white flex items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl sm:text-2xl animate-spin" style={{ animationDuration: '4s' }}>
                  🌀
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <strong className="text-xs sm:text-sm font-black text-cyan-200 truncate">
                      [자유 순간이동] 미로의 원하는 자리를 터치하세요!
                    </strong>
                    <span className="px-1.5 py-0.5 rounded-full bg-cyan-400 text-cyan-950 text-[9px] font-black animate-pulse shrink-0">
                      3연속 보상
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-cyan-100/90 truncate leading-tight mt-0.5">
                    원하는 오솔길, Q1~Q10 제단, 출구 어디든 직접 터치하면 바로 이동합니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTeleportMode(false)}
                className="px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[10px] sm:text-[11px] font-bold border border-slate-600 shrink-0 cursor-pointer"
                title="순간이동 닫기"
              >
                닫기
              </button>
            </div>
          )}

          {/* 15x15 Forest Maze Board (Tablet Optimized Dimensions) */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`relative bg-gradient-to-b from-[#091a10] via-[#0d2618] to-[#07140c] p-2 sm:p-3 rounded-3xl shadow-2xl border-4 border-[#1b432a] w-full max-w-[460px] sm:max-w-[520px] md:max-w-[560px] aspect-square overflow-hidden select-none transition-transform ${
              isBoardShaking ? 'animate-board-shake border-rose-600 shadow-rose-900/50' : ''
            }`}
            style={{ touchAction: 'none' }}
          >
            {/* Soft Ambient Forest Glow */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div
              className="grid gap-0.5 sm:gap-1 w-full h-full"
              style={{
                gridTemplateColumns: `repeat(${MAZE_GRID_SIZE}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${MAZE_GRID_SIZE}, minmax(0, 1fr))`
              }}
            >
              {mazeGrid.map((row, rIdx) =>
                row.map((cellType, cIdx) => {
                  const isPlayerHere = playerPos.x === cIdx && playerPos.y === rIdx;
                  const isWall = cellType === 1;
                  const isStart = cIdx === 1 && rIdx === 1;
                  const isExit = cIdx === 13 && rIdx === 13;
                  const isQuestion = cellType >= 101 && cellType <= 110;
                  const qNumber = isQuestion ? cellType - 100 : null;
                  const isSolved = qNumber ? solvedQuestions[qNumber]?.isCorrect : false;
                  const isSnack = cellType >= 200 && cellType < 300;
                  const isLandmine = cellType >= 301 && cellType <= 308;
                  const isExplodedMine = cellType === 399;
                  const isExplodingNow =
                    mineExplosionPos &&
                    mineExplosionPos.x === cIdx &&
                    mineExplosionPos.y === rIdx;

                  // Check if this tile is part of Fairy Compass golden footprints path
                  const isFootprint =
                    showFootprints &&
                    compassPath.some((pt) => pt.x === cIdx && pt.y === rIdx) &&
                    !isPlayerHere;

                  // 🌀 Free Teleportation Destination Candidate
                  const isTeleportCandidate =
                    (canTeleport || isTeleportMode) && !isWall && !isPlayerHere;

                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      onClick={() => {
                        // 🌀 3연속 정답 보상: 자유 순간이동 활성화 시 원하는 타일로 즉시 이동!
                        if (canTeleport || isTeleportMode) {
                          if (!isWall) {
                            handleTeleportToTile(cIdx, rIdx);
                            return;
                          }
                        }
                        const dx = cIdx - playerPos.x;
                        const dy = rIdx - playerPos.y;
                        if (Math.abs(dx) + Math.abs(dy) === 1) {
                          movePlayer(dx, dy);
                        } else if (isQuestion && qNumber) {
                          jumpToQuestion(qNumber);
                        }
                      }}
                      className={`relative w-full h-full flex items-center justify-center rounded-xs sm:rounded-sm md:rounded-md text-[9px] sm:text-xs font-black transition-all duration-150 cursor-pointer overflow-hidden ${
                        isWall
                          ? 'bg-gradient-to-b from-emerald-800 via-green-900 to-emerald-950 border-t border-emerald-700/60 border-b border-black/50 shadow-inner'
                          : isTeleportCandidate
                          ? 'bg-[#122e2b] ring-2 ring-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)] hover:bg-cyan-600/40 hover:scale-105 z-10 cursor-pointer'
                          : isExit
                          ? 'bg-gradient-to-tr from-amber-950/80 to-emerald-950/90 border border-amber-400/80 shadow-md'
                          : isStart
                          ? 'bg-emerald-950/80 border border-emerald-500/60'
                          : isFootprint
                          ? 'bg-[#2a4521] ring-1 ring-amber-400/80'
                          : isLandmine
                          ? 'bg-[#1b2a1a] hover:bg-[#283827]'
                          : isExplodedMine
                          ? 'bg-[#121914] border border-black/60'
                          : 'bg-[#153120]/80 hover:bg-[#1c3e29]'
                      }`}
                    >
                      {/* Hedge Wall Texture: Forest leafy sprig */}
                      {isWall && (
                        <div className="flex flex-col items-center justify-center opacity-70">
                          <span className="text-[7px] sm:text-[9px] select-none leading-none">
                            {(rIdx + cIdx) % 3 === 0 ? '🌿' : (rIdx + cIdx) % 3 === 1 ? '🍃' : '🌲'}
                          </span>
                        </div>
                      )}

                      {/* Path stepping ground texture */}
                      {!isWall &&
                        !isPlayerHere &&
                        !isQuestion &&
                        !isExit &&
                        !isSnack &&
                        !isStart &&
                        !isFootprint &&
                        !isLandmine &&
                        !isExplodedMine && (
                          <div
                            className={`w-1 h-1 rounded-full opacity-25 ${
                              (rIdx + cIdx) % 4 === 0 ? 'bg-amber-300' : 'bg-emerald-400'
                            }`}
                          />
                        )}

                      {/* Golden Footprints: 2-Streak Compass Perk (3-seconds guide) */}
                      {isFootprint && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none animate-pulse">
                          <span className="text-[10px] sm:text-xs md:text-sm filter drop-shadow-[0_0_8px_rgba(251,191,36,1)] scale-110">
                            🐾
                          </span>
                        </div>
                      )}

                      {/* Start Basecamp Tile */}
                      {isStart && !isPlayerHere && (
                        <span className="text-[8px] sm:text-[10px] text-emerald-300 font-black">
                          출발
                        </span>
                      )}

                      {/* Temple of Democracy / Forest Sanctuary Exit */}
                      {isExit && !isPlayerHere && (
                        <span
                          className="text-xs sm:text-base animate-pulse filter drop-shadow-md"
                          title="민주주의 전당"
                        >
                          🏛️
                        </span>
                      )}

                      {/* Character Favorite Forest Snack Item */}
                      {isSnack && !isPlayerHere && (
                        <span className="text-xs sm:text-sm animate-bounce filter drop-shadow">
                          {character.snackEmoji}
                        </span>
                      )}

                      {/* Active Landmine (지뢰: 밟으면 💥 폭발 & +10걸음) */}
                      {isLandmine && !isPlayerHere && (
                        <div
                          className="flex flex-col items-center justify-center animate-pulse"
                          title="위험! 숲속 지뢰 (밟으면 +10걸음)"
                        >
                          <span className="text-[11px] sm:text-xs filter drop-shadow">💣</span>
                          <span className="text-[6px] sm:text-[7px] text-rose-300 font-black leading-none -mt-0.5">
                            지뢰
                          </span>
                        </div>
                      )}

                      {/* Exploded Landmine Crater (그을린 자국) */}
                      {isExplodedMine && !isPlayerHere && (
                        <div className="flex flex-col items-center justify-center opacity-65">
                          <span className="text-[9px] sm:text-[11px]">💥</span>
                          <span className="text-[6px] text-slate-400 leading-none">폭발됨</span>
                        </div>
                      )}

                      {/* Real-time Mine Explosion Flash Effect */}
                      {isExplodingNow && (
                        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-ping">
                          <span className="text-lg sm:text-2xl filter drop-shadow-[0_0_12px_rgba(239,68,68,1)]">
                            💥
                          </span>
                        </div>
                      )}

                      {/* Ancient Forest Shrine Question Node (Q1 ~ Q10) */}
                      {isQuestion && qNumber && !isPlayerHere && (
                        <div
                          className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[8px] sm:text-[11px] font-black shadow-md transition-transform ${
                            isSolved
                              ? 'bg-emerald-500 text-white ring-1 ring-emerald-300'
                              : 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 animate-pulse ring-2 ring-amber-300/90 scale-105 shadow-amber-500/50'
                          }`}
                          title={`숲속 제단 ${qNumber}번 문제`}
                        >
                          {isSolved ? '✓' : `Q${qNumber}`}
                        </div>
                      )}

                      {/* Player Character roaming in the Forest */}
                      {isPlayerHere && (
                        <div
                          className={`absolute inset-0 flex items-center justify-center text-sm sm:text-xl md:text-2xl transition-transform z-20 ${
                            facingRight ? 'scale-x-100' : '-scale-x-100'
                          }`}
                        >
                          <div className="relative flex items-center justify-center">
                            <span className="filter drop-shadow-lg">{character.emoji}</span>
                            {/* Forest Magical Aura below character */}
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-emerald-400/50 rounded-full blur-[2px]" />

                            {/* 🌀 Free Teleportation Portal Aura when Teleport is Ready */}
                            {(canTeleport || isTeleportMode) && (
                              <>
                                <span
                                  className="absolute -inset-2 rounded-full border-2 border-cyan-400 animate-spin opacity-90 shadow-[0_0_12px_rgba(34,211,238,1)] pointer-events-none"
                                  style={{ animationDuration: '2.5s' }}
                                />
                                <span className="absolute -top-3.5 -right-3 text-[10px] sm:text-xs filter drop-shadow z-30 animate-bounce">
                                  🌀
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Tablet & Mobile Virtual D-Pad Touch Controller */}
          <div className="mt-4 sm:mt-5 flex flex-col items-center w-full max-w-xs">
            <div className="grid grid-cols-3 gap-2 w-full">
              <div />
              <button
                type="button"
                onClick={() => movePlayer(0, -1)}
                className="h-12 sm:h-14 rounded-2xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border-2 border-emerald-300 text-emerald-950 flex items-center justify-center font-black shadow-sm transition active:scale-95 cursor-pointer"
                aria-label="위로 이동"
              >
                <ArrowUp className="w-6 h-6 text-emerald-800" />
              </button>
              <div />

              <button
                type="button"
                onClick={() => movePlayer(-1, 0)}
                className="h-12 sm:h-14 rounded-2xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border-2 border-emerald-300 text-emerald-950 flex items-center justify-center font-black shadow-sm transition active:scale-95 cursor-pointer"
                aria-label="왼쪽으로 이동"
              >
                <ArrowLeft className="w-6 h-6 text-emerald-800" />
              </button>

              {/* Center Companion Action Button */}
              <button
                type="button"
                onClick={() => {
                  const currentTile = mazeGrid[playerPos.y][playerPos.x];
                  if (currentTile >= 101 && currentTile <= 110) {
                    jumpToQuestion(currentTile - 100);
                  } else if (streak >= 2) {
                    triggerCompassFootprints();
                  }
                }}
                className={`relative h-12 sm:h-14 rounded-2xl bg-gradient-to-tr ${character.bgColor} text-white flex items-center justify-center text-xl font-bold shadow-md transition active:scale-95 cursor-pointer border-2 ${character.borderColor}`}
                title="현재 위치 확인 / 제단 열기 / 나침반 길안내"
              >
                {character.emoji}
                {(canTeleport || isTeleportMode) && (
                  <span className="absolute -top-1 -right-1 text-xs bg-cyan-500 rounded-full p-0.5 animate-bounce">
                    🌀
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => movePlayer(1, 0)}
                className="h-12 sm:h-14 rounded-2xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border-2 border-emerald-300 text-emerald-950 flex items-center justify-center font-black shadow-sm transition active:scale-95 cursor-pointer"
                aria-label="오른쪽으로 이동"
              >
                <ArrowRight className="w-6 h-6 text-emerald-800" />
              </button>

              <div />
              <button
                type="button"
                onClick={() => movePlayer(0, 1)}
                className="h-12 sm:h-14 rounded-2xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border-2 border-emerald-300 text-emerald-950 flex items-center justify-center font-black shadow-sm transition active:scale-95 cursor-pointer"
                aria-label="아래로 이동"
              >
                <ArrowDown className="w-6 h-6 text-emerald-800" />
              </button>
              <div />
            </div>
            <p className="text-[11px] text-slate-500 mt-2 text-center font-medium">
              화면 스와이프 • D-Pad 터치 • 인접한 타일 탭 모두 지원합니다
            </p>
          </div>
        </div>

        {/* Right: Question Checklist & Direct Teleport Stations */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Companion Card */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-4 border border-emerald-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{character.emoji}</span>
              <div>
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                  탐험 동행 캐릭터
                </span>
                <span className="text-sm font-black text-slate-900">
                  {character.name} ({character.koreanName})
                </span>
              </div>
            </div>
            <button
              onClick={() => setHasStarted(false)}
              className="px-2.5 py-1 text-xs font-bold rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
            >
              캐릭터 교체
            </button>
          </div>

          {/* Forest Exploration Mission & Exit Card (Checklist Deleted as requested) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-base">
                  🌲
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    숲속 미로 탐험 현황
                  </h3>
                  <span className="text-[11px] text-slate-500">10개 제단 탐색 및 문제 풀이</span>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {solvedCount} / {totalQuestions} 완료
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>탐험 진척도</span>
                <span className="text-emerald-700">{Math.round((solvedCount / totalQuestions) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(solvedCount / totalQuestions) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                {totalQuestions - solvedCount > 0
                  ? `💡 숲속에 아직 ${totalQuestions - solvedCount}개의 미해결 제단이 남아있습니다. 미로를 탐험하세요!`
                  : '🎉 모든 제단의 문제를 해결했습니다! 민주주의 전당(13,13)으로 이동하세요!'}
              </p>
            </div>

            {/* Final Exit Guidance & Completion Button */}
            <div className="pt-2">
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 transition ${
                  solvedCount >= totalQuestions
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm animate-pulse'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span className="text-2xl shrink-0">🏛️</span>
                <div className="flex-1 min-w-0">
                  <strong className="block font-black text-xs sm:text-sm">
                    {solvedCount >= totalQuestions
                      ? '민주주의 전당 출구 개방!'
                      : '민주주의 전당 (최종 출구)'}
                  </strong>
                  <span className="text-[11px] leading-tight block text-slate-500 mt-0.5">
                    {solvedCount >= totalQuestions
                      ? '10문제를 모두 풀었습니다! (13,13) 출구로 도착하여 탐험을 완료하세요.'
                      : `10개 제단을 모두 통과하면 미로 오른쪽 하단 (13,13) 출구가 열립니다.`}
                  </span>
                </div>
              </div>

              {solvedCount >= totalQuestions && (
                <button
                  onClick={handleGameFinish}
                  className="mt-3 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-black rounded-2xl shadow-md transition cursor-pointer w-full flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>최종 결과 & 수료증 확인</span>
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '3s' }} />
                </button>
              )}
            </div>

            {/* Quick Game Guide Tips */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
              <strong className="text-slate-900 font-extrabold block text-xs">
                🧭 인게임 연속 정답 & 탐험 팁
              </strong>
              <div className="flex items-start gap-1.5">
                <span className="shrink-0">🧭</span>
                <span><strong>2연속 정답:</strong> 요정의 나침반이 가장 가까운 제단까지 황금 발자국을 비춥니다.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="shrink-0">🌀</span>
                <span><strong>3연속 정답:</strong> 플레이어가 원하는 미로 타일로 즉시 워프 이동합니다.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="shrink-0">💣</span>
                <span><strong>지뢰 주의:</strong> 미로 바닥의 지뢰를 밟으면 10걸음이 추가됩니다.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          QUESTION MODAL DIALOG (With Character Reaction & Shield Perks)
         ======================================================== */}
      {currentQuestion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
            {/* Top: Selected Character Companion Speech Bubble Bar */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 rounded-2xl p-3 sm:p-4 border border-emerald-200/80 mb-3 flex items-center gap-3">
              <div
                className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr ${character.bgColor} flex items-center justify-center text-3xl shadow-md shrink-0 ring-2 ring-emerald-300`}
              >
                {character.emoji}
                {(canTeleport || isTeleportMode) && (
                  <span className="absolute -top-1.5 -right-1.5 text-xs bg-cyan-500 rounded-full p-0.5 shadow-md animate-bounce">
                    🌀
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-black text-emerald-800 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
                    {character.name} ({character.koreanName})의 힌트
                  </span>
                  {streak >= 2 && (
                    <span className="text-[11px] font-extrabold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-600" />
                      <span>{streak}연속 정답 중!</span>
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                  {!showExplanation
                    ? `"${character.dialogueWaiting}"`
                    : selectedOption === currentQuestion.correctAnswer
                    ? `🎉 ${character.cheerCorrect}`
                    : `💡 ${character.cheerIncorrect}`}
                </p>
              </div>
            </div>

            {/* Active Teleport Perk Notice in Question Dialog */}
            {(canTeleport || isTeleportMode) && !showExplanation && (
              <div className="bg-gradient-to-r from-cyan-950 via-indigo-950 to-purple-950 border-2 border-cyan-400 text-cyan-200 rounded-2xl p-3 mb-4 flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl animate-spin" style={{ animationDuration: '4s' }}>
                    🌀
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-cyan-100">
                      [자유 순간이동 능력 보유 중]
                    </h4>
                    <p className="text-[11px] text-cyan-200/90 leading-tight">
                      문제 해결 후 미로에서 원하는 자리를 터치하여 그 자리로 즉시 공간 이동할 수 있습니다!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                  Q{currentQuestion.id}
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {currentQuestion.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      {currentQuestion.category}
                    </span>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                      배점: 10점
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Mini Pie Timer in Question Dialog */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-mono font-black ${
                    timeLeft <= 15
                      ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse ring-1 ring-rose-400'
                      : timeLeft <= 30
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  }`}
                  title="퀴즈 진행 중에도 제한 시간이 계속 흐릅니다!"
                >
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" className="stroke-slate-200 fill-slate-100" strokeWidth="2.5" />
                      <path
                        d={getPiePath(12, 12, 8, timeRatio)}
                        className={
                          timeLeft <= 15
                            ? 'fill-rose-500/40'
                            : timeLeft <= 30
                            ? 'fill-amber-500/40'
                            : 'fill-emerald-500/40'
                        }
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        fill="transparent"
                        strokeWidth="2.5"
                        strokeDasharray={56.55}
                        strokeDashoffset={56.55 * (1 - timeRatio)}
                        strokeLinecap="round"
                        transform="rotate(-90 12 12)"
                        className={
                          timeLeft <= 15
                            ? 'stroke-rose-500'
                            : timeLeft <= 30
                            ? 'stroke-amber-500'
                            : 'stroke-emerald-500'
                        }
                      />
                    </svg>
                  </div>
                  <span>{formatTime(timeLeft)}</span>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-base font-bold transition cursor-pointer"
                  title="닫기"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-4">
              <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-relaxed mb-3">
                {currentQuestion.question}
              </p>

              {/* Passage Box if available */}
              {currentQuestion.passage && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-medium mb-3">
                  {currentQuestion.passage}
                </div>
              )}
            </div>

            {/* Answer Options (Optimized Touch Targets for Tablet) */}
            <div className="space-y-2.5 mb-5">
              {currentQuestion.options.map((opt, idx) => {
                const optNum = idx + 1;
                const isSelected = selectedOption === optNum;
                const isCorrect = optNum === currentQuestion.correctAnswer;
                const isUserChosen =
                  solvedQuestions[currentQuestion.id]?.selectedOption === optNum;

                let btnStyle =
                  'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-slate-800 bg-white';

                if (showExplanation) {
                  if (isCorrect) {
                    btnStyle =
                      'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400 font-black';
                  } else if (isSelected) {
                    btnStyle = 'border-rose-400 bg-rose-50 text-rose-950 font-bold';
                  } else {
                    btnStyle = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                  }
                } else if (isUserChosen) {
                  btnStyle = 'border-emerald-400 bg-emerald-50 text-emerald-900 font-bold';
                }

                return (
                  <button
                    key={idx}
                    disabled={showExplanation}
                    onClick={() => handleAnswerSubmit(optNum)}
                    className={`w-full min-h-[50px] p-3.5 sm:p-4 rounded-2xl border-2 text-left transition flex items-start gap-3 cursor-pointer active:scale-[0.99] ${btnStyle}`}
                  >
                    <span className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                      {optNum === 1
                        ? '①'
                        : optNum === 2
                        ? '②'
                        : optNum === 3
                        ? '③'
                        : optNum === 4
                        ? '④'
                        : optNum}
                    </span>
                    <span className="text-xs sm:text-sm leading-relaxed flex-1">{opt}</span>
                    {showExplanation && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {showExplanation && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation & Concept Feedback */}
            {showExplanation && (
              <div
                className={`p-4 sm:p-5 rounded-2xl border mb-5 animate-in fade-in ${
                  selectedOption === currentQuestion.correctAnswer
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50/80 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-sm mb-2">
                  {selectedOption === currentQuestion.correctAnswer ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="text-emerald-800">
                        정답입니다! (+10점 획득, 현재 {streak}연속 정답)
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-600" />
                      <span className="text-rose-800">
                        오답입니다. 정답은 {currentQuestion.correctAnswer}번 입니다.
                      </span>
                    </>
                  )}
                </div>

                <div className="text-xs sm:text-sm leading-relaxed mb-3 text-slate-700">
                  <strong className="text-slate-900 block mb-1">💡 학습 해설:</strong>
                  {currentQuestion.explanation}
                </div>

                <div className="text-xs bg-white/80 p-2.5 rounded-xl border border-black/5 font-bold text-emerald-900 mb-2">
                  📌 {currentQuestion.conceptSummary}
                </div>

                {/* 3-Streak Teleport Reward Banner inside Modal */}
                {streak >= 3 && selectedOption === currentQuestion.correctAnswer && (
                  <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-cyan-950 via-indigo-950 to-purple-950 border-2 border-cyan-400 text-cyan-200 text-xs flex items-center justify-between gap-3 shadow-md animate-pulse">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl animate-spin" style={{ animationDuration: '4s' }}>
                        🌀
                      </span>
                      <div>
                        <strong className="text-cyan-100 font-black block text-xs sm:text-sm">
                          3연속 정답 달성! [자유 순간이동] 능력 획득!
                        </strong>
                        <span className="text-[11px] text-cyan-200/90 block">
                          팝업을 닫고 미로에서 이동하고 싶은 자리를 직접 터치하면 바로 이동합니다!
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                {showExplanation ? '해설을 확인한 후 숲속 탐험을 계속하세요' : '정답 번호를 선택하세요'}
              </span>
              <button
                onClick={handleCloseModal}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>숲속 미로 탐험 계속하기</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          1차 도전(2분) 시간 초과 모달 ➔ 2차(3분) 재도전 기회 부여
         ======================================================== */}
      {isTimeoutModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 text-white">
            {/* Hourglass Icon */}
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-4xl shadow-lg mx-auto mb-4 animate-bounce">
              ⏳
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black mb-2 border border-amber-400/30">
              <Clock className="w-3.5 h-3.5" />
              <span>1차 도전 (2분) 시간 초과</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              1차 도전 시간이 초과되었습니다!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
              2분의 시간이 지났지만 아직 포기하기는 이릅니다!<br />
              민주주의 지식을 완성할 수 있도록 <strong className="text-amber-400 font-black">3분의 재도전 기회</strong>가 주어집니다!
            </p>

            {/* Progress Recap */}
            <div className="grid grid-cols-2 gap-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700 mb-5 text-left">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">1차 해결 문제</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400">
                  {solvedCount} <span className="text-xs text-slate-400">/ 10</span>
                </span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">획득 점수</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400">
                  {totalScore}점
                </span>
              </div>
            </div>

            {/* Special Retry Announcement */}
            <div className="bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/40 rounded-2xl p-4 mb-6 text-left">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-300 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>2차 재도전 혜택: 여유로운 3분(180초) 제공</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                2차 도전에서는 시간이 <strong>1분 더 늘어난 3분(180초)</strong>이 주어집니다.<br />
                연속 정답 버프(🧭 나침반 / 🌀 자유 순간이동)를 잘 활용하여 모든 문제를 풀어보세요!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <button
                onClick={handleStartRetry}
                className="w-full sm:w-auto flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm sm:text-base shadow-xl transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Clock className="w-5 h-5" />
                <span>⏱️ 3분 재도전 시작하기 (2차 도전)</span>
              </button>
              <button
                onClick={handleGoToCharacterSelect}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition cursor-pointer border border-slate-700"
              >
                캐릭터 변경
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          1차(2분) & 2차(3분) 모두 초과 시: '도전 실패' 모달
         ======================================================== */}
      {isFailedModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
          <div className="bg-slate-950 border-2 border-rose-600/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 text-white">
            {/* Big Alert Icon */}
            <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-4xl shadow-lg mx-auto mb-4 animate-pulse">
              💥
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black mb-3 border border-rose-500/30">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>1차(2분) & 2차(3분) 기회 모두 종료</span>
            </div>

            {/* Prominent '도전 실패' Heading */}
            <h2 className="text-3xl sm:text-4xl font-black text-rose-500 tracking-tight mb-2 drop-shadow-md">
              도전 실패
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
              <strong>1차(2분)</strong>와 <strong>2차 재도전(3분)</strong>의 기회를 모두 사용하였으나<br className="hidden sm:inline" />
              제한시간 내에 숲속 미로 10문제를 모두 완료하지 못했습니다.
            </p>

            {/* Results Recap */}
            <div className="grid grid-cols-3 gap-2.5 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 mb-5 text-center">
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">해결한 문제</span>
                <span className="text-lg sm:text-xl font-black text-rose-400">
                  {solvedCount} / 10
                </span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">최종 점수</span>
                <span className="text-lg sm:text-xl font-black text-amber-400">
                  {totalScore}점
                </span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">남은 문제</span>
                <span className="text-lg sm:text-xl font-black text-slate-300">
                  {totalQuestions - solvedCount}문제
                </span>
              </div>
            </div>

            {/* Advice Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 text-left text-xs text-slate-300">
              <strong className="text-amber-300 block mb-1 font-black flex items-center gap-1.5">
                <span>💡</span> 재도전 팁:
              </strong>
              <p className="leading-relaxed text-[11px] sm:text-xs text-slate-400">
                - <strong>2연속 정답</strong> 시 나침반이 최단 경로의 황금 발자국을 안내합니다.<br />
                - <strong>3연속 정답</strong> 시 원하는 자리로 즉시 공간 이동(자유 순간이동)할 수 있습니다.<br />
                - <strong>지뢰(💣)</strong>를 밟으면 10걸음이 추가되니 조심해서 이동하세요!
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <button
                onClick={handleRestartFromBeginning}
                className="w-full sm:w-auto flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-500 hover:to-rose-600 text-white font-black text-sm sm:text-base shadow-xl transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <RotateCcw className="w-5 h-5" />
                <span>처음부터 다시 도전하기 (1차 2분)</span>
              </button>
              <button
                onClick={handleGoToCharacterSelect}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition cursor-pointer border border-slate-700"
              >
                캐릭터 변경
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          COMPLETION & FINAL GRADE / GAS SUBMISSION MODAL
         ======================================================== */}
      {isCompleted && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-4xl shadow-lg mx-auto mb-3 animate-bounce">
              🏆
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>미로 탐험 완료 & 민주주의 전당 입성!</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
              축하합니다! 숲속 탐험 마스터 달성
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
              <strong>{character.name} ({character.koreanName})</strong>와 함께 신비로운 숲속 미로를 모두 돌파하고<br />
              <strong>정치 형태와 생활양식으로서의 민주주의 10문제</strong>를 멋지게 마쳤습니다!
            </p>

            {/* Attempt Badge & Time Left Announcement */}
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 mb-5 flex items-center justify-center gap-4 text-xs font-bold text-emerald-950">
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black">
                  {attemptNumber === 1 ? '1차 도전 성공 🥇' : '2차 재도전 성공 🥈'}
                </span>
                <span>{attemptNumber === 1 ? '2분 내 완료' : '3분 내 완료'}</span>
              </div>
              <div className="w-px h-4 bg-emerald-300" />
              <div className="flex items-center gap-1 text-emerald-800">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>남은 시간: {formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Score Stats Board */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 text-left">
              <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">최종 점수</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600">
                  {totalScore}
                  <span className="text-xs text-slate-400">/100</span>
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">최고 콤보</span>
                <span className="text-xl sm:text-2xl font-black text-amber-500">
                  🔥 {maxStreak}
                  <span className="text-xs text-slate-400">연속</span>
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">총 이동 걸음</span>
                <span className="text-xl sm:text-2xl font-black text-slate-800">
                  {stepsCount}
                  <span className="text-xs text-slate-400">걸음</span>
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">획득 간식</span>
                <span className="text-xl sm:text-2xl font-black text-purple-600">
                  {character.snackEmoji} {snacksCollected}
                </span>
              </div>
            </div>

            {/* Student ID & Name Check before submission */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-left mb-6">
              <h4 className="text-xs font-black text-emerald-950 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>선생님께 탐험 결과 제출</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">학번</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="예: 10305"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">이름</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="예: 홍길동"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-emerald-500"
                  />
                </div>
              </div>

              {submitStatus === 'success' ? (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-950 text-xs font-black flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>탐험 결과가 성공적으로 전송되었습니다!</span>
                </div>
              ) : (
                <button
                  onClick={handleSubmitResults}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isSubmitting ? '전송하는 중...' : '구글 시트로 결과 제출하기'}</span>
                </button>
              )}

              {errorMessage && (
                <p className="text-[11px] text-rose-600 mt-2 font-bold">{errorMessage}</p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 justify-center">
              <button
                onClick={handleRestartFromBeginning}
                className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                미로 다시 도전
              </button>
              <button
                onClick={handleGoToCharacterSelect}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer"
              >
                다른 캐릭터로 플레이
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
