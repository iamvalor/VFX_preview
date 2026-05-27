// =========================================================================
//  Weapon FX — Tech + Projectile effects (4 of 8)
// =========================================================================

// ---- 5. PLAGUE.EXE (Hex blast) -----------------------------------------
FX.hex = function(ctx, canvas, t) {
  FX.clear(ctx, canvas);
  const p = FX.playerPos(canvas);

  const enemies = [
    { x: p.x + 50,  y: p.y - 30 },
    { x: p.x - 20,  y: p.y + 60 },
    { x: p.x + 90,  y: p.y + 40 },
    { x: p.x - 50,  y: p.y + 10 },
  ];
  const maxR = 110;
  const ringR = maxR * FX.ease.outQuint(t);
  enemies.forEach(e => {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    const hit = d <= ringR ? Math.max(0, 1 - (ringR - d) / 24) : 0;
    FX.drawEnemy(ctx, e.x, e.y, { hitFlash: hit });
  });

  FX.drawPlayer(ctx, canvas);

  const { phase, k } = FX.phase(t, [[0.20, 'form'], [0.65, 'burst'], [1.0, 'decay']]);

  // Inner hex (scales up + rotates)
  const formA = phase === 'form' ? k : 1;
  const burstScale = phase === 'form' ? 0.6 + 0.4 * k
                    : phase === 'burst' ? 1 + 0.4 * FX.ease.outCubic(k)
                    : 1.4;
  const rot = t * Math.PI * 0.6;
  const innerR = 26 * burstScale;
  const innerPts = FX.hexPoints(p.x, p.y, innerR, rot);
  const innerA = phase === 'decay' ? (1 - k) * 0.8 : formA;
  ctx.shadowBlur = 14; ctx.shadowColor = FX.colors.pink;
  FX.poly(ctx, innerPts, {
    fill: `rgba(255,0,170,${0.18 * innerA})`,
    stroke: `rgba(255,0,170,${innerA})`,
    width: 2.5,
  });
  ctx.shadowBlur = 0;

  // Expanding outer hex grid
  if (phase !== 'form') {
    const outerR = maxR * (phase === 'burst' ? FX.ease.outQuint(k) : 1);
    const outerA = phase === 'burst' ? (1 - k * 0.5) : (1 - k) * 0.5;
    const outerPts = FX.hexPoints(p.x, p.y, outerR, -rot * 0.5);
    ctx.shadowBlur = 18; ctx.shadowColor = FX.colors.pink;
    FX.poly(ctx, outerPts, {
      stroke: `rgba(255,0,170,${outerA})`,
      width: 2.2,
    });
    ctx.shadowBlur = 0;

    // Vertices of outer hex glow
    outerPts.forEach(pt => {
      FX.glowCircle(ctx, pt[0], pt[1], 4, `rgba(255,0,170,${outerA})`, true, 10);
    });
  }

  // Virus dots scattering outward
  if (phase !== 'form') {
    const seed = Math.floor(t * 100) === 0 ? 1 : 1; // stable
    let rs = 1;
    const rand = () => { rs = (rs * 9301 + 49297) % 233280; return rs / 233280; };
    for (let i = 0; i < 18; i++) {
      const ang = rand() * Math.PI * 2;
      const speed = 60 + rand() * 80;
      const tt = phase === 'burst' ? k : 1;
      const r = 20 + speed * tt;
      const dx = p.x + Math.cos(ang) * r;
      const dy = p.y + Math.sin(ang) * r;
      const a = (1 - tt) * 0.8 * (phase === 'decay' ? 1 - k : 1);
      FX.glowCircle(ctx, dx, dy, 1.5, `rgba(255,0,170,${a})`, true, 6);
    }
  }
};


