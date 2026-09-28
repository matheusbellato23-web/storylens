/* ======================================
   STORYLENS — JS
   Preloader, Cursor, Navbar, Animations,
   Carousel, Counter, Form, Modal
====================================== */

/* ── Preloader ─────────────────────── */
function initPreloader() {
  const loader = document.getElementById('preloader');
  const bar    = document.querySelector('.preloader-bar');
  const pct    = document.querySelector('.preloader-pct');

  if (!loader) return;

  function dismiss() {
    if (bar) bar.style.width = '100%';
    if (pct) pct.textContent = '100%';
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.classList.remove('preloading');
      setTimeout(() => loader.remove(), 400);
    }, 150);
  }

  // Fast dismiss: as soon as DOM is ready or onload fires
  if (document.readyState === 'complete') {
    dismiss();
  } else {
    window.addEventListener('load', dismiss, { once: true });
    // Safety fallback so PageSpeed / slow connections never get blocked
    setTimeout(dismiss, 600);
  }
}

/* ── Custom Cursor ─────────────────── */
function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cursor   = document.querySelector('.cursor');
  const follower = document.querySelector('.cursor-follower');
  if (!cursor || !follower) return;

  let mX = -100, mY = -100;
  let fX = -100, fY = -100;
  let isMoving = false;

  window.addEventListener('mousemove', (e) => {
    mX = e.clientX;
    mY = e.clientY;
    if (!isMoving) {
      isMoving = true;
      cursor.style.opacity = '1';
      follower.style.opacity = '0.6';
    }
  }, { passive: true });

  window.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget && !e.toElement) {
      cursor.style.opacity = '0';
      follower.style.opacity = '0';
    }
  });

  function render() {
    // Fast lerp
    fX += (mX - fX) * 0.15;
    fY += (mY - fY) * 0.15;

    cursor.style.transform = `translate3d(${mX}px, ${mY}px, 0) translate(-50%, -50%)`;
    follower.style.transform = `translate3d(${fX}px, ${fY}px, 0) translate(-50%, -50%)`;

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  const hoverTargets = document.querySelectorAll('a, button, [data-cursor], .service-card, .methodology-video-wrap, .action-video-wrap');
  hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hover-state');
      follower.classList.add('hover-state');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hover-state');
      follower.classList.remove('hover-state');
    });
  });
}

/* ── Navbar ────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const hamburger  = document.querySelector('.nav-hamburger');
  const mobileNav  = document.querySelector('.nav-mobile');
  const closeBtn   = document.querySelector('.nav-mobile-close');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  // Close mobile nav on link click
  document.querySelectorAll('.nav-mobile a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ── Scroll Reveal ─────────────────── */
function initReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = Number(el.dataset.delay || 0);
        setTimeout(() => {
          el.classList.add('visible');
          setTimeout(() => {
            el.style.willChange = 'auto';
          }, 800);
        }, delay);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => io.observe(el));
}

/* ── Animated Counters ─────────────── */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el  = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1600;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        el.textContent = '+' + Math.round(ease * target) + suffix;
        if (progress < 1) requestAnimationFrame(update);
      }

      requestAnimationFrame(update);
      io.unobserve(el);

      // Also trigger the border animation
      const card = el.closest('.stat-card');
      if (card) card.classList.add('visible');
    });
  }, { threshold: 0.5 });

  counters.forEach(el => io.observe(el));
}

/* ── BTS Carousel ─────────────────── */
function initCarousel() {
  const track  = document.querySelector('.carousel-track');
  const dots   = document.querySelectorAll('.carousel-dot');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  if (!track) return;

  const slides = track.querySelectorAll('.carousel-slide');
  const total  = slides.length;

  // How many visible at a time depends on breakpoint
  function getVisible() {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }

  let current = 0;
  let autoplayTimer;

  function updateDots() {
    const visible = getVisible();
    const maxIdx  = total - visible;
    dots.forEach((dot, i) => {
      dot.style.display = i <= maxIdx ? '' : 'none';
      dot.classList.toggle('active', i === current);
    });
  }

  function go(idx) {
    const visible = getVisible();
    const maxIdx  = total - visible;
    current = Math.max(0, Math.min(idx, maxIdx));

    const slideWidth = slides[0].offsetWidth + 16; // gap
    track.style.transform = `translateX(-${current * slideWidth}px)`;

    updateDots();
  }

  function startAutoplay() {
    autoplayTimer = setInterval(() => {
      const visible = getVisible();
      const maxIdx = total - visible;
      const next = (current >= maxIdx) ? 0 : current + 1;
      go(next);
    }, 4500);
  }

  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }

  prevBtn?.addEventListener('click', () => { go(current - 1); resetAutoplay(); });
  nextBtn?.addEventListener('click', () => { go(current + 1); resetAutoplay(); });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { go(i); resetAutoplay(); });
  });

  // Touch / drag support
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      go(diff > 0 ? current + 1 : current - 1);
      resetAutoplay();
    }
  }, { passive: true });

  window.addEventListener('resize', () => go(current));

  go(0);
  startAutoplay();
}

