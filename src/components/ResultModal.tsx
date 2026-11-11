import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameStateSnapshot } from '../game/types';
import { Trophy, AlertCircle, ShoppingBag, Play, RotateCcw, Home } from './Icons';

interface ResultModalProps {
  state: GameStateSnapshot;
  onGoToShop: () => void;
  onNextOrRetry: () => void;
  onGoHome: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  state,
  onGoToShop,
  onNextOrRetry,
  onGoHome,
}) => {
  if (state.screen !== 'RESULT') return null;

  const passed = state.lastResultPassed;

  useEffect(() => {
    if (passed) {
      try {
        confetti({
          particleCount: 85,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#fde047', '#f59e0b', '#38bdf8', '#34d399', '#ffffff'],
        });
      } catch (_) {}
    }
  }, [passed]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="hud-glass max-w-md w-full rounded-3xl p-6 sm:p-7 border-2 border-amber-500/40 text-center animate-float">
        {/* Result Icon */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 border ${
            passed
              ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
              : 'bg-red-500/20 border-red-400/50 text-red-400'
          }`}
        >
          {passed ? <Trophy className="w-9 h-9 text-amber-400" /> : <AlertCircle className="w-9 h-9 text-red-400" />}
        </div>

        {/* Title */}
        <h2
          className={`font-display text-2xl sm:text-3xl font-extrabold ${
            passed ? 'text-amber-300' : 'text-red-400'
          }`}
        >
          {passed ? `HOÀN THÀNH MÀN ${state.level - 1}!` : 'CHƯA ĐỦ CHỈ TIÊU!'}
        </h2>

        {/* Subtitle */}
        <p className="text-stone-300 text-sm mt-1.5 leading-relaxed">
          {passed
            ? 'Ông Già Đào Vàng đã thu hoạch vượt chỉ tiêu! Hãy ghé Cửa Hàng mua trang bị cho màn mới.'
            : 'Đừng nản chí! Bạn có thể khởi động lại từ Màn 1 với $500 vốn ban đầu.'}
        </p>

        {/* Score comparison card */}
        <div className="bg-stone-900/90 border border-stone-700 rounded-2xl p-4 my-5 flex justify-around">
          <div>
            <span className="text-xs text-stone-400 block font-medium">Tiền thu hoạch</span>
            <span className="font-display text-2xl font-extrabold text-amber-400">
              ${state.walletGold.toLocaleString()}
            </span>
          </div>
          <div className="border-l border-stone-700 pl-6">
            <span className="text-xs text-stone-400 block font-medium">Mục tiêu yêu cầu</span>
            <span className="font-display text-2xl font-extrabold text-emerald-400">
              ${state.targetScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {passed && (
            <button
              onClick={onGoToShop}
              className="gold-btn w-full py-3.5 rounded-2xl font-display font-extrabold text-base text-stone-950 uppercase flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5 text-stone-950" />
              <span>VÀO CỬA HÀNG MUA ĐỒ & QUA MÀN</span>
            </button>
          )}

          <button
            onClick={onNextOrRetry}
            className="secondary-btn w-full py-3.5 rounded-2xl font-display font-bold text-sm text-amber-300 uppercase flex items-center justify-center gap-2"
          >
            {passed ? (
              <>
                <Play className="w-4 h-4 fill-amber-300" />
                <span>CHƠI NGAY MÀN TIẾP THEO (MÀN {state.level})</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>CHƠI LẠI TỪ MÀN 1</span>
              </>
            )}
          </button>

          <button
            onClick={onGoHome}
            className="text-xs text-stone-400 hover:text-white pt-2 font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Home className="w-4 h-4" />
            <span>Về Trang Chủ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
