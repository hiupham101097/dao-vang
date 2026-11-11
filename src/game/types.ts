import * as THREE from 'three';

export type GameScreen = 'HOME' | 'SHOP' | 'PLAYING' | 'RESULT';

export type ItemType =
  | 'GOLD_SMALL'
  | 'GOLD_MEDIUM'
  | 'GOLD_LARGE'
  | 'ROCK_SMALL'
  | 'ROCK_LARGE'
  | 'DIAMOND'
  | 'MYSTERY_BAG'
  | 'TNT';

export interface ItemSpec {
  type: ItemType;
  name: string;
  mass: number;
  baseValue: number;
  radius: number;
  isExplosive: boolean;
  explosionRadius?: number;
}

export interface ActiveBuffs {
  strength: boolean;
  clover: boolean;
  polish: boolean;
  magnet: boolean;
}

export interface FloatingPopupItem {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
}

export interface GameStateSnapshot {
  screen: GameScreen;
  level: number;
  walletGold: number;
  targetScore: number;
  remainingTime: number;
  dynamiteCount: number;
  buffs: ActiveBuffs;
  canUseDynamite: boolean;
  canFinishEarly: boolean;
  minerSpeech: string;
  isMuted: boolean;
  lastResultPassed: boolean;
  highScore: number;
}

