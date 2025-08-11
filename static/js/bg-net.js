/*
 * Animated network background with a blue→orange gradient along the x‑axis.
 * Points wander slowly and lines fade based on distance. Adapted from various
 * open source examples (e.g. CodePen) and written without external deps.
 */

(function () {
  const canvas = document.getElementById('net-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;

  // Increase the number of points and connection distance for a denser, more dynamic network.
  // A higher count and larger distance make the animation more noticeable without overwhelming the viewer.
  // Increase counts for a more noticeable animation
  const POINTS_COUNT = 150;
  const MAX_DIST = 220;
  const points = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    // reposition points when resizing to keep them within viewport
    for (const p of points) {
      p.x = Math.random() * width;
      p.y = Math.random() * height;
    }
  }

  // Populate initial points with random positions and velocities
  for (let i = 0; i < POINTS_COUNT; i++) {
    points.push({
      x: 0,
      y: 0,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    });
  }

  window.addEventListener('resize', resize);
  resize();

  function blendColors(c1, c2, t) {
    return [
      Math.round(c1[0] * (1 - t) + c2[0] * t),
      Math.round(c1[1] * (1 - t) + c2[1] * t),
      Math.round(c1[2] * (1 - t) + c2[2] * t),
    ];
  }

  function updatePoints() {
    for (const p of points) {
      p.x += p.vx;
      p.y += p.vy;
      // bounce on edges
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    // Draw points with a color gradient across the x‑axis
    for (const p of points) {
      const t = width ? p.x / width : 0;
      // Blend from teal (16,181,166) to orange (255,106,61)
      const [r, g, b] = blendColors([16, 181, 166], [255, 106, 61], t);
      /* Draw each point with full opacity and a slightly larger radius for better visibility. */
      ctx.fillStyle = `rgba(${r},${g},${b},1)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw lines between close points with gradient colors
    for (let i = 0; i < POINTS_COUNT; i++) {
      for (let j = i + 1; j < POINTS_COUNT; j++) {
        const pi = points[i];
        const pj = points[j];
        const dx = pi.x - pj.x;
        const dy = pi.y - pj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          /* Increase the base alpha for lines so they remain visible even when far away. */
          const alpha = Math.min(1, (1 - dist / MAX_DIST) * 2.0);
          // Determine color based on the midpoint of the line
          const midX = (pi.x + pj.x) / 2;
          const t = width ? midX / width : 0;
          const [r, g, b] = blendColors([16, 181, 166], [255, 106, 61], t);
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(pi.x, pi.y);
          ctx.lineTo(pj.x, pj.y);
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    updatePoints();
    render();
    requestAnimationFrame(loop);
  }
  loop();
})();