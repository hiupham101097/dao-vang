import React, { useState, useCallback, useRef } from 'react';
import { GoldMinerEngine } from './game/core/GoldMinerEngine';
import { FloatingPopupItem, GameStateSnapshot } from './game/types';
import { GameCanvas } from './components/GameCanvas';
import { FloatingPopups } from './components/FloatingPopups';
import { RPGHUD } from './components/RPGHUD';
import { HUD } from './components/HUD';
import { ShopModal } from './components/ShopModal';
import { BlastingModal } from './components/BlastingModal';
import { GuideModal } from './components/GuideModal';

const initialSnapshot: GameStateSnapshot = {
  screen: 'HOTEL',
  level: 1,
  walletGold: 500,
  targetScore: 1050,
  remainingTime: 60,
  dynamiteCount: 2,
  buffs: {
    strength: false,
    clover: false,
    polish: false,
    magnet: false,
  },
  canUseDynamite: false,
  canFinishEarly: false,
  minerSpeech: '👨‍🏭 "Chào buổi sáng! Hãy rời khách sạn ra thị trấn chuẩn bị đồ nghề."',
  isMuted: false,
  lastResultPassed: true,
  highScore: 500,
  currentZoneName: '🏨 Khách Sạn Thợ Mỏ',
  interactionPrompt: null,
  questText: 'Rời khách sạn để bước ra thị trấn',
};

export const App: React.FC = () => {
  const engineRef = useRef<GoldMinerEngine | null>(null);
  const [gameState, setGameState] = useState<GameStateSnapshot>(initialSnapshot);
  const [popups, setPopups] = useState<FloatingPopupItem[]>([]);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleEngineReady = useCallback((engine: GoldMinerEngine) => {
    engineRef.current = engine;
  }, []);

  const handleStateChange = useCallback((snapshot: GameStateSnapshot) => {
    setGameState(snapshot);
  }, []);

  const handleFloatingPopup = useCallback((popup: FloatingPopupItem) => {
    setPopups((prev) => [...prev, popup]);
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== popup.id));
    }, 1450);
  }, []);

  // Exploration Actions
  const handleInteract = useCallback(() => {
    engineRef.current?.interactCurrentPrompt();
  }, []);

  const handleFastTravel = useCallback((zone: 'HOTEL' | 'TOWN' | 'MINE_EXTERIOR' | 'MINING') => {
    engineRef.current?.setZone(zone);
  }, []);

  const handleMoveInput = useCallback((dx: number, dz: number) => {
    engineRef.current?.setMoveInput(dx, dz);
  }, []);

  // Mining Arcade Actions
  const handleLaunchHook = useCallback(() => {
    engineRef.current?.launchHook();
  }, []);

  const handleUseDynamite = useCallback(() => {
    engineRef.current?.tryUseDynamite();
  }, []);

  const handleFinishEarly = useCallback(() => {
    engineRef.current?.finishMiningLevel();
  }, []);

  const handleBackToTown = useCallback(() => {
    engineRef.current?.setZone('TOWN');
  }, []);

  const handleToggleAudio = useCallback(() => {
    engineRef.current?.toggleAudio();
  }, []);

  const handleBuyItem = useCallback(
    (key: 'dynamite' | 'strength' | 'clover' | 'polish' | 'magnet', price: number) => {
      engineRef.current?.buyItem(key, price);
    },
    []
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0705] select-none font-sans">
      {/* 3D World Scene Canvas */}
      <GameCanvas
        onEngineReady={handleEngineReady}
        onStateChange={handleStateChange}
        onFloatingPopup={handleFloatingPopup}
      />

      {/* Floating 2D In-Game Popups */}
      <FloatingPopups popups={popups} />

      {/* RPG Exploration HUD (Hotel, Town, Mine Exterior) */}
      <RPGHUD
        state={gameState}
        onInteract={handleInteract}
        onFastTravel={handleFastTravel}
        onToggleAudio={handleToggleAudio}
        onMoveInput={handleMoveInput}
      />

      {/* Arcade Mining Machine HUD (Underground Hook Minigame) */}
      <HUD
        state={gameState}
        onLaunchHook={handleLaunchHook}
        onUseDynamite={handleUseDynamite}
        onFinishEarly={handleFinishEarly}
        onBackHome={handleBackToTown}
      />

      {/* General Store Modal (Inside Town Shop) */}
      <ShopModal
        state={gameState}
        onBuyItem={handleBuyItem}
        onCloseToHome={() => engineRef.current?.setZone('TOWN')}
        onStartGame={() => engineRef.current?.setZone('MINING')}
      />

      {/* Mountain Blasting Sequence Modal (When Level is Cleared) */}
      <BlastingModal
        state={gameState}
        blastCountdown={engineRef.current?.blastCountdown || 0}
        onEnterNewMine={() => engineRef.current?.setZone('MINING')}
        onGoToTown={() => engineRef.current?.setZone('TOWN')}
        onGoToHotel={() => engineRef.current?.setZone('HOTEL')}
      />

      {/* Mineral Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};

export default App;
