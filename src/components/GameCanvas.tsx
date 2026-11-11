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

    // Pointer events
    const handlePointerDown = (e: PointerEvent) => {
      if (!engineRef.current) return;
      engineRef.current.handlePointerDown(e);
    };

    const containerEl = containerRef.current;
    containerEl.addEventListener('pointerdown', handlePointerDown);

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('contextmenu', handleContextMenu);

    // Key tracking for smooth exploration movement
    const pressedKeys = new Set<string>();

    const updateMovement = () => {
      if (!engineRef.current) return;
      let dx = 0;
      let dz = 0;

      if (pressedKeys.has('KeyA') || pressedKeys.has('ArrowLeft')) dx -= 1;
      if (pressedKeys.has('KeyD') || pressedKeys.has('ArrowRight')) dx += 1;
      if (pressedKeys.has('KeyW') || pressedKeys.has('ArrowUp')) dz += 1;
      if (pressedKeys.has('KeyS') || pressedKeys.has('ArrowDown')) dz -= 1;

      engineRef.current.setMoveInput(dx, dz);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;

      if (engineRef.current.state === 'MINING') {
        if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'KeyS') {
          e.preventDefault();
          engineRef.current.launchHook();
        } else if (e.code === 'KeyE' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          engineRef.current.tryUseDynamite();
        }
      } else {
        // Exploration mode
        pressedKeys.add(e.code);
        updateMovement();

        if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          engineRef.current.interactCurrentPrompt();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.delete(e.code);
      updateMovement();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      containerEl.removeEventListener('pointerdown', handlePointerDown);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full z-0 cursor-crosshair overflow-hidden flex items-center justify-center bg-[#0a0705]"
    />
  );
};
