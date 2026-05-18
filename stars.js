// Stars background — layered scrolling stars with mouse parallax
// Mirrors the React StarsBackground component in vanilla JS

function generateBoxShadow(count, color) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 4000) - 2000;
    const y = Math.floor(Math.random() * 4000) - 2000;
    parts.push(`${x}px ${y}px ${color}`);
  }
  return parts.join(', ');
}

function createStarLayer(count, size, duration, color) {
  const shadow = generateBoxShadow(count, color);

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 2000px;
    animation: starsScroll ${duration}s linear infinite;
    will-change: transform;
  `;

  // Two copies stacked — second starts at 2000px so scroll loops seamlessly
  [0, 2000].forEach(topOffset => {
    const dot = document.createElement('div');
    dot.style.cssText = `
      position: absolute;
      top: ${topOffset}px; left: 0;
      width: ${size}px; height: ${size}px;
      border-radius: 50%;
      background: transparent;
      box-shadow: ${shadow};
    `;
    wrapper.appendChild(dot);
  });

  return wrapper;
}

function initStars(container, canvasId, starColor = '#ffffff') {
  // Inject keyframes once
  if (!document.getElementById('stars-keyframes')) {
    const style = document.createElement('style');
    style.id = 'stars-keyframes';
    style.textContent = `
      @keyframes starsScroll {
        from { transform: translateY(0); }
        to   { transform: translateY(-2000px); }
      }
    `;
    document.head.appendChild(style);
  }

  const host = document.createElement('div');
  host.id = canvasId;
  host.style.cssText = `
    position: absolute;
    inset: 0;
    width: 100%; height: 100%;
    overflow: hidden;
    pointer-events: none;
  `;

  // Parallax wrapper
  const parallax = document.createElement('div');
  parallax.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%;';
  host.appendChild(parallax);

  // Three layers: small/slow, medium/mid, large/fast (matching the React component)
  parallax.appendChild(createStarLayer(1000, 1, 50,  starColor));
  parallax.appendChild(createStarLayer(400,  2, 100, starColor));
  parallax.appendChild(createStarLayer(200,  3, 150, starColor));

  container.insertBefore(host, container.firstChild);

  // Mouse parallax
  const factor = 0.05;
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  window.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    targetX = -(e.clientX - cx) * factor;
    targetY = -(e.clientY - cy) * factor;
  });

  let rafId;
  function tick() {
    // Spring-style lerp (stiffness ~50, damping ~20 approximated)
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;
    parallax.style.transform = `translate(${currentX}px, ${currentY}px)`;
    rafId = requestAnimationFrame(tick);
  }
  tick();
}

window.addEventListener('load', function () {
  const hero = document.querySelector('.hero');
  if (hero) initStars(hero, 'stars-hero');

  const contact = document.querySelector('#contact');
  if (contact) initStars(contact, 'stars-contact');
});
