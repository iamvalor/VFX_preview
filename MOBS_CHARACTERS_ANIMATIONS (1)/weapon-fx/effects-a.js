// =========================================================================
//  Weapon FX — Melee + Pulse effects (4 of 8)
//  Each function: (ctx, canvas, t)  where t ∈ [0,1]
// =========================================================================

// ---- 1. PROTOCOL: HOLLOW (Greatsword) ----------------------------------
FX.greatsword = function(ctx, canvas, t) {
  FX.clear(ctx, canvas);
  const p = FX.playerPos(canvas);

  // Two enemies in arc range
  FX.drawEnemy(ctx, canvas.width * 0.50, canvas.height * 0.42, { hitFlash: t > 0.30 && t < 0.55 ? 1 - (t - 0.30) / 0.25 : 0 });
  FX.drawEnemy(ctx, canvas.width * 0.55, canvas.height * 0.62, { hitFlash: t > 0.30 && t < 0.55 ? 1 - (t - 0.30) / 0.25 : 0 });

  FX.drawPlayer(ctx, canvas);

  const reach = 110;
  const arcSpan = 2.0;       // ~115°
  const facing = 0;          // pointing right (radians)
  const { phase, k } = FX.phase(t, [[0.25, 'windup'], [0.55, 'strike'], [1.0, 'decay']]);

  if (phase === 'windup') {
    // Faint trailing arc
    FX.glowArc(ctx, p.x, p.y, reach, facing - arcSpan/2, arcSpan,
      `rgba(0,255,255,${0.25 * k})`, 6 * k, 4);

  } else if (phase === 'strike') {
    // Thick cyan body
    FX.glowArc(ctx, p.x, p.y, reach, facing - arcSpan/2, arcSpan,
      FX.colors.cyan, 14, 16);
    // White-hot inner core
    FX.glowArc(ctx, p.x, p.y, reach, facing - arcSpan/2 + 0.12, arcSpan - 0.24,
      '#FFFFFF', 5, 12);
    // Sparks shooting outward at arc edge
    for (let i = 0; i < 14; i++) {
      const ang = facing + (i - 6.5) * 0.16;
      const r = reach * (0.85 + 0.30 * FX.ease.outCubic(k));
      const sx = p.x + Math.cos(ang) * r;
      const sy = p.y + Math.sin(ang) * r;
      FX.glowCircle(ctx, sx, sy,
        2.5 + 2.5 * (1 - k),
        `rgba(255,255,255,${1 - k * 0.7})`, true, 8);
    }

  } else {
    // decay
    FX.glowArc(ctx, p.x, p.y, reach, facing - arcSpan/2, arcSpan,
      `rgba(0,255,255,${0.6 * (1 - k)})`, 8 * (1 - k * 0.7), 8);
  }
};


// ---- 2. NEEDLE.DLL (Thrust) --------------------------------------------
FX.needle = function(ctx, canvas, t) {
  FX.clear(ctx, canvas);
  const p = FX.playerPos(canvas);

  const reach = 90;
  // single enemy at thrust tip
  const ex = p.x + reach * 0.85;
  const ey = p.y;
  FX.drawEnemy(ctx, ex, ey, { hitFlash: t > 0.35 && t < 0.65 ? 1 - (t - 0.35) / 0.30 : 0 });

  FX.drawPlayer(ctx, canvas);

  const { phase, k } = FX.phase(t, [[0.40, 'extend'], [0.60, 'hit'], [1.0, 'retract']]);

  let lineLen;
  if (phase === 'extend')   lineLen = reach * FX.ease.outQuint(k);
  else if (phase === 'hit') lineLen = reach;
  else                      lineLen = reach * (1 - FX.ease.inCubic(k));

  const tipX = p.x + lineLen;
  const tipY = p.y;
  const tipAlpha = (phase === 'retract') ? (1 - k) : 1;

  // Thin needle line
  FX.glowLine(ctx, p.x + 14, p.y, tipX, tipY,
    `rgba(0,255,255,${tipAlpha})`, 3, 12);
  // White core
  FX.glowLine(ctx, p.x + 14, p.y, tipX, tipY,
    `rgba(255,255,255,${0.7 * tipAlpha})`, 1.2, 4);

  // Hit burst
  if (phase === 'hit' || (phase === 'retract' && k < 0.4)) {
    const burstAlpha = (phase === 'hit') ? 1 : (1 - k / 0.4);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const r = 6 + 14 * (phase === 'hit' ? k : 1);
      const sx = tipX + Math.cos(ang) * r;
      const sy = tipY + Math.sin(ang) * r;
      FX.glowCircle(ctx, sx, sy, 2, `rgba(0,255,255,${burstAlpha})`, true, 6);
    }
    FX.glowCircle(ctx, tipX, tipY, 5, `rgba(255,255,255,${burstAlpha})`, true, 10);
  }
};


