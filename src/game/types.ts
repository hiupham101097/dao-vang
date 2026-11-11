import * as THREE from 'three';

export type GameScreen =
  | 'HOTEL'          // Inside the Miner's Hotel
  | 'TOWN'           // The Gold Rush Town
  | 'SHOP'           // Inside the Town Supply Store
  | 'MINE_EXTERIOR'  // Path outside the Mountain Mine
  | 'MINING'         // Operating the Winch Crane inside the Mine
  | 'BLASTING'       // Dynamite blasting through the mountain to next mine
  | 'HOME'
  | 'PLAYING'
  | 'RESULT';

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

export interface InteractionPrompt {
  actionKey: string;
  title: string;
  description: string;
  onTrigger: () => void;
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
  currentZoneName: string;
  interactionPrompt: InteractionPrompt | null;
  questText: string;
}
