// =========================================================================
//  Weapon FX — runner: animates every <canvas data-fx="..."> on the page
// =========================================================================

(function() {
  const REGISTRY = {
    greatsword: FX.greatsword,
    needle:     FX.needle,
    beam:       FX.beam,
    pulse:      FX.pulse,
    hex:        FX.hex,
    stack:      FX.stack,
    chain:      FX.chain,
    dagger:     FX.dagger,
  };

  let canvases = [];

  function collect() {
    canvases = Array.from(document.querySelectorAll('canvas[data-fx]')).map(c => {
      // Backing-store sized for DPR so it stays crisp
      const dpr = window.devicePixelRatio || 1;
      const rect = c.getBoundingClientRect();
      const w = c.clientWidth || rect.width || 400;
      const h = c.clientHeight || rect.height || 240;
      c.width = w * dpr;
      c.height = h * dpr;
      const ctx = c.getContext('2d');
      ctx.scale(dpr, dpr);
      // Override .width/.height for FX code (they assume CSS px)
      Object.defineProperty(c, 'width',  { configurable: true, get() { return w; } });
      Object.defineProperty(c, 'height', { configurable: true, get() { return h; } });
      return {
        canvas: c,
        ctx,
        fx: REGISTRY[c.dataset.fx],
        cycle:  parseFloat(c.dataset.cycle || '1.2'),    // sec per loop
        active: parseFloat(c.dataset.active || '0.5'),   // active portion (rest paused at t=0)
        frozenT: c.dataset.frozen !== undefined ? parseFloat(c.dataset.frozen) : null,
      };
    });
  }

  function start() {
    const t0 = performance.now();
    function tick(now) {
      const elapsed = (now - t0) / 1000;
      for (const entry of canvases) {
        if (!entry.fx) continue;
        let t;
        if (entry.frozenT !== null) {
          t = entry.frozenT;
        } else {
          const local = elapsed % entry.cycle;
          // Active phase is local 0..active, then frozen at t=1 for a beat,
          // then resets. Use only active portion for the effect timeline.
          t = Math.min(1, local / entry.active);
          // If we want pure-loop without "pause at finish", swap to:
          //   t = (local / entry.cycle);
        }
        entry.fx(entry.ctx, entry.canvas, t);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function init() { collect(); start(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Re-collect on resize
  window.addEventListener('resize', () => { collect(); });
})();
