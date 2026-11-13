import React, { useState, useCallback, useRef } from 'react';
import { GoldMinerEngine } from './game/core/GoldMinerEngine';
import { FloatingPopupItem, GameStateSnapshot } from './game/types';
import { GameCanvas } from './components/GameCanvas';
import { FloatingPopups } from './components/FloatingPopups';
import { HUD } from './components/HUD';
import { HomeScreen } from './components/HomeScreen';
import { ShopModal } from './components/ShopModal';
import { GuideModal } from './components/GuideModal';
import { ResultModal } from './components/ResultModal';

const initialSnapshot: GameStateSnapshot = {
  screen: 'HOME',
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
  minerSpeech: '👨‍🏭 Ông Thợ Mỏ: "Chào mừng bạn! Sẵn sàng đào kho báu chưa?"',
  isMuted: false,
  lastResultPassed: true,
  highScore: 500,
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

  // UI Actions
  const handlePlay = useCallback(() => {
    engineRef.current?.startPureGameplay();
  }, []);

  const handleOpenShop = useCallback(() => {
    engineRef.current?.openShopScreen();
  }, []);

  const handleCloseShop = useCallback(() => {
    engineRef.current?.goToHomeScreen();
  }, []);

  const handleLaunchHook = useCallback(() => {
    engineRef.current?.launchHook();
  }, []);

  const handleUseDynamite = useCallback(() => {
    engineRef.current?.tryUseDynamite();
  }, []);

  const handleFinishEarly = useCallback(() => {
    engineRef.current?.finishLevel();
  }, []);

  const handleBackHome = useCallback(() => {
    engineRef.current?.goToHomeScreen();
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

  const handleNextOrRetry = useCallback(() => {
    engineRef.current?.startPureGameplay();
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080604] select-none font-sans">
      {/* 3D Three.js Engine Canvas */}
      <GameCanvas
        onEngineReady={handleEngineReady}
        onStateChange={handleStateChange}
        onFloatingPopup={handleFloatingPopup}
      />

      {/* Floating 2D In-Game Popups (Scores, TNT, Clover bonuses) */}
      <FloatingPopups popups={popups} />

      {/* Game Screens & Modals */}
      <HomeScreen
        state={gameState}
        onPlay={handlePlay}
        onOpenShop={handleOpenShop}
        onOpenGuide={() => setIsGuideOpen(true)}
        onToggleAudio={handleToggleAudio}
      />

      <HUD
        state={gameState}
        onLaunchHook={handleLaunchHook}
        onUseDynamite={handleUseDynamite}
        onFinishEarly={handleFinishEarly}
        onBackHome={handleBackHome}
      />

      <ShopModal
        state={gameState}
        onBuyItem={handleBuyItem}
        onCloseToHome={handleCloseShop}
        onStartGame={handlePlay}
      />

      <ResultModal
        state={gameState}
        onGoToShop={handleOpenShop}
        onNextOrRetry={handleNextOrRetry}
        onGoHome={handleBackHome}
      />

      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};

export default App;

