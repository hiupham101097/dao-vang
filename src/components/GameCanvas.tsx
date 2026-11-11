import React, { useEffect, useRef } from 'react';
import { GoldMinerEngine } from '../game/core/GoldMinerEngine';
import { FloatingPopupItem, GameStateSnapshot } from '../game/types';

interface GameCanvasProps {
  onEngineReady: (engine: GoldMinerEngine) => void;
  onStateChange: (snapshot: GameStateSnapshot) => void;
  onFloatingPopup: (popup: FloatingPopupItem) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onEngineReady,
  onStateChange,
  onFloatingPopup,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GoldMinerEngine | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GoldMinerEngine(
      containerRef.current,
      (snapshot) => onStateChange(snapshot),
      (popup) => onFloatingPopup(popup)
    );

    engineRef.current = engine;
    onEngineReady(engine);

    // Resize handler
    const handleResize = () => {
      if (engineRef.current && containerRef.current) {
        engineRef.current.resize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Pointer down (Click / Tap to drop hook; Right click to use dynamite)
    const handlePointerDown = (e: PointerEvent) => {
      if (!engineRef.current) return;
      if (engineRef.current.state !== 'PLAYING') return;

      if (e.button === 2) {
        engineRef.current.tryUseDynamite();
      } else {
        engineRef.current.launchHook();
      }
    };

    const containerEl = containerRef.current;
    containerEl.addEventListener('pointerdown', handlePointerDown);

    // Context menu disable
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('contextmenu', handleContextMenu);

    // Keyboard bindings
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      if (engineRef.current.state !== 'PLAYING') return;

      if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        engineRef.current.launchHook();
      } else if (e.code === 'KeyE' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        engineRef.current.tryUseDynamite();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      containerEl.removeEventListener('pointerdown', handlePointerDown);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full z-0 cursor-crosshair overflow-hidden"
    />
  );
};