// ---- 3. GHOST BEAM (Continuous laser) ----------------------------------
FX.beam = function(ctx, canvas, t) {
  FX.clear(ctx, canvas);
  const p = FX.playerPos(canvas);

  // Enemies along the beam
  const beamEnd = p.x + 240;
  FX.drawEnemy(ctx, p.x + 130, p.y + 6, { hitFlash: t > 0.10 ? 0.8 : 0 });
  FX.drawEnemy(ctx, p.x + 200, p.y - 8, { hitFlash: t > 0.10 ? 0.8 : 0 });

  FX.drawPlayer(ctx, canvas);

  const { phase, k } = FX.phase(t, [[0.10, 'ramp'], [0.80, 'steady'], [1.0, 'decay']]);

  let intensity, length;
  if (phase === 'ramp')        { intensity = k;             length = p.x + 22 + (beamEnd - p.x - 22) * FX.ease.outCubic(k); }
  else if (phase === 'steady') { intensity = 1;             length = beamEnd; }
  else                         { intensity = 1 - k * 0.7;   length = beamEnd; }

  // Outer purple halo
  FX.glowLine(ctx, p.x + 16, p.y, length, p.y,
    `rgba(179,0,255,${0.55 * intensity})`, 22, 28);
  // Mid cyan
  FX.glowLine(ctx, p.x + 16, p.y, length, p.y,
    `rgba(0,255,255,${0.9 * intensity})`, 9, 14);
  // White-hot core
  FX.glowLine(ctx, p.x + 16, p.y, length, p.y,
    `rgba(255,255,255,${intensity})`, 2.5, 6);

  // Heat shimmer rising along beam (during steady)
  if (phase !== 'decay' || intensity > 0.3) {
    const shimmerCount = 8;
    for (let i = 0; i < shimmerCount; i++) {
      const phase_i = ((t * 2) + i / shimmerCount) % 1;
      const sx = p.x + 22 + (length - p.x - 22) * (i / shimmerCount);
      const sy = p.y - phase_i * 22;
      const a = (1 - phase_i) * 0.45 * intensity;
      FX.glowCircle(ctx, sx, sy, 1.5, `rgba(255,180,255,${a})`, true, 4);
    }
  }

  // Tip burst
  if (intensity > 0.3) {
    FX.glowCircle(ctx, length, p.y, 14, `rgba(179,0,255,${0.5 * intensity})`, true, 14);
    FX.glowCircle(ctx, length, p.y, 5,  `rgba(255,255,255,${intensity})`, true, 10);
  }
};


// ---- 4. ECHO WALL (Force-field pulse) ----------------------------------
FX.pulse = function(ctx, canvas, t) {
  FX.clear(ctx, canvas);
  const p = FX.playerPos(canvas);

  // Enemies — the ones inside the expanding ring get hit
  const enemies = [
    { x: p.x + 60,  y: p.y - 40 },
    { x: p.x - 30,  y: p.y + 50 },
    { x: p.x + 90,  y: p.y + 30 },
    { x: p.x - 60,  y: p.y - 20 },
    { x: p.x + 120, y: p.y - 70 },
  ];
  const maxR = 130;
  const ringR = maxR * FX.ease.outQuint(t);
  enemies.forEach(e => {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    const hit = d <= ringR ? Math.max(0, 1 - (ringR - d) / 30) : 0;
    FX.drawEnemy(ctx, e.x, e.y, { hitFlash: hit });
  });

  FX.drawPlayer(ctx, canvas);

  // 3 expanding rings, staggered
  for (let i = 0; i < 3; i++) {
    const delay = i * 0.08;
    const tt = Math.max(0, Math.min(1, (t - delay) / (1 - delay)));
    if (tt <= 0) continue;
    const r = maxR * FX.ease.outQuint(tt);
    const a = (1 - tt) * (i === 0 ? 1 : 0.5);
    ctx.shadowBlur = 14;
    ctx.shadowColor = FX.colors.cyan;
    ctx.strokeStyle = `rgba(0,255,255,${a})`;
    ctx.lineWidth = 3 + (1 - tt) * 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Inner solid disc that fades fast
  if (t < 0.35) {
    const k = t / 0.35;
    const a = (1 - k) * 0.55;
    FX.glowCircle(ctx, p.x, p.y, 28 + 20 * k, `rgba(0,255,255,${a})`, true, 18);
  }
};
