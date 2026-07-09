/**
 * BreachWise Live Background Script
 * ---------------------------------
 * Connected Constellation particle network background.
 */

window.initBreachWiseLiveBackground = function (canvas) {
  // If there is an existing cleanup function, call it to prevent multiple loops
  if (canvas._cleanupBG) {
    canvas._cleanupBG();
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let w = (canvas.width = window.innerWidth);
  let h = (canvas.height = window.innerHeight);

  const maxDistance = 115;
  const mouse = { x: null, y: null, radius: 160 };

  const handleMouseMove = (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  };

  const handleMouseLeave = () => {
    mouse.x = null;
    mouse.y = null;
  };

  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseleave", handleMouseLeave);
  window.addEventListener("blur", handleMouseLeave);

  // Dynamic particle count depending on viewport size to maintain high frame rate
  const particleCount = Math.min(75, Math.floor((w * h) / 19000));
  const particles = Array.from({ length: particleCount }, () => {
    const isPurple = Math.random() > 0.65;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      colorType: isPurple ? "purple" : "cyan",
    };
  });

  let animationFrameId;

  function draw() {
    const isDark = document.documentElement.classList.contains("dark");

    ctx.clearRect(0, 0, w, h);

    // Update and draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around or bounce off boundaries
      if (p.x < -10) p.x = w + 10;
      else if (p.x > w + 10) p.x = -10;
      
      if (p.y < -10) p.y = h + 10;
      else if (p.y > h + 10) p.y = -10;

      // Interactive hover force (subtle displacement)
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          // Slowly push particles away from cursor
          p.x -= (dx / dist) * force * 0.8;
          p.y -= (dy / dist) * force * 0.8;
        }
      }

      const currentRadius = isDark ? p.r : (p.r * 5);

      ctx.beginPath();
      ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);

      if (isDark) {
        ctx.fillStyle = p.colorType === "purple" 
          ? "rgba(168, 85, 247, 0.45)" 
          : "rgba(34, 211, 238, 0.5)";
        ctx.fill();

        // Connect close particles with fading lines (only in dark mode)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.colorType === "purple" 
              ? `rgba(168, 85, 247, ${alpha})` 
              : `rgba(34, 211, 238, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      } else {
        ctx.fillStyle = "rgba(37, 99, 235, 0.15)";
        ctx.fill();
      }
    }

    animationFrameId = requestAnimationFrame(draw);
  }

  draw();

  const handleResize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  };

  window.addEventListener("resize", handleResize);

  // Store cleanup function
  canvas._cleanupBG = () => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseleave", handleMouseLeave);
    window.removeEventListener("blur", handleMouseLeave);
    window.removeEventListener("resize", handleResize);
    cancelAnimationFrame(animationFrameId);
  };
};