// ---- 6. STACK OVERFLOW (Injection + stack counter) ---------------------
FX.stack = function(ctx, canvas, t) {
  FX.clear(ctx, canvas);
  const p = FX.playerPos(canvas);
  const target = { x: p.x + 200, y: p.y - 10 };

  const { phase, k } = FX.phase(t, [[0.15, 'inject'], [0.30, 'pop'], [1.0, 'linger']]);

  // Injection beam from player to target
  const beamA = phase === 'linger' ? 1 - k * 0.85 : 1;
  // Beam: thin green with droplet pulses
  if (phase === 'inject') {
    const drawLen = k;
    const cx = p.x + 16 + (target.x - p.x - 16) * drawLen;
    const cy = p.y + (target.y - p.y) * drawLen;
    FX.glowLine(ctx, p.x + 16, p.y, cx, cy, `rgba(51,255,153,${beamA})`, 4, 12);
    FX.glowLine(ctx, p.x + 16, p.y, cx, cy, '#FFFFFF', 1.5, 4);
  } else {
    FX.glowLine(ctx, p.x + 16, p.y, target.x, target.y, `rgba(51,255,153,${beamA * 0.9})`, 4, 12);
    FX.glowLine(ctx, p.x + 16, p.y, target.x, target.y, `rgba(255,255,255,${beamA})`, 1.5, 4);
  }

  // Hit flash on target
  const hit = (phase === 'pop') ? 1 - k : phase === 'linger' ? 0 : 0;
  FX.drawEnemy(ctx, target.x, target.y, { hitFlash: hit });
  FX.drawPlayer(ctx, canvas);

  // Drip particles falling from target (during linger)
  if (phase === 'linger' || phase === 'pop') {
    const localT = phase === 'linger' ? k : 0;
    let s = 1;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < 8; i++) {
      const offset = rand();
      const tt = (localT + offset) % 1;
      const dx = target.x + (rand() - 0.5) * 24;
      const dy = target.y + 14 + tt * 30;
      const a = (1 - tt) * 0.6;
      FX.glowCircle(ctx, dx, dy, 1.5, `rgba(51,255,153,${a})`, true, 6);
    }
  }

  // Stack counter above target (pops on phase=pop, lingers fading)
  if (phase === 'pop' || phase === 'linger') {
    const stackCount = 3;
    const popK = phase === 'pop' ? FX.ease.outBack(k) : 1;
    const stackA = phase === 'linger' ? (1 - k * 0.4) : 1;
    const yOffset = phase === 'pop' ? -28 - 14 * popK : -42 - k * 16;
    ctx.save();
    ctx.translate(target.x, target.y + yOffset);
    ctx.scale(popK, popK);
    // Pill background
    ctx.shadowBlur = 14;
    ctx.shadowColor = FX.colors.green;
    ctx.fillStyle = `rgba(8, 20, 14, ${stackA})`;
    ctx.strokeStyle = `rgba(51,255,153,${stackA})`;
    ctx.lineWidth = 1.5;
    const w = 52, h = 18;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-w/2, -h/2, w, h, 4) : (() => {
      ctx.moveTo(-w/2 + 4, -h/2); ctx.lineTo(w/2 - 4, -h/2);
      ctx.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + 4);
      ctx.lineTo(w/2, h/2 - 4); ctx.quadraticCurveTo(w/2, h/2, w/2 - 4, h/2);
      ctx.lineTo(-w/2 + 4, h/2); ctx.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - 4);
      ctx.lineTo(-w/2, -h/2 + 4); ctx.quadraticCurveTo(-w/2, -h/2, -w/2 + 4, -h/2);
    })();
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(51,255,153,${stackA})`;
    ctx.fillText(`STACK ×${stackCount}`, 0, 1);
    ctx.restore();
  }
};


// ---- 7. BLOOD.HEX (Chain lightning) ------------------------------------
FX.chain = function(ctx, canvas, t) {
  FX.clear(ctx, canvas);
  const p = FX.playerPos(canvas);

  const enemies = [
    { x: p.x + 110, y: p.y - 60 },   // first
    { x: p.x + 200, y: p.y + 10 },   // bounce 1
    { x: p.x + 130, y: p.y + 80 },   // bounce 2
  ];

  // Phase: strikes happen sequentially.
  // 0.00-0.10: player -> e1
  // 0.10-0.20: e1 -> e2
  // 0.20-0.30: e2 -> e3
  // 0.30-1.00: all fade
  const segments = [
    { start: [p.x + 16, p.y], end: enemies[0], strike: 0.00 },
    { start: enemies[0],       end: enemies[1], strike: 0.10 },
    { start: enemies[1],       end: enemies[2], strike: 0.20 },
  ];

  // Hit flashes
  enemies.forEach((e, i) => {
    const struck = t > segments[i].strike;
    const local = struck ? Math.min(1, (t - segments[i].strike) / 0.20) : 0;
    FX.drawEnemy(ctx, e.x, e.y, { hitFlash: struck ? 1 - local : 0 });
  });

  FX.drawPlayer(ctx, canvas);

  // Draw bolts
  segments.forEach((seg, i) => {
    if (t < seg.strike) return;
    const localT = (t - seg.strike) / 0.7;        // visible duration ~0.7s
    if (localT > 1) return;
    const a = 1 - localT;
    const s = seg.start;
    const e = seg.end;
    // Jagged path — re-seed each frame slightly so it crackles
    const seed = (i + 1) * 1000 + Math.floor(t * 60);
    const pts = FX.lightningPath(s.x || s[0], s.y || s[1], e.x, e.y, 8, 10, seed);
    // Outer pink halo
    FX.drawLightning(ctx, pts, `rgba(255,0,170,${0.7 * a})`, 6, 18);
    // White-hot core
    FX.drawLightning(ctx, pts, `rgba(255,255,255,${a})`, 1.5, 6);

    // Spark at endpoint
    if (localT < 0.4) {
      FX.glowCircle(ctx, e.x, e.y, 9, `rgba(255,0,170,${(1 - localT / 0.4)})`, true, 16);
    }
  });
};


// ---- 8. PHANTOM DAGGER (Projectile) ------------------------------------
FX.dagger = function(ctx, canvas, t) {
  FX.clear(ctx, canvas);
  const p = FX.playerPos(canvas);

  // Target enemy at the right
  const target = { x: p.x + 280, y: p.y - 40 };
  const struck = t > 0.85;
  FX.drawEnemy(ctx, target.x, target.y, { hitFlash: struck ? 1 - (t - 0.85) / 0.15 : 0 });

  FX.drawPlayer(ctx, canvas);

  // Dagger flight from player toward target
  const flightT = Math.min(1, t / 0.85);
  const dx = p.x + 18 + (target.x - p.x - 18) * flightT;
  const dy = p.y + (target.y - p.y) * flightT;

  // Velocity vector for orientation
  const vx = target.x - p.x - 18;
  const vy = target.y - p.y;
  const ang = Math.atan2(vy, vx);

  // Trail particles (drawn first, behind dagger)
  const trailCount = 14;
  for (let i = 1; i <= trailCount; i++) {
    const lag = i / trailCount * 0.18;
    const tt = Math.max(0, flightT - lag);
    const tx = p.x + 18 + (target.x - p.x - 18) * tt;
    const ty = p.y + (target.y - p.y) * tt;
    const a = (1 - i / trailCount) * 0.7;
    const size = 4 - (i / trailCount) * 3;
    FX.glowCircle(ctx, tx, ty, size, `rgba(0,255,255,${a})`, true, 8);
  }

  // Dagger silhouette (spins as it flies)
  ctx.save();
  ctx.translate(dx, dy);
  ctx.rotate(ang + t * Math.PI * 4);  // continuous spin
  ctx.shadowBlur = 14;
  ctx.shadowColor = FX.colors.cyan;
  // Blade
  ctx.fillStyle = `rgba(0,255,255,0.95)`;
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(-10, -3);
  ctx.lineTo(14, -1);
  ctx.lineTo(16, 0);
  ctx.lineTo(14, 1);
  ctx.lineTo(-10, 3);
  ctx.closePath();
  ctx.fill();
  // White edge highlight
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(14, 0);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Impact burst at target
  if (struck) {
    const k = (t - 0.85) / 0.15;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = 10 + 18 * k;
      const sx = target.x + Math.cos(a) * r;
      const sy = target.y + Math.sin(a) * r;
      FX.glowCircle(ctx, sx, sy, 3 * (1 - k), `rgba(0,255,255,${1 - k})`, true, 10);
    }
    FX.glowCircle(ctx, target.x, target.y, 6 + 8 * k, `rgba(255,255,255,${1 - k})`, true, 14);
  }
};
