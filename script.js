// Wilson Web Design and Hosting — script.js

// ---- NAV BAR SCROLL BLUR ----
(function () {
  const bar = document.querySelector('.nav-bar');
  if (!bar) return;
  const onScroll = () => bar.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();



// ---- BUDGET BUTTONS ----
(function () {
  const btns = document.querySelectorAll('.budget-btn');
  const input = document.getElementById('budget-input');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (input) input.value = btn.dataset.value;
    });
  });
})();

// ---- HIGHLIGHTS TICKER ----
(function () {
  const track = document.querySelector('.highlights-track');
  if (!track) return;

  const originals = Array.from(track.children);
  originals.forEach(el => track.appendChild(el.cloneNode(true)));

  function setDist() {
    const half = track.scrollWidth / 2;
    track.style.setProperty('--ticker-half', `-${half}px`);
  }

  // Wait for fonts so text widths are accurate before measuring
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    setDist();
    window.addEventListener('resize', setDist);
  });
})();

// ---- TESTIMONIAL TICKER ----
(function () {
  const track = document.getElementById('carouselTrack');
  if (!track) return;
  const originals = Array.from(track.children);
  originals.forEach(card => track.appendChild(card.cloneNode(true)));

  const track2 = document.getElementById('carouselTrack2');
  if (!track2) return;
  const originals2 = Array.from(track2.children);
  originals2.forEach(card => track2.appendChild(card.cloneNode(true)));
})();

// Intersection Observer for fade-in animations
const observerOptions = { threshold: 0.08, rootMargin: '0px 0px -40px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Individual card fade-ups
document.querySelectorAll(
  '.problem-card, .service-card, .work-card, .process-step, .pricing-block, .faq-item'
).forEach(el => {
  el.classList.add('fade-up');
  observer.observe(el);
});

// Section-level fade-ins
document.querySelectorAll(
  '.testimonials, .work, .pricing, .faq, .footer, .footer-bar'
).forEach((el, i) => {
  el.classList.add('section-fade');
  observer.observe(el);
});

// Custom select dropdowns
document.querySelectorAll('.custom-select').forEach(function (select) {
  const trigger  = select.querySelector('.custom-select-trigger');
  const valueEl  = select.querySelector('.custom-select-value');
  const options  = select.querySelectorAll('.custom-select-option');
  const input    = select.querySelector('.custom-select-input');

  trigger.addEventListener('click', function () {
    select.classList.toggle('open');
  });

  options.forEach(function (option) {
    option.addEventListener('click', function () {
      valueEl.textContent = option.textContent;
      trigger.classList.add('has-value');
      input.value = option.getAttribute('data-value');
      options.forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      select.classList.remove('open');
    });
  });

  document.addEventListener('click', function (e) {
    if (!select.contains(e.target)) select.classList.remove('open');
  });
});

// Footer CTA form handler

// Contact form handler
function handleSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Sending...';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = "We'll be in touch within 24 hours!";
    btn.style.background = 'linear-gradient(135deg, #16a34a, #4ade80)';
    e.target.reset();
  }, 1200);
}

// Newsletter handler
function handleNewsletter(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.textContent = 'Subscribed!';
  btn.style.background = 'linear-gradient(135deg, #16a34a, #4ade80)';
  btn.disabled = true;
  e.target.querySelector('input').value = '';
}

// FAQ accordion (mobile only)
function setFaqHeight(p, open) {
  if (open) {
    p.style.height = p.scrollHeight + 'px';
  } else {
    p.style.height = p.scrollHeight + 'px'; // set explicit before collapsing
    requestAnimationFrame(() => { p.style.height = '0'; });
  }
}

document.querySelectorAll('.faq-item').forEach(item => {
  item.addEventListener('click', () => {
    if (window.innerWidth > 600) return;
    const p = item.querySelector('p');
    const isOpen = item.classList.contains('open');

    // Close all open items
    document.querySelectorAll('.faq-item.open').forEach(i => {
      i.classList.remove('open');
      setFaqHeight(i.querySelector('p'), false);
    });

    // Open clicked if it wasn't already open
    if (!isOpen) {
      item.classList.add('open');
      setFaqHeight(p, true);
    }
  });
});

// Active nav link highlight
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-pill a');

window.addEventListener('scroll', () => {
  let current = '';
  const scrollY = window.scrollY;
  const atBottom = scrollY + window.innerHeight >= document.body.scrollHeight - 80;

  if (atBottom) {
    current = sections[sections.length - 1]?.getAttribute('id') || '';
  } else {
    sections.forEach(section => {
      if (scrollY >= section.offsetTop - 120) {
        current = section.getAttribute('id');
      }
    });
  }

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});
