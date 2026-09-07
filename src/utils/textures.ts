import * as THREE from 'three';

/**
 * Procedural Texture Generator for Floors and Walls.
 * Creates seamless, high-resolution CanvasTextures using HTML5 Canvas
 * with zero external network dependencies, ensuring pristine offline & container reliability.
 */

// 1. Hardwood Parquet Plank Floor Texture
export function createHardwoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Warm rich oak / walnut base gradient
  const baseGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
  baseGrad.addColorStop(0, '#54260a');
  baseGrad.addColorStop(0.5, '#451f08');
  baseGrad.addColorStop(1, '#3b1a05');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Parquet Planks (8 rows x 4 columns of wood boards)
  const rows = 16;
  const plankH = 1024 / rows;
  const cols = 4;
  const plankW = 1024 / cols;

  for (let r = 0; r < rows; r++) {
    const y = r * plankH;
    const xOffset = (r % 2) * (plankW / 2);

    for (let c = -1; c < cols + 1; c++) {
      const x = c * plankW + xOffset;
      const boardVariation = ((r * 13 + c * 7) % 7) / 7;

      // Plank body
      ctx.fillStyle = boardVariation > 0.6 ? '#5e2d0e' : boardVariation > 0.3 ? '#4d2309' : '#3d1a05';
      ctx.fillRect(x + 2, y + 2, plankW - 4, plankH - 4);

      // Fine Wood Grain Lines
      ctx.strokeStyle = 'rgba(25, 10, 3, 0.45)';
      ctx.lineWidth = 1.2;
      for (let g = 0; g < 6; g++) {
        const lineY = y + 4 + g * (plankH / 7) + (Math.sin(c + g) * 2);
        ctx.beginPath();
        ctx.moveTo(x + 4, lineY);
        ctx.bezierCurveTo(
          x + plankW * 0.3,
          lineY + (g % 2 === 0 ? 3 : -3),
          x + plankW * 0.7,
          lineY + (g % 2 === 0 ? -2 : 3),
          x + plankW - 4,
          lineY
        );
        ctx.stroke();
      }

      // Plank edge bevel highlights & shadows
      ctx.strokeStyle = 'rgba(120, 60, 25, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 2, plankW - 4, plankH - 4);

      // Plank Grout / Seam
      ctx.strokeStyle = '#180a02';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, plankW, plankH);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  return texture;
}

// 2. Polished Carrera Marble Tiles (Bathrooms & Dining/Atrium)
export function createMarbleTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Smooth pearlescent marble base
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1024, 1024);

  // 4x4 Grid of square luxury tiles
  const tileSize = 256;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const tx = c * tileSize;
      const ty = r * tileSize;

      // Soft tile variation
      const shade = ((r + c * 3) % 4) * 3;
      ctx.fillStyle = `rgb(${245 + shade}, ${247 + shade}, ${250 + shade})`;
      ctx.fillRect(tx + 2, ty + 2, tileSize - 4, tileSize - 4);

      // Marble Veining
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(tx + 20, ty + 30);
      ctx.bezierCurveTo(tx + 90, ty + 120, tx + 140, ty + 80, tx + 230, ty + 210);
      ctx.stroke();

      // Branching thinner vein
      ctx.strokeStyle = 'rgba(160, 174, 192, 0.22)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(tx + 110, ty + 100);
      ctx.bezierCurveTo(tx + 170, ty + 115, tx + 195, ty + 70, tx + 240, ty + 60);
      ctx.stroke();

      // Golden vein accent
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.15)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(tx + 40, ty + 200);
      ctx.bezierCurveTo(tx + 100, ty + 160, tx + 180, ty + 210, tx + 220, ty + 180);
      ctx.stroke();

      // Tile Grout
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3.0;
      ctx.strokeRect(tx, ty, tileSize, tileSize);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  return texture;
}

// 3. Architectural Wainscoting & Plaster Wall Texture
export function createWainscotWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Warm luxury cream plaster top (height 0 to 600)
  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(0, 0, 512, 600);

  // Subtle plaster stipple texture
  ctx.fillStyle = 'rgba(215, 205, 190, 0.15)';
  for (let i = 0; i < 2000; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 600;
    ctx.fillRect(rx, ry, 2, 2);
  }

  // Chair Rail Trim Molding (Y = 600 to 630)
  const railGrad = ctx.createLinearGradient(0, 600, 0, 630);
  railGrad.addColorStop(0, '#e5e7eb');
  railGrad.addColorStop(0.5, '#ffffff');
  railGrad.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = railGrad;
  ctx.fillRect(0, 600, 512, 30);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 600, 512, 30);

  // Lower Wainscoting Paneling (Y = 630 to 980)
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 630, 512, 350);

  // 2 Classic Beveled Recessed Panels
  const panelW = 210;
  const panelH = 300;
  [30, 270].forEach((px) => {
    // Outer shadow
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(px, 660, panelW, panelH);

    // Inner bevel
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(px + 12, 672, panelW - 24, panelH - 24);

    // Molded borders
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.strokeRect(px, 660, panelW, panelH);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(px + 12, 672, panelW - 24, panelH - 24);
  });

  // Baseboard Molding (Y = 980 to 1024)
  const baseGrad = ctx.createLinearGradient(0, 980, 0, 1024);
  baseGrad.addColorStop(0, '#e2e8f0');
  baseGrad.addColorStop(0.3, '#ffffff');
  baseGrad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 980, 512, 44);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 1);
  return texture;
}

// 4. Royal Navy Damask Wallpaper Texture (Accent Walls)
export function createAccentNavyWallpaperTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep royal midnight navy
  ctx.fillStyle = '#172554';
  ctx.fillRect(0, 0, 512, 512);

  // Diagonal damask lattice
  ctx.strokeStyle = 'rgba(30, 58, 138, 0.8)';
  ctx.lineWidth = 8;
  for (let i = -512; i < 1024; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 512, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i + 512, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
  }

  // Gold fleur-de-lis / ornate medallions at diamond intersections
  const goldColor = 'rgba(245, 158, 11, 0.45)';
  for (let y = 0; y <= 512; y += 128) {
    for (let x = 0; x <= 512; x += 128) {
      // Diamond star
      ctx.fillStyle = goldColor;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();

      // Petal flourishes
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y - 14, 4, 9, 0, 0, Math.PI * 2);
      ctx.ellipse(x, y + 14, 4, 9, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 14, y, 9, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 14, y, 9, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 4);
  return texture;
}

// 5. Ornate Persian Area Rug Texture
export function createOrnateRugTexture(baseColor = '#991b1b', borderGold = '#d97706'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  // Base ruby red field
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 768);

  // Outer gold fringed border
  ctx.strokeStyle = borderGold;
  ctx.lineWidth = 18;
  ctx.strokeRect(18, 18, 512 - 36, 768 - 36);

  // Inner decorative border
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 8;
  ctx.strokeRect(36, 36, 512 - 72, 768 - 72);

  ctx.strokeStyle = borderGold;
  ctx.lineWidth = 4;
  ctx.strokeRect(46, 46, 512 - 92, 768 - 92);

  // Center medallion
  ctx.fillStyle = borderGold;
  ctx.beginPath();
  ctx.ellipse(256, 384, 80, 130, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(256, 384, 55, 90, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(256, 384, 18, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
