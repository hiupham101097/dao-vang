import React from 'react';
import { GameStateSnapshot } from '../game/types';
import { Bomb, ArrowLeft, Zap, Sparkles, Gem, Magnet, CheckCircle2 } from './Icons';

interface HUDProps {
  state: GameStateSnapshot;
  onLaunchHook: () => void;
  onUseDynamite: () => void;
  onFinishEarly: () => void;
  onBackHome: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  state,
  onLaunchHook,
  onUseDynamite,
  onFinishEarly,
  onBackHome,
}) => {
  if (state.screen !== 'PLAYING') return null;

  const targetPct = Math.min(100, Math.floor((state.walletGold / Math.max(1, state.targetScore)) * 100));
  const remainingSecs = Math.ceil(state.remainingTime);
  const isUrgent = remainingSecs <= 10;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-2.5 sm:p-4">
      {/* Top HUD Bar */}
      <div className="flex items-start justify-between gap-2 w-full">
        {/* Left: Level & Target Progress */}
        <div className="hud-glass rounded-2xl p-2.5 sm:p-3.5 flex items-center gap-3 sm:gap-4 pointer-events-auto">
          <div className="flex flex-col items-center justify-center bg-amber-500/15 border border-amber-400/40 rounded-xl px-2.5 py-1.5 min-w-[54px]">
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">MÀN</span>
            <span className="font-display text-xl sm:text-2xl font-extrabold text-amber-400 leading-none">
              {String(state.level).padStart(2, '0')}
            </span>
          </div>

          <div className="flex flex-col gap-1 min-w-[140px] sm:min-w-[210px]">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-stone-300 font-semibold">Tiền:</span>
              <span className="font-display text-lg sm:text-2xl font-extrabold text-amber-300">
                ${state.walletGold.toLocaleString()}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-stone-400">Chỉ tiêu:</span>
              <span className="font-display text-sm sm:text-base font-bold text-emerald-400">
                ${state.targetScore.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-stone-900/90 h-2 rounded-full overflow-hidden border border-stone-700/60 mt-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${targetPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Miner Speech Bubble */}
        <div className="hidden lg:flex flex-col items-center max-w-md pointer-events-auto">
          <div className="px-4 py-1.5 rounded-full bg-stone-950/85 border border-amber-400/40 text-amber-200 text-xs font-semibold shadow-lg text-center backdrop-blur-md">
            {state.minerSpeech}
          </div>
        </div>

        {/* Right: Timer & Tools */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Active Buffs */}
          <div className="hidden md:flex items-center gap-1.5">
            {state.buffs.strength && (
              <span className="p-2 rounded-xl bg-sky-500/20 border border-sky-400/50 text-sky-300 text-xs flex items-center gap-1" title="Nước Tăng Lực (+85% tốc độ)">
                <Zap className="w-4 h-4 text-sky-400 fill-sky-400/30" />
              </span>
            )}
            {state.buffs.clover && (
              <span className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs flex items-center gap-1" title="Cỏ 4 Lá (Túi bí ẩn may mắn)">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </span>
            )}
            {state.buffs.polish && (
              <span className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs flex items-center gap-1" title="Đá Đánh Bóng (+50% giá Kim Cương)">
                <Gem className="w-4 h-4 text-cyan-400" />
              </span>
            )}
            {state.buffs.magnet && (
              <span className="p-2 rounded-xl bg-purple-500/20 border border-purple-400/50 text-purple-300 text-xs flex items-center gap-1" title="Ngàm Titan (+25% tốc độ phóng)">
                <Magnet className="w-4 h-4 text-purple-400" />
              </span>
            )}
          </div>

          {/* Countdown Clock */}
          <div className="hud-glass rounded-2xl px-3.5 py-2 flex flex-col items-center min-w-[70px]">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">THỜI GIAN</span>
            <span
              className={`font-display text-xl sm:text-2xl font-extrabold leading-none ${
                isUrgent ? 'timer-urgent text-red-500' : 'text-white'
              }`}
            >
              {remainingSecs}s
            </span>
          </div>

          {/* Dynamite Action Button */}
          <button
            onClick={onUseDynamite}
            disabled={!state.canUseDynamite}
            className="danger-btn rounded-2xl px-3 py-2 text-white font-semibold text-xs flex items-center gap-2 group transition"
            title="Ném thuốc nổ phá đá đang kéo (Phím E, W hoặc Chuột Phải)"
          >
            <Bomb className="w-5 h-5 text-red-200 group-hover:rotate-12 transition-transform" />
            <div className="flex flex-col items-start leading-tight">
              <span className="font-display font-extrabold text-sm">TNT</span>
              <span className="text-[10px] text-red-200">SL: {state.dynamiteCount}</span>
            </div>
          </button>

          {/* Finish Early Button (when target reached) */}
          {state.canFinishEarly && (
            <button
              onClick={onFinishEarly}
              className="gold-btn rounded-2xl px-3.5 py-2 text-stone-950 font-display font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 animate-bounce"
              title="Đạt đủ chỉ tiêu, qua màn ngay!"
            >
              <CheckCircle2 className="w-4 h-4 text-stone-950" />
              <span>QUA MÀN SỚM</span>
            </button>
          )}

          {/* Back to Home / Pause */}
          <button
            onClick={onBackHome}
            className="secondary-btn rounded-2xl p-2.5 text-stone-300 hover:text-amber-400 transition"
            title="Về Trang Chủ"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Center Launch Button (Especially great for Mobile touch) */}
      <div className="flex flex-col items-center gap-2 pointer-events-auto sm:hidden pb-2">
        <button
          onClick={onLaunchHook}
          className="gold-btn w-full max-w-xs py-3.5 rounded-2xl font-display font-black text-lg text-stone-950 uppercase tracking-wider shadow-2xl active:scale-95"
        >
          ⛏️ PHÓNG MÓC
        </button>
      </div>
    </div>
  );
};
