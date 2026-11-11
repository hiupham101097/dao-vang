import React from 'react';
import { GameStateSnapshot } from '../game/types';
import { Bomb, Play, ShoppingBag, Home } from './Icons';

interface BlastingModalProps {
  state: GameStateSnapshot;
  blastCountdown: number;
  onEnterNewMine: () => void;
  onGoToTown: () => void;
  onGoToHotel: () => void;
}

export const BlastingModal: React.FC<BlastingModalProps> = ({
  state,
  blastCountdown,
  onEnterNewMine,
  onGoToTown,
  onGoToHotel,
}) => {
  if (state.screen !== 'BLASTING') return null;

  const isCountingDown = blastCountdown > 0;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="hud-glass max-w-lg w-full rounded-3xl p-6 sm:p-8 border-2 border-amber-500/50 text-center animate-float">
        {isCountingDown ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-20 h-20 rounded-3xl bg-red-500/20 border-2 border-red-400/60 flex items-center justify-center text-red-400 animate-pulse">
              <Bomb className="w-10 h-10" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-amber-300 uppercase tracking-wide">
              ĐANG ĐẶT MÌN PHÁ NÚI...
            </h2>
            <div className="font-display text-5xl sm:text-6xl font-black text-red-500 animate-bounce">
              {Math.ceil(blastCountdown)}
            </div>
            <p className="text-xs text-stone-300 max-w-sm">
              Mỏ cũ đã khai thác xong! Thuốc nổ TNT đang được kích nổ để phá tan vách núi, thông sang tầng mỏ mới phong phú hơn!
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400/60 flex items-center justify-center text-amber-400 text-4xl shadow-xl shadow-amber-500/20">
              💥
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-amber-300 uppercase tracking-wide">
              ĐÃ PHÁ NÚI THÀNH CÔNG!
            </h2>
            <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs uppercase tracking-widest">
              ĐÃ KHAI PHÁ MỎ MỚI (MÀN {state.level})
            </div>
            <p className="text-stone-300 text-sm leading-relaxed max-w-md">
              Vách núi đã nổ tung! Phía sau là một mạch khoáng sản mới chứa đầy Vàng Nguyên Khối, Kim Cương và Túi Bí Ẩn!
            </p>

            {/* Current Wallet & Next Target */}
            <div className="bg-stone-900/90 border border-stone-700/80 rounded-2xl p-4 my-2 w-full flex justify-around">
              <div>
                <span className="text-xs text-stone-400 block font-medium">Tiền hiện có</span>
                <span className="font-display text-2xl font-extrabold text-amber-400">
                  ${state.walletGold.toLocaleString()}
                </span>
              </div>
              <div className="border-l border-stone-700 pl-6">
                <span className="text-xs text-stone-400 block font-medium">Chỉ tiêu Màn {state.level}</span>
                <span className="font-display text-2xl font-extrabold text-emerald-400">
                  ${state.targetScore.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 w-full pt-2">
              <button
                onClick={onEnterNewMine}
                className="gold-btn w-full py-3.5 rounded-2xl font-display font-extrabold text-base text-stone-950 uppercase flex items-center justify-center gap-2 shadow-xl"
              >
                <Play className="w-5 h-5 fill-stone-950" />
                <span>VÀO ĐÀO MỎ MỚI NGAY (MÀN {state.level})</span>
              </button>

              <button
                onClick={onGoToTown}
                className="secondary-btn w-full py-3 rounded-2xl font-display font-bold text-sm text-amber-300 uppercase flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>QUAY VỀ THỊ TRẤN MUA ĐỒ TIẾP TẾ</span>
              </button>

              <button
                onClick={onGoToHotel}
                className="text-xs text-stone-400 hover:text-white pt-1 font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Về Khách Sạn Nghỉ Ngơi</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

