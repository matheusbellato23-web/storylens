/* ======================================
   STORYLENS - JS
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
        const delay = Math.min(Number(el.dataset.delay || 0), 140);
        setTimeout(() => {
          el.classList.add('visible');
          el.querySelectorAll('.section-title, .motion-title-ready').forEach(t => t.classList.add('visible'));
          setTimeout(() => {
            el.style.willChange = 'auto';
          }, 800);
        }, delay);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.01, rootMargin: '80px 0px 80px 0px' });

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
  const catLabelEl  = document.getElementById('showcase-sidebar-cat-label');
  const subfiltersWrap = document.getElementById('showcase-subfilters');
  const thumbsWrap  = document.getElementById('showcase-thumbs');
  const tabsWrap    = document.getElementById('showcase-tabs');
  const prevBtn     = document.getElementById('showcase-prev');
  const nextBtn     = document.getElementById('showcase-next');
  const closeBtn    = modal?.querySelector('.video-modal-close');

  if (!modal) return;

  // Curated Catalog across the 4 Services (Zero Repetition, 100% of Sent Assets)
  const DRIVE_CATALOG = [
    // ── 1. EVENTOS (6 materiais de Eventos e Coberturas, sem repetição de clientes) ──
    { id: 'ev-fast-vid', type: 'video', cats: ['eventos'], title: 'Inauguração Fast Escova', src: '/assets/drive_media/bts-fast-escova.mp4', thumb: '/assets/drive_media/bts-fast-escova.webp?v=4' },
    { id: 'ev-panvel', type: 'video', cats: ['eventos'], title: 'Convenção PanVel no Palco', src: '/assets/drive_media/bts-producao.mp4', thumb: '/assets/drive_media/bts-producao.webp' },
    { id: 'ev-abrafarma', type: 'photo', cats: ['eventos'], title: 'Palco Abrafarma Future Trends', src: '/assets/drive_media/photos/img_3071.webp', thumb: '/assets/drive_media/photos/img_3071.webp' },
    { id: 'ev-bienal-3', type: 'photo', cats: ['eventos'], title: 'Bienal Internacional do Livro SP', src: '/assets/drive_media/photos/evento_3_.webp', thumb: '/assets/drive_media/photos/evento_3_.webp' },
    { id: 'ev-ana-evento', type: 'photo', cats: ['eventos'], title: 'Ana StoryLens em Cobertura Cultural', src: '/assets/drive_media/photos/evento_5_.webp', thumb: '/assets/drive_media/photos/evento_5_.webp' },
    { id: 'ev-mulheres', type: 'photo', cats: ['eventos'], title: 'Palestra Mulheres na Íntegra', src: '/assets/drive_media/photos/evento-11.webp', thumb: '/assets/drive_media/photos/evento-11.webp' },

    // ── 2. FOTOGRAFIA PROFISSIONAL CORPORATIVA (6 retratos corporativos, 100% fotografia) ──
    { id: 'foto-andressa', type: 'photo', cats: ['fotografia'], title: 'Retrato Corporativo — Dra. Andressa', src: '/assets/drive_media/photos/foto_andressa_.webp', thumb: '/assets/drive_media/photos/foto_andressa_.webp' },
    { id: 'foto-gi', type: 'photo', cats: ['fotografia'], title: 'Ensaio Fotográfico — Gi', src: '/assets/drive_media/photos/foto_gi_.webp', thumb: '/assets/drive_media/photos/foto_gi_.webp' },
    { id: 'foto-andreia', type: 'photo', cats: ['fotografia'], title: 'Retrato Executivo — Andréia', src: '/assets/drive_media/photos/andre_ia_.webp', thumb: '/assets/drive_media/photos/andre_ia_.webp' },
    { id: 'foto-ana-prof', type: 'photo', cats: ['fotografia'], title: 'Retrato Profissional — Ana StoryLens', src: '/assets/drive_media/photos/foto-ana.webp', thumb: '/assets/drive_media/photos/foto-ana.webp' },
    { id: 'foto-set-estudio', type: 'photo', cats: ['fotografia'], title: 'Estrutura & Set de Estúdio', src: '/assets/drive_media/photos/set-estudio.webp', thumb: '/assets/drive_media/photos/set-estudio.webp' },
    { id: 'foto-cenario-greika', type: 'photo', cats: ['fotografia'], title: 'Set de Estúdio & Iluminação', src: '/assets/drive_media/photos/estudio-cenario-greika.webp', thumb: '/assets/drive_media/photos/estudio-cenario-greika.webp' },

    // ── 3. MARKETING DIGITAL & ROTEIRO GUIADO (8 produções de Roteiro e Posicionamento) ──
    { id: 'rot-vid-03', type: 'video', cats: ['roteiro'], title: 'Posicionamento Digital em Dupla', src: '/assets/drive_media/main-video-03.mp4', thumb: '/assets/drive_media/main-video-03.webp' },
    { id: 'rot-vid-04', type: 'video', cats: ['roteiro'], title: 'Direção de Roteiro & Autoridade', src: '/assets/drive_media/main-video-04.mp4', thumb: '/assets/drive_media/main-video-04.webp' },
    { id: 'rot-vid-05', type: 'video', cats: ['roteiro'], title: 'Gravação Guiada com Teleprompter', src: '/assets/drive_media/main-video-05.mp4', thumb: '/assets/drive_media/main-video-05.webp?v=2' },
    { id: 'rot-vid-06', type: 'video', cats: ['roteiro'], title: 'Audiovisual de Alta Performance', src: '/assets/drive_media/main-video-06.mp4', thumb: '/assets/drive_media/main-video-06.webp' },
    { id: 'rot-vid-07', type: 'video', cats: ['roteiro'], title: 'Formato Dinâmico para Redes', src: '/assets/drive_media/main-video-07.mp4', thumb: '/assets/drive_media/main-video-07.webp' },
    { id: 'rot-vid-09', type: 'video', cats: ['roteiro'], title: 'Captação Cinematográfica', src: '/assets/drive_media/main-video-09.mp4', thumb: '/assets/drive_media/main-video-09.webp' },
    { id: 'rot-foto-ipad', type: 'photo', cats: ['roteiro'], title: 'Planejamento & Roteiro no iPad', src: '/assets/drive_media/photos/roteiro-foto.webp', thumb: '/assets/drive_media/photos/roteiro-foto.webp' },
    { id: 'rot-foto-dupla', type: 'photo', cats: ['roteiro'], title: 'Ensaio de Dupla & Autoridade', src: '/assets/drive_media/photos/estudio-dupla-roteiro.webp', thumb: '/assets/drive_media/photos/estudio-dupla-roteiro.webp' },

    // ── 4. ENSAIO EXTERNO & LOCAÇÃO (7 produções em ambiente externo e da cliente) ──
    { id: 'ext-loja-dot', type: 'video', cats: ['externo'], title: 'Roteiro & Ensaio em Loja (DOT)', src: '/assets/drive_media/ensaio-roteiro-01.mp4', thumb: '/assets/drive_media/ensaio-roteiro-01.webp' },
    { id: 'ext-ambiente-cli', type: 'video', cats: ['externo'], title: 'Captação em Ambiente da Cliente', src: '/assets/drive_media/ensaio-externo.mp4', thumb: '/assets/drive_media/ensaio-externo.webp' },
    { id: 'ext-bast-exec', type: 'video', cats: ['externo'], title: 'Bastidores do Ensaio Executivo', src: '/assets/drive_media/ensaio-bastidores.mp4', thumb: '/assets/drive_media/ensaio-bastidores.webp' },
    { id: 'ext-makingof-loc', type: 'video', cats: ['externo'], title: 'Produção & Ensaio Externo', src: '/assets/drive_media/ensaio-makingof.mp4', thumb: '/assets/drive_media/ensaio-makingof.webp' },
    { id: 'ext-metodologia', type: 'video', cats: ['externo'], title: 'Metodologia de Roteiro Guiado', src: '/assets/drive_media/methodology-video.mp4', thumb: '/assets/drive_media/methodology-poster.webp?v=3' },
    { id: 'ext-direcao-cena', type: 'photo', cats: ['externo'], title: 'Direção de Cena em Locação', src: '/assets/drive_media/photos/foto-ensaio-prod.webp', thumb: '/assets/drive_media/photos/foto-ensaio-prod.webp' },
    { id: 'ext-extra-copy', type: 'video', cats: ['externo'], title: 'Ensaio Guiado em Locação', src: '/assets/drive_media/extra-copy-roteiro.mp4', thumb: '/assets/drive_media/extra-copy-roteiro.webp' },

    // ── 5. BASTIDORES & EQUIPE ──
    { id: 'bts-vid-1', type: 'video', cats: ['bts'], title: 'Direção & Monitoramento em Estúdio', src: '/assets/drive_media/bts-video-10.mp4', thumb: '/assets/drive_media/bts-video-10.webp' },
    { id: 'bts-vid-2', type: 'video', cats: ['bts'], title: 'Condução de Cena & Imagem', src: '/assets/drive_media/bts-video-11.mp4', thumb: '/assets/drive_media/bts-video-11.webp' },
    { id: 'bts-vid-3', type: 'video', cats: ['bts'], title: 'Set e Captação em Tempo Real', src: '/assets/drive_media/bts-video-12.mp4', thumb: '/assets/drive_media/bts-video-12.webp' }
  ];

  // Helper to mute all inline videos on the page except a specific one
  function muteOtherInlineVideos(exceptVid = null) {
    document.querySelectorAll('video').forEach(v => {
      if (v !== exceptVid && v !== modalVid) {
        v.muted = true;
        const wrap = v.closest('.hero-video-frame, .action-video-wrap, .methodology-video-wrap, .hub-video-card, .reel-card');
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

  // Bind inline audio and modal trigger on all reel cards across all sections
  document.querySelectorAll('.reel-card[data-showcase-id]').forEach(card => {
    const vid = card.querySelector('video');
    const audioBtn = card.querySelector('[data-card-audio]');
    const cat = card.dataset.showcaseCat || 'all';
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

  // Dual filtering in #portfolio (Category + Format Type)
  const portfolioFilterBar = document.getElementById('portfolio-filter-bar');
  const portfolioTypeBar = document.getElementById('portfolio-type-bar');
  const portfolioGrid = document.getElementById('portfolio-main-grid');

  let currentPortfolioCat = 'all';
  let currentPortfolioType = 'all';

  function filterPortfolioGrid() {
    if (!portfolioGrid) return;
    portfolioGrid.querySelectorAll('.reel-card').forEach(card => {
      const cardCat = card.dataset.portfolioCat;
      const cardType = card.dataset.portfolioType;
      const matchCat = (currentPortfolioCat === 'all' || currentPortfolioCat === cardCat);
      const matchType = (currentPortfolioType === 'all' || currentPortfolioType === cardType);
      card.style.display = (matchCat && matchType) ? '' : 'none';
    });
  }

  if (portfolioFilterBar && portfolioGrid) {
    portfolioFilterBar.querySelectorAll('.portfolio-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        portfolioFilterBar.querySelectorAll('.portfolio-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPortfolioCat = btn.dataset.filter || 'all';
        filterPortfolioGrid();
      });
    });
  }

  if (portfolioTypeBar && portfolioGrid) {
    portfolioTypeBar.querySelectorAll('.portfolio-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        portfolioTypeBar.querySelectorAll('.portfolio-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPortfolioType = btn.dataset.type || 'all';
        filterPortfolioGrid();
      });
    });
  }

  const CATEGORY_NAMES = {
    all: 'Todas as Produções',
    eventos: 'Vídeo para Eventos em Tempo Real',
    fotografia: 'Fotografia Profissional Corporativa',
    roteiro: 'Marketing Digital & Roteiro Guiado',
    externo: 'Ensaio Fotográfico & Locação Externa'
  };

  let activeCategory = 'all';
  let activeFilterType = 'all';
  let filteredItems = [];
  let currentIndex = 0;

  function getCategoryItems(cat) {
    if (cat === 'all') return DRIVE_CATALOG;
    const list = DRIVE_CATALOG.filter(item => item.cats.includes(cat));
    return list.length ? list : DRIVE_CATALOG;
  }

  function updateFilteredItems() {
    const baseList = getCategoryItems(activeCategory);
    if (activeFilterType === 'all') {
      filteredItems = baseList;
    } else {
      filteredItems = baseList.filter(item => item.type === activeFilterType);
    }
    if (!filteredItems.length) {
      filteredItems = baseList;
      activeFilterType = 'all';
    }
  }

  function renderTabs() {
    if (!tabsWrap) return;
    tabsWrap.querySelectorAll('.showcase-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === activeCategory);
    });
  }

  function renderSubfilters() {
    if (!subfiltersWrap) return;
    const baseList = getCategoryItems(activeCategory);
    const totalCount = baseList.length;
    const videoCount = baseList.filter(i => i.type === 'video').length;
    const photoCount = baseList.filter(i => i.type === 'photo').length;

    subfiltersWrap.innerHTML = `
      <button type="button" class="showcase-subfilter-btn ${activeFilterType === 'all' ? 'active' : ''}" data-type="all">Todos (${totalCount})</button>
      ${videoCount > 0 ? `<button type="button" class="showcase-subfilter-btn ${activeFilterType === 'video' ? 'active' : ''}" data-type="video">Vídeos (${videoCount})</button>` : ''}
      ${photoCount > 0 ? `<button type="button" class="showcase-subfilter-btn ${activeFilterType === 'photo' ? 'active' : ''}" data-type="photo">Fotos (${photoCount})</button>` : ''}
    `;

    subfiltersWrap.querySelectorAll('.showcase-subfilter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        activeFilterType = btn.dataset.type || 'all';
        updateFilteredItems();
        renderSubfilters();
        selectItem(0);
      });
    });

    if (catLabelEl) {
      catLabelEl.textContent = CATEGORY_NAMES[activeCategory] || 'Conteúdos da Categoria';
    }
  }

  function renderThumbs() {
    if (!thumbsWrap) return;
    thumbsWrap.innerHTML = filteredItems.map((item, idx) => `
      <button type="button" class="showcase-thumb ${idx === currentIndex ? 'active' : ''}" data-idx="${idx}" aria-label="${item.title}">
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

  function openShowcase({ category = 'portfolio', matchSrc = '', matchId = '' } = {}) {
    muteOtherInlineVideos(null);
    activeCategory = category;
    activeFilterType = 'all';
    updateFilteredItems();

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
    renderSubfilters();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    selectItem(startIdx);
  }

  // 1. Video triggers ([data-video-modal])
  document.querySelectorAll('[data-video-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      if (e.target.closest('[data-inline-audio]')) return;
      if (trigger.closest('#action')) {
        openShowcase({ category: 'all', matchId: 'rot-vid-04' });
      } else if (trigger.closest('#ensaio-externo')) {
        openShowcase({ category: 'externo', matchId: 'ext-metodologia' });
      }
    });
  });

  // 2. Service Cards (#services .service-card) -> filter portfolio to matching category and scroll smoothly!
  document.querySelectorAll('#services .service-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const cat = card.dataset.galleryCategory || '';
      const filterBtn = portfolioFilterBar?.querySelector(`.portfolio-filter-btn[data-filter="${cat}"]`);
      if (filterBtn) {
        filterBtn.click();
      }
      const el = document.getElementById('portfolio');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // 3. BTS Carousel Photos & Hero Video -> open in lightbox!
  document.querySelectorAll('#bts .carousel-slide, .hero-video-frame').forEach(slide => {
    slide.style.cursor = 'pointer';
    slide.addEventListener('click', (e) => {
      if (e.target.closest('[data-inline-audio]')) return;
      if (slide.classList.contains('hero-video-frame')) {
        openShowcase({ category: 'all', matchId: 'rot-vid-03' });
        return;
      }
      const matchId = slide.dataset.showcaseId || '';
      const img = slide.querySelector('img');
      const rawSrc = img?.getAttribute('src') || img?.currentSrc || '';
      openShowcase({ category: 'all', matchId: matchId, matchSrc: rawSrc });
    });
  });

  // 4. CTA buttons targeting a specific portfolio filter ([data-filter-target])
  document.querySelectorAll('[data-filter-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetCat = btn.dataset.filterTarget;
      const filterBtn = portfolioFilterBar?.querySelector(`.portfolio-filter-btn[data-filter="${targetCat}"]`);
      if (filterBtn) filterBtn.click();
      const allTypeBtn = portfolioTypeBar?.querySelector(`.portfolio-type-btn[data-type="all"]`);
      if (allTypeBtn) allTypeBtn.click();
      const el = document.getElementById('portfolio');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Tab clicks
  tabsWrap?.querySelectorAll('.showcase-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat || 'all';
      activeFilterType = 'all';
      updateFilteredItems();
      renderTabs();
      renderSubfilters();
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

/* ── Cinematic Motion Effects & Scroll Immersion ── */
function initMotionEffects() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 1. Top Scroll Progress Bar
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress-bar';
  document.body.appendChild(progressBar);

  // 2. Masked Word-by-Word Split Text on Section Titles & CTA Title
  function wrapWordsInElement(el) {
    if (el.dataset.motionSplit === 'true') return;
    el.dataset.motionSplit = 'true';
    let wordCounter = 0;

    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (!text || !text.trim()) return document.createTextNode(text);
        const frag = document.createDocumentFragment();
        const tokens = text.split(/(\s+)/);
        tokens.forEach(token => {
          if (!token) return;
          if (/^\s+$/.test(token)) {
            frag.appendChild(document.createTextNode(' '));
          } else {
            const mask = document.createElement('span');
            mask.className = 'motion-word-mask';
            const word = document.createElement('span');
            word.className = 'motion-word';
            word.style.setProperty('--word-idx', String(wordCounter++));
            word.textContent = token;
            mask.appendChild(word);
            frag.appendChild(mask);
          }
        });
        return frag;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'BR') return node.cloneNode(false);
        const clone = node.cloneNode(false);
        Array.from(node.childNodes).forEach(child => {
          clone.appendChild(processNode(child));
        });
        return clone;
      }
      return node.cloneNode(true);
    }

    const newChildren = Array.from(el.childNodes).map(processNode);
    el.innerHTML = '';
    newChildren.forEach(c => el.appendChild(c));
    el.classList.add('motion-title-ready');
    if (el.closest('.visible') || el.classList.contains('visible')) {
      el.classList.add('visible');
    }
  }

  document.querySelectorAll('.section-title, .cta-title').forEach(wrapWordsInElement);

  // 3. Scroll-Linked Depth Parallax & Progress Bar
  const parallaxFrames = document.querySelectorAll('.action-video-wrap, .methodology-video-wrap, .about-photo-wrap');
  let rafPending = false;

  function updateScrollMotion() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));
    progressBar.style.setProperty('--scroll-progress', progress.toFixed(4));

    const vh = window.innerHeight;
    parallaxFrames.forEach(frame => {
      const rect = frame.getBoundingClientRect();
      if (rect.bottom > -100 && rect.top < vh + 100) {
        const centerOffset = (rect.top + rect.height * 0.5 - vh * 0.5) / (vh * 0.5);
        const shiftY = Math.max(-22, Math.min(22, centerOffset * -16));
        frame.style.setProperty('--parallax-y', `${shiftY.toFixed(1)}px`);
      }
    });
    rafPending = false;
  }

  window.addEventListener('scroll', () => {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(updateScrollMotion);
    }
  }, { passive: true });
  updateScrollMotion();

  // 4. Interactive Spotlight & Subtle 3D Tilt on Cards (Desktop)
  if (window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.service-card, .reel-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--spot-x', `${x.toFixed(0)}px`);
      card.style.setProperty('--spot-y', `${y.toFixed(0)}px`);
    }, { passive: true });
  }
}

/* ── Init all ─────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initCursor();
  initNavbar();
  initMotionEffects();
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