/* ── Testimonials (clean static grid) ──────── */
function initTestimonials() {
  // Testimonials are rendered in a clean, responsive CSS grid
}

/* ── Video Modal ─────────────────── */
function initVideoModal() {
  const modal   = document.querySelector('.video-modal');
  const modalVid = modal?.querySelector('video');
  const closeBtn = modal?.querySelector('.video-modal-close');

  if (!modal) return;

  document.querySelectorAll('[data-video-modal]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const childVid = trigger.querySelector('video');
      const src = childVid?.currentSrc || childVid?.getAttribute('src') || trigger.dataset.videoSrc;
      if (src && modalVid) {
        modalVid.src = src;
        modalVid.play();
      }
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    if (modalVid) { modalVid.pause(); modalVid.src = ''; }
  }

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

/* ── Contact Form (Hostinger SMTP /api/contact) ──────── */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submit  = form.querySelector('.form-submit');
  const success = form.querySelector('.form-success');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const payload = {
      name: (formData.get('name') || '').toString().trim(),
      email: (formData.get('email') || '').toString().trim(),
      phone: (formData.get('phone') || '').toString().trim(),
      service: (formData.get('service') || '').toString().trim(),
      message: (formData.get('message') || '').toString().trim(),
    };

    if (!payload.name || !payload.email || !payload.message) {
      success.style.display = 'block';
      success.style.background = '#fff0f0';
      success.style.borderColor = '#e00';
      success.style.color = '#c00';
      success.textContent = 'Por favor, preencha seu Nome, E-mail e Mensagem.';
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Enviando...';
    success.style.display = 'none';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (res.ok && json.ok) {
        form.reset();
        success.style.display = 'block';
        success.style.background = '';
        success.style.borderColor = '';
        success.style.color = '';
        success.textContent = '✓ Mensagem enviada com sucesso! Nossa equipe responderá em breve.';
        setTimeout(() => { success.style.display = 'none'; }, 7000);
        return;
      }

      // Fallback via FormSubmit if Hostinger SMTP password/relay needs confirmation in hPanel
      const fallbackRes = await fetch('https://formsubmit.co/ajax/comercial@storylens.com.br', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          _subject: `Novo Orçamento no Site StoryLens: ${payload.name}`,
          Nome: payload.name,
          Email: payload.email,
          WhatsApp: payload.phone || 'Não informado',
          Servico: payload.service || 'Não especificado',
          Mensagem: payload.message,
        }),
      });

      if (fallbackRes.ok) {
        form.reset();
        success.style.display = 'block';
        success.style.background = '';
        success.style.borderColor = '';
        success.style.color = '';
        success.textContent = '✓ Mensagem recebida com sucesso! Entraremos em contato em breve.';
        setTimeout(() => { success.style.display = 'none'; }, 7000);
        return;
      }

      throw new Error(json.error || 'Falha no envio');
    } catch {
      const waText = encodeURIComponent(
        `Olá! Vim pelo site da StoryLens.\n\n*Nome:* ${payload.name}\n*E-mail:* ${payload.email}\n*WhatsApp:* ${payload.phone || '-'}\n*Serviço:* ${payload.service || '-'}\n*Mensagem:* ${payload.message}`
      );
      success.style.display = 'block';
      success.style.background = '#f0f9fb';
      success.style.borderColor = '#0095B1';
      success.style.color = '#0d1b22';
      success.innerHTML = `Redirecionando seu atendimento... <a href="https://wa.me/5511961608299?text=${waText}" target="_blank" rel="noopener" style="color:#0095B1;font-weight:700;text-decoration:underline;">Clique aqui para concluir no WhatsApp →</a>`;
    } finally {
      submit.disabled = false;
      submit.textContent = 'Enviar Mensagem';
    }
  });
}

/* ── Parallax subtle hero ────────── */
function initParallax() {
  const heroVideo = document.querySelector('.hero-video-frame video');
  if (!heroVideo) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        if (scrolled < window.innerHeight) {
          heroVideo.style.transform = `translate3d(0, ${scrolled * 0.15}px, 0)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ── Smooth anchor scroll ─────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ── Smart Viewport Video Playback ── */
function initSmartVideos() {
  const videos = document.querySelectorAll('#hero video, #action video, #methodology video');
  if (!videos.length) return;

  const timers = new WeakMap();

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const vid = entry.target;
      const existingTimer = timers.get(vid);
      if (existingTimer) {
        clearTimeout(existingTimer);
        timers.delete(vid);
      }

      if (entry.isIntersecting) {
        // Wait for scroll reveal transition to finish so scroll stays 100% smooth
        const isHero = vid.closest('#hero') !== null;
        const delay = isHero ? 50 : 450;
        const t = setTimeout(() => {
          vid.play().catch(() => {});
        }, delay);
        timers.set(vid, t);
      } else {
        vid.pause();
      }
    });
  }, { threshold: 0.25 });

  videos.forEach(vid => io.observe(vid));
}

/* ── Init all ─────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initCursor();
  initNavbar();
  initReveal();
  initCounters();
  initCarousel();
  initTestimonials();
  initVideoModal();
  initContactForm();
  initParallax();
  initSmoothScroll();
  initSmartVideos();
});
