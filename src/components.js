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

  const hoverTargets = document.querySelectorAll('a, button, [data-cursor], .service-card, .methodology-video-wrap, .action-video-wrap, .reel-card');
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

/* ── Interactive Media Showcase Modal (All 35 Google Drive Contents) ── */
function initVideoModal() {
  const modal       = document.getElementById('media-showcase-modal') || document.querySelector('.video-modal');
  const modalVid    = document.getElementById('showcase-video') || modal?.querySelector('video');
  const modalImg    = document.getElementById('showcase-image');
  const titleEl     = document.getElementById('showcase-current-title');
  const counterEl   = document.getElementById('showcase-counter');
  const thumbsWrap  = document.getElementById('showcase-thumbs');
  const tabsWrap    = document.getElementById('showcase-tabs');
  const prevBtn     = document.getElementById('showcase-prev');
  const nextBtn     = document.getElementById('showcase-next');
  const closeBtn    = modal?.querySelector('.video-modal-close');

  if (!modal) return;

  // Curated catalog: 4 exclusive items per Icon (Zero duplicates across icons or sections!)
  const DRIVE_CATALOG = [
    // ── 1. ÍCONE EVENTOS (4 materiais exclusivos) ──
    { id: 'ev-1', type: 'video', cats: ['eventos'], title: 'Evento Fast Escova (Vídeo)', src: '/assets/drive_media/bts-fast-escova.mp4', thumb: '/assets/drive_media/bts-fast-escova.webp?v=2' },
    { id: 'ev-2', type: 'video', cats: ['eventos'], title: 'Cobertura Corporativa Palco PanVel (Vídeo)', src: '/assets/drive_media/bts-producao.mp4', thumb: '/assets/drive_media/bts-producao.webp' },
    { id: 'ev-3', type: 'photo', cats: ['eventos'], title: 'Bienal Internacional do Livro SP', src: '/assets/drive_media/photos/evento_3_.webp', thumb: '/assets/drive_media/photos/evento_3_.webp' },
    { id: 'ev-4', type: 'photo', cats: ['eventos'], title: 'Inauguração & Decoração Corporativa', src: '/assets/drive_media/photos/foto-fast.webp', thumb: '/assets/drive_media/photos/foto-fast.webp' },

    // ── 2. ÍCONE ROTEIRO GUIADO (4 materiais exclusivos) ──
    { id: 'rot-1', type: 'video', cats: ['roteiro'], title: 'Gravação com Teleprompter & Roteiro', src: '/assets/drive_media/main-video-05.mp4', thumb: '/assets/drive_media/main-video-05.webp?v=2' },
    { id: 'rot-2', type: 'video', cats: ['roteiro'], title: 'Posicionamento Digital em Dupla', src: '/assets/drive_media/main-video-03.mp4', thumb: '/assets/drive_media/main-video-03.webp' },
    { id: 'rot-3', type: 'video', cats: ['roteiro'], title: 'Conteúdo Corporativo & Autoridade', src: '/assets/drive_media/main-video-04.mp4', thumb: '/assets/drive_media/main-video-04.webp' },
    { id: 'rot-4', type: 'photo', cats: ['roteiro'], title: 'Set de Gravação com Roteiro Guiado', src: '/assets/drive_media/photos/foto-main-1.webp', thumb: '/assets/drive_media/photos/foto-main-1.webp' },

    // ── 3. ÍCONE EXTERNO & ENSAIO (4 materiais exclusivos) ──
    { id: 'ext-1', type: 'video', cats: ['externo'], title: 'Roteiro & Ensaio em Loja (Vídeo)', src: '/assets/drive_media/ensaio-roteiro-01.mp4', thumb: '/assets/drive_media/ensaio-roteiro-01.webp' },
    { id: 'ext-2', type: 'video', cats: ['externo'], title: 'Captação em Ambiente Corporativo', src: '/assets/drive_media/ensaio-externo.mp4', thumb: '/assets/drive_media/ensaio-externo.webp' },
    { id: 'ext-3', type: 'video', cats: ['externo'], title: 'Bastidores do Ensaio Executivo', src: '/assets/drive_media/ensaio-bastidores.mp4', thumb: '/assets/drive_media/ensaio-bastidores.webp' },
    { id: 'ext-4', type: 'photo', cats: ['externo'], title: 'Direção de Cena & Roteiro no iPad', src: '/assets/drive_media/photos/roteiro-foto.webp', thumb: '/assets/drive_media/photos/roteiro-foto.webp' },

    // ── 4. ÍCONE FOTOGRAFIA & RETRATOS (4 materiais exclusivos) ──
    { id: 'foto-1', type: 'photo', cats: ['fotografia'], title: 'Retrato Corporativo — Dra. Andressa', src: '/assets/drive_media/photos/foto_andressa_.webp', thumb: '/assets/drive_media/photos/foto_andressa_.webp' },
    { id: 'foto-2', type: 'photo', cats: ['fotografia'], title: 'Ensaio Fotográfico — Gi', src: '/assets/drive_media/photos/foto_gi_.webp', thumb: '/assets/drive_media/photos/foto_gi_.webp' },
    { id: 'foto-3', type: 'photo', cats: ['fotografia'], title: 'Retrato Executivo — Andréia', src: '/assets/drive_media/photos/andre_ia_.webp', thumb: '/assets/drive_media/photos/andre_ia_.webp' },
    { id: 'foto-4', type: 'video', cats: ['fotografia'], title: 'Sessão Fotográfica em Estúdio (Vídeo)', src: '/assets/drive_media/main-video-07.mp4', thumb: '/assets/drive_media/main-video-07.webp' },

    // ── 5. SEÇÃO ENSAIO & ROTEIRO EXTERNO (4 vídeos exclusivos da seção) ──
    { id: 'sec-ens-1', type: 'video', cats: ['secao-ensaio'], title: 'Direção de Roteiro em Escritório', src: '/assets/drive_media/extra-take-site-2.mp4', thumb: '/assets/drive_media/extra-take-site-2.webp' },
    { id: 'sec-ens-2', type: 'video', cats: ['secao-ensaio'], title: 'Preparação de Set & Iluminação Guiada', src: '/assets/drive_media/extra-copy-roteiro.mp4', thumb: '/assets/drive_media/extra-copy-roteiro.webp' },
    { id: 'sec-ens-3', type: 'video', cats: ['secao-ensaio'], title: 'Reunião de Alinhamento com o Cliente', src: '/assets/drive_media/main-video-09.mp4', thumb: '/assets/drive_media/main-video-09.webp' },
    { id: 'sec-ens-4', type: 'video', cats: ['secao-ensaio'], title: 'Detalhes e Ambientação Corporativa', src: '/assets/drive_media/bts-evento.mp4', thumb: '/assets/drive_media/bts-evento.webp?v=3' },

    // ── 6. SEÇÃO BASTIDORES (4 vídeos exclusivos + 5 fotos exclusivas de Bastidores) ──
    { id: 'bts-vid-1', type: 'video', cats: ['bts'], title: 'Direção & Monitoramento em Estúdio', src: '/assets/drive_media/bts-video-10.mp4', thumb: '/assets/drive_media/bts-video-10.webp' },
    { id: 'bts-vid-2', type: 'video', cats: ['bts'], title: 'Iluminação Greika & Condução de Cena', src: '/assets/drive_media/bts-video-11.mp4', thumb: '/assets/drive_media/bts-video-11.webp' },
    { id: 'bts-vid-3', type: 'video', cats: ['bts'], title: 'Captação de Beleza em Tempo Real', src: '/assets/drive_media/bts-video-12.mp4', thumb: '/assets/drive_media/bts-video-12.webp' },
    { id: 'bts-vid-4', type: 'video', cats: ['bts'], title: 'Making Of — Estrutura de Estúdio', src: '/assets/drive_media/ensaio-makingof.mp4', thumb: '/assets/drive_media/ensaio-makingof.webp' },
    { id: 'bts-photo-1', type: 'photo', cats: ['bts'], title: 'Fotógrafa StoryLens em Estúdio', src: '/assets/drive_media/photos/foto-main-2.webp', thumb: '/assets/drive_media/photos/foto-main-2.webp' },
    { id: 'bts-photo-2', type: 'photo', cats: ['bts'], title: 'Cliente Feliz com Resultado do Ensaio', src: '/assets/drive_media/photos/foto_prod_bastidor.webp', thumb: '/assets/drive_media/photos/foto_prod_bastidor.webp' },
    { id: 'bts-photo-3', type: 'photo', cats: ['bts'], title: 'Cobertura Evento Abrafarma Future Trends', src: '/assets/drive_media/photos/img_3071.webp', thumb: '/assets/drive_media/photos/img_3071.webp' },
    { id: 'bts-photo-5', type: 'photo', cats: ['bts'], title: 'Cobertura Evento Mulheres na Íntegra', src: '/assets/drive_media/photos/evento-11.webp', thumb: '/assets/drive_media/photos/evento-11.webp' },
    { id: 'bts-photo-6', type: 'photo', cats: ['bts'], title: 'Ana — Bastidores de Evento', src: '/assets/drive_media/photos/evento_5_.webp', thumb: '/assets/drive_media/photos/evento_5_.webp' },

    // ── Mídias adicionais exclusivas das seções de destaque (Hero, Ação e Metodologia) ──
    { id: 'video-hero', type: 'video', cats: ['destaque'], title: 'Showreel Institucional StoryLens', src: '/assets/images/hero-video.mp4', thumb: '/assets/drive_media/hero-poster.webp?v=3' },
    { id: 'video-action', type: 'video', cats: ['destaque'], title: 'StoryLens em Ação — Direção em Estúdio', src: '/assets/drive_media/main-video-06.mp4', thumb: '/assets/drive_media/main-video-06.webp?v=3' },
    { id: 'video-methodology', type: 'video', cats: ['destaque'], title: 'Metodologia de Roteiro Guiado', src: '/assets/images/methodology-video.mp4', thumb: '/assets/drive_media/methodology-poster.webp?v=3' }
  ];

  // Helper to mute all inline videos on the page except a specific one
  function muteOtherInlineVideos(exceptVid = null) {
    document.querySelectorAll('video').forEach(v => {
      if (v !== exceptVid && v !== modalVid) {
        v.muted = true;
        const wrap = v.closest('.hero-video-frame, .action-video-wrap, .methodology-video-wrap, .hub-video-card');
        const btn = wrap?.querySelector('[data-inline-audio], .hub-audio-btn');
        if (btn) {
          btn.classList.remove('is-unmuted');
          const txt = btn.querySelector('.audio-text');
          if (txt) txt.textContent = 'Ouvir com Áudio';
        }
      }
    });
  }

  // Bind inline audio buttons on Hero, Action, and Ensaio Externo main videos
  document.querySelectorAll('[data-inline-audio]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const wrap = btn.closest('.hero-video-frame, .action-video-wrap, .methodology-video-wrap');
      const vid = wrap?.querySelector('video');
      if (!vid) return;

      if (vid.muted) {
        muteOtherInlineVideos(vid);
        vid.muted = false;
        vid.play().catch(() => {});
        btn.classList.add('is-unmuted');
        const txt = btn.querySelector('.audio-text');
        if (txt) txt.textContent = 'Som Ligado';
      } else {
        vid.muted = true;
        btn.classList.remove('is-unmuted');
        const txt = btn.querySelector('.audio-text');
        if (txt) txt.textContent = 'Ouvir com Áudio';
      }
    });
  });

  // Bind inline audio and modal on static section sub-galleries (#ensaio-externo and #bts)
  document.querySelectorAll('.reel-card[data-showcase-id]').forEach(card => {
    const vid = card.querySelector('video');
    const audioBtn = card.querySelector('[data-card-audio]');
    const cat = card.dataset.showcaseCat || 'secao-ensaio';
    const itemId = card.dataset.showcaseId || '';

    audioBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!vid) return;
      if (vid.paused || vid.muted) {
        muteOtherInlineVideos(vid);
        vid.muted = false;
        vid.play().catch(() => {});
        card.classList.add('playing-inline');
        audioBtn.classList.add('is-unmuted');
        audioBtn.innerHTML = '<span class="audio-text">Pausar Áudio</span>';
      } else {
        vid.pause();
        vid.muted = true;
        card.classList.remove('playing-inline');
        audioBtn.classList.remove('is-unmuted');
        audioBtn.innerHTML = '<span class="audio-text">Ouvir com Áudio</span>';
      }
    });

    card.addEventListener('click', () => {
      if (vid) { vid.pause(); vid.muted = true; }
      openShowcase({ category: cat, matchId: itemId });
    });
  });

  // ── Interactive Icon Hub (#portfolio): 4 Exclusive Items per Icon ──
  const hubIconsBar = document.getElementById('hub-icons-bar');
  const hubMixedGrid = document.getElementById('hub-mixed-grid');
  const hubTitleEl = document.getElementById('hub-panel-title');
  const hubBadgeEl = document.getElementById('hub-panel-badge');

  const HUB_LABELS = {
    eventos: { badge: 'Categoria: Eventos (4 materiais)', title: 'Cobertura de Eventos em Tempo Real' },
    roteiro: { badge: 'Categoria: Roteiro Guiado (4 materiais)', title: 'Roteiro Guiado & Direção de Cena com Áudio' },
    externo: { badge: 'Categoria: Externo & Ensaio (4 materiais)', title: 'Produções Externas & Ensaios Estratégicos' },
    fotografia: { badge: 'Categoria: Fotografia & Retratos (4 materiais)', title: 'Fotografia Corporativa, Retratos & Making Of' }
  };

  function renderIconHub(cat = 'eventos') {
    if (!hubMixedGrid) return;

    // Update active icon card
    hubIconsBar?.querySelectorAll('.hub-icon-card').forEach(btn => {
      const isActive = btn.dataset.hubCat === cat;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    const meta = HUB_LABELS[cat] || HUB_LABELS.eventos;
    if (hubBadgeEl) hubBadgeEl.textContent = meta.badge;
    if (hubTitleEl) hubTitleEl.textContent = meta.title;

    const items = DRIVE_CATALOG.filter(i => i.cats.includes(cat));

    // Render all 4 exclusive items in a single clean 4-column row
    hubMixedGrid.innerHTML = items.map(item => {
      if (item.type === 'video') {
        return `
          <div class="reel-card hub-video-card" data-item-id="${item.id}" data-item-cat="${cat}">
            <video src="${item.src}" poster="${item.thumb}" preload="none" loop playsinline muted></video>
            <div class="reel-card-overlay">
              <button type="button" class="hub-audio-btn" aria-label="Ouvir vídeo com áudio">
                <span class="audio-text">Ouvir com Áudio</span>
              </button>
              <button type="button" class="hub-expand-btn" aria-label="Abrir em tela cheia">Tela Cheia</button>
              <span class="reel-card-tag">${item.title}</span>
            </div>
          </div>
        `;
      }
      return `
        <div class="reel-card hub-photo-item" data-item-id="${item.id}" data-item-cat="${cat}">
          <img src="${item.src}" alt="${item.title}" loading="lazy" decoding="async" />
          <div class="reel-card-overlay">
            <button type="button" class="hub-expand-btn" aria-label="Ampliar foto">Ampliar Foto</button>
            <span class="reel-card-tag">${item.title}</span>
          </div>
        </div>
      `;
    }).join('');

    // Bind events on the 4 rendered cards
    hubMixedGrid.querySelectorAll('.reel-card').forEach(card => {
      const vid = card.querySelector('video');
      const audioBtn = card.querySelector('.hub-audio-btn');
      const itemId = card.dataset.itemId;
      const itemCat = card.dataset.itemCat || cat;

      audioBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!vid) return;
        if (vid.paused || vid.muted) {
          muteOtherInlineVideos(vid);
          vid.muted = false;
          vid.play().catch(() => {});
          card.classList.add('playing-inline');
          audioBtn.classList.add('is-unmuted');
          audioBtn.innerHTML = '<span class="audio-text">Pausar Áudio</span>';
        } else {
          vid.pause();
          vid.muted = true;
          card.classList.remove('playing-inline');
          audioBtn.classList.remove('is-unmuted');
          audioBtn.innerHTML = '<span class="audio-text">Ouvir com Áudio</span>';
        }
      });

      card.addEventListener('click', () => {
        if (vid) { vid.pause(); vid.muted = true; }
        openShowcase({ category: itemCat, matchId: itemId });
      });
    });
  }

  hubIconsBar?.querySelectorAll('.hub-icon-card').forEach(btn => {
    btn.addEventListener('click', () => {
      muteOtherInlineVideos(null);
      renderIconHub(btn.dataset.hubCat || 'eventos');
    });
  });

  // Initial render of Icon Hub
  renderIconHub('eventos');

  let activeCategory = 'eventos';
  let filteredItems = DRIVE_CATALOG.filter(i => i.cats.includes('eventos'));
  let currentIndex = 0;

  function getFiltered(cat) {
    const list = DRIVE_CATALOG.filter(item => item.cats.includes(cat));
    return list.length ? list : DRIVE_CATALOG.filter(item => item.cats.includes('eventos'));
  }

  function renderTabs() {
    if (!tabsWrap) return;
    tabsWrap.querySelectorAll('.showcase-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === activeCategory);
    });
  }

  function renderThumbs() {
    if (!thumbsWrap) return;
    thumbsWrap.innerHTML = filteredItems.map((item, idx) => `
      <button type="button" class="showcase-thumb ${idx === currentIndex ? 'active' : ''}" data-idx="${idx}">
        <img src="${item.thumb}" alt="${item.title}" loading="lazy" />
        <span class="showcase-thumb-badge ${item.type}">${item.type === 'video' ? 'Vídeo' : 'Foto'}</span>
        <span class="showcase-thumb-title">${item.title}</span>
      </button>
    `).join('');

    thumbsWrap.querySelectorAll('.showcase-thumb').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        selectItem(idx);
      });
    });

    const activeThumb = thumbsWrap.querySelector('.showcase-thumb.active');
    activeThumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }

  function selectItem(idx) {
    if (!filteredItems.length) return;
    currentIndex = (idx + filteredItems.length) % filteredItems.length;
    const item = filteredItems[currentIndex];

    if (titleEl) titleEl.textContent = item.title;
    if (counterEl) counterEl.textContent = `${currentIndex + 1} / ${filteredItems.length}`;

    if (item.type === 'video') {
      if (modalImg) {
        modalImg.style.display = 'none';
        modalImg.src = '';
      }
      if (modalVid) {
        modalVid.style.display = 'block';
        modalVid.src = item.src;
        modalVid.play().catch(() => {});
      }
    } else {
      if (modalVid) {
        modalVid.pause();
        modalVid.src = '';
        modalVid.style.display = 'none';
      }
      if (modalImg) {
        modalImg.src = item.src;
        modalImg.alt = item.title;
        modalImg.style.display = 'block';
      }
    }

    renderThumbs();
  }

  function openShowcase({ category = 'eventos', matchSrc = '', matchId = '' } = {}) {
    muteOtherInlineVideos(null);
    activeCategory = category;
    filteredItems = getFiltered(activeCategory);

    let startIdx = 0;
    if (matchId) {
      const found = filteredItems.findIndex(i => i.id === matchId);
      if (found >= 0) startIdx = found;
    } else if (matchSrc) {
      const cleanName = matchSrc.split('/').pop().replace(/-[A-Za-z0-9_-]{8}\.(webp|mp4|jpg|png)$/i, '.$1');
      const found = filteredItems.findIndex(i =>
        i.src.endsWith(cleanName) ||
        i.thumb.endsWith(cleanName) ||
        matchSrc.includes(i.id)
      );
      if (found >= 0) startIdx = found;
    }

    renderTabs();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    selectItem(startIdx);
  }

  // 1. Video triggers ([data-video-modal])
  document.querySelectorAll('[data-video-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      if (e.target.closest('[data-inline-audio]')) return;
      if (trigger.closest('#action')) {
        openShowcase({ category: 'destaque', matchId: 'video-action' });
      } else if (trigger.closest('#ensaio-externo')) {
        openShowcase({ category: 'destaque', matchId: 'video-methodology' });
      }
    });
  });

  // 2. Service Cards (#services .service-card) -> select matching Icon in #portfolio AND scroll smoothly to #portfolio!
  document.querySelectorAll('#services .service-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const cat = card.dataset.galleryCategory || 'eventos';
      renderIconHub(cat);
      const portfolioSection = document.getElementById('portfolio');
      if (portfolioSection) {
        portfolioSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // 3. BTS Carousel Photos & Hero Video -> open in lightbox!
  document.querySelectorAll('#bts .carousel-slide, .hero-video-frame').forEach(slide => {
    slide.style.cursor = 'pointer';
    slide.addEventListener('click', (e) => {
      if (e.target.closest('[data-inline-audio]')) return;
      if (slide.classList.contains('hero-video-frame')) {
        openShowcase({ category: 'destaque', matchId: 'video-hero' });
        return;
      }
      const img = slide.querySelector('img');
      const rawSrc = img?.getAttribute('src') || img?.currentSrc || '';
      openShowcase({ category: 'bts', matchSrc: rawSrc });
    });
  });

  // Tab clicks
  tabsWrap?.querySelectorAll('.showcase-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat || 'all';
      filteredItems = getFiltered(activeCategory);
      renderTabs();
      selectItem(0);
    });
  });

  // Prev / Next buttons
  prevBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    selectItem(currentIndex - 1);
  });
  nextBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    selectItem(currentIndex + 1);
  });

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    if (modalVid) {
      modalVid.pause();
      modalVid.src = '';
    }
  }

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') selectItem(currentIndex - 1);
    if (e.key === 'ArrowRight') selectItem(currentIndex + 1);
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
      success.innerHTML = `Redirecionando seu atendimento... <a href="https://wa.me/5511995203024?text=${waText}" target="_blank" rel="noopener" style="color:#0095B1;font-weight:700;text-decoration:underline;">Clique aqui para concluir no WhatsApp →</a>`;
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
  const videos = document.querySelectorAll('#hero video, #action video, #methodology video, #ensaio-externo video');
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
