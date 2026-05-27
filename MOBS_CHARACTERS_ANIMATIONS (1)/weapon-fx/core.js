// =========================================================================
//  Weapon FX — shared canvas utilities
//  All effect functions take (ctx, canvas, t) where t ∈ [0,1].
// =========================================================================

const FX = (typeof window !== 'undefined') ? (window.FX = window.FX || {}) : {};

FX.colors = {
  cyan:   '#00FFFF',
  purple: '#B300FF',
  pink:   '#FF00AA',
  green:  '#33FF99',
  yellow: '#FFCC00',
  white:  '#FFFFFF',
  red:    '#FF3333',
  dim:    '#8A8AA8',
};

// Easings
FX.ease = {
  outCubic:    t => 1 - Math.pow(1 - t, 3),
  inCubic:     t => t * t * t,
  inOutCubic:  t => t < 0.5 ? 4 * t**3 : 1 - Math.pow(-2*t + 2, 3) / 2,
  outQuint:    t => 1 - Math.pow(1 - t, 5),
  outBack:     (t, s=1.70158) => 1 + (s+1) * Math.pow(t-1, 3) + s * Math.pow(t-1, 2),
};

// Phase-mapper. Pass an array of [endT, name]. Returns { phase, k } where k is the
// 0..1 progress WITHIN that phase. Usage:
//   const {phase, k} = FX.phase(t, [[0.25,'windup'],[0.55,'strike'],[1.0,'decay']]);
FX.phase = function(t, phases) {
  let prev = 0;
  for (const [end, name] of phases) {
    if (t <= end || end === phases[phases.length-1][0]) {
      const k = (end === prev) ? 1 : (t - prev) / (end - prev);
      return { phase: name, k: Math.max(0, Math.min(1, k)) };
    }
    prev = end;
  }
  return { phase: phases[phases.length-1][1], k: 1 };
};

// Player anchor — left-center so we have arena room to the right
FX.playerPos = function(canvas) {
  return { x: canvas.width * 0.30, y: canvas.height * 0.50 };
};

// =========================================================================
//  Backdrop + entity primitives
// =========================================================================

FX.clear = function(ctx, canvas) {
  // Dark base
  ctx.fillStyle = '#0A0A10';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Faint biome glow
  const grad = ctx.createRadialGradient(
    canvas.width * 0.5, canvas.height * 0.5, 0,
    canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.7
  );
  grad.addColorStop(0, 'rgba(40, 20, 60, 0.4)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 1;
  const step = 32;
  for (let x = 0; x < canvas.width; x += step) {
    ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(canvas.width, y + 0.5); ctx.stroke();
  }
};

// Top-down player marker. Draw EARLY so effects render over.
FX.drawPlayer = function(ctx, canvas) {
  const p = FX.playerPos(canvas);
  // Soft cyan halo
  const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 30);
  halo.addColorStop(0, 'rgba(0,255,255,0.5)');
  halo.addColorStop(1, 'rgba(0,255,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(p.x, p.y, 30, 0, Math.PI * 2); ctx.fill();
  // Body
  ctx.fillStyle = 'rgba(0,180,200,0.95)';
  ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill();
  // Inner head
  ctx.fillStyle = '#E8FFFF';
  ctx.beginPath(); ctx.arc(p.x, p.y - 2, 7, 0, Math.PI * 2); ctx.fill();
};

// Top-down enemy
FX.drawEnemy = function(ctx, x, y, opts = {}) {
  const r = opts.radius ?? 13;
  const hit = opts.hitFlash ?? 0;  // 0..1, 1 = full white tint
  const dead = opts.dead ?? false;
  if (dead) return;

  ctx.fillStyle = 'rgba(255,80,80,0.18)';
  ctx.beginPath(); ctx.arc(x, y, r + 4, 0, Math.PI * 2); ctx.fill();

  const body = hit > 0
    ? `rgba(${255}, ${80 + 175 * hit}, ${80 + 175 * hit}, 0.95)`
    : 'rgba(180, 50, 50, 0.95)';
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

  // Eye dots
  ctx.fillStyle = hit > 0 ? '#FFFFFF' : '#FF3333';
  ctx.beginPath(); ctx.arc(x - 4, y - 2, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 4, y - 2, 1.5, 0, Math.PI * 2); ctx.fill();
};

// =========================================================================
//  Drawing helpers
// =========================================================================

FX.glowLine = function(ctx, x1, y1, x2, y2, color, width, glow = 8) {
  if (width <= 0) return;
  ctx.shadowBlur = glow;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.shadowBlur = 0;
};

FX.glowCircle = function(ctx, x, y, r, color, fill = true, glow = 8, lw = 2) {
  if (r <= 0) return;
  ctx.shadowBlur = glow;
  ctx.shadowColor = color;
  if (fill) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.shadowBlur = 0;
};

FX.glowArc = function(ctx, cx, cy, r, start, sweep, color, width, glow = 12) {
  if (r <= 0 || width <= 0) return;
  ctx.shadowBlur = glow;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, start + sweep);
  ctx.stroke();
  ctx.shadowBlur = 0;
};

// Hex polygon points around (cx,cy) at radius r, rotation in radians.
FX.hexPoints = function(cx, cy, r, rot = 0) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = rot + i * Math.PI / 3;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
};

// Draw a polygon
FX.poly = function(ctx, pts, opts = {}) {
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]));
  ctx.closePath();
  if (opts.fill) { ctx.fillStyle = opts.fill; ctx.fill(); }
  if (opts.stroke) {
    if (opts.glow) { ctx.shadowBlur = opts.glow; ctx.shadowColor = opts.stroke; }
    ctx.strokeStyle = opts.stroke;
    ctx.lineWidth = opts.width || 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
};

// Jagged lightning polyline between two points, segments + amplitude.
FX.lightningPath = function(x1, y1, x2, y2, segments = 6, amp = 8, seed = 0) {
  // Deterministic pseudo-random based on seed so animation can be re-rendered identically
  let s = seed * 9301 + 49297;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

  const points = [[x1, y1]];
  const dx = (x2 - x1) / segments;
  const dy = (y2 - y1) / segments;
  // perpendicular unit
  const len = Math.hypot(x2 - x1, y2 - y1);
  const px = -((y2 - y1) / len);
  const py = ((x2 - x1) / len);
  for (let i = 1; i < segments; i++) {
    const r = (rand() - 0.5) * 2 * amp;
    points.push([x1 + dx * i + px * r, y1 + dy * i + py * r]);
  }
  points.push([x2, y2]);
  return points;
};

FX.drawLightning = function(ctx, points, color, width, glow = 14) {
  ctx.shadowBlur = glow;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]));
  ctx.stroke();
  ctx.shadowBlur = 0;
};
