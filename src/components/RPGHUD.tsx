import React from 'react';
import { GameStateSnapshot } from '../game/types';
import { Coins, Volume2, VolumeX, Compass, MapPin, Footprints } from './Icons';

interface RPGHUDProps {
  state: GameStateSnapshot;
  onInteract: () => void;
  onFastTravel: (zone: 'HOTEL' | 'TOWN' | 'MINE_EXTERIOR' | 'MINING') => void;
  onToggleAudio: () => void;
  onMoveInput: (dx: number, dz: number) => void;
}

export const RPGHUD: React.FC<RPGHUDProps> = ({
  state,
  onInteract,
  onFastTravel,
  onToggleAudio,
  onMoveInput,
}) => {
  // Only active during exploration (HOTEL, TOWN, MINE_EXTERIOR)
  if (state.screen === 'MINING' || state.screen === 'BLASTING' || state.screen === 'SHOP') {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-5">
      {/* Top Bar: Location, Quest Tracker, Fast Travel & Wallet */}
      <div className="flex flex-col gap-2.5 w-full">
        <div className="flex items-center justify-between w-full pointer-events-auto">
          {/* Location & Quest */}
          <div className="flex items-center gap-3">
            <div className="hud-glass px-4 py-2 rounded-2xl flex items-center gap-2.5 border-amber-400/50">
              <MapPin className="w-5 h-5 text-amber-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">KHU VỰC HIỆN TẠI</span>
                <span className="font-display text-sm sm:text-base font-extrabold text-amber-300">
                  {state.currentZoneName}
                </span>
              </div>
            </div>

            <div className="hud-glass px-4 py-2 rounded-2xl hidden md:flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-400 animate-spin-slow" />
              <div className="flex flex-col">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">NHIỆM VỤ</span>
                <span className="text-xs sm:text-sm font-semibold text-emerald-300">
                  {state.questText}
                </span>
              </div>
            </div>
          </div>

          {/* Wallet & Audio Toggle */}
          <div className="flex items-center gap-2.5">
            <div className="hud-glass px-4 py-2 rounded-2xl flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <span className="font-display text-lg sm:text-xl font-extrabold text-amber-400">
                ${state.walletGold.toLocaleString()}
              </span>
            </div>

            <button
              onClick={onToggleAudio}
              className="hud-glass p-2.5 rounded-2xl text-amber-400 hover:text-amber-300 transition"
              title="Bật/Tắt âm thanh"
            >
              {state.isMuted ? <VolumeX className="w-5 h-5 text-stone-500" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Fast Travel Quick Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pointer-events-auto">
          <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider pl-1 hidden sm:inline">
            Di chuyển nhanh:
          </span>
          <button
            onClick={() => onFastTravel('HOTEL')}
            className={`px-3 py-1.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition ${
              state.screen === 'HOTEL'
                ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/30'
                : 'hud-glass text-stone-300 hover:text-white'
            }`}
          >
            🏨 Khách Sạn
          </button>
          <button
            onClick={() => onFastTravel('TOWN')}
            className={`px-3 py-1.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition ${
              state.screen === 'TOWN'
                ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/30'
                : 'hud-glass text-stone-300 hover:text-white'
            }`}
          >
            🏘️ Thị Trấn
          </button>
          <button
            onClick={() => onFastTravel('MINE_EXTERIOR')}
            className={`px-3 py-1.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition ${
              state.screen === 'MINE_EXTERIOR'
                ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/30'
                : 'hud-glass text-stone-300 hover:text-white'
            }`}
          >
            ⛰️ Lối Vào Mỏ
          </button>
          <button
            onClick={() => onFastTravel('MINING')}
            className="gold-btn px-3.5 py-1.5 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider text-stone-950 shadow-lg flex items-center gap-1.5"
          >
            <span>⛏️ Vào Đào Vàng (Màn {state.level})</span>
          </button>
        </div>
      </div>

      {/* Center Speech Bubble */}
      <div className="flex justify-center w-full">
        <div className="px-5 py-2 rounded-full bg-stone-950/85 border border-amber-400/40 text-amber-200 text-xs sm:text-sm font-semibold shadow-2xl backdrop-blur-md text-center max-w-xl pointer-events-auto">
          {state.minerSpeech}
        </div>
      </div>

      {/* Bottom Area: Context Interaction Banner & Mobile D-pad */}
      <div className="flex flex-col items-center gap-3 w-full pb-2">
        {/* Interactive Prompt Banner (When near door/shop/mine) */}
        {state.interactionPrompt && (
          <div className="pointer-events-auto w-full max-w-md animate-bounce">
            <button
              onClick={onInteract}
              className="gold-btn w-full py-3.5 px-6 rounded-2xl flex items-center justify-between shadow-2xl text-stone-950 font-display font-black text-sm sm:text-base uppercase tracking-wider"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-stone-950 text-amber-400 flex items-center justify-center font-extrabold text-sm border border-amber-400/40">
                  {state.interactionPrompt.actionKey}
                </span>
                <div className="flex flex-col items-start leading-tight">
                  <span className="font-extrabold">{state.interactionPrompt.title}</span>
                  <span className="text-[11px] text-stone-800 font-medium normal-case">
                    {state.interactionPrompt.description}
                  </span>
                </div>
              </div>
              <span className="text-xl">➔</span>
            </button>
          </div>
        )}

        {/* Keyboard / Touch Controls Helper */}
        <div className="hud-glass rounded-xl px-4 py-1.5 text-[11px] text-stone-300 pointer-events-auto flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Footprints className="w-3.5 h-3.5 text-amber-400" />
            <b>Phím W A S D / Mũi tên:</b> Di chuyển nhân vật
          </span>
          <span className="text-stone-600">|</span>
          <span>
            <b>Phím E / Bấm nút:</b> Tương tác hành động
          </span>
        </div>

        {/* Mobile On-Screen D-Pad for easy touch navigation */}
        <div className="sm:hidden grid grid-cols-3 gap-1.5 w-36 pointer-events-auto pt-1">
          <div />
          <button
            onPointerDown={() => onMoveInput(0, 1)}
            onPointerUp={() => onMoveInput(0, 0)}
            className="hud-glass p-3 rounded-xl flex items-center justify-center font-bold text-base active:bg-amber-400 active:text-stone-950"
          >
            ▲
          </button>
          <div />
          <button
            onPointerDown={() => onMoveInput(-1, 0)}
            onPointerUp={() => onMoveInput(0, 0)}
            className="hud-glass p-3 rounded-xl flex items-center justify-center font-bold text-base active:bg-amber-400 active:text-stone-950"
          >
            ◀
          </button>
          <button
            onPointerDown={() => onMoveInput(0, -1)}
            onPointerUp={() => onMoveInput(0, 0)}
            className="hud-glass p-3 rounded-xl flex items-center justify-center font-bold text-base active:bg-amber-400 active:text-stone-950"
          >
            ▼
          </button>
          <button
            onPointerDown={() => onMoveInput(1, 0)}
            onPointerUp={() => onMoveInput(0, 0)}
            className="hud-glass p-3 rounded-xl flex items-center justify-center font-bold text-base active:bg-amber-400 active:text-stone-950"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
