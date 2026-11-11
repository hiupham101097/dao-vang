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
    <div className="fixed inset-0 z-30 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto bg-stone-950/85 backdrop-blur-md select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full pointer-events-auto max-w-5xl mx-auto">
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
      <div className="flex flex-col items-center justify-center text-center my-auto pointer-events-auto max-w-xl mx-auto w-full py-4">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-widest mb-3 shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>Đồ Họa Chuẩn HD 720p Siêu Nét • Không Hộp Khối Pixel</span>
        </div>

        {/* Title */}
        <h1 className="font-display text-5xl sm:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_4px_20px_rgba(245,158,11,0.6)]">
          ĐÀO VÀNG HD
        </h1>

        {/* RPG Journey Flow Preview */}
        <div className="mt-2 mb-6 p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-stone-300 text-xs sm:text-sm max-w-lg">
          <p className="font-bold text-amber-300 mb-1">🗺️ HÀNH TRÌNH KHÁM PHÁ CỦA THỢ MỎ:</p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] sm:text-xs text-stone-300">
            <span className="px-2 py-0.5 rounded bg-stone-800 text-amber-300">🏨 Khách Sạn</span>
            <span>➔</span>
            <span className="px-2 py-0.5 rounded bg-stone-800 text-amber-300">🏘️ Thị Trấn</span>
            <span>➔</span>
            <span className="px-2 py-0.5 rounded bg-stone-800 text-amber-300">🏪 Cửa Hàng</span>
            <span>➔</span>
            <span className="px-2 py-0.5 rounded bg-stone-800 text-amber-300">⛰️ Hầm Mỏ</span>
            <span>➔</span>
            <span className="px-2 py-0.5 rounded bg-stone-800 text-amber-300">⛏️ Máy Đào</span>
            <span>➔</span>
            <span className="px-2 py-0.5 rounded bg-stone-800 text-amber-300">💥 Phá Núi Mở Mỏ Mới</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3.5 w-full max-w-md">
          <button
            onClick={onPlay}
            className="gold-btn py-4 px-6 rounded-2xl font-display font-black text-base sm:text-lg text-stone-950 uppercase tracking-wider flex-1 flex items-center justify-center gap-2.5 shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            <Play className="w-6 h-6 fill-stone-950 text-stone-950" />
            <span>BẮT ĐẦU (VÀO KHÁCH SẠN)</span>
          </button>

          <button
            onClick={onOpenShop}
            className="secondary-btn py-4 px-6 rounded-2xl font-display font-bold text-base text-amber-300 uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <span>CỬA HÀNG</span>
          </button>
        </div>

        {/* Inventory preview bar */}
        <div className="hud-glass rounded-2xl px-5 py-2.5 mt-5 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Bomb className="w-4 h-4 text-red-400" />
            <span className="text-stone-400">Thuốc nổ TNT:</span>
            <span className="font-bold text-red-300">{state.dynamiteCount} quả</span>
          </div>
          <div className="h-3 w-px bg-stone-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">Mục tiêu:</span>
            <span className="font-bold text-amber-400">${state.targetScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Mineral Guide Modal Link */}
        <button
          onClick={onOpenGuide}
          className="mt-4 text-amber-400/90 hover:text-amber-300 hover:underline text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition"
        >
          <BookOpen className="w-4 h-4" />
          <span>Xem Bảng Giá Khoáng Sản & Mẹo Đào Vàng</span>
        </button>
      </div>

      {/* Footer Instructions */}
      <div className="text-center text-stone-400 text-[11px] sm:text-xs pointer-events-auto max-w-xl mx-auto">
        <p>
          🎮 <b>Di chuyển</b>: Phím WASD / Mũi tên / Chạm & Click trên màn hình • <b>Tương tác</b>: Phím [E] hoặc Click
        </p>
      </div>
    </div>
  );
};
