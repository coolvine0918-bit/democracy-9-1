import React from 'react';
import {
  Sparkles,
  TreePine,
  ShieldCheck,
  CheckCircle,
  Play,
  User,
  Compass,
  Zap,
  Heart,
  Volume2,
  BookOpen,
  Clock,
  AlertCircle
} from 'lucide-react';
import { CHARACTERS, CharacterInfo } from '../data/mazeQuizData';
import { sounds } from '../utils/audio';

interface CharacterSelectProps {
  selectedCharId: 'cat' | 'dog' | 'shark';
  onSelectChar: (id: 'cat' | 'dog' | 'shark') => void;
  onStartGame: () => void;
  studentId: string;
  studentName: string;
  onUpdateStudentId: (id: string) => void;
  onUpdateStudentName: (name: string) => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  selectedCharId,
  onSelectChar,
  onStartGame,
  studentId,
  studentName,
  onUpdateStudentId,
  onUpdateStudentName
}) => {
  const currentCharacter: CharacterInfo =
    CHARACTERS.find((c) => c.id === selectedCharId) || CHARACTERS[0];

  const handleSelect = (id: 'cat' | 'dog' | 'shark') => {
    onSelectChar(id);
    sounds.play('select');
  };

  const handleStart = () => {
    sounds.play('success');
    onStartGame();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 animate-in fade-in duration-300">
      {/* Top Banner / Theme Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/40 relative overflow-hidden mb-6">
        {/* Subtle Decorative Forest Accents */}
        <div className="absolute top-2 right-4 text-6xl opacity-15 select-none pointer-events-none">
          🌲🌳🌿
        </div>
        <div className="absolute -bottom-6 -right-6 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-200 text-xs sm:text-sm font-black mb-3 border border-emerald-400/30">
            <TreePine className="w-4 h-4 text-emerald-300" />
            <span>[5페이지] 신비의 숲속 미로 10제 • 탐험가 캐릭터 선택</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-emerald-50 mb-2">
            숲속 미로에 입장하기 전, 나만의 캐릭터를 골라보세요!
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-emerald-100/90 max-w-2xl leading-relaxed">
            푸른 덤불과 신비로운 고목이 우거진 숲속 미로를 탐험하며,{' '}
            <strong className="text-amber-300 underline underline-offset-4 decoration-amber-400/60">
              정치 형태로서의 민주주의
            </strong>
            와{' '}
            <strong className="text-emerald-300 underline underline-offset-4 decoration-emerald-400/60">
              생활양식으로서의 민주주의
            </strong>{' '}
            10문제를 모두 풀고 <strong>민주주의 전당</strong>에 도달하세요!
          </p>
        </div>
      </div>

      {/* 3 Character Selection Cards (Optimized for Tablet & Desktop) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span>탐험 파트너 선택 (3종)</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            원하는 캐릭터 카드를 탭하여 선택하세요
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {CHARACTERS.map((char) => {
            const isSelected = selectedCharId === char.id;
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => handleSelect(char.id)}
                className={`group relative rounded-3xl p-5 sm:p-6 text-left transition-all duration-200 cursor-pointer border-2 select-none active:scale-[0.98] ${
                  isSelected
                    ? 'bg-gradient-to-b from-white via-emerald-50/50 to-white border-emerald-500 shadow-xl ring-4 ring-emerald-400/30'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                {/* Active Selection Badge */}
                {isSelected && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-xs">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>선택됨</span>
                  </div>
                )}

                {/* Character Big Avatar */}
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr ${char.bgColor} flex items-center justify-center text-4xl sm:text-5xl shadow-md transition-transform group-hover:scale-105 ${
                      isSelected ? 'ring-4 ring-white shadow-lg animate-bounce' : ''
                    }`}
                  >
                    {char.emoji}
                  </div>
                  <div>
                    <span
                      className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md border mb-1 ${char.badgeColor}`}
                    >
                      {char.koreanName}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">
                      {char.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{char.title}</p>
                  </div>
                </div>

                {/* Dialogue Preview */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs text-slate-700 leading-relaxed mb-4">
                  <span className="font-bold text-slate-900 block mb-0.5">💬 한마디:</span>
                  <span className="italic">"{char.dialogueWaiting}"</span>
                </div>

                {/* Details List */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">좋아하는 간식</span>
                    <span className="font-bold text-slate-800">
                      {char.snackEmoji} {char.snackName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">탐험 특기</span>
                    <span className="font-bold text-emerald-700">{char.forestPerk}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">이동 기동력</span>
                    <span className="font-bold text-indigo-700">{char.speed}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Character Spotlight & Student Input (Tablet Optimized) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-md mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Spotlight info */}
          <div className="lg:col-span-7 flex items-center gap-4 sm:gap-6">
            <div className="relative shrink-0">
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr ${currentCharacter.bgColor} flex items-center justify-center text-4xl sm:text-5xl shadow-xl`}
              >
                {currentCharacter.emoji}
              </div>
              <span className="absolute -bottom-2 -right-2 text-2xl bg-white rounded-full p-1 shadow-sm border border-slate-100">
                {currentCharacter.snackEmoji}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  선택된 탐험가: {currentCharacter.name} ({currentCharacter.koreanName})
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-slate-900 mb-1">
                "{currentCharacter.tagline}"
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                미로 속 10개 문제마다 <strong>{currentCharacter.name}</strong>가 문제 풀이를 응원하며,
                정답 여부에 따라 즉시 생생한 피드백을 전달합니다!
              </p>
            </div>
          </div>

          {/* Right: Student Information Entry (Optional/Recommended for GAS Evaluation) */}
          <div className="lg:col-span-5 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
            <div className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>학생 평가 정보 (선택 입력)</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              학번과 이름을 입력해 두면 미로 탈출 후 구글 시트로 평가 결과가 안전하게 전송됩니다.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  학번 (예: 20101)
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => onUpdateStudentId(e.target.value)}
                  placeholder="학번 입력"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  이름 (예: 홍길동)
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => onUpdateStudentName(e.target.value)}
                  placeholder="이름 입력"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Concept Guide Box */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <BookOpen className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-emerald-900 block sm:inline mr-2">[학습 핵심 개념 미리보기]</strong>
            <span>
              <strong>정치 형태:</strong> 국가 통치 구조, 국민 주권, 선거와 법률 |{' '}
              <strong>생활양식:</strong> 가정, 학교, 지역사회 속 대화와 타협의 삶의 태도
            </span>
          </div>
        </div>
        <span className="text-[11px] text-emerald-800 font-bold shrink-0 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300">
          총 10문항 (100점 만점)
        </span>
      </div>

      {/* Challenge Time Limit Rules Box */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-950 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-amber-900 block sm:inline mr-2">⏱️ [미로찾기 제한시간 규칙]</strong>
            <span>
              <strong>1차 도전:</strong> 2분(120초) 안에 10문제 해결 및 미로 완주! |{' '}
              <strong>재도전 기회:</strong> 시간 초과 시 <strong>3분(180초)</strong>의 2차 기회 부여 |{' '}
              <strong className="text-rose-700">모두 실패 시 '도전 실패'</strong>
            </span>
          </div>
        </div>
        <span className="text-[11px] text-amber-800 font-black shrink-0 bg-amber-200/60 px-2.5 py-1 rounded-full border border-amber-300">
          1차 2분 ➔ 2차 3분
        </span>
      </div>

      {/* Start Button Area (Large, Tap-Friendly for Tablets) */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={handleStart}
          className="w-full sm:w-auto min-w-[280px] sm:min-w-[340px] px-8 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center gap-3 mx-auto"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{currentCharacter.name}와 함께 숲속 미로 게임 입장하기 🌲</span>
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
        </button>
        <p className="text-xs text-slate-400 mt-2.5">
          태블릿 터치 화면 및 키보드 방향키(↑ ↓ ← →) 조작을 모두 완벽 지원합니다.
        </p>
      </div>
    </div>
  );
};
