/**
 * BreachWise Live Background Script
 * ---------------------------------
 * PASTE YOUR ANTIGRAVITY / LIVE BACKGROUND SCRIPT HERE.
 *
 * The canvas is passed in as the first argument.
 * Example: const ctx = canvas.getContext("2d");
 *
 * Do NOT use document.write or add your own <script> tags.
 */

window.initBreachWiseLiveBackground = function (canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // ─── PASTE YOUR SCRIPT BELOW THIS LINE ───────────────────────────
  // Replace everything between the markers with your script.
  // If your script uses `document.getElementById('canvas')`, change it to use the `canvas` variable above.

  /* --- START PASTE --- */

  // Default fallback animation (replace with your script)
  let w = (canvas.width = window.innerWidth);
  let h = (canvas.height = window.innerHeight);

  const particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 12 + 4,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8 - 0.2,
  }));

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(37, 99, 235, 0.15)";
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  draw();

  window.addEventListener("resize", () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  });

  /* --- END PASTE --- */
};
