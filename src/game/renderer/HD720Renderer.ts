/**
 * HD720Renderer - High-Definition (1280x720) 2.5D Illustrated Game Engine
 * Renders rich stylized vector/raster art with gradients, dynamic lighting,
 * smooth animations, particle physics, and zero crude 3D blocky boxes.
 */

import { ItemType } from '../types';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  elapsed: number;
  dt: number;
}

export interface UndergroundItem {
  id: number;
  type: ItemType;
  x: number;
  y: number;
  radius: number;
  baseValue: number;
  mass: number;
  isExplosive: boolean;
  explosionRadius?: number;
  rotation: number;
  isAttached: boolean;
}

export interface MiningHookState {
  angle: number; // in radians
  length: number; // length of wire from pivot (640, 115)
  state: 'SWINGING' | 'EXTENDING' | 'RETURNING';
  attachedItem: UndergroundItem | null;
  dynamiteInFlight: boolean;
  dynamiteDist: number;
}

export interface VFXParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'smoke' | 'fire' | 'rock' | 'star';
}

export class HD720Renderer {
  public static readonly V_WIDTH = 1280;
  public static readonly V_HEIGHT = 720;

  // =========================================================================
  // 1. HOTEL ROOM SCENE (KHÁCH SẠN THỢ MỎ - 1280x720)
  // =========================================================================
  public static renderHotel(
    rc: RenderContext,
    player: { x: number; y: number; dir: number; isWalking: boolean; walkCycle: number },
    vfx: VFXParticle[]
  ): void {
    const { ctx, elapsed } = rc;

    // 1. Cozy Timber Wall & Floor
    const wallGrad = ctx.createLinearGradient(0, 0, 0, 420);
    wallGrad.addColorStop(0, '#2d1808');
    wallGrad.addColorStop(1, '#4a2810');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, 1280, 420);

