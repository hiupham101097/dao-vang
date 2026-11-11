import React from 'react';
import { GameStateSnapshot } from '../game/types';
import { ShoppingBag, ArrowLeft, Play, Coins, Bomb, Zap, Sparkles, Gem, Magnet, Check } from './Icons';

interface ShopModalProps {
  state: GameStateSnapshot;
  onBuyItem: (key: 'dynamite' | 'strength' | 'clover' | 'polish' | 'magnet', price: number) => void;
  onCloseToHome: () => void;
  onStartGame: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  state,
  onBuyItem,
  onCloseToHome,
  onStartGame,
}) => {
  if (state.screen !== 'SHOP') return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="hud-glass max-w-4xl w-full rounded-3xl p-4 sm:p-7 border-2 border-amber-500/40 flex flex-col gap-4 sm:gap-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-700/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-black text-amber-300 uppercase tracking-wide">
                CỬA HÀNG VẬT PHẨM
              </h2>
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block">
                Trạm Tiếp Tế Thợ Mỏ — Chuẩn Bị Cho Màn {state.level}
              </span>
            </div>
          </div>

          {/* Wallet In Shop */}
          <div className="hud-glass px-4 py-2 rounded-2xl flex items-center gap-2 border-amber-400/40">
            <Coins className="w-5 h-5 text-amber-400" />
            <div className="text-right">
              <span className="text-[10px] text-stone-400 block font-semibold">VÍ TIỀN</span>
              <span className="font-display text-xl sm:text-2xl font-extrabold text-amber-300 leading-none">
                ${state.walletGold.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Store Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* 1. Thuốc nổ TNT */}
          <div className="bg-stone-900/80 border border-stone-700/80 hover:border-red-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">🧨</span>
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-bold">
                  Đang có: {state.dynamiteCount}
                </span>
              </div>
              <h3 className="font-display font-bold text-base text-white">Thuốc Nổ TNT</h3>
              <p className="text-xs text-stone-400 mt-1">
                Phá hủy ngay vật cản nặng (đá, tảng) khi đang kéo để tiết kiệm thời gian quý giá.
              </p>
            </div>
            <button
              onClick={() => onBuyItem('dynamite', 150)}
              disabled={state.walletGold < 150}
              className="mt-4 w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-display font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Bomb className="w-4 h-4 text-red-400" />
              <span>Mua Thêm ($150)</span>
            </button>
          </div>

          {/* 2. Nước Tăng Lực */}
          <div className="bg-stone-900/80 border border-stone-700/80 hover:border-sky-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">⚡</span>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 text-xs font-semibold">
                  Hiệu lực 1 màn
                </span>
              </div>
              <h3 className="font-display font-bold text-base text-white">Nước Tăng Lực Thần Tốc</h3>
              <p className="text-xs text-stone-400 mt-1">
                Tăng <b>+85% tốc độ kéo</b> mọi vật phẩm (kể cả tảng đá khổng lồ và vàng tảng to nhất).
              </p>
            </div>
            <button
              onClick={() => onBuyItem('strength', 250)}
              disabled={state.buffs.strength || state.walletGold < 250}
              className={`mt-4 w-full py-2.5 rounded-xl border font-display font-bold text-sm transition flex items-center justify-center gap-1.5 ${
                state.buffs.strength
                  ? 'bg-sky-500/20 border-sky-400/50 text-sky-300 cursor-default'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/50 text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {state.buffs.strength ? (
                <>
                  <Check className="w-4 h-4 text-sky-400" />
                  <span>Đã Trang Bị ✔</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Mua ($250)</span>
                </>
              )}
            </button>
          </div>

          {/* 3. Cỏ Bốn Lá */}
          <div className="bg-stone-900/80 border border-stone-700/80 hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">🍀</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                  Hiệu lực 1 màn
                </span>
              </div>
              <h3 className="font-display font-bold text-base text-white">Cỏ Bốn Lá May Mắn</h3>
              <p className="text-xs text-stone-400 mt-1">
                Mở <b>Túi Bí Ẩn</b> chắc chắn ra tiền khủng ($500 - $950) hoặc tặng thêm thuốc nổ!
              </p>
            </div>
            <button
              onClick={() => onBuyItem('clover', 200)}
              disabled={state.buffs.clover || state.walletGold < 200}
              className={`mt-4 w-full py-2.5 rounded-xl border font-display font-bold text-sm transition flex items-center justify-center gap-1.5 ${
                state.buffs.clover
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 cursor-default'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/50 text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {state.buffs.clover ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Đã Trang Bị ✔</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Mua ($200)</span>
                </>
              )}
            </button>
          </div>

          {/* 4. Đá Đánh Bóng Kim Cương */}
          <div className="bg-stone-900/80 border border-stone-700/80 hover:border-cyan-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">💎</span>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-semibold">
                  Hiệu lực 1 màn
                </span>
              </div>
              <h3 className="font-display font-bold text-base text-white">Đá Đánh Bóng Kim Cương</h3>
              <p className="text-xs text-stone-400 mt-1">
                Tăng <b>+50% giá trị bán</b> Kim Cương Tinh Khiết ($650 ➔ $975 mỗi viên)!
              </p>
            </div>
            <button
              onClick={() => onBuyItem('polish', 300)}
              disabled={state.buffs.polish || state.walletGold < 300}
              className={`mt-4 w-full py-2.5 rounded-xl border font-display font-bold text-sm transition flex items-center justify-center gap-1.5 ${
                state.buffs.polish
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 cursor-default'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/50 text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {state.buffs.polish ? (
                <>
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Đã Trang Bị ✔</span>
                </>
              ) : (
                <>
                  <Gem className="w-4 h-4 text-amber-400" />
                  <span>Mua ($300)</span>
                </>
              )}
            </button>
          </div>

          {/* 5. Ngàm Kẹp Titan */}
          <div className="bg-stone-900/80 border border-stone-700/80 hover:border-purple-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">🧲</span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs font-semibold">
                  Hiệu lực 1 màn
                </span>
              </div>
              <h3 className="font-display font-bold text-base text-white">Ngàm Titan Từ Tính</h3>
              <p className="text-xs text-stone-400 mt-1">
                Tăng <b>+25% tốc độ phóng</b> và tự động hút Kim Cương/Vàng trong phạm vi gần.
              </p>
            </div>
            <button
              onClick={() => onBuyItem('magnet', 220)}
              disabled={state.buffs.magnet || state.walletGold < 220}
              className={`mt-4 w-full py-2.5 rounded-xl border font-display font-bold text-sm transition flex items-center justify-center gap-1.5 ${
                state.buffs.magnet
                  ? 'bg-purple-500/20 border-purple-400/50 text-purple-300 cursor-default'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/50 text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {state.buffs.magnet ? (
                <>
                  <Check className="w-4 h-4 text-purple-400" />
                  <span>Đã Trang Bị ✔</span>
                </>
              ) : (
                <>
                  <Magnet className="w-4 h-4 text-amber-400" />
                  <span>Mua ($220)</span>
                </>
              )}
            </button>
          </div>

          {/* 6. Miner Tip Card */}
          <div className="bg-gradient-to-br from-amber-500/10 to-stone-900/90 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-center">
            <div className="text-xs uppercase tracking-wider text-amber-400 font-bold mb-1 flex items-center gap-1">
              <span>💡 Mẹo Từ Ông Thợ Mỏ</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Vàng Khối và Tảng Đá rất nặng. Hãy trang bị <b>Nước Tăng Lực</b> hoặc dùng <b>Thuốc Nổ TNT</b> phá đá để gắp nhanh Kim Cương bên dưới!
            </p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-700/80">
          <button
            onClick={onCloseToHome}
            className="secondary-btn w-full sm:w-auto px-6 py-3 rounded-2xl font-display font-bold text-sm text-stone-200 uppercase flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Trang Chủ</span>
          </button>

          <button
            onClick={onStartGame}
            className="gold-btn w-full sm:flex-1 py-3.5 px-8 rounded-2xl font-display font-extrabold text-base text-stone-950 uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-stone-950" />
            <span>VÀO CHƠI NGAY (MÀN {state.level})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
