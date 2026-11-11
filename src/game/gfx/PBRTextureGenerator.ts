import * as THREE from 'three';

/**
 * Procedural PBR Texture Generator
 * Generates bump maps, labels, and decals entirely in-memory using HTML5 Canvas
 */
export class PBRTextureGenerator {
  public static createStoneBumpMap(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 420; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = 3 + Math.random() * 18;
      const lum = Math.floor(35 + Math.random() * 185);
      const grad = ctx.createRadialGradient(x, y, 1, x, y, r);
      grad.addColorStop(0, `rgb(${lum},${lum},${lum})`);
      grad.addColorStop(1, 'rgba(128,128,128,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  public static createTNTLabelTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#991b1b';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0, 76, 512, 104);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 76, 512, 8);
    ctx.fillRect(0, 172, 512, 8);

    ctx.fillStyle = '#dc2626';
    ctx.font = '900 66px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧨 TNT 🧨', 135, 130);
    ctx.fillText('🧨 TNT 🧨', 390, 130);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  public static createMysteryBagTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#c28e53';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(65, 40, 15, 0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 256; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }

    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 6;
    ctx.font = '900 120px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('?', 128, 140);
    ctx.fillText('?', 128, 140);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
}

