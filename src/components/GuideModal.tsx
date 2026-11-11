import React from 'react';
import { X, BookOpen, AlertTriangle } from './Icons';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="hud-glass max-w-lg w-full rounded-3xl p-6 border-2 border-amber-500/40">
        <div className="flex items-center justify-between pb-3 border-b border-stone-700">
          <div className="flex items-center gap-2 text-amber-300">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="font-display text-xl font-extrabold">BẢNG GIÁ KHOÁNG SẢN 720P HD</h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 my-4 text-left">
          <div className="bg-stone-900/90 border border-stone-700 rounded-xl p-3 flex items-center gap-3">
            <span className="text-3xl">🪙</span>
            <div>
              <div className="text-xs font-bold text-amber-300">Vàng Nguyên Khối</div>
              <div className="text-[11px] text-stone-400">$50 / $250 / $500</div>
            </div>
          </div>

          <div className="bg-stone-900/90 border border-stone-700 rounded-xl p-3 flex items-center gap-3">
            <span className="text-3xl">💎</span>
            <div>
              <div className="text-xs font-bold text-cyan-300">Kim Cương Tinh Khiết</div>
              <div className="text-[11px] text-stone-400">$600 • Nhẹ, kéo nhanh</div>
            </div>
          </div>

          <div className="bg-stone-900/90 border border-stone-700 rounded-xl p-3 flex items-center gap-3">
            <span className="text-3xl">🪨</span>
            <div>
              <div className="text-xs font-bold text-stone-300">Đá Trầm Tích</div>
              <div className="text-[11px] text-stone-400">$20 - $45 • Rất nặng</div>
            </div>
          </div>

          <div className="bg-stone-900/90 border border-stone-700 rounded-xl p-3 flex items-center gap-3">
            <span className="text-3xl">🎒</span>
            <div>
              <div className="text-xs font-bold text-yellow-400">Túi Bí Ẩn</div>
              <div className="text-[11px] text-stone-400">$80 - $950 / +1 TNT</div>
            </div>
          </div>

          <div className="bg-stone-900/90 border border-stone-700 rounded-xl p-3 flex items-center gap-3 col-span-2">
            <span className="text-3xl">🛢️</span>
            <div>
              <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <span>Thùng Thuốc Nổ TNT</span>
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px] text-stone-400">
                Gắp trúng sẽ phát nổ lan rộng phá hủy toàn bộ các chướng ngại vật xung quanh!
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="gold-btn w-full py-3 rounded-xl font-display font-extrabold text-sm text-stone-950 uppercase"
        >
          ĐÃ HIỂU
        </button>
      </div>
    </div>
  );
};
