import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Worksheet9_1 } from './components/Worksheet9_1';
import { BalanceQuiz } from './components/BalanceQuiz';
import { MindmapPage } from './components/MindmapPage';
import { BubbleQuiz } from './components/BubbleQuiz';
import { MazeQuiz } from './components/MazeQuiz';
import { sounds } from './utils/audio';
import { GoogleSheetsHeaderControl } from './components/GoogleSheetsHeaderControl';

export const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbzfEar4EvRv2oWcgiew-eO3FmTZdOZntCqGKa2iVeRqsnBiFQy042YRa9A4QPHc-wobvA/exec';

export default function App() {
  // Navigation Tab: 'worksheet-9-1' | 'balance-quiz' | 'mindmap-page' | 'bubble-quiz' | 'line-quiz' (Pages 1 to 5)
  const [activeTab, setActiveTab] = useState<
    'worksheet-9-1' | 'balance-quiz' | 'mindmap-page' | 'bubble-quiz' | 'line-quiz'
  >('worksheet-9-1');

  // Student Info
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');

  // Sound toggle
  const [soundOn, setSoundOn] = useState(true);

  // Google Apps Script Web App URL (Hardcoded with teacher's deployment URL)
  const [gasUrl, setGasUrl] = useState<string>(() => {
    const saved = localStorage.getItem('gas_quiz_webhook_url');
    if (!saved || !saved.includes('AKfycbzfEar4EvRv2oWcgiew') || !saved.startsWith('http')) {
      localStorage.setItem('gas_quiz_webhook_url', DEFAULT_GAS_URL);
      return DEFAULT_GAS_URL;
    }
    return saved;
  });

  // Keep sound manager in sync
  useEffect(() => {
    sounds.enabled = soundOn;
  }, [soundOn]);



  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased selection:bg-blue-100">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Header Title with prominent blue background highlight */}
          <div className="flex items-center">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white shadow-sm border border-blue-400/30">
              <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse shrink-0" />
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-normal text-white drop-shadow-2xs">
                정치와 민주주의
              </h1>
            </div>
          </div>

          {/* Student Info Inputs & Quick Actions */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center bg-slate-100 px-2 py-1 rounded-xl border border-slate-200 gap-1.5">
              <label htmlFor="studentIdInput" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                학번
              </label>
              <input
                id="studentIdInput"
                type="text"
                placeholder="예: 20315"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-20 px-2 py-1 text-xs bg-white rounded-lg border border-slate-300 focus:outline-blue-500 font-medium"
              />
              <span className="text-slate-300">|</span>
              <label htmlFor="studentNameInput" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                이름
              </label>
              <input
                id="studentNameInput"
                type="text"
                placeholder="예: 홍길동"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-20 px-2 py-1 text-xs bg-white rounded-lg border border-slate-300 focus:outline-blue-500 font-medium"
              />
            </div>

            {/* Google Sheets Backend & Inspector */}
            <GoogleSheetsHeaderControl
              gasUrl={gasUrl}
              onGasUrlChange={setGasUrl}
            />

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundOn(!soundOn)}
              title={soundOn ? '소리 끄기' : '소리 켜기'}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* Activity Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('worksheet-9-1')}
            className={`py-2.5 px-3.5 text-xs sm:text-sm font-extrabold border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer rounded-t-lg ${
              activeTab === 'worksheet-9-1'
                ? 'border-indigo-600 text-indigo-800 bg-indigo-50/70 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
              1
            </span>
            <span>[1페이지] 개념 빈칸 학습지</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
              형성평가
            </span>
          </button>

          <button
            onClick={() => setActiveTab('balance-quiz')}
            className={`py-2.5 px-3.5 text-xs sm:text-sm font-extrabold border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer rounded-t-lg ${
              activeTab === 'balance-quiz'
                ? 'border-orange-500 text-orange-950 bg-orange-50/80 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-orange-500 text-white flex items-center justify-center text-[10px] font-black">
              2
            </span>
            <span>[2페이지] 정치인가?</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
              🍬 2분 캔디
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mindmap-page')}
            className={`py-2.5 px-3.5 text-xs sm:text-sm font-extrabold border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer rounded-t-lg ${
              activeTab === 'mindmap-page'
                ? 'border-teal-600 text-teal-900 bg-teal-50/80 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-teal-600 text-white flex items-center justify-center text-[10px] font-black">
              3
            </span>
            <span>[3페이지] 마인드맵</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900">
              노트북LM
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bubble-quiz')}
            className={`py-2.5 px-3.5 text-xs sm:text-sm font-extrabold border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer rounded-t-lg ${
              activeTab === 'bubble-quiz'
                ? 'border-violet-600 text-violet-900 bg-violet-50/80 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-violet-600 text-white flex items-center justify-center text-[10px] font-black">
              4
            </span>
            <span>[4페이지] 버블버블 15제</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-900">
              🫧 3연속 팡!
            </span>
          </button>

          <button
            onClick={() => setActiveTab('line-quiz')}
            className={`py-2.5 px-3.5 text-xs sm:text-sm font-extrabold border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer rounded-t-lg ${
              activeTab === 'line-quiz'
                ? 'border-emerald-600 text-emerald-950 bg-emerald-50/80 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
              5
            </span>
            <span>[5페이지] 숲속 미로 탐험 10제</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
              🌲 숲속 미로 (고양이·강아지·상어)
            </span>
          </button>
        </div>
      </nav>

      {/* Pages Content */}
      <main className="flex-1">
        {activeTab === 'worksheet-9-1' && (
          <Worksheet9_1
            studentId={studentId}
            studentName={studentName}
            gasUrl={gasUrl}
            onStudentIdChange={setStudentId}
            onStudentNameChange={setStudentName}
          />
        )}

        {activeTab === 'balance-quiz' && (
          <BalanceQuiz
            studentId={studentId}
            studentName={studentName}
            gasUrl={gasUrl}
          />
        )}

        {activeTab === 'mindmap-page' && (
          <MindmapPage
            studentId={studentId}
            studentName={studentName}
            gasUrl={gasUrl}
          />
        )}

        {activeTab === 'bubble-quiz' && (
          <BubbleQuiz
            studentId={studentId}
            studentName={studentName}
            gasUrl={gasUrl}
          />
        )}

        {activeTab === 'line-quiz' && (
          <MazeQuiz
            studentId={studentId}
            studentName={studentName}
            gasUrl={gasUrl}
          />
        )}
      </main>
    </div>
  );
}
