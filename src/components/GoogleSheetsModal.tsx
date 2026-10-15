import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Unlock,
  Code,
  Copy,
  Check,
  ShieldCheck,
  Settings,
  AlertTriangle
} from 'lucide-react';
import {
  PAGE_SHEET_INFO,
  fetchRecentRecordsFromGas
} from '../services/googleSheets';
import { CODE_GS_TEMPLATE } from '../data/gasTemplates';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasUrl: string;
  onGasUrlChange?: (newUrl: string) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  gasUrl,
  onGasUrlChange
}) => {
  // Default to student-safe 'records' tab
  const [activeTab, setActiveTab] = useState<'records' | 'code' | 'faq' | 'settings'>('records');
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [records, setRecords] = useState<{ headers: string[]; rows: any[][] }>({
    headers: PAGE_SHEET_INFO[1].headers,
    rows: []
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputUrl, setInputUrl] = useState(gasUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Hidden Teacher Mode: students cannot see or access developer tabs unless unlocked
  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [teacherKeyPrompt, setTeacherKeyPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    setInputUrl(gasUrl);
  }, [gasUrl]);

  // Reset tab to records whenever opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab('records');
      setTeacherKeyPrompt(false);
    }
  }, [isOpen]);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRecentRecordsFromGas(gasUrl, selectedPage, 10);
      setRecords({
        headers: data.headers || PAGE_SHEET_INFO[selectedPage].headers,
        rows: data.rows || []
      });
    } catch {
      setRecords({
        headers: PAGE_SHEET_INFO[selectedPage].headers,
        rows: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'records') {
      loadRecords();
    }
  }, [isOpen, activeTab, selectedPage, gasUrl]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CODE_GS_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveUrl = () => {
    if (onGasUrlChange && inputUrl.trim()) {
      onGasUrlChange(inputUrl.trim());
      localStorage.setItem('gas_quiz_webhook_url', inputUrl.trim());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleUnlockTeacherMode = (e: React.FormEvent) => {
    e.preventDefault();
    // Default simple teacher password
    if (passwordInput.trim() === '1234' || passwordInput.trim() === 'teacher' || passwordInput.trim() === '선생님') {
      setIsTeacherMode(true);
      setTeacherKeyPrompt(false);
      setPasswordInput('');
    } else {
      alert('비밀번호가 올바르지 않습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header - Clean student-safe title with NO '시트 열기' link */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">학생 퀴즈 참여 및 제출 현황</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                  실시간 연동
                </span>
              </div>
              <p className="text-xs text-emerald-100/90">
                1페이지부터 5페이지까지 학생들이 제출한 활동 결과가 표시됩니다.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation - Only shown if teacher explicitly unlocked */}
        {isTeacherMode && (
          <div className="flex border-b border-amber-200 bg-amber-50/70 px-5 pt-2 gap-2 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setActiveTab('records')}
              className={`pb-2 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'records'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>1~5페이지 시트 기록 확인</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`pb-2 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'code'
                  ? 'border-indigo-600 text-indigo-800 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Code className="w-4 h-4 text-indigo-600" />
              <span>백엔드 코드 (Code.gs)</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-2 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'settings'
                  ? 'border-teal-600 text-teal-800 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings className="w-4 h-4 text-teal-600" />
              <span>웹 앱 URL 설정</span>
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`pb-2 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'faq'
                  ? 'border-red-600 text-red-800 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>배포 FAQ</span>
            </button>
            <button
              onClick={() => {
                setIsTeacherMode(false);
                setActiveTab('records');
              }}
              className="ml-auto text-[11px] text-slate-400 hover:text-slate-700 underline pb-2"
            >
              교사 모드 종료
            </button>
          </div>
        )}

        {/* Tab 1: Records Table (Default & ONLY view for students) */}
        {activeTab === 'records' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Page selection buttons */}
            <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[1, 2, 3, 4, 5].map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedPage === p
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {PAGE_SHEET_INFO[p].title}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadRecords}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>새로고침</span>
                </button>
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-3 flex items-center justify-between text-xs text-slate-600 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    확인 중인 활동: <strong className="text-emerald-800 font-bold">{PAGE_SHEET_INFO[selectedPage].title}</strong>
                  </span>
                </div>
              </div>

              {isLoading ? (
                <div className="py-16 text-center text-slate-500 text-sm">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
                  제출 기록을 불러오는 중입니다...
                </div>
              ) : records.rows.length === 0 ? (
                <div className="py-12 px-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">제출된 기록이 대기 중입니다.</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                    학생이 퀴즈를 풀고 제출하면 이곳에 제출 내역이 표시됩니다.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5">No</th>
                        {records.headers.map((h, i) => (
                          <th key={i} className="px-3 py-2.5 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50 transition">
                          <td className="px-3 py-2 text-slate-400 font-mono">{rIdx + 1}</td>
                          {records.headers.map((_, cIdx) => (
                            <td key={cIdx} className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap max-w-xs truncate" title={String(row[cIdx] || '')}>
                              {row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Code.gs (Only visible when unlocked by teacher) */}
        {isTeacherMode && activeTab === 'code' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-900">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  교사용 백엔드 코드 (Code.gs)
                </span>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-xs cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? '복사 완료!' : 'Code.gs 전체 복사'}</span>
                </button>
              </div>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-200 text-[11px] font-mono rounded-xl overflow-x-auto max-h-80 leading-relaxed selection:bg-indigo-600">
{CODE_GS_TEMPLATE}
            </pre>
          </div>
        )}

        {/* Tab 3: Settings (Only visible when unlocked by teacher) */}
        {isTeacherMode && activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <label htmlFor="gasUrlInput" className="block text-xs font-bold text-slate-700 mb-1">
                Google Apps Script 웹 앱 배포 URL
              </label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  id="gasUrlInput"
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono focus:outline-blue-600"
                />
                <button
                  onClick={handleSaveUrl}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer shrink-0"
                >
                  {saveSuccess ? '저장 완료!' : 'URL 저장'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: FAQ (Only visible when unlocked by teacher) */}
        {isTeacherMode && activeTab === 'faq' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <h4 className="font-bold text-amber-900">배포 시 주의사항</h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>[액세스 권한이 있는 사용자]를 '모든 사용자(Anyone)'로 설정해야 학생 전송이 가능합니다.</li>
                <li>코드를 수정한 뒤에는 반드시 [배포 관리] &gt; [새 버전]으로 배포해야 반영됩니다.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            {teacherKeyPrompt ? (
              <form onSubmit={handleUnlockTeacherMode} className="flex items-center gap-1.5">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-300 rounded-lg w-28 bg-white focus:outline-emerald-600"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer text-xs"
                >
                  확인
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTeacherKeyPrompt(false);
                    setPasswordInput('');
                  }}
                  className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-xs"
                >
                  취소
                </button>
              </form>
            ) : !isTeacherMode ? (
              <button
                onClick={() => setTeacherKeyPrompt(true)}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span>교사용 설정</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                <Unlock className="w-3 h-3 text-emerald-600" />
                <span>교사용 모드 활성화됨</span>
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
