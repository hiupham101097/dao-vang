import React from 'react';
import { GameStateSnapshot } from '../game/types';
import { Play, ShoppingBag, BookOpen, Volume2, VolumeX, Trophy, Sparkles, Coins, Bomb } from './Icons';

interface HomeScreenProps {
  state: GameStateSnapshot;
  onPlay: () => void;
  onOpenShop: () => void;
  onOpenGuide: () => void;
  onToggleAudio: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  state,
  onPlay,
  onOpenShop,
  onOpenGuide,
  onToggleAudio,
}) => {
  if (state.screen !== 'HOME') return null;

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 sm:p-6 overflow-y-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        {/* Wallet & High Score */}
        <div className="flex items-center gap-3">
          <div className="hud-glass px-4 py-2.5 rounded-2xl flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">VỐN KHỞI ĐIỂM</span>
              <span className="font-display text-lg sm:text-xl font-extrabold text-amber-400 leading-none">
                ${state.walletGold.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="hud-glass px-4 py-2.5 rounded-2xl hidden sm:flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">KỶ LỤC</span>
              <span className="font-display text-lg sm:text-xl font-extrabold text-yellow-300 leading-none">
                ${state.highScore.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Audio Mute Button */}
        <button
          onClick={onToggleAudio}
          className="hud-glass p-3 rounded-2xl text-amber-400 hover:text-amber-300 hover:border-amber-400/80 transition"
          title={state.isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {state.isMuted ? <VolumeX className="w-5 h-5 text-stone-500" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
        </button>
      </div>

      {/* Center Branding & Action Card */}
      <div className="flex flex-col items-center justify-center text-center my-auto pointer-events-auto max-w-xl mx-auto w-full">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-300 text-xs font-bold uppercase tracking-widest mb-3 backdrop-blur-md animate-float">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Three.js PBR Engine r160 + React</span>
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_4px_16px_rgba(245,158,11,0.5)]">
          ĐÀO VÀNG 3D
        </h1>
        <p className="text-stone-300 text-xs sm:text-sm font-medium mt-1 mb-6 max-w-md">
          Khám phá lòng đất bí ẩn, săn lùng Vàng Khối và Kim Cương với đồ họa 3D chân thực!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3.5 w-full max-w-md">
          <button
            onClick={onPlay}
            className="gold-btn py-3.5 px-6 rounded-2xl font-display font-black text-base sm:text-lg text-stone-950 uppercase tracking-wider flex-1 flex items-center justify-center gap-2.5 shadow-xl"
          >
            <Play className="w-5 h-5 fill-stone-950 text-stone-950" />
            <span>BẮT ĐẦU (MÀN {state.level})</span>
          </button>

          <button
            onClick={onOpenShop}
            className="secondary-btn py-3.5 px-6 rounded-2xl font-display font-bold text-base text-amber-300 uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <span>CỬA HÀNG</span>
          </button>
        </div>

        {/* Inventory preview bar */}
        <div className="hud-glass rounded-2xl px-4 py-2.5 mt-5 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Bomb className="w-4 h-4 text-red-400" />
            <span className="text-stone-400">Thuốc nổ TNT:</span>
            <span className="font-bold text-red-300">{state.dynamiteCount}</span>
          </div>
          <div className="h-3 w-px bg-stone-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">Nước tăng lực:</span>
            <span className={`font-bold ${state.buffs.strength ? 'text-sky-400' : 'text-stone-500'}`}>
              {state.buffs.strength ? 'Đã bật' : 'Chưa có'}
            </span>
          </div>
          <div className="h-3 w-px bg-stone-700 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-stone-400">Cỏ may mắn:</span>
            <span className={`font-bold ${state.buffs.clover ? 'text-emerald-400' : 'text-stone-500'}`}>
              {state.buffs.clover ? 'Đã bật' : 'Chưa có'}
            </span>
          </div>
        </div>

        {/* Mineral Guide Modal Link */}
        <button
          onClick={onOpenGuide}
          className="mt-4 text-amber-400/90 hover:text-amber-300 hover:underline text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition"
        >
          <BookOpen className="w-4 h-4" />
          <span>Xem Bảng Giá Khoáng Sản & Mẹo Đào</span>
        </button>
      </div>

      {/* Footer Instructions */}
      <div className="text-center text-stone-400 text-[11px] sm:text-xs pointer-events-auto">
        <p>
          🎮 <b>Phím Space / Click chuột / Chạm</b> để thả móc • <b>Phím E / Chuột phải</b> để ném thuốc nổ
        </p>
      </div>
    </div>
  );
};
