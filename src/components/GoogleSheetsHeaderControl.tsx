import React, { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { GoogleSheetsModal } from './GoogleSheetsModal';

interface GoogleSheetsHeaderControlProps {
  gasUrl: string;
  onGasUrlChange?: (newUrl: string) => void;
}

export const GoogleSheetsHeaderControl: React.FC<GoogleSheetsHeaderControlProps> = ({
  gasUrl,
  onGasUrlChange
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Student-safe submission viewer trigger */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition shadow-2xs cursor-pointer"
          title="1~5페이지 퀴즈 제출 현황 확인"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">제출 현황</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      </div>

      <GoogleSheetsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        gasUrl={gasUrl}
        onGasUrlChange={onGasUrlChange}
      />
    </>
  );
};
