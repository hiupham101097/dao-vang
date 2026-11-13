/**
 * HD720Renderer - High-Definition (1280x720) 2.5D Stylized Illustrated Art Engine
 * Handcrafted procedural visual engine with rich texturing, layered depth, dynamic lighting,
 * ambient occlusion, realistic shading, atmospheric effects, and ZERO crude 8-pixel boxes.
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
  // SHARED ARTISTIC PROCEDURAL TEXTURE & SHADING HELPERS
  // =========================================================================

  /**
   * Vẽ tấm ván gỗ có thớ vân, viền bóng đổ 3D và đinh tán
   */
  public static drawWoodPlank(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    baseColor: string = '#78350f',
    darkColor: string = '#451a03',
    lightColor: string = '#92400e',
    horizontalGrains: boolean = true
  ): void {
    ctx.save();
    // Nền ván gỗ với gradient nhẹ
    const grad = horizontalGrains
      ? ctx.createLinearGradient(x, y, x, y + h)
      : ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, lightColor);
    grad.addColorStop(0.5, baseColor);
    grad.addColorStop(1, darkColor);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Vân gỗ tự nhiên (procedural grain lines)
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.45;
    if (horizontalGrains) {
      const step = Math.max(8, h / 4);
      for (let gy = y + step / 2; gy < y + h; gy += step) {
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.bezierCurveTo(
          x + w * 0.3,
          gy + Math.sin(gy * 0.4) * 3,
          x + w * 0.7,
          gy - Math.cos(gy * 0.4) * 3,
          x + w,
          gy
        );
        ctx.stroke();
      }
    } else {
      const step = Math.max(10, w / 4);
      for (let gx = x + step / 2; gx < x + w; gx += step) {
        ctx.beginPath();
        ctx.moveTo(gx, y);
        ctx.bezierCurveTo(
          gx + Math.sin(gx * 0.4) * 3,
          y + h * 0.3,
          gx - Math.cos(gx * 0.4) * 3,
          y + h * 0.7,
          gx,
          y + h
        );
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1.0;

    // Viền vát cạnh nổi khối (bevel highlight & shadow)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Vẽ quầng sáng đèn bão / lò sưởi / đèn lồng chân thực
   */
  public static drawAtmosphericLight(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    innerColor: string = 'rgba(254, 240, 138, 0.65)',
    outerColor: string = 'rgba(245, 158, 11, 0)'
  ): void {
    ctx.save();
    const light = ctx.createRadialGradient(x, y, 0, x, y, radius);
    light.addColorStop(0, innerColor);
    light.addColorStop(0.35, innerColor.replace(/[\d.]+\)$/, '0.35)'));
    light.addColorStop(0.7, innerColor.replace(/[\d.]+\)$/, '0.1)'));
    light.addColorStop(1, outerColor);
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Hiệu ứng mờ tối 4 góc màn hình (Vignette cinematic)
   */
  public static drawVignette(ctx: CanvasRenderingContext2D, intensity: number = 0.35): void {
    ctx.save();
    const vig = ctx.createRadialGradient(640, 360, 380, 640, 360, 780);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, 1280, 720);
    ctx.restore();
  }

  /**
   * Bụi vàng / đốm sáng lơ lửng trong không khí (Dust Motes / Atmospheric Particles)
   */
  public static drawDustMotes(ctx: CanvasRenderingContext2D, elapsed: number, count: number = 18): void {
    ctx.save();
    for (let i = 0; i < count; i++) {
      const px = (Math.sin(i * 123.45 + elapsed * 0.3) * 0.5 + 0.5) * 1280;
      const py = (Math.cos(i * 98.76 + elapsed * 0.25) * 0.5 + 0.5) * 720;
      const size = 1.2 + Math.sin(elapsed * 2 + i) * 0.8;
      const alpha = 0.25 + Math.sin(elapsed * 1.5 + i * 2) * 0.2;
      ctx.fillStyle = `rgba(254, 240, 138, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // =========================================================================
  // 1. HOTEL ROOM SCENE (KHÁCH SẠN THỢ MỎ ẤM CÚNG - 1280x720)
  // =========================================================================
  public static renderHotel(
    rc: RenderContext,
    player: { x: number; y: number; dir: number; isWalking: boolean; walkCycle: number },
    vfx: VFXParticle[]
  ): void {
    const { ctx, elapsed } = rc;

    // 1. Tường gỗ sang trọng với hoa văn dập nổi phong cách miền Tây
    const wallGrad = ctx.createLinearGradient(0, 0, 0, 430);
    wallGrad.addColorStop(0, '#1c0f05');
    wallGrad.addColorStop(0.4, '#381c0b');
    wallGrad.addColorStop(1, '#52290f');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, 1280, 430);

    // Các tấm ốp tường gỗ dọc với gờ nổi (Wall wainscoting)
    for (let x = 0; x < 1280; x += 96) {
      this.drawWoodPlank(ctx, x, 0, 92, 430, '#421f0b', '#261105', '#5a2d12', false);
      // Gờ nẹp chân tường (Baseboard)
      this.drawWoodPlank(ctx, x, 410, 96, 20, '#5a2b0d', '#291104', '#7c3f15', true);
      // Gờ chỉ nẹp lưng tường (Chair rail)
      this.drawWoodPlank(ctx, x, 250, 96, 14, '#5a2b0d', '#291104', '#7c3f15', true);
    }

    // Tranh sơn dầu phong cảnh mỏ vàng cổ điển trên tường (ở giữa tường)
    ctx.save();
    ctx.fillStyle = '#261105';
    ctx.fillRect(490, 70, 240, 140);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.strokeRect(490, 70, 240, 140);
    // Bức tranh bên trong: dãy núi vàng lúc hoàng hôn
    const artGrad = ctx.createLinearGradient(496, 76, 496, 204);
    artGrad.addColorStop(0, '#f97316');
    artGrad.addColorStop(0.6, '#fbbf24');
    artGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = artGrad;
    ctx.fillRect(496, 76, 228, 128);
    // Núi trong tranh
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(496, 204);
    ctx.lineTo(560, 120);
    ctx.lineTo(610, 160);
    ctx.lineTo(670, 105);
    ctx.lineTo(724, 204);
    ctx.closePath();
    ctx.fill();
    // Đèn soi tranh bằng đồng vàng
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(580, 58, 60, 8);
    ctx.restore();

    // 2. Sàn gỗ vát góc phối cảnh (Perspective Wood Plank Flooring)
    const floorGrad = ctx.createLinearGradient(0, 430, 0, 720);
    floorGrad.addColorStop(0, '#592e10');
    floorGrad.addColorStop(0.5, '#422008');
    floorGrad.addColorStop(1, '#271103');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 430, 1280, 290);

    // Kẻ các thớ ván sàn tạo chiều sâu không gian
    for (let y = 430; y < 720; y += 38) {
      const plankH = 36;
      this.drawWoodPlank(ctx, 0, y, 1280, plankH, '#4c240a', '#241003', '#663210', true);
    }

    // 3. Thảm thổ cẩm phương Tây dệt viền tua rua vàng (Cozy Ornate Rug)
    ctx.save();
    // Bóng đổ của thảm
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(355, 485, 570, 190, 24);
    ctx.fill();

    // Nền thảm nhung đỏ thẫm
    const rugGrad = ctx.createRadialGradient(640, 580, 40, 640, 580, 320);
    rugGrad.addColorStop(0, '#b91c1c');
    rugGrad.addColorStop(0.7, '#7f1d1d');
    rugGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = rugGrad;
    ctx.beginPath();
    ctx.roundRect(350, 480, 580, 190, 20);
    ctx.fill();

    // Viền hoa văn dệt vàng kim
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(365, 495, 550, 160, 16);
    ctx.stroke();

    // Họa tiết quả trám dệt thoi trong thảm
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.lineWidth = 2;
    for (let rx = 400; rx <= 880; rx += 60) {
      ctx.beginPath();
      ctx.moveTo(rx, 575 - 35);
      ctx.lineTo(rx + 30, 575);
      ctx.lineTo(rx, 575 + 35);
      ctx.lineTo(rx - 30, 575);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();

    // 4. Lò sưởi bằng đá hoa cương xếp lớp cổ kính bên Trái (Stone Fireplace)
    ctx.save();
    // Bệ đá chính
    ctx.fillStyle = '#292524';
    ctx.fillRect(70, 160, 260, 270);
    // Họa tiết các khối đá xếp lớp
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 3;
    for (let row = 160; row < 430; row += 30) {
      ctx.beginPath();
      ctx.moveTo(70, row);
      ctx.lineTo(330, row);
      ctx.stroke();
      const offset = (row % 60 === 0) ? 0 : 35;
      for (let col = 70 + offset; col < 330; col += 70) {
        ctx.beginPath();
        ctx.moveTo(col, row);
        ctx.lineTo(col, row + 30);
        ctx.stroke();
      }
    }

    // Mái vòm buồng đốt lò sưởi (Hearth chamber)
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.roundRect(105, 250, 190, 180, [45, 45, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Tầng củi đốt lò sưởi
    ctx.fillStyle = '#3f1f08';
    ctx.fillRect(125, 400, 150, 20);
    ctx.fillStyle = '#52290f';
    ctx.fillRect(140, 390, 120, 16);

    // Ngọn lửa bốc cháy chân thực có nhiều lớp màu sinh động
    const fireFlicker = Math.sin(elapsed * 18) * 12;
    const fireGlowRad = 180 + fireFlicker;
    this.drawAtmosphericLight(ctx, 200, 360, fireGlowRad, 'rgba(251, 146, 60, 0.75)', 'rgba(251, 146, 60, 0)');

    // Ngọn lửa vàng ngoài cùng
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(145, 410);
    ctx.quadraticCurveTo(175, 310 + Math.sin(elapsed * 24) * 20, 195, 270 + Math.cos(elapsed * 18) * 16);
    ctx.quadraticCurveTo(215, 320, 255, 410);
    ctx.closePath();
    ctx.fill();

    // Ngọn lửa cam rực giữa
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(160, 410);
    ctx.quadraticCurveTo(185, 330 + Math.cos(elapsed * 22) * 15, 200, 290);
    ctx.quadraticCurveTo(220, 330, 240, 410);
    ctx.closePath();
    ctx.fill();

    // Tàn lửa nhỏ bắn lên (Fire sparks)
    for (let s = 0; s < 5; s++) {
      const sx = 175 + Math.sin(elapsed * 10 + s * 2) * 35;
      const sy = 310 - ((elapsed * 120 + s * 45) % 110);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Giá để đồ trên lò sưởi bằng gỗ sồi bóng (Mantel shelf)
    this.drawWoodPlank(ctx, 50, 145, 300, 22, '#78350f', '#3b1702', '#9a4714', true);

    // Đồng hồ cổ quả lắc / kim giờ trên giá lò sưởi
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(200, 115, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(200, 115, 18, 0, Math.PI * 2);
    ctx.fill();
    // Kim đồng hồ quay chầm chậm
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(200, 115);
    ctx.lineTo(200 + Math.cos(elapsed * 0.1) * 12, 115 + Math.sin(elapsed * 0.1) * 12);
    ctx.moveTo(200, 115);
    ctx.lineTo(200 + Math.sin(elapsed * 1.2) * 15, 115 - Math.cos(elapsed * 1.2) * 15);
    ctx.stroke();
    ctx.restore();

    // 5. Cửa sổ nhìn ra cảnh hoàng hôn mỏ núi ấm áp (Bay Window with God Rays)
    ctx.save();
    // Khung vòm cửa sổ
    ctx.fillStyle = '#1e0e04';
    ctx.beginPath();
    ctx.roundRect(790, 80, 170, 220, [40, 40, 4, 4]);
    ctx.fill();
    ctx.strokeStyle = '#5a2b0d';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Kính cửa sổ nhìn ra hoàng hôn
    const windowSky = ctx.createLinearGradient(800, 90, 800, 290);
    windowSky.addColorStop(0, '#f97316');
    windowSky.addColorStop(0.5, '#fbbf24');
    windowSky.addColorStop(1, '#a855f7');
    ctx.fillStyle = windowSky;
    ctx.beginPath();
    ctx.roundRect(798, 88, 154, 204, [32, 32, 0, 0]);
    ctx.fill();

    // Đỉnh núi tím ở đằng xa ngoài cửa sổ
    ctx.fillStyle = '#4c1d95';
    ctx.beginPath();
    ctx.moveTo(798, 292);
    ctx.lineTo(840, 200);
    ctx.lineTo(880, 240);
    ctx.lineTo(925, 180);
    ctx.lineTo(952, 292);
    ctx.closePath();
    ctx.fill();

    // Nan cửa sổ chữ thập bằng gỗ
    ctx.fillStyle = '#3f1a04';
    ctx.fillRect(870, 88, 10, 204);
    ctx.fillRect(798, 185, 154, 10);

    // Rèm cửa sổ nhung đỏ viền đăng ten sang trọng
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(790, 80);
    ctx.lineTo(830, 80);
    ctx.quadraticCurveTo(825, 170, 800, 260);
    ctx.lineTo(790, 260);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(960, 80);
    ctx.lineTo(920, 80);
    ctx.quadraticCurveTo(925, 170, 950, 260);
    ctx.lineTo(960, 260);
    ctx.closePath();
    ctx.fill();

    // Luồng ánh sáng mặt trời vàng xiên qua cửa sổ (Volumetric Sun God Rays)
    const sunBeam = ctx.createLinearGradient(870, 180, 620, 660);
    sunBeam.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    sunBeam.addColorStop(0.6, 'rgba(254, 240, 138, 0.15)');
    sunBeam.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = sunBeam;
    ctx.beginPath();
    ctx.moveTo(798, 292);
    ctx.lineTo(952, 292);
    ctx.lineTo(860, 680);
    ctx.lineTo(540, 680);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 6. Cửa chính dày dặn bằng gỗ sồi kiên cố dẫn ra Thị Trấn (Right Exit Door)
    const doorX = 1040;
    const doorY = 150;
    ctx.save();
    // Khung bao cửa
    this.drawWoodPlank(ctx, doorX - 16, doorY - 14, 212, 330, '#3b1905', '#1a0901', '#54260a', false);

    // Cánh cửa gỗ dày
    this.drawWoodPlank(ctx, doorX, doorY, 180, 310, '#5a2d12', '#2c1203', '#7d411b', false);

    // 4 ô pa-nô nổi khối trên cửa
    for (let py = doorY + 20; py < doorY + 280; py += 135) {
      this.drawWoodPlank(ctx, doorX + 22, py, 136, 115, '#421f09', '#1d0b02', '#633111', true);
    }

    // Bản lề sắt đúc màu đen chống rỉ
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(doorX + 160, doorY + 45, 24, 14);
    ctx.fillRect(doorX + 160, doorY + 240, 24, 14);

    // Quả đấm cửa bằng đồng thau sáng bóng
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(doorX + 35, doorY + 165, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(doorX + 32, doorY + 162, 4, 0, Math.PI * 2);
    ctx.fill();

    // Đèn dầu đồng cổ điển treo cạnh cửa tỏa ánh sáng vàng chào đón
    ctx.fillStyle = '#78350f';
    ctx.fillRect(doorX - 35, doorY + 80, 14, 8);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.roundRect(doorX - 42, doorY + 88, 28, 42, 6);
    ctx.fill();
    this.drawAtmosphericLight(ctx, doorX - 28, doorY + 109, 90, 'rgba(254, 240, 138, 0.7)', 'rgba(254, 240, 138, 0)');

    // Bảng hiệu gỗ chạm khắc viền vàng lấp lánh: "LỐI RA THỊ TRẤN ➔"
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.roundRect(doorX - 30, doorY - 55, 240, 44, 10);
    ctx.fill();

    this.drawWoodPlank(ctx, doorX - 35, doorY - 60, 240, 44, '#854d0e', '#451a03', '#a16207', true);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(doorX - 32, doorY - 57, 234, 38);

    ctx.fillStyle = '#fef08a';
    ctx.font = '900 17px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6;
    ctx.fillText('LỐI RA THỊ TRẤN ➔', doorX + 85, doorY - 38);
    ctx.shadowBlur = 0;
    ctx.restore();

    // 7. Bụi vàng bay trong không gian & Hiệu ứng hạt VFX
    this.drawDustMotes(ctx, elapsed, 22);
    this.drawVFX(ctx, vfx);

    // 8. Vẽ nhân vật Thợ mỏ phong cách HD 720p sắc nét
    this.drawHDMiner(ctx, player.x, player.y, player.dir, player.isWalking, player.walkCycle, elapsed);

    // 9. Lớp viền tối điện ảnh (Cinematic Vignette)
    this.drawVignette(ctx, 0.32);
  }

  // =========================================================================
  // 2. TOWN SCENE (THỊ TRẤN THỢ MỎ MIỀN TÂY SẦM UẤT - 1280x720)
  // =========================================================================
  public static renderTown(
    rc: RenderContext,
    player: { x: number; y: number; dir: number; isWalking: boolean; walkCycle: number },
    vfx: VFXParticle[]
  ): void {
    const { ctx, elapsed } = rc;

    // 1. Bầu trời hoàng hôn sa mạc chuyển màu ngoạn mục (Multi-stop Western Sky)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 360);
    skyGrad.addColorStop(0, '#581c87'); // Tím sẫm hoàng hôn
    skyGrad.addColorStop(0.3, '#c2410c'); // Đỏ cam sa mạc
    skyGrad.addColorStop(0.65, '#f59e0b'); // Vàng rực
    skyGrad.addColorStop(1, '#fed7aa'); // Vàng sáng chân trời
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1280, 360);

    // Mặt trời lặn đỏ rực phía sau rặng núi
    const sunGrad = ctx.createRadialGradient(640, 240, 10, 640, 240, 140);
    sunGrad.addColorStop(0, '#fef08a');
    sunGrad.addColorStop(0.4, '#f97316');
    sunGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(640, 240, 140, 0, Math.PI * 2);
    ctx.fill();

    // Dãy núi đá tím xa xôi (Far mountains layer)
    ctx.fillStyle = '#4a044e';
    ctx.beginPath();
    ctx.moveTo(0, 320);
    ctx.lineTo(120, 210);
    ctx.lineTo(260, 280);
    ctx.lineTo(440, 180);
    ctx.lineTo(600, 260);
    ctx.lineTo(760, 170);
    ctx.lineTo(950, 270);
    ctx.lineTo(1120, 190);
    ctx.lineTo(1280, 270);
    ctx.lineTo(1280, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    // Dãy núi đá cam sẫm lớp gần (Near mesas & cliffs)
    ctx.fillStyle = '#7c2d12';
    ctx.beginPath();
    ctx.moveTo(0, 360);
    ctx.lineTo(80, 270);
    ctx.lineTo(220, 310);
    ctx.lineTo(390, 240);
    ctx.lineTo(520, 290);
    ctx.lineTo(720, 250);
    ctx.lineTo(890, 300);
    ctx.lineTo(1080, 230);
    ctx.lineTo(1280, 310);
    ctx.lineTo(1280, 360);
    ctx.closePath();
    ctx.fill();

    // 2. Mặt đất đường phố cát nén sa mạc (Desert Sand Street Ground)
    const streetGrad = ctx.createLinearGradient(0, 360, 0, 720);
    streetGrad.addColorStop(0, '#b45309');
    streetGrad.addColorStop(0.4, '#92400e');
    streetGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = streetGrad;
    ctx.fillRect(0, 360, 1280, 360);

    // Vết rãnh bánh xe ngựa trên đường đất (Wagon wheel ruts)
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(420, 720);
    ctx.lineTo(550, 360);
    ctx.moveTo(860, 720);
    ctx.lineTo(730, 360);
    ctx.stroke();

    // Các tảng đá nhỏ và bụi cỏ khô lăn lóc trên đường
    ctx.fillStyle = '#57534e';
    [180, 480, 790, 1150].forEach((rx, idx) => {
      ctx.beginPath();
      ctx.arc(rx, 460 + (idx % 2) * 80, 9 + (idx % 3) * 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Vỉa hè lót ván gỗ viễn tây 2 bên (Wooden Boardwalks)
    this.drawWoodPlank(ctx, 0, 360, 330, 55, '#854d0e', '#451a03', '#a16207', true);
    this.drawWoodPlank(ctx, 950, 360, 330, 55, '#854d0e', '#451a03', '#a16207', true);
    // Cọc chống vỉa hè
    for (let bx = 30; bx < 330; bx += 80) {
      ctx.fillStyle = '#291204';
      ctx.fillRect(bx, 405, 14, 18);
    }
    for (let bx = 970; bx < 1280; bx += 80) {
      ctx.fillStyle = '#291204';
      ctx.fillRect(bx, 405, 14, 18);
    }

    // 4. Tòa nhà Bên Trái: CỬA HÀNG TRANG BỊ (GENERAL SUPPLY STORE)
    ctx.save();
    // Tường nhà gỗ thông xanh rêu viễn tây (Evergreen Timber Shop)
    this.drawWoodPlank(ctx, 30, 100, 340, 270, '#065f46', '#022c22', '#047857', false);

    // Mái che hiên kẻ sọc đỏ trắng phong cách cổ điển (Awning)
    for (let a = 20; a < 380; a += 36) {
      const isRed = (Math.round(a / 36) % 2 === 0);
      ctx.fillStyle = isRed ? '#dc2626' : '#fef08a';
      ctx.beginPath();
      ctx.moveTo(a, 210);
      ctx.lineTo(a + 36, 210);
      ctx.lineTo(a + 28, 255);
      ctx.lineTo(a - 8, 255);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Cửa kính trưng bày hàng hóa
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(50, 270, 85, 85);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 270, 85, 85);
    // Ánh phản chiếu trên kính
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.moveTo(55, 345);
    ctx.lineTo(130, 275);
    ctx.lineTo(110, 275);
    ctx.lineTo(55, 325);
    ctx.closePath();
    ctx.fill();

    // Cửa ra vào tiệm
    ctx.fillStyle = '#271203';
    ctx.fillRect(160, 260, 110, 105);
    ctx.strokeStyle = '#5a2d12';
    ctx.lineWidth = 4;
    ctx.strokeRect(160, 260, 110, 105);
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(175, 315, 6, 0, Math.PI * 2);
    ctx.fill();

    // Thùng gỗ trữ rượu & bao cát trước tiệm (Props)
    this.drawWoodPlank(ctx, 290, 310, 42, 50, '#78350f', '#3b1702', '#9a4714', false);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(290, 320, 42, 4);
    ctx.fillRect(290, 345, 42, 4);

    // Bảng hiệu Cửa Hàng lớn sơn son thếp vàng
    this.drawWoodPlank(ctx, 40, 50, 320, 50, '#92400e', '#451a03', '#b45309', true);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.strokeRect(44, 54, 312, 42);
    ctx.fillStyle = '#fef08a';
    ctx.font = '900 18px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 8;
    ctx.fillText('🏪 TIỆM ĐỒ THỢ MỎ [SHOP]', 200, 81);
    ctx.shadowBlur = 0;
    ctx.restore();

    // 5. Tòa nhà Bên Phải: KHÁCH SẠN THỢ MỎ (MINER'S GRAND HOTEL)
    ctx.save();
    // Tường gỗ sơn đỏ boóc-đô quý phái
    this.drawWoodPlank(ctx, 910, 90, 340, 280, '#991b1b', '#450a0a', '#b91c1c', false);

    // Ban công lầu 2 bằng gỗ tinh xảo
    this.drawWoodPlank(ctx, 930, 215, 300, 14, '#78350f', '#291204', '#9a4714', true);
    for (let rx = 945; rx < 1220; rx += 28) {
      ctx.fillStyle = '#451a03';
      ctx.fillRect(rx, 175, 8, 40);
    }

    // Cửa sổ lầu 2 có ánh đèn vàng hắt ra
    ctx.fillStyle = '#fde047';
    ctx.fillRect(960, 120, 55, 55);
    ctx.fillRect(1135, 120, 55, 55);
    this.drawAtmosphericLight(ctx, 987, 147, 50, 'rgba(254, 240, 138, 0.4)', 'rgba(254, 240, 138, 0)');
    this.drawAtmosphericLight(ctx, 1162, 147, 50, 'rgba(254, 240, 138, 0.4)', 'rgba(254, 240, 138, 0)');

    // Cửa chính khách sạn
    ctx.fillStyle = '#291204';
    ctx.fillRect(1015, 260, 110, 105);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.strokeRect(1015, 260, 110, 105);

    // Bảng hiệu Khách Sạn chạm khắc rực rỡ
    this.drawWoodPlank(ctx, 920, 40, 320, 50, '#78350f', '#3b1702', '#9a4714', true);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.strokeRect(924, 44, 312, 42);
    ctx.fillStyle = '#fef08a';
    ctx.font = '900 18px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 8;
    ctx.fillText('🏨 KHÁCH SẠN THỢ MỎ', 1080, 71);
    ctx.shadowBlur = 0;
    ctx.restore();

    // 6. Con đường ở giữa dẫn lên HẦM MỎ VÀNG (Pathway to the Gold Mine)
    ctx.save();
    // Lòng đường đất nén lên mỏ
    const roadGrad = ctx.createLinearGradient(0, 360, 0, 720);
    roadGrad.addColorStop(0, '#78350f');
    roadGrad.addColorStop(0.5, '#92400e');
    roadGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = roadGrad;
    ctx.beginPath();
    ctx.moveTo(550, 360);
    ctx.lineTo(730, 360);
    ctx.lineTo(840, 720);
    ctx.lineTo(440, 720);
    ctx.closePath();
    ctx.fill();

    // Cổng vòm gỗ hoành tráng dẫn vào khu mỏ (Archway to the Mine)
    // 2 Trụ gỗ chống lớn
    this.drawWoodPlank(ctx, 520, 170, 30, 195, '#54260a', '#1e0901', '#78350f', false);
    this.drawWoodPlank(ctx, 730, 170, 30, 195, '#54260a', '#1e0901', '#78350f', false);

    // Xà ngang cổng vòm
    this.drawWoodPlank(ctx, 490, 150, 300, 35, '#78350f', '#2c1203', '#9a4714', true);

    // Bảng chỉ dẫn lớn treo trên cổng vòm: "⛰️ ĐƯỜNG LÊN MỎ VÀNG ➔"
    this.drawWoodPlank(ctx, 500, 195, 280, 48, '#9a3412', '#431407', '#c2410c', true);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.strokeRect(504, 199, 272, 40);

    ctx.fillStyle = '#fef08a';
    ctx.font = '900 17px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 6;
    ctx.fillText('⛰️ ĐƯỜNG LÊN MỎ VÀNG ➔', 640, 224);
    ctx.shadowBlur = 0;

    // Đèn lồng treo 2 bên cổng vòm đung đưa
    [-1, 1].forEach((side) => {
      const lx = side < 0 ? 505 : 775;
      const swing = Math.sin(elapsed * 2.5 + side) * 3;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(lx + swing, 185, 4, 18);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.roundRect(lx - 10 + swing, 203, 24, 30, 5);
      ctx.fill();
      this.drawAtmosphericLight(ctx, lx + 2 + swing, 218, 75, 'rgba(254, 240, 138, 0.75)', 'rgba(254, 240, 138, 0)');
    });
    ctx.restore();

    // 7. Cột đèn đường thắp sáng hai bên phố
    [-1, 1].forEach((side) => {
      const lx = side < 0 ? 365 : 915;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(lx, 260, 10, 150);
      ctx.fillStyle = '#334155';
      ctx.fillRect(lx - 8, 250, 26, 12);
      this.drawAtmosphericLight(ctx, lx + 5, 255, 95, 'rgba(254, 240, 138, 0.8)', 'rgba(254, 240, 138, 0)');
    });

    // 8. Bụi gió & VFX
    this.drawDustMotes(ctx, elapsed, 16);
    this.drawVFX(ctx, vfx);

    // 9. Vẽ thợ mỏ HD di chuyển trong thị trấn
    this.drawHDMiner(ctx, player.x, player.y, player.dir, player.isWalking, player.walkCycle, elapsed);

    // 10. Vignette
    this.drawVignette(ctx, 0.3);
  }

  // =========================================================================
  // 3. MINE EXTERIOR SCENE (CỔNG HẦM MỎ NÚI ĐÁ HÙNG VĨ - 1280x720)
  // =========================================================================
  public static renderMineExterior(
    rc: RenderContext,
    player: { x: number; y: number; dir: number; isWalking: boolean; walkCycle: number },
    vfx: VFXParticle[]
  ): void {
    const { ctx, elapsed } = rc;

    // 1. Bầu trời hẻm núi lúc chạng vạng
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 330);
    skyGrad.addColorStop(0, '#0f172a');
    skyGrad.addColorStop(0.5, '#451a03');
    skyGrad.addColorStop(1, '#9a3412');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1280, 330);

    // Vách núi đá đồ sộ 2 bên sườn (Grand Canyon Mountain Walls)
    // Núi trái
    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(460, 0);
    ctx.lineTo(420, 180);
    ctx.lineTo(460, 260);
    ctx.lineTo(390, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    // Vết nứt & vân đá núi trái
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(180, 0);
    ctx.lineTo(240, 120);
    ctx.lineTo(190, 240);
    ctx.lineTo(280, 360);
    ctx.stroke();

    // Mạch vàng óng ánh lộ thiên trên vách đá trái
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(280, 160, 16, 28, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    this.drawSparkle(ctx, 280, 160, 14, '#ffffff');

    // Núi phải
    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.moveTo(1280, 0);
    ctx.lineTo(820, 0);
    ctx.lineTo(860, 170);
    ctx.lineTo(820, 270);
    ctx.lineTo(890, 360);
    ctx.lineTo(1280, 360);
    ctx.closePath();
    ctx.fill();

    // Vết nứt núi phải
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(1080, 0);
    ctx.lineTo(1020, 150);
    ctx.lineTo(1070, 270);
    ctx.lineTo(980, 360);
    ctx.stroke();

    // Nền đất đá hẻm núi (360 -> 720)
    const groundGrad = ctx.createLinearGradient(0, 360, 0, 720);
    groundGrad.addColorStop(0, '#44403c');
    groundGrad.addColorStop(0.6, '#292524');
    groundGrad.addColorStop(1, '#1c1917');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 360, 1280, 360);

    // 2. Miệng hang hầm mỏ khổng lồ (Colossal Mine Cave Portal)
    ctx.save();
    // Lòng hang tối thẳm sâu không đáy
    ctx.fillStyle = '#050302';
    ctx.beginPath();
    ctx.roundRect(430, 150, 420, 220, [80, 80, 0, 0]);
    ctx.fill();

    // Ánh vàng lấp lánh phản quang từ tận đáy hầm mỏ
    const caveGoldGlow = ctx.createRadialGradient(640, 270, 20, 640, 270, 160);
    caveGoldGlow.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
    caveGoldGlow.addColorStop(0.7, 'rgba(217, 119, 6, 0.15)');
    caveGoldGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = caveGoldGlow;
    ctx.fillRect(430, 150, 420, 220);

    // Khung gỗ chống chịu lực hầm mỏ (Heavy Mine Timber Frame)
    this.drawWoodPlank(ctx, 400, 130, 55, 240, '#54260a', '#1e0901', '#78350f', false);
    this.drawWoodPlank(ctx, 825, 130, 55, 240, '#54260a', '#1e0901', '#78350f', false);
    this.drawWoodPlank(ctx, 380, 100, 520, 55, '#78350f', '#2c1203', '#9a4714', true);

    // Giằng chéo chịu lực
    ctx.strokeStyle = '#3b1702';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(430, 155);
    ctx.lineTo(480, 105);
    ctx.moveTo(850, 155);
    ctx.lineTo(800, 105);
    ctx.stroke();

    // Bảng hiệu hầm mỏ "HẦM MỎ VÀNG CHÍNH — [VÀO ĐÀO]"
    this.drawWoodPlank(ctx, 420, 45, 440, 55, '#92400e', '#451a03', '#b45309', true);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(425, 50, 430, 45);

    ctx.fillStyle = '#fef08a';
    ctx.font = '900 21px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 8;
    ctx.fillText('⛏️ HẦM MỎ VÀNG — [BẤM ĐỂ VÀO]', 640, 78);
    ctx.shadowBlur = 0;

    // 2 Đèn bão lớn soi sáng 2 bên cửa hầm mỏ
    [380, 890].forEach((lx) => {
      this.drawAtmosphericLight(ctx, lx, 230, 130, 'rgba(254, 240, 138, 0.85)', 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(lx - 5, 200, 10, 50);
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(lx, 225, 12, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 3. Đường ray xe goòng bằng thép dẫn từ trong hang ra ngoài (Mining Railway)
    ctx.save();
    // Thanh tà-vẹt gỗ (Sleepers)
    for (let ry = 380; ry < 720; ry += 36) {
      const spread = (ry - 370) * 0.45;
      this.drawWoodPlank(ctx, 640 - spread - 85, ry, spread * 2 + 170, 16, '#54260a', '#1e0901', '#78350f', true);
    }

    // 2 thanh ray thép sáng bóng (Steel rails with highlight)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(560, 370);
    ctx.lineTo(430, 720);
    ctx.moveTo(720, 370);
    ctx.lineTo(850, 720);
    ctx.stroke();

    // Ánh sáng kim loại phản chiếu trên ray
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(560, 370);
    ctx.lineTo(430, 720);
    ctx.moveTo(720, 370);
    ctx.lineTo(850, 720);
    ctx.stroke();
    ctx.restore();

    // 4. Xe goòng chở đầy vàng đỗ bên trái (Mine Cart full of Gold)
    ctx.save();
    const cartX = 230;
    const cartY = 460;
    // Bóng xe goòng
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(cartX + 80, cartY + 110, 100, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thùng xe thép gỉ
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(cartX, cartY + 10, 160, 85, 10);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Vàng vun ngọn bên trong xe goòng
    for (let g = 0; g < 9; g++) {
      this.drawGoldNugget(ctx, 'GOLD_MEDIUM', 18, elapsed + g);
      ctx.save();
      ctx.translate(cartX + 25 + g * 14, cartY + 5 - (g % 3) * 6);
      this.drawGoldNugget(ctx, 'GOLD_SMALL', 14, elapsed);
      ctx.restore();
    }

    // 4 Bánh xe sắt
    [-1, 1].forEach((s) => {
      const wx = s < 0 ? cartX + 35 : cartX + 125;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(wx, cartY + 98, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(wx, cartY + 98, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Cây cuốc chim dựa vào xe goòng
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cartX + 165, cartY + 95);
    ctx.lineTo(cartX + 205, cartY - 15);
    ctx.stroke();
    // Lưỡi cuốc thép
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cartX + 205, cartY - 15, 24, Math.PI * 0.7, Math.PI * 1.3);
    ctx.stroke();
    ctx.restore();

    // 5. Bụi & VFX
    this.drawDustMotes(ctx, elapsed, 18);
    this.drawVFX(ctx, vfx);

    // 6. Vẽ thợ mỏ HD
    this.drawHDMiner(ctx, player.x, player.y, player.dir, player.isWalking, player.walkCycle, elapsed);

    // 7. Vignette
    this.drawVignette(ctx, 0.35);
  }

  // =========================================================================
  // 4. UNDERGROUND MINING SCENE (LÒNG MỎ VÀNG - MÁY TỜI CƠ KHÍ - 1280x720)
  // =========================================================================
  public static renderMining(
    rc: RenderContext,
    hook: MiningHookState,
    items: UndergroundItem[],
    vfx: VFXParticle[],
    level: number
  ): void {
    const { ctx, elapsed } = rc;

    // 1. Lòng đất sâu đa tầng địa chất (Subterranean Cavern & Strata)
    const caveGrad = ctx.createLinearGradient(0, 0, 0, 720);
    caveGrad.addColorStop(0, '#1a0e07'); // Vòm hang tối sẫm
    caveGrad.addColorStop(0.2, '#2e180d'); // Đất sét nâu hổ phách
    caveGrad.addColorStop(0.55, '#3b1c0b'); // Tầng nham thạch cổ
    caveGrad.addColorStop(0.85, '#1e0c05'); // Tầng đá sâu thẳm
    caveGrad.addColorStop(1, '#0a0502'); // Vực thẳm đáy mỏ
    ctx.fillStyle = caveGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // Mạch bụi vàng lấp lánh ẩn hiện trong vách đá (Gleaming Gold Veins)
    for (let i = 0; i < 8; i++) {
      const vy = 160 + i * 70;
      ctx.fillStyle = 'rgba(251, 191, 36, 0.09)';
      ctx.beginPath();
      ctx.moveTo(0, vy);
      ctx.bezierCurveTo(380, vy - 40, 780, vy + 45, 1280, vy - 20);
      ctx.lineTo(1280, vy + 28);
      ctx.bezierCurveTo(780, vy + 75, 380, vy - 15, 0, vy + 32);
      ctx.closePath();
      ctx.fill();

      // Đốm quặng vàng nhỏ phát sáng trong mạch
      for (let dot = 0; dot < 4; dot++) {
        const dx = (dot * 320 + i * 90) % 1260;
        const dy = vy + Math.sin(dx * 0.02) * 15;
        this.drawSparkle(ctx, dx, dy, 3 + (dot % 3) * 2, '#fef08a');
      }
    }

    // Nhũ đá thạch nhũ buông rủ từ trần hang (Stalactites)
    const stalactites = [70, 190, 310, 480, 800, 960, 1100, 1220];
    stalactites.forEach((sx, idx) => {
      const h = 55 + ((idx * 23) % 40);
      ctx.fillStyle = '#261205';
      ctx.beginPath();
      ctx.moveTo(sx - 28, 0);
      ctx.lineTo(sx, h);
      ctx.lineTo(sx + 28, 0);
      ctx.closePath();
      ctx.fill();

      // Giọt nước đọng trên đầu nhũ đá
      const dropOffset = (elapsed * 45 + idx * 30) % 200;
      if (dropOffset > 100) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.beginPath();
        ctx.arc(sx, h + (dropOffset - 100) * 0.6, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 2. Giàn giáo gỗ chịu lực đỡ trần hang mỏ (Heavy Mine Timber Supports)
    this.drawWoodPlank(ctx, 0, 0, 1280, 36, '#451a03', '#1e0901', '#662607', true);
    this.drawWoodPlank(ctx, 40, 0, 42, 145, '#451a03', '#1e0901', '#662607', false);
    this.drawWoodPlank(ctx, 1198, 0, 42, 145, '#451a03', '#1e0901', '#662607', false);

    // Sàn ray thép chịu lực cho máy tời (Heavy Rig Platform at y = 115)
    ctx.fillStyle = '#475569';
    ctx.fillRect(320, 116, 640, 14);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(320, 126, 640, 8);

    // Tà vẹt gỗ giàn tời
    for (let rx = 330; rx < 950; rx += 45) {
      this.drawWoodPlank(ctx, rx, 126, 26, 12, '#522405', '#240d02', '#78350f', true);
    }

    // 3. Vẽ tất cả khoáng sản dưới lòng đất (Gold, Diamond, Rocks, TNT, Bags)
    this.drawUndergroundItems(ctx, items, elapsed);

    // 4. Vẽ Dây cáp tời & Móc ngoạm cơ khí (Hook & Braided Steel Winch Cable)
    this.drawHookAndCable(ctx, hook, elapsed);

    // 5. Vẽ Máy tời đào vàng HD & Ông già thợ mỏ vận hành máy
    this.drawMiningMachineAndMiner(ctx, hook, elapsed);

    // 6. Hiệu ứng hạt VFX (Tia lửa, đá vỡ, khói nổ)
    this.drawVFX(ctx, vfx);

    // 7. Lớp phủ bóng tối hang động & Vignette
    this.drawVignette(ctx, 0.28);
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

    // 1. Vách núi đá hang cùng
    const wallGrad = ctx.createLinearGradient(0, 0, 0, 720);
    wallGrad.addColorStop(0, '#1c1917');
    wallGrad.addColorStop(0.5, '#292524');
    wallGrad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, 1280, 720);

    const isDetonating = countdown <= 0;
    if (!isDetonating) {
      // Bức tường đá núi chắn ngang trước khi nổ
      ctx.save();
      // Khối đá hoa cương khổng lồ
      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.roundRect(300, 80, 680, 520, 24);
      ctx.fill();
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 8;
      ctx.stroke();

      // Vết nứt trên vách đá sắp nổ
      ctx.strokeStyle = '#0c0a09';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(380, 120);
      ctx.lineTo(520, 260);
      ctx.lineTo(460, 390);
      ctx.lineTo(540, 560);
      ctx.moveTo(820, 140);
      ctx.lineTo(760, 310);
      ctx.lineTo(840, 480);
      ctx.stroke();

      // Các bó thuốc nổ TNT gắn vào vách đá
      const tntBundles = [
        { x: 440, y: 220 },
        { x: 760, y: 230 },
        { x: 480, y: 430 },
        { x: 740, y: 440 },
        { x: 610, y: 330 },
      ];

      // Dây kíp nổ đỏ nối từ hộp điều khiển đến các quả mìn
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(250, 560);
      tntBundles.forEach((tp) => {
        ctx.lineTo(tp.x, tp.y);
      });
      ctx.stroke();

      // Vẽ từng bó thuốc nổ
      tntBundles.forEach((tp) => {
        this.drawTNT(ctx, 22, elapsed);
        ctx.save();
        ctx.translate(tp.x, tp.y);
        this.drawTNT(ctx, 22, elapsed);
        ctx.restore();
      });

      // Hộp kích nổ Pít-tông cổ điển (Vintage TNT Plunger Box)
      const boxX = 220;
      const boxY = 510;
      this.drawWoodPlank(ctx, boxX, boxY, 80, 100, '#dc2626', '#7f1d1d', '#ef4444', false);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(boxX, boxY, 80, 100);

      // Cần gạt pít-tông bằng đồng
      ctx.fillStyle = '#fde047';
      ctx.fillRect(boxX + 34, boxY - 45, 12, 45);
      ctx.fillRect(boxX + 10, boxY - 55, 60, 12);

      // Chữ trên hộp
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TNT BLAST', boxX + 40, boxY + 55);
      ctx.restore();
    } else {
      // VÁCH NÚI PHÁ TAN! LỐI VÀO MỎ MỚI RỰC RỠ ÁNH VÀNG VÀ CHÂU BÁU!
      ctx.save();
      const newMineGlow = ctx.createRadialGradient(640, 340, 50, 640, 340, 450);
      newMineGlow.addColorStop(0, '#fef08a');
      newMineGlow.addColorStop(0.35, '#f59e0b');
      newMineGlow.addColorStop(0.7, '#b45309');
      newMineGlow.addColorStop(1, '#1c1917');
      ctx.fillStyle = newMineGlow;
      ctx.beginPath();
      ctx.ellipse(640, 340, 420, 280, 0, 0, Math.PI * 2);
      ctx.fill();

      // Đá vỡ vụn rải đầy dưới sàn
      ctx.fillStyle = '#44403c';
      for (let r = 0; r < 20; r++) {
        ctx.beginPath();
        ctx.arc(360 + r * 35, 590 + (r % 3) * 14, 24, 0, Math.PI * 2);
        ctx.fill();
      }

      // Luồng châu báu lấp lánh bay ra từ mỏ mới
      for (let s = 0; s < 16; s++) {
        const sx = 420 + Math.sin(elapsed * 4 + s * 1.3) * 220;
        const sy = 220 + Math.cos(elapsed * 3 + s * 1.8) * 140;
        this.drawSparkle(ctx, sx, sy, 18, '#ffffff');
      }
      ctx.restore();
    }

    // Mặt đất
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 620, 1280, 100);

    // Thợ mỏ đứng quan sát bên trái
    this.drawHDMiner(ctx, 160, 590, 1, false, 0, elapsed);

    // Hiệu ứng khói lửa nổ
    this.drawVFX(ctx, vfx);

    // Vignette
    this.drawVignette(ctx, 0.35);
  }

  // =========================================================================
  // 6. DRAW UNDERGROUND ITEMS (GOLD NUGGETS, DIAMOND, ROCKS, TNT, BAGS)
  // =========================================================================
  private static drawUndergroundItems(
    ctx: CanvasRenderingContext2D,
    items: UndergroundItem[],
    elapsed: number
  ): void {
    items.forEach((item) => {
      if (item.isAttached) return; // Nếu đã bị móc kẹp thì vẽ ở đầu móc

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

  /**
   * Vẽ Thỏi Vàng 24K đa giác vát cạnh lấp lánh (Faceted High-Definition Gold Nugget)
   */
  public static drawGoldNugget(
    ctx: CanvasRenderingContext2D,
    type: ItemType,
    r: number,
    elapsed: number
  ): void {
    ctx.save();
    // 1. Quầng sáng vàng kim tỏa xung quanh (Warm Auric Glow)
    const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.7);
    glow.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
    glow.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)');
    glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
    ctx.fill();

    // 2. Thân vàng nguyên khối với gradient nhiều dải màu kim loại
    const goldGrad = ctx.createRadialGradient(-r * 0.4, -r * 0.4, r * 0.1, 0, 0, r);
    goldGrad.addColorStop(0, '#ffffff'); // Điểm sáng gắt
    goldGrad.addColorStop(0.2, '#fef08a'); // Vàng sáng 24K
    goldGrad.addColorStop(0.55, '#f59e0b'); // Vàng kim hổ phách
    goldGrad.addColorStop(0.85, '#d97706'); // Vàng đồng đậm
    goldGrad.addColorStop(1, '#78350f'); // Viền bóng đổ sâu

    ctx.fillStyle = goldGrad;
    ctx.beginPath();
    // Đa giác bất đối xứng chân thực
    const points = type === 'GOLD_LARGE' ? 10 : type === 'GOLD_MEDIUM' ? 8 : 7;
    for (let i = 0; i < points; i++) {
      const a = (i / points) * Math.PI * 2;
      const variation = 0.82 + Math.sin(i * 3.8) * 0.22;
      const px = Math.cos(a) * r * variation;
      const py = Math.sin(a) * r * variation;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Viền mép vàng kim loại
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = Math.max(2, r * 0.08);
    ctx.stroke();

    // Các đường gân vát mặt đa diện kim cương
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.2);
    ctx.lineTo(r * 0.2, -r * 0.45);
    ctx.lineTo(r * 0.45, r * 0.1);
    ctx.lineTo(-r * 0.1, r * 0.4);
    ctx.closePath();
    ctx.stroke();

    // Tia sao lấp lánh 4 cánh nhấp nháy
    const pulse = Math.sin(elapsed * 6 + r) * 0.3 + 0.7;
    this.drawSparkle(ctx, -r * 0.35, -r * 0.35, r * 0.5 * pulse, '#ffffff');
    ctx.restore();
  }

  /**
   * Vẽ Viên Kim Cương Xanh Ngọc Lấp Lánh (Brilliant Cut Diamond)
   */
  public static drawDiamond(ctx: CanvasRenderingContext2D, r: number, elapsed: number): void {
    ctx.save();
    // Quầng sáng Cyan huyền ảo
    const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, r * 1.9);
    glow.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
    glow.addColorStop(0.6, 'rgba(56, 189, 248, 0.2)');
    glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.9, 0, Math.PI * 2);
    ctx.fill();

    // Đáy kim cương (Tam giác ngược sẫm màu)
    const baseGrad = ctx.createLinearGradient(0, -r * 0.3, 0, r);
    baseGrad.addColorStop(0, '#0284c7');
    baseGrad.addColorStop(1, '#082f49');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.35);
    ctx.lineTo(r, -r * 0.35);
    ctx.lineTo(0, r);
    ctx.closePath();
    ctx.fill();

    // Mặt trên kim cương (Crown facets)
    const crownGrad = ctx.createLinearGradient(0, -r, 0, -r * 0.35);
    crownGrad.addColorStop(0, '#e0f2fe');
    crownGrad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = crownGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 0.65, -r);
    ctx.lineTo(r * 0.65, -r);
    ctx.lineTo(r, -r * 0.35);
    ctx.lineTo(-r, -r * 0.35);
    ctx.closePath();
    ctx.fill();

    // Các giác cắt mặt kim cương phản chiếu quang phổ
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.35, -r * 0.35);
    ctx.lineTo(0, -r * 0.1);
    ctx.lineTo(-r * 0.35, -r * 0.35);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Ngôi sao lấp lánh trên đỉnh
    const glint = Math.sin(elapsed * 7) * 0.3 + 0.8;
    this.drawSparkle(ctx, -r * 0.3, -r * 0.5, r * 0.65 * glint, '#ffffff');
    ctx.restore();
  }

  /**
   * Vẽ Tảng Đá Hoa Cương Xám Có Vết Nứt (Granite Boulder)
   */
  public static drawRock(ctx: CanvasRenderingContext2D, type: ItemType, r: number): void {
    ctx.save();
    // Khối đá với dải gradient xám than
    const rockGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    rockGrad.addColorStop(0, '#cbd5e1');
    rockGrad.addColorStop(0.4, '#64748b');
    rockGrad.addColorStop(0.85, '#334155');
    rockGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = rockGrad;
    ctx.beginPath();
    const pts = type === 'ROCK_LARGE' ? 9 : 7;
    for (let i = 0; i < pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const variation = 0.84 + Math.sin(i * 3.1) * 0.2;
      const px = Math.cos(a) * r * variation;
      const py = Math.sin(a) * r * variation;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Vết nứt trên đá
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.35);
    ctx.lineTo(r * 0.1, 0);
    ctx.lineTo(r * 0.4, r * 0.3);
    ctx.moveTo(r * 0.1, 0);
    ctx.lineTo(-r * 0.2, r * 0.35);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Vẽ Bao Tải Bí Ẩn Có Thắt Nút Thừng (Mystery Burlap Bag)
   */
  public static drawMysteryBag(ctx: CanvasRenderingContext2D, r: number, elapsed: number): void {
    ctx.save();
    // Bầu bao tải căng tròn
    const bagGrad = ctx.createLinearGradient(0, -r, 0, r);
    bagGrad.addColorStop(0, '#d97706');
    bagGrad.addColorStop(0.65, '#92400e');
    bagGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = bagGrad;

    ctx.beginPath();
    ctx.arc(0, r * 0.25, r * 0.85, 0, Math.PI);
    ctx.quadraticCurveTo(r * 0.85, -r * 0.45, 0, -r * 0.55);
    ctx.quadraticCurveTo(-r * 0.85, -r * 0.45, -r * 0.85, r * 0.25);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Miệng bao tải dún bèo & dây thừng buộc cổ
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-r * 0.45, -r * 0.85, r * 0.9, r * 0.35);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-r * 0.5, -r * 0.55, r, 6);

    // Dấu chấm hỏi '?' vàng lấp lánh đung đưa
    const floatY = Math.sin(elapsed * 4) * 3;
    ctx.fillStyle = '#fde047';
    ctx.font = `900 ${Math.round(r * 1.1)}px "Chakra Petch", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6;
    ctx.fillText('?', 0, r * 0.25 + floatY);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /**
   * Vẽ Thùng Thuốc Nổ TNT (Red Dynamite Barrel)
   */
  public static drawTNT(ctx: CanvasRenderingContext2D, r: number, elapsed: number): void {
    ctx.save();
    // Thân thùng trụ đỏ
    const tntGrad = ctx.createLinearGradient(-r * 0.75, 0, r * 0.75, 0);
    tntGrad.addColorStop(0, '#ef4444');
    tntGrad.addColorStop(0.5, '#dc2626');
    tntGrad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = tntGrad;
    ctx.fillRect(-r * 0.75, -r * 0.9, r * 1.5, r * 1.8);

    // 2 đai sắt xiết thùng màu đen
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-r * 0.8, -r * 0.7, r * 1.6, 6);
    ctx.fillRect(-r * 0.8, r * 0.5, r * 1.6, 6);

    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 3;
    ctx.strokeRect(-r * 0.75, -r * 0.9, r * 1.5, r * 1.8);

    // Chữ 'TNT' in đậm màu trắng
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(r * 0.7)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TNT', 0, 0);

    // Dây ngòi nổ bén lửa
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.quadraticCurveTo(8, -r * 1.25, -4, -r * 1.45);
    ctx.stroke();

    // Tia lửa bén nhấp nháy trên ngòi nổ
    const sparkRad = 7 + Math.sin(elapsed * 32) * 3;
    this.drawAtmosphericLight(ctx, -4, -r * 1.45, sparkRad, 'rgba(254, 240, 138, 0.9)', 'rgba(239, 68, 68, 0)');
    ctx.restore();
  }

  /**
   * Vẽ Ngôi sao lấp lánh 4 cánh
   */
  public static drawSparkle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ): void {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.quadraticCurveTo(x, y, x + size, y);
    ctx.quadraticCurveTo(x, y, x, y + size);
    ctx.quadraticCurveTo(x, y, x - size, y);
    ctx.quadraticCurveTo(x, y, x, y - size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // =========================================================================
  // 7. DRAW HOOK & BRAIDED STEEL WINCH CABLE
  // =========================================================================
  private static drawHookAndCable(
    ctx: CanvasRenderingContext2D,
    hook: MiningHookState,
    elapsed: number
  ): void {
    const pivotX = 640;
    const pivotY = 125;

    // Tọa độ đầu móc cẩu
    const hookX = pivotX + Math.sin(hook.angle) * hook.length;
    const hookY = pivotY + Math.cos(hook.angle) * hook.length;

    // 1. Dây cáp thép bện chịu lực (Braided Steel Cable with Metallic Sheen)
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(hookX, hookY);
    ctx.stroke();

    // Lõi phản quang của dây cáp
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(hookX, hookY);
    ctx.stroke();

    // 2. Quả thuốc nổ bay dọc dây cáp khi người chơi bấm phá đá
    if (hook.dynamiteInFlight) {
      const dynX = pivotX + (hookX - pivotX) * (hook.dynamiteDist / hook.length);
      const dynY = pivotY + (hookY - pivotY) * (hook.dynamiteDist / hook.length);

      ctx.save();
      ctx.translate(dynX, dynY);
      ctx.rotate(hook.angle + Math.PI / 2);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-16, -7, 32, 14);
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(18, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Càng gắp cơ khí cơ giới 3 chấu (Articulated Steel Mechanical Claws)
    ctx.save();
    ctx.translate(hookX, hookY);
    ctx.rotate(-hook.angle);

    // Trục xoay trung tâm đinh tán đồng
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Độ xòe của vuốt gắp
    const isOpen = hook.attachedItem === null && hook.state !== 'RETURNING';
    const clawSpread = isOpen ? 0.54 : 0.16;

    // Vuốt trái
    ctx.save();
    ctx.rotate(-clawSpread);
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.quadraticCurveTo(-28, 22, -20, 46);
    ctx.quadraticCurveTo(-11, 40, -4, 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Mũi vuốt bọc crom sắc nhọn
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-24, 35);
    ctx.lineTo(-20, 46);
    ctx.stroke();
    ctx.restore();

    // Vuốt phải
    ctx.save();
    ctx.rotate(clawSpread);
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.quadraticCurveTo(28, 22, 20, 46);
    ctx.quadraticCurveTo(11, 40, 4, 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Mũi vuốt bọc crom
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 35);
    ctx.lineTo(20, 46);
    ctx.stroke();
    ctx.restore();

    // 4. Nếu đang kéo vật phẩm lên, vẽ vật phẩm gắn chặt vào vuốt
    if (hook.attachedItem) {
      ctx.save();
      ctx.translate(0, 36);
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

    ctx.save();
    // 1. Thùng xe tời bằng thép tán đinh (Heavy Ore Cart Body)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(cx - 80, cy - 44, 160, 50, 10);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Đinh tán thép trên thành xe
    ctx.fillStyle = '#94a3b8';
    [-65, -35, 0, 35, 65].forEach((rx) => {
      ctx.beginPath();
      ctx.arc(cx + rx, cy - 36, 3.5, 0, Math.PI * 2);
      ctx.arc(cx + rx, cy - 10, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4 Bánh xe thép nan hoa đúc
    [-55, 55].forEach((wx) => {
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(cx + wx, cy + 8, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Nắp trục đồng
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx + wx, cy + 8, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Bộ máy tời bánh răng đồng (Rotating Cogwheel Winch Rig)
    const isReeling = hook.state === 'RETURNING';
    const gearRot = isReeling ? elapsed * 14 : hook.angle;

    ctx.save();
    ctx.translate(cx + 45, cy - 26);
    ctx.rotate(gearRot);

    // Vành bánh răng
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Các răng cưa
    ctx.fillStyle = '#b45309';
    for (let t = 0; t < 12; t++) {
      const ta = (t / 12) * Math.PI * 2;
      ctx.fillRect(Math.cos(ta) * 18 - 3.5, Math.sin(ta) * 18 - 3.5, 7, 7);
    }
    // Tay quay tời
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(11, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Ròng rọc thả cáp tại điểm pivot (640, 125)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(cx, cy + 10, 9, 0, Math.PI * 2);
    ctx.fill();

    // 3. Ông già thợ mỏ ngồi trên xe lái cần gạt
    ctx.save();
    ctx.translate(cx - 22, cy - 32);

    const isHeavy = hook.attachedItem && hook.attachedItem.mass > 2.5;

    // Áo sơ mi ca-rô đỏ
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(-24, -46, 48, 46, 12);
    ctx.fill();

    // Quần yếm bò xanh
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.roundRect(-20, -34, 40, 36, [8, 8, 10, 10]);
    ctx.fill();

    // Đầu & khuôn mặt
    ctx.fillStyle = '#fbd5b5';
    ctx.beginPath();
    ctx.arc(0, -58, 20, 0, Math.PI * 2);
    ctx.fill();

    // Má hồng
    ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.beginPath();
    ctx.arc(-9, -54, 5.5, 0, Math.PI * 2);
    ctx.arc(9, -54, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Mắt biểu cảm
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4, -62, 4.5, 0, Math.PI * 2);
    ctx.arc(6, -62, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-3, -62, 2.5, 0, Math.PI * 2);
    ctx.arc(7, -62, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Mũi to tròn ngộ nghĩnh
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(1, -56, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Bộ râu trắng bồng bềnh
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-8, -48, 12, 0, Math.PI * 2);
    ctx.arc(8, -48, 12, 0, Math.PI * 2);
    ctx.arc(0, -42, 15, 0, Math.PI * 2);
    ctx.fill();

    // Mũ bảo hộ vàng công trình
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, -70, 22, Math.PI, 0);
    ctx.lineTo(24, -67);
    ctx.lineTo(-24, -67);
    ctx.closePath();
    ctx.fill();

    // Đèn pha trên mũ bảo hộ chiếu luồng sáng xuống lòng đất
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(18, -70, 7, 0, Math.PI * 2);
    ctx.fill();

    // Luồng sáng đèn pha
    const minerBeam = ctx.createLinearGradient(20, -70, 260, 200);
    minerBeam.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    minerBeam.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = minerBeam;
    ctx.beginPath();
    ctx.moveTo(20, -76);
    ctx.lineTo(280, 170);
    ctx.lineTo(230, 240);
    ctx.lineTo(16, -64);
    ctx.closePath();
    ctx.fill();

    // Tay cầm cần điều khiển
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(10, -42, 28, 12);
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(38, -36, 8, 0, Math.PI * 2);
    ctx.fill();

    // Giọt mồ hôi khi kéo đồ nặng
    if (isHeavy) {
      ctx.fillStyle = '#38bdf8';
      for (let s = 0; s < 3; s++) {
        const sy = -68 + Math.sin(elapsed * 18 + s) * 12;
        ctx.beginPath();
        ctx.arc(-16 - s * 6, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
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

    // Lật hướng nhìn
    if (dir < 0) {
      ctx.scale(-1, 1);
    }

    // Chuyển động nhún người khi bước đi & thở
    const bobY = isWalking ? Math.abs(Math.sin(walkCycle * 2)) * 6 : Math.sin(elapsed * 3) * 2;
    const legSwing = isWalking ? Math.sin(walkCycle) * 20 : 0;

    // Bóng đổ trên mặt đất (Ground Contact Shadow)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 5, 42, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, -bobY);

    // 1. Chân & Ủng da thợ mỏ (Heavy Leather Miner Boots)
    // Chân sau
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-18, -44, 18, 34);
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.roundRect(-24 - legSwing * 0.4, -18, 28, 20, [4, 8, 4, 4]);
    ctx.fill();

    // Chân trước
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(4, -44, 18, 34);
    ctx.fillStyle = '#522405';
    ctx.beginPath();
    ctx.roundRect(2 + legSwing * 0.4, -18, 30, 20, [4, 8, 4, 4]);
    ctx.fill();

    // 2. Thân người tròn trịa & Áo yếm bò (Pudge Torso & Denim Overalls)
    // Áo flannel đỏ ca-rô
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(-30, -98, 60, 60, 18);
    ctx.fill();

    // Quần yếm bò xanh
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.roundRect(-26, -86, 52, 50, [10, 10, 14, 14]);
    ctx.fill();

    // Khuy đồng cài yếm
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(-16, -82, 5, 0, Math.PI * 2);
    ctx.arc(16, -82, 5, 0, Math.PI * 2);
    ctx.fill();

    // 3. Khuôn mặt phúc hậu & Bộ râu trắng nhiều tầng
    // Khuôn mặt
    ctx.fillStyle = '#fbd5b5';
    ctx.beginPath();
    ctx.arc(0, -114, 25, 0, Math.PI * 2);
    ctx.fill();

    // Má hồng ửng
    ctx.fillStyle = 'rgba(239, 68, 68, 0.55)';
    ctx.beginPath();
    ctx.arc(-14, -110, 8, 0, Math.PI * 2);
    ctx.arc(14, -110, 8, 0, Math.PI * 2);
    ctx.fill();

    // Mắt to tròn hoạt hình vui tươi
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(7, -120, 6.5, 0, Math.PI * 2);
    ctx.arc(-7, -120, 6.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(8, -120, 3.8, 0, Math.PI * 2);
    ctx.arc(-6, -120, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // Mũi củ cà rốt đỏ thắm
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -111, 8.5, 0, Math.PI * 2);
    ctx.fill();

    // Bộ râu trắng phồng to nhiều lớp bồng bềnh
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-12, -100, 15, 0, Math.PI * 2);
    ctx.arc(12, -100, 15, 0, Math.PI * 2);
    ctx.arc(0, -92, 19, 0, Math.PI * 2);
    ctx.arc(-18, -106, 11, 0, Math.PI * 2);
    ctx.arc(18, -106, 11, 0, Math.PI * 2);
    ctx.fill();

    // 4. Mũ bảo hộ vàng công trình kèm đèn pin rọi sáng
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, -130, 27, Math.PI, 0);
    ctx.lineTo(29, -126);
    ctx.lineTo(-29, -126);
    ctx.closePath();
    ctx.fill();

    // Vành mũ
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-32, -128, 64, 7);

    // Đèn pha trên mũ
    ctx.fillStyle = '#b45309';
    ctx.fillRect(18, -138, 13, 15);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(31, -131, 8.5, 0, Math.PI * 2);
    ctx.fill();

    // Nón ánh sáng đèn pin chiếu xiên về phía trước
    const flashBeam = ctx.createLinearGradient(33, -131, 230, -80);
    flashBeam.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    flashBeam.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = flashBeam;
    ctx.beginPath();
    ctx.moveTo(33, -137);
    ctx.lineTo(250, -45);
    ctx.lineTo(250, 40);
    ctx.lineTo(33, -125);
    ctx.closePath();
    ctx.fill();

    // 5. Cây Cuốc Chim Vàng cầm trên tay khi di chuyển! (Golden Pickaxe)
    const armSwing = isWalking ? Math.cos(walkCycle) * 22 : Math.sin(elapsed * 2) * 6;
    ctx.save();
    ctx.translate(22, -64 + armSwing * 0.3);
    ctx.rotate(0.35 + armSwing * 0.02);
    // Cán cuốc bằng gỗ sồi
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 28);
    ctx.lineTo(0, -38);
    ctx.stroke();
    // Lưỡi cuốc mạ vàng 2 đầu nhọn
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, -38, 22, Math.PI * 0.75, Math.PI * 1.25);
    ctx.stroke();
    ctx.restore();

    // Bàn tay mang găng da bảo hộ
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-28, -94, 13, 30);
    ctx.fillRect(15, -94, 13, 30);

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(-22 + armSwing * 0.3, -64, 8.5, 0, Math.PI * 2);
    ctx.arc(22 - armSwing * 0.3, -64, 8.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // =========================================================================
  // 10. DRAW VFX PARTICLES (EXPLOSIONS, SPARKS, SMOKE, FLYING ROCKS)
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