    // Wall timber panels
    ctx.strokeStyle = '#1e1005';
    ctx.lineWidth = 3;
    for (let x = 0; x < 1280; x += 110) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 420);
      ctx.stroke();
    }

    // Wooden Plank Floor (420 -> 720)
    const floorGrad = ctx.createLinearGradient(0, 420, 0, 720);
    floorGrad.addColorStop(0, '#663914');
    floorGrad.addColorStop(1, '#3b1f08');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 420, 1280, 300);

    // Floor planks with perspective
    ctx.strokeStyle = '#271405';
    ctx.lineWidth = 2;
    for (let y = 420; y < 720; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1280, y);
      ctx.stroke();
    }

    // Cozy Woven Persian Rug
    const rugGrad = ctx.createLinearGradient(380, 480, 900, 680);
    rugGrad.addColorStop(0, '#991b1b');
    rugGrad.addColorStop(0.5, '#b45309');
    rugGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = rugGrad;
    ctx.beginPath();
    ctx.roundRect(380, 490, 520, 180, 24);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 2. Stone Fireplace with roaring animated fire on the Left
    ctx.fillStyle = '#44403c';
    ctx.fillRect(80, 180, 240, 240);
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 4;
    ctx.strokeRect(80, 180, 240, 240);

    // Hearth opening
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.roundRect(110, 260, 180, 160, [30, 30, 0, 0]);
    ctx.fill();

    // Fire glow effect
    const fireFlicker = Math.sin(elapsed * 18) * 15;
    const fireRad = ctx.createRadialGradient(200, 370, 10, 200, 370, 160 + fireFlicker);
    fireRad.addColorStop(0, 'rgba(255, 140, 0, 0.85)');
    fireRad.addColorStop(0.4, 'rgba(255, 69, 0, 0.4)');
    fireRad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = fireRad;
    ctx.fillRect(40, 200, 320, 300);

    // Dynamic flame tongues
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(150, 410);
    ctx.quadraticCurveTo(180, 330 + Math.sin(elapsed * 24) * 20, 200, 300 + Math.cos(elapsed * 20) * 25);
    ctx.quadraticCurveTo(220, 330, 250, 410);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(170, 410);
    ctx.quadraticCurveTo(195, 350 + Math.cos(elapsed * 22) * 15, 200, 320);
    ctx.quadraticCurveTo(215, 350, 230, 410);
    ctx.closePath();
    ctx.fill();

    // Fireplace Mantle & Miner Clock
    ctx.fillStyle = '#78350f';
    ctx.fillRect(60, 170, 280, 20);

    // Clock
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(200, 145, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(200, 145, 16, 0, Math.PI * 2);
    ctx.fill();

    // 3. Cozy Quilted Miner Bed on the Back Wall
    ctx.fillStyle = '#5c2b09';
    ctx.fillRect(440, 250, 280, 170); // Bed frame
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(450, 280, 260, 130);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(460, 290, 240, 110);
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.roundRect(470, 260, 140, 45, 12);
    ctx.fill();

    // 4. Hotel Window showing Mountain Sunset
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(780, 110, 160, 180);
    ctx.fillStyle = '#291404';
    ctx.fillRect(855, 110, 10, 180);
    ctx.fillRect(780, 195, 160, 10);

    // Warm sunlight beam streaming into the room
    const beam = ctx.createLinearGradient(850, 200, 600, 600);
    beam.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
    beam.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(780, 290);
    ctx.lineTo(940, 290);
    ctx.lineTo(680, 620);
    ctx.lineTo(460, 620);
    ctx.closePath();
    ctx.fill();

    // 5. Heavy Hotel Exit Door on the Right
    const doorX = 1040;
    const doorY = 170;
    ctx.fillStyle = '#3f2109';
    ctx.fillRect(doorX, doorY, 170, 290);
    ctx.strokeStyle = '#1e0f03';
    ctx.lineWidth = 6;
    ctx.strokeRect(doorX, doorY, 170, 290);

    ctx.fillStyle = '#522b0c';
    ctx.fillRect(doorX + 20, doorY + 25, 130, 105);
    ctx.fillRect(doorX + 20, doorY + 155, 130, 115);

    // Glowing brass doorknob
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(doorX + 30, doorY + 150, 10, 0, Math.PI * 2);
    ctx.fill();

    // Wooden sign over door: "LỐI RA THỊ TRẤN ➔"
    ctx.fillStyle = '#78350f';
    ctx.fillRect(doorX - 25, doorY - 45, 220, 36);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(doorX - 25, doorY - 45, 220, 36);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 15px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LỐI RA THỊ TRẤN ➔', doorX + 85, doorY - 21);

    // 6. Draw VFX Particles
    this.drawVFX(ctx, vfx);

    // 7. Draw 720p HD Miner Character
    this.drawHDMiner(ctx, player.x, player.y, player.dir, player.isWalking, player.walkCycle, elapsed);
  }

  // =========================================================================
  // 2. TOWN SCENE (THỊ TRẤN THỢ MỎ MIỀN TÂY - 1280x720)
  // =========================================================================
  public static renderTown(
    rc: RenderContext,
    player: { x: number; y: number; dir: number; isWalking: boolean; walkCycle: number },
    vfx: VFXParticle[]
  ): void {
    const { ctx, elapsed } = rc;

    // 1. Sky with warm western sunset
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 360);
    skyGrad.addColorStop(0, '#f97316'); // Orange sunset
    skyGrad.addColorStop(0.5, '#fbbf24'); // Golden yellow
    skyGrad.addColorStop(1, '#fed7aa'); // Warm horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1280, 360);

    // Distant Purple Rocky Mountains
    ctx.fillStyle = '#6b21a8';
    ctx.beginPath();
    ctx.moveTo(0, 320);
    ctx.lineTo(160, 210);
    ctx.lineTo(340, 290);
    ctx.lineTo(520, 170);
    ctx.lineTo(760, 310);
    ctx.lineTo(980, 190);
    ctx.lineTo(1160, 270);
    ctx.lineTo(1280, 220);
    ctx.lineTo(1280, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    // 2. Town Dirt Street Ground (360 -> 720)
    const streetGrad = ctx.createLinearGradient(0, 360, 0, 720);
    streetGrad.addColorStop(0, '#d97706');
    streetGrad.addColorStop(1, '#92400e');
    ctx.fillStyle = streetGrad;
    ctx.fillRect(0, 360, 1280, 360);

    // Wooden boardwalk sidewalks
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 370, 280, 45);
    ctx.fillRect(1000, 370, 280, 45);

    // 3. Left Building: GENERAL STORE (CỬA HÀNG TRANG BỊ)
    ctx.fillStyle = '#065f46'; // Forest green wooden store
    ctx.fillRect(40, 140, 320, 260);
    ctx.strokeStyle = '#022c22';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 140, 320, 260);

    // Store striped awning
    for (let a = 40; a < 360; a += 40) {
      ctx.fillStyle = ((a / 40) % 2 === 0) ? '#dc2626' : '#fef08a';
      ctx.beginPath();
      ctx.moveTo(a, 240);
      ctx.lineTo(a + 40, 240);
      ctx.lineTo(a + 30, 275);
      ctx.lineTo(a - 10, 275);
      ctx.closePath();
      ctx.fill();
    }

    // Store Sign "CỬA HÀNG VẬT PHẨM"
    ctx.fillStyle = '#b45309';
    ctx.fillRect(50, 95, 300, 45);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 95, 300, 45);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 18px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏪 CỬA HÀNG TRANG BỊ', 200, 124);

    // Store Door
    ctx.fillStyle = '#361e06';
    ctx.fillRect(145, 275, 110, 125);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('[VÀO TIỆM]', 200, 335);

    // 4. Right Building: MINER'S HOTEL (KHÁCH SẠN THỢ MỎ)
    ctx.fillStyle = '#991b1b'; // Red wood building
    ctx.fillRect(920, 140, 320, 260);
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 4;
    ctx.strokeRect(920, 140, 320, 260);

    // Hotel Signboard
    ctx.fillStyle = '#78350f';
    ctx.fillRect(930, 95, 300, 45);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.strokeRect(930, 95, 300, 45);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 18px "Chakra Petch", sans-serif';
    ctx.fillText('🏨 KHÁCH SẠN THỢ MỎ', 1080, 124);

    // Hotel Door
    ctx.fillStyle = '#2b1202';
    ctx.fillRect(1025, 275, 110, 125);

    // 5. Center-North: ROAD LEADING UP TO THE GOLD MINE
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(560, 360);
    ctx.lineTo(720, 360);
    ctx.lineTo(820, 720);
    ctx.lineTo(460, 720);
    ctx.closePath();
    ctx.fill();

    // Archway & Big Sign pointing to the Mine
    ctx.fillStyle = '#451a03';
    ctx.fillRect(540, 210, 20, 150);
    ctx.fillRect(720, 210, 20, 150);

    ctx.fillStyle = '#b45309';
    ctx.fillRect(510, 180, 260, 42);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.strokeRect(510, 180, 260, 42);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 16px "Chakra Petch", sans-serif';
    ctx.fillText('⛰️ ĐƯỜNG RA MỎ VÀNG ➔', 640, 207);

    // Street Lanterns casting warm ambient light
    [-1, 1].forEach((side) => {
      const lx = side < 0 ? 385 : 895;
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(lx, 300, 10, 120);
      const lanternGlow = ctx.createRadialGradient(lx + 5, 300, 5, lx + 5, 300, 60);
      lanternGlow.addColorStop(0, 'rgba(254, 240, 138, 0.8)');
      lanternGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = lanternGlow;
      ctx.beginPath();
      ctx.arc(lx + 5, 300, 60, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Draw VFX Particles
    this.drawVFX(ctx, vfx);

    // 7. Draw 720p HD Miner Character
    this.drawHDMiner(ctx, player.x, player.y, player.dir, player.isWalking, player.walkCycle, elapsed);
  }

  // =========================================================================
  // 3. MINE EXTERIOR SCENE (LỐI VÀO MỎ NÚI - 1280x720)
  // =========================================================================
  public static renderMineExterior(
    rc: RenderContext,
    player: { x: number; y: number; dir: number; isWalking: boolean; walkCycle: number },
    vfx: VFXParticle[]
  ): void {
    const { ctx, elapsed } = rc;

    // 1. Rugged Canyon Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 320);
    skyGrad.addColorStop(0, '#1e1b4b');
    skyGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1280, 320);

    // Massive Mountain Cliffs
    ctx.fillStyle = '#44403c';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(460, 0);
    ctx.lineTo(400, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(1280, 0);
    ctx.lineTo(820, 0);
    ctx.lineTo(880, 360);
    ctx.lineTo(1280, 360);
    ctx.closePath();
    ctx.fill();

    // Canyon Rocky Floor (360 -> 720)
    ctx.fillStyle = '#292524';
    ctx.fillRect(0, 360, 1280, 360);

    // 2. Heavy Timber Mine Entrance Portal (Center)
    ctx.fillStyle = '#09090b'; // Pitch black cave tunnel
    ctx.beginPath();
    ctx.roundRect(450, 160, 380, 240, [60, 60, 0, 0]);
    ctx.fill();

    // Heavy Wooden Archway Frame
    ctx.fillStyle = '#3f1f0a';
    ctx.fillRect(430, 150, 45, 250);
    ctx.fillRect(805, 150, 45, 250);
    ctx.fillRect(410, 120, 460, 50);

    // Mine Banner Sign "HẦM MỎ VÀNG — MÀN KHAI THÁC"
    ctx.fillStyle = '#78350f';
    ctx.fillRect(440, 65, 400, 50);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(440, 65, 400, 50);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 20px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⛏️ HẦM MỎ VÀNG CHÍNH', 640, 98);

    // Glowing Lanterns flanking the cave mouth
    [410, 850].forEach((lx) => {
      const glow = ctx.createRadialGradient(lx, 260, 8, lx, 260, 110);
      glow.addColorStop(0, 'rgba(245, 158, 11, 0.9)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lx, 260, 110, 0, Math.PI * 2);
      ctx.fill();
    });

    // Steel Mining Rails leading into the dark tunnel
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(560, 390);
    ctx.lineTo(440, 720);
    ctx.moveTo(720, 390);
    ctx.lineTo(840, 720);
    ctx.stroke();

    // Wooden railway cross-ties
    ctx.fillStyle = '#451a03';
    for (let ry = 420; ry < 720; ry += 48) {
      const spread = (ry - 390) * 0.4;
      ctx.fillRect(640 - spread - 80, ry, spread * 2 + 160, 14);
    }

    // Ore cart parked on rails filled with sparkling gold
    ctx.fillStyle = '#292524';
    ctx.fillRect(260, 460, 140, 90);
    // Gold nuggets spilling from cart
    ctx.fillStyle = '#fbbf24';
    for (let g = 0; g < 6; g++) {
      ctx.beginPath();
      ctx.arc(280 + g * 18, 455, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Draw VFX
    this.drawVFX(ctx, vfx);

    // 4. Draw 720p HD Miner Character
    this.drawHDMiner(ctx, player.x, player.y, player.dir, player.isWalking, player.walkCycle, elapsed);
  }

  // =========================================================================
  // 4. UNDERGROUND MINING SCENE (LÒNG MỎ VÀNG - VẬN HÀNH MÁY ĐÀO - 1280x720)
  // =========================================================================
  public static renderMining(
    rc: RenderContext,
    hook: MiningHookState,
    items: UndergroundItem[],
    vfx: VFXParticle[],
    level: number
  ): void {
    const { ctx, elapsed } = rc;

    // 1. Cavern Underground Wall & Strata
    const caveGrad = ctx.createLinearGradient(0, 0, 0, 720);
    caveGrad.addColorStop(0, '#1c1108'); // Dark earthy roof
    caveGrad.addColorStop(0.35, '#2e180d'); // Amber subterranean bedrock
    caveGrad.addColorStop(0.75, '#1e1008'); // Deep strata
    caveGrad.addColorStop(1, '#0f0703'); // Abyssal base
    ctx.fillStyle = caveGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // Shimmering veins of raw gold dust in cavern wall
    ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      const vy = 190 + i * 75;
      ctx.moveTo(0, vy);
      ctx.bezierCurveTo(400, vy - 35, 800, vy + 40, 1280, vy - 15);
      ctx.lineTo(1280, vy + 25);
      ctx.bezierCurveTo(800, vy + 65, 400, vy - 10, 0, vy + 30);
      ctx.closePath();
      ctx.fill();
    }

    // Rocky Stalactites along the ceiling
    ctx.fillStyle = '#291407';
    const stalactiteX = [80, 210, 360, 520, 760, 920, 1070, 1200];
    stalactiteX.forEach((sx, idx) => {
      const h = 45 + ((idx * 17) % 35);
      ctx.beginPath();
      ctx.moveTo(sx - 25, 0);
      ctx.lineTo(sx, h);
      ctx.lineTo(sx + 25, 0);
      ctx.closePath();
      ctx.fill();
    });

    // 2. Heavy Timber Support Beams at the Ceiling (0 -> 135)
    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, 0, 1280, 32); // Ceiling header beam
    ctx.fillRect(40, 0, 36, 140); // Left pillar
    ctx.fillRect(1204, 0, 36, 140); // Right pillar

    // Steel Mining Rails Platform (y: 110 -> 135)
    ctx.fillStyle = '#64748b';
    ctx.fillRect(360, 118, 560, 12);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(360, 126, 560, 6);

    // Sleepers
    ctx.fillStyle = '#522405';
    for (let rx = 380; rx < 920; rx += 50) {
      ctx.fillRect(rx, 128, 24, 10);
    }

    // 3. Draw Underground Items (Gold, Diamonds, Rocks, Mystery Bags, TNT)
    this.drawUndergroundItems(ctx, items, elapsed);

    // 4. Draw Hook & Winch Cable
    this.drawHookAndCable(ctx, hook, elapsed);

    // 5. Draw 720p HD Mining Machine & Cart with Miner (Pivot at 640, 115)
    this.drawMiningMachineAndMiner(ctx, hook, elapsed);

    // 6. Draw VFX Particles (Sparks, explosions, rock chunks)
    this.drawVFX(ctx, vfx);
  }

  // =========================================================================
  // 5. MOUNTAIN BLASTING SCENE (PHÁ NÚI MỞ MỎ MỚI - 1280x720)
  // =========================================================================
  public static renderBlasting(
    rc: RenderContext,
    countdown: number,
    vfx: VFXParticle[],
    level: number
  ): void {
    const { ctx, elapsed } = rc;

    // 1. Rocky Cavern Wall
    const wallGrad = ctx.createLinearGradient(0, 0, 0, 720);
    wallGrad.addColorStop(0, '#1c1917');
    wallGrad.addColorStop(0.5, '#44403c');
    wallGrad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // Massive Mountain Stone Barrier in Center
    const isDetonating = countdown <= 0;
    if (!isDetonating) {
      // Intact mountain cliff wall
      ctx.fillStyle = '#57534e';
      ctx.beginPath();
      ctx.roundRect(320, 100, 640, 480, 20);
      ctx.fill();
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Rock fissures
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(420, 150);
      ctx.lineTo(540, 280);
      ctx.lineTo(500, 390);
      ctx.moveTo(760, 180);
      ctx.lineTo(700, 320);
      ctx.lineTo(780, 450);
      ctx.stroke();

      // 4 Dynamite Bundles strapped to the rock face
      const tntPositions = [
        { x: 440, y: 220 },
        { x: 740, y: 230 },
        { x: 480, y: 410 },
        { x: 720, y: 400 },
      ];

      // Detonation electric wire
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(260, 580); // from plunger box
      tntPositions.forEach((tp) => {
        ctx.lineTo(tp.x, tp.y);
      });
      ctx.stroke();

      tntPositions.forEach((tp) => {
        // Dynamite bundle
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(tp.x - 22, tp.y - 18, 44, 36);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(tp.x - 20, tp.y - 10, 40, 4);
        ctx.fillRect(tp.x - 20, tp.y + 6, 40, 4);

        // Blinking fuse LED
        const blink = Math.sin(elapsed * 16) > 0;
        ctx.fillStyle = blink ? '#fef08a' : '#ef4444';
        ctx.beginPath();
        ctx.arc(tp.x, tp.y - 24, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Vintage Detonation Plunger Box on Left (x: 230, y: 520)
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(210, 520, 75, 95);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(210, 520, 75, 95);

      // Brass plunger handle
      ctx.fillStyle = '#fde047';
      ctx.fillRect(242, 475, 12, 45);
      ctx.fillRect(222, 465, 52, 12);

      // Text on box
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TNT BOX', 247, 560);
    } else {
      // Mountain wall broken open! Gleaming golden treasure light pouring from the new mine tunnel!
      const goldenTunnel = ctx.createRadialGradient(640, 340, 40, 640, 340, 420);
      goldenTunnel.addColorStop(0, '#fef08a');
      goldenTunnel.addColorStop(0.35, '#f59e0b');
      goldenTunnel.addColorStop(0.7, '#b45309');
      goldenTunnel.addColorStop(1, '#1c1917');
      ctx.fillStyle = goldenTunnel;
      ctx.beginPath();
      ctx.ellipse(640, 340, 380, 260, 0, 0, Math.PI * 2);
      ctx.fill();

      // Crumbling rocks on ground
      ctx.fillStyle = '#44403c';
      for (let r = 0; r < 14; r++) {
        ctx.beginPath();
        ctx.arc(380 + r * 42, 580 + (r % 3) * 12, 28, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sparkles pouring from the new mine
      for (let s = 0; s < 10; s++) {
        const sx = 440 + Math.sin(elapsed * 4 + s * 1.5) * 180;
        const sy = 240 + Math.cos(elapsed * 3 + s * 2.1) * 120;
        this.drawSparkle(ctx, sx, sy, 16, '#fef08a');
      }
    }

    // Ground floor
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 610, 1280, 110);

    // Miner standing on the left
    this.drawHDMiner(ctx, 160, 580, 1, false, 0, elapsed);

    // 2. Draw VFX
    this.drawVFX(ctx, vfx);
  }

  // =========================================================================
  // 6. DRAW UNDERGROUND ITEMS (GOLD, DIAMONDS, ROCKS, TNT, BAGS)
  // =========================================================================
  private static drawUndergroundItems(ctx: CanvasRenderingContext2D, items: UndergroundItem[], elapsed: number): void {
    items.forEach((item) => {
      if (item.isAttached) return; // Drawn on hook head instead

      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation);

      if (item.type.startsWith('GOLD')) {
        this.drawGoldNugget(ctx, item.type, item.radius, elapsed);
      } else if (item.type === 'DIAMOND') {
        this.drawDiamond(ctx, item.radius, elapsed);
      } else if (item.type.startsWith('ROCK')) {
        this.drawRock(ctx, item.type, item.radius);
      } else if (item.type === 'MYSTERY_BAG') {
        this.drawMysteryBag(ctx, item.radius, elapsed);
      } else if (item.type === 'TNT') {
        this.drawTNT(ctx, item.radius, elapsed);
      }

      ctx.restore();
    });
  }

  // Draw Faceted High-Definition Gold Nugget
  public static drawGoldNugget(ctx: CanvasRenderingContext2D, type: ItemType, r: number, elapsed: number): void {
    // Ambient Gold Glow
    const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.6);
    glow.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    glow.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Nugget Body Gradient
    const goldGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    goldGrad.addColorStop(0, '#fef08a'); // Highlight
    goldGrad.addColorStop(0.3, '#fbbf24'); // Pure 24K Gold
    goldGrad.addColorStop(0.75, '#d97706'); // Deep amber
    goldGrad.addColorStop(1, '#92400e'); // Nugget shadow rim

    ctx.fillStyle = goldGrad;
    ctx.beginPath();
    // Multi-faceted irregular polygon
    const points = type === 'GOLD_LARGE' ? 9 : type === 'GOLD_MEDIUM' ? 7 : 6;
    for (let i = 0; i < points; i++) {
      const a = (i / points) * Math.PI * 2;
      const variation = 0.82 + Math.sin(i * 3.7) * 0.22;
      const px = Math.cos(a) * r * variation;
      const py = Math.sin(a) * r * variation;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Outline
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = Math.max(2, r * 0.08);
    ctx.stroke();

    // Internal facet lines
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.2);
    ctx.lineTo(r * 0.2, -r * 0.4);
    ctx.lineTo(r * 0.4, r * 0.1);
    ctx.stroke();

    // Sparkling 4-point star glint
    const pulse = Math.sin(elapsed * 6 + r) * 0.3 + 0.7;
    this.drawSparkle(ctx, -r * 0.3, -r * 0.35, r * 0.45 * pulse, '#ffffff');
  }

  // Draw Brilliant Diamond
  public static drawDiamond(ctx: CanvasRenderingContext2D, r: number, elapsed: number): void {
    // Cyan crystalline glow
    const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, r * 1.8);
    glow.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
    glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Diamond Gem Shape
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r, -r * 0.35);
    ctx.lineTo(0, r);
    ctx.lineTo(-r, -r * 0.35);
    ctx.closePath();
    ctx.fill();

    // Bright upper facets
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.6, -r * 0.35);
    ctx.lineTo(0, 0);
    ctx.lineTo(-r * 0.6, -r * 0.35);
    ctx.closePath();
    ctx.fill();

    // Center jewel facet
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.85);
    ctx.lineTo(r * 0.3, -r * 0.35);
    ctx.lineTo(0, -r * 0.1);
    ctx.lineTo(-r * 0.3, -r * 0.35);
    ctx.closePath();
    ctx.fill();

    // Diamond Outline
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sparkle
    this.drawSparkle(ctx, 0, -r * 0.4, r * 0.6, '#ffffff');
  }

  // Draw Granite Rock Boulder
  public static drawRock(ctx: CanvasRenderingContext2D, type: ItemType, r: number): void {
    const rockGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    rockGrad.addColorStop(0, '#94a3b8');
    rockGrad.addColorStop(0.5, '#64748b');
    rockGrad.addColorStop(1, '#334155');

    ctx.fillStyle = rockGrad;
    ctx.beginPath();
    const pts = type === 'ROCK_LARGE' ? 8 : 6;
    for (let i = 0; i < pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const variation = 0.85 + Math.sin(i * 2.8) * 0.18;
      const px = Math.cos(a) * r * variation;
      const py = Math.sin(a) * r * variation;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Cracks
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, -r * 0.3);
    ctx.lineTo(r * 0.1, 0);
    ctx.lineTo(r * 0.35, r * 0.25);
    ctx.stroke();
  }

  // Draw Mystery Burlap Bag
  public static drawMysteryBag(ctx: CanvasRenderingContext2D, r: number, elapsed: number): void {
    // Burlap pouch body
    const bagGrad = ctx.createLinearGradient(0, -r, 0, r);
    bagGrad.addColorStop(0, '#d97706');
    bagGrad.addColorStop(0.7, '#92400e');
    bagGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = bagGrad;

    ctx.beginPath();
    ctx.arc(0, r * 0.2, r * 0.85, 0, Math.PI);
    ctx.quadraticCurveTo(r * 0.85, -r * 0.4, 0, -r * 0.5);
    ctx.quadraticCurveTo(-r * 0.85, -r * 0.4, -r * 0.85, r * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Tied neck & ruffled top
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-r * 0.45, -r * 0.85, r * 0.9, r * 0.38);

    // Hemp rope tie
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-r * 0.5, -r * 0.55, r, 5);

    // Golden Question Mark '?'
    ctx.fillStyle = '#fde047';
    ctx.font = `bold ${Math.round(r * 1.05)}px "Chakra Petch", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 0, r * 0.25);
  }

  // Draw TNT Explosive Barrel
  public static drawTNT(ctx: CanvasRenderingContext2D, r: number, elapsed: number): void {
    // Red barrel cylinder
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-r * 0.75, -r * 0.9, r * 1.5, r * 1.8);

    // Steel barrel rings
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-r * 0.8, -r * 0.7, r * 1.6, 5);
    ctx.fillRect(-r * 0.8, r * 0.5, r * 1.6, 5);

    // Outline
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 3;
    ctx.strokeRect(-r * 0.75, -r * 0.9, r * 1.5, r * 1.8);

    // White bold text "TNT"
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(r * 0.72)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TNT', 0, 0);

    // Twisting burning fuse
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.quadraticCurveTo(8, -r * 1.25, -4, -r * 1.45);
    ctx.stroke();

    // Animated spark on the fuse tip
    const sparkRad = 6 + Math.sin(elapsed * 32) * 3;
    const sparkGrad = ctx.createRadialGradient(-4, -r * 1.45, 1, -4, -r * 1.45, sparkRad);
    sparkGrad.addColorStop(0, '#ffffff');
    sparkGrad.addColorStop(0.4, '#fde047');
    sparkGrad.addColorStop(0.8, '#ef4444');
    sparkGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sparkGrad;
    ctx.beginPath();
    ctx.arc(-4, -r * 1.45, sparkRad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw 4-point sparkle star
  private static drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.quadraticCurveTo(x, y, x + size, y);
    ctx.quadraticCurveTo(x, y, x, y + size);
    ctx.quadraticCurveTo(x, y, x - size, y);
    ctx.quadraticCurveTo(x, y, x, y - size);
    ctx.closePath();
    ctx.fill();
  }

  // =========================================================================
  // 7. DRAW HOOK & WINCH CABLE
  // =========================================================================
  private static drawHookAndCable(ctx: CanvasRenderingContext2D, hook: MiningHookState, elapsed: number): void {
    const pivotX = 640;
    const pivotY = 125;

    // Calculate hook claw tip coordinates
    const hookX = pivotX + Math.sin(hook.angle) * hook.length;
    const hookY = pivotY + Math.cos(hook.angle) * hook.length;

    // 1. Draw Braided Steel Cable
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(hookX, hookY);
    ctx.stroke();

    // Steel cable highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(hookX, hookY);
    ctx.stroke();

    // 2. Draw Flying Dynamite (if thrown to blow up heavy rock!)
    if (hook.dynamiteInFlight) {
      const dynX = pivotX + (hookX - pivotX) * (hook.dynamiteDist / hook.length);
      const dynY = pivotY + (hookY - pivotY) * (hook.dynamiteDist / hook.length);

      ctx.save();
      ctx.translate(dynX, dynY);
      ctx.rotate(hook.angle + Math.PI / 2);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-14, -6, 28, 12);
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(16, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Draw Heavy Articulated Steel Mechanical Claws
    ctx.save();
    ctx.translate(hookX, hookY);
    ctx.rotate(-hook.angle); // Align with cable direction

    // Hook Pivot Hub
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Brass center rivet
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Claw aperture: open when extending/idle, tightly shut when holding item
    const isOpen = hook.attachedItem === null && hook.state !== 'RETURNING';
    const clawSpread = isOpen ? 0.52 : 0.16;

    // Left Claw
    ctx.save();
    ctx.rotate(-clawSpread);
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.quadraticCurveTo(-26, 20, -18, 42);
    ctx.quadraticCurveTo(-10, 36, -3, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner chrome sharp tip
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-20, 32);
    ctx.lineTo(-18, 42);
    ctx.stroke();
    ctx.restore();

    // Right Claw
    ctx.save();
    ctx.rotate(clawSpread);
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.quadraticCurveTo(26, 20, 18, 42);
    ctx.quadraticCurveTo(10, 36, 3, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner chrome sharp tip
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, 32);
    ctx.lineTo(18, 42);
    ctx.stroke();
    ctx.restore();

    // 4. Draw Attached Item if Hook is reeling back in!
    if (hook.attachedItem) {
      ctx.save();
      ctx.translate(0, 32);
      ctx.rotate(hook.attachedItem.rotation);

      if (hook.attachedItem.type.startsWith('GOLD')) {
        this.drawGoldNugget(ctx, hook.attachedItem.type, hook.attachedItem.radius, elapsed);
      } else if (hook.attachedItem.type === 'DIAMOND') {
        this.drawDiamond(ctx, hook.attachedItem.radius, elapsed);
      } else if (hook.attachedItem.type.startsWith('ROCK')) {
        this.drawRock(ctx, hook.attachedItem.type, hook.attachedItem.radius);
      } else if (hook.attachedItem.type === 'MYSTERY_BAG') {
        this.drawMysteryBag(ctx, hook.attachedItem.radius, elapsed);
      } else if (hook.attachedItem.type === 'TNT') {
        this.drawTNT(ctx, hook.attachedItem.radius, elapsed);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // =========================================================================
  // 8. DRAW MINING MACHINE & MINER CART AT TOP PLATFORM
  // =========================================================================
  private static drawMiningMachineAndMiner(
    ctx: CanvasRenderingContext2D,
    hook: MiningHookState,
    elapsed: number
  ): void {
    const cx = 640;
    const cy = 115;

    // 1. Heavy Ore Cart Body
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(cx - 75, cy - 42, 150, 48, 8);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Rivets on cart
    ctx.fillStyle = '#94a3b8';
    [-60, -30, 0, 30, 60].forEach((rx) => {
      ctx.beginPath();
      ctx.arc(cx + rx, cy - 34, 3, 0, Math.PI * 2);
      ctx.arc(cx + rx, cy - 8, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4 Cast Iron Spoke Wheels
    [-52, 52].forEach((wx) => {
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(cx + wx, cy + 6, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Brass hubcap
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx + wx, cy + 6, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Winch Crane Rig: Rotating Cogwheel Gear & Spool
    const isReeling = hook.state === 'RETURNING';
    const gearRot = isReeling ? elapsed * 12 : hook.angle;

    // Cogwheel Gear at (cx + 38, cy - 25)
    ctx.save();
    ctx.translate(cx + 42, cy - 25);
    ctx.rotate(gearRot);
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Gear teeth
    ctx.fillStyle = '#b45309';
    for (let t = 0; t < 12; t++) {
      const ta = (t / 12) * Math.PI * 2;
      ctx.fillRect(Math.cos(ta) * 16 - 3, Math.sin(ta) * 16 - 3, 6, 6);
    }
    // Crank handle
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(10, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Pulley wheel at cable origin (640, 125)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(cx, cy + 10, 8, 0, Math.PI * 2);
    ctx.fill();

    // 3. Draw Seated HD Old Miner Operating The Machine
    ctx.save();
    ctx.translate(cx - 20, cy - 30);

    // Is reeling heavy item?
    const isHeavy = hook.attachedItem && hook.attachedItem.mass > 3;

    // Torso & Overalls
    ctx.fillStyle = '#dc2626'; // Red flannel shirt
    ctx.beginPath();
    ctx.roundRect(-22, -45, 44, 45, 10);
    ctx.fill();

    ctx.fillStyle = '#1d4ed8'; // Denim overalls
    ctx.beginPath();
    ctx.roundRect(-18, -32, 36, 34, [6, 6, 8, 8]);
    ctx.fill();

    // Head
    ctx.fillStyle = '#fbd5b5';
    ctx.beginPath();
    ctx.arc(0, -56, 18, 0, Math.PI * 2);
    ctx.fill();

    // Rosy cheeks
    ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.beginPath();
    ctx.arc(-8, -52, 5, 0, Math.PI * 2);
    ctx.arc(8, -52, 5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4, -60, 4, 0, Math.PI * 2);
    ctx.arc(6, -60, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-3, -60, 2.5, 0, Math.PI * 2);
    ctx.arc(7, -60, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Big red bulbous nose
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(1, -54, 6, 0, Math.PI * 2);
    ctx.fill();

    // White bushy beard & mustache
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-7, -46, 11, 0, Math.PI * 2);
    ctx.arc(7, -46, 11, 0, Math.PI * 2);
    ctx.arc(0, -40, 14, 0, Math.PI * 2);
    ctx.fill();

    // Yellow hard helmet
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, -68, 20, Math.PI, 0);
    ctx.lineTo(22, -65);
    ctx.lineTo(-22, -65);
    ctx.closePath();
    ctx.fill();

    // Headlamp
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(16, -68, 6, 0, Math.PI * 2);
    ctx.fill();

    // Headlamp beam
    const lamp = ctx.createLinearGradient(20, -68, 240, 180);
    lamp.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    lamp.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = lamp;
    ctx.beginPath();
    ctx.moveTo(20, -74);
    ctx.lineTo(260, 150);
    ctx.lineTo(220, 220);
    ctx.lineTo(16, -62);
    ctx.closePath();
    ctx.fill();

    // Arms grasping the lever
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(8, -40, 26, 12);
    ctx.fillStyle = '#d97706'; // Glove
    ctx.beginPath();
    ctx.arc(36, -34, 7, 0, Math.PI * 2);
    ctx.fill();

    // Sweating if reeling heavy rock!
    if (isHeavy) {
      ctx.fillStyle = '#38bdf8';
      for (let s = 0; s < 3; s++) {
        const sy = -65 + Math.sin(elapsed * 18 + s) * 12;
        ctx.beginPath();
        ctx.arc(-14 - s * 6, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // =========================================================================
  // 9. DRAW 720P HIGH-DEFINITION OLD MINER CHARACTER ("ÔNG GIÀ ĐÀO VÀNG HD")
  // =========================================================================
  public static drawHDMiner(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    dir: number, // -1 facing left, 1 facing right
    isWalking: boolean,
    walkCycle: number,
    elapsed: number
  ): void {
    ctx.save();
    ctx.translate(x, y);

    // Direction flip
    if (dir < 0) {
      ctx.scale(-1, 1);
    }

    // Walking body bobbing
    const bobY = isWalking ? Math.abs(Math.sin(walkCycle * 2)) * 6 : Math.sin(elapsed * 3) * 2;
    const legSwing = isWalking ? Math.sin(walkCycle) * 18 : 0;

    // Shadow on the ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 5, 38, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, -bobY);

    // 1. Boots & Legs
    // Back leg
    ctx.fillStyle = '#1e3a8a'; // Denim overall pants
    ctx.fillRect(-18, -42, 16, 32);
    ctx.fillStyle = '#451a03'; // Heavy leather boot
    ctx.fillRect(-22 - legSwing * 0.4, -16, 26, 18);

    // Front leg
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(4, -42, 16, 32);
    ctx.fillStyle = '#522405';
    ctx.fillRect(2 + legSwing * 0.4, -16, 28, 18);

    // 2. Plump Torso & Overalls
    // Red checkered flannel shirt
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(-28, -96, 56, 58, 16);
    ctx.fill();

    // Blue Denim Overalls Bib
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.roundRect(-24, -84, 48, 48, [8, 8, 14, 14]);
    ctx.fill();

    // Brass overall buckles
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(-14, -80, 5, 0, Math.PI * 2);
    ctx.arc(14, -80, 5, 0, Math.PI * 2);
    ctx.fill();

    // 3. Round Happy Face & Big Bushy White Beard
    // Head base
    ctx.fillStyle = '#fbd5b5';
    ctx.beginPath();
    ctx.arc(0, -112, 24, 0, Math.PI * 2);
    ctx.fill();

    // Rosy Cheeks
    ctx.fillStyle = 'rgba(239, 68, 68, 0.55)';
    ctx.beginPath();
    ctx.arc(-12, -108, 7, 0, Math.PI * 2);
    ctx.arc(12, -108, 7, 0, Math.PI * 2);
    ctx.fill();

    // Expressive Cartoon Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(6, -118, 6, 0, Math.PI * 2);
    ctx.arc(-6, -118, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(7, -118, 3.5, 0, Math.PI * 2);
    ctx.arc(-5, -118, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Cute Bulbous Red Miner Nose
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -109, 8, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy Layered White Beard & Mustache
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-10, -98, 14, 0, Math.PI * 2);
    ctx.arc(10, -98, 14, 0, Math.PI * 2);
    ctx.arc(0, -90, 18, 0, Math.PI * 2);
    ctx.arc(-16, -104, 10, 0, Math.PI * 2);
    ctx.arc(16, -104, 10, 0, Math.PI * 2);
    ctx.fill();

    // 4. Shiny Construction Gold Safety Helmet with Headlamp
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, -128, 26, Math.PI, 0); // Dome
    ctx.lineTo(28, -124);
    ctx.lineTo(-28, -124);
    ctx.closePath();
    ctx.fill();

    // Helmet brim
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-30, -126, 60, 6);

    // Brass Searchlight Headlamp
    ctx.fillStyle = '#b45309';
    ctx.fillRect(16, -136, 12, 14);

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(28, -129, 8, 0, Math.PI * 2);
    ctx.fill();

    // Volumetric glowing light beam casting forward from helmet!
    const lampBeam = ctx.createLinearGradient(30, -129, 220, -80);
    lampBeam.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    lampBeam.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = lampBeam;
    ctx.beginPath();
    ctx.moveTo(30, -135);
    ctx.lineTo(240, -50);
    ctx.lineTo(240, 30);
    ctx.lineTo(30, -123);
    ctx.closePath();
    ctx.fill();

    // 5. Arms & Work Gloves
    const armSwing = isWalking ? Math.cos(walkCycle) * 20 : Math.sin(elapsed * 2) * 5;
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-26, -92, 12, 28);
    ctx.fillRect(14, -92, 12, 28);

    // Leather work gloves
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(-20 + armSwing * 0.3, -62, 8, 0, Math.PI * 2);
    ctx.arc(20 - armSwing * 0.3, -62, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // =========================================================================
  // 10. DRAW VFX PARTICLES (EXPLOSIONS, SPARKS, SMOKE)
  // =========================================================================
  private static drawVFX(ctx: CanvasRenderingContext2D, particles: VFXParticle[]): void {
    particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

      if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'fire') {
        const fire = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        fire.addColorStop(0, '#ffffff');
        fire.addColorStop(0.3, '#fde047');
        fire.addColorStop(0.7, '#ea580c');
        fire.addColorStop(1, 'rgba(220, 38, 38, 0)');
        ctx.fillStyle = fire;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'rock') {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
      } else if (p.type === 'star') {
        this.drawSparkle(ctx, p.x, p.y, p.size, p.color);
      }

      ctx.restore();
    });
  }
}
