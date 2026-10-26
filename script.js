// Instituto Rosa — comportamento da página (portado da lógica do design v4)
(() => {
  const WHATSAPP = '5561999355665';
  const WA_MSG = 'Olá, Viviane! Vim pelo site e gostaria de agendar uma avaliação.';
  // Ao trocar um vídeo mantendo o nome do arquivo, suba a versão dele aqui
  // para furar o cache do Cloudflare e dos navegadores.
  const VIDEO_VERSIONS = { 6: 2 };
  const VIDEOS = [
    'Aluna sentada na Chair fazendo exercício com o anel de Pilates, acompanhada pela fisioterapeuta',
    'Fisioterapeuta fazendo alongamento e liberação nas pernas de uma paciente deitada na maca',
    'Exercício de fortalecimento dos dedos do pé no aparelho corretor de pés',
    'Fisioterapeuta orientando uma aluna sentada no Cadillac em exercício com os braços na barra',
    'Aluno ajoelhado no Reformer abrindo os braços com as alças do aparelho',
    'Aluna em pé no Reformer fazendo agachamento com as pernas afastadas, acompanhada pela fisioterapeuta',
    'Aluno fazendo exercício de equilíbrio em pé sobre uma prancha',
  ].map((alt, i) => ({ src: `./assets/video-${i + 1}.mp4${VIDEO_VERSIONS[i + 1] ? `?v=${VIDEO_VERSIONS[i + 1]}` : ''}`, alt }));

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Links de WhatsApp
  const waLink = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(WA_MSG)}`;
  document.querySelectorAll('[data-wa]').forEach((a) => { a.href = waLink; });

  // Saudação e ano no rodapé
  const hr = new Date().getHours();
  document.querySelector('[data-greeting]').textContent = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
  document.querySelector('[data-year]').textContent = new Date().getFullYear();

  // Painéis de vídeo do carrossel. O src só entra quando a seção se aproxima,
  // para não baixar ~100 MB de vídeo na abertura da página.
  const track = document.querySelector('[data-track]');
  const videos = VIDEOS.map(({ src, alt }) => {
    const wrap = document.createElement('div');
    wrap.className = 'panel-wrap';
    wrap.innerHTML = '<div><div data-panel class="panel"></div></div>';
    const v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
    v.setAttribute('aria-label', `Vídeo: ${alt}`);
    v.title = alt;
    v.dataset.src = src;
    wrap.querySelector('[data-panel]').appendChild(v);
    track.appendChild(wrap);
    return v;
  });
  const carrossel = document.querySelector('[data-hscroll]');
  new IntersectionObserver((es) => {
    es.forEach((e) => {
      videos.forEach((v) => {
        if (e.isIntersecting) {
          if (!v.src) v.src = v.dataset.src;
          if (!reduce) v.play().catch(() => {});
        } else if (v.src) v.pause();
      });
    });
  }, { rootMargin: '100% 0px' }).observe(carrossel);

  // Revelar ao rolar
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll('[data-r]').forEach((el) => io.observe(el));

  // Rolagem suave
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, anchors: true });
    const loop = (t) => { lenis.raf(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  document.querySelectorAll('[data-to-top]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    if (lenis) lenis.scrollTo(0, { duration: 1.6 }); else window.scrollTo({ top: 0, behavior: 'smooth' });
  }));

  // Comparadores antes/depois
  document.querySelectorAll('[data-cmp]').forEach((box) => {
    const input = box.querySelector('input');
    input.addEventListener('input', () => box.style.setProperty('--v', input.value));
  });

  // Efeitos dependentes da rolagem
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('[data-hero]');
  const fabs = document.querySelectorAll('[data-fab]');
  const depthEls = document.querySelectorAll('[data-depth]');
  const panels = carrossel.querySelectorAll('[data-panel]');

  function tick() {
    const y = scrollY, vh = innerHeight, vw = innerWidth;
    header.style.boxShadow = y > 20 ? '0 10px 30px rgba(43,40,42,.08)' : 'none';
    const p = Math.min(1, y / vh);
    hero.style.transform = `scale(${1 - p * .07}) translateY(${-p * 50}px)`;
    hero.style.opacity = 1 - p * .5;
    const show = y > vh * 1.1 && y < document.body.scrollHeight - vh * 1.5;
    fabs.forEach((fab) => {
      fab.style.opacity = show ? 1 : 0;
      fab.style.transform = show ? 'none' : 'translateY(20px)';
      fab.style.pointerEvents = show ? 'auto' : 'none';
    });
    depthEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translateY(${(r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.depth)}px)`;
    });

    const r = carrossel.getBoundingClientRect();
    const raw = Math.min(1, Math.max(0, -r.top / (r.height - vh)));
    const pr = Math.min(1, raw / .6);
    const x = Math.max(0, (raw - .6) / .4);
    const max = Math.max(0, track.scrollWidth - vw);
    const e = Math.min(1, Math.max(0, (vh - r.top) / vh));
    const ease = 1 - Math.pow(1 - e, 3);
    track.style.transform = `translate3d(${-pr * max + (1 - ease) * vw * 1.1 - (1 - Math.pow(1 - x, 2)) * vw * .7}px,0,0)`;
    panels.forEach((el) => {
      const b = el.getBoundingClientRect();
      const d = (b.left + b.width / 2 - vw / 2) / vw;
      const ad = Math.min(1.2, Math.abs(d));
      el.style.transform = `rotateY(${-Math.max(-1.2, Math.min(1.2, d)) * 34}deg) scale(${1 + ad * ad * 1.1})`;
      el.parentElement.parentElement.style.zIndex = Math.round(ad * 100);
    });
  }
  let raf = 0;
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; tick(); }); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  tick();

  // Inclinação dos cards e botões magnéticos
  let lastTilt = null, lastMag = null;
  window.addEventListener('pointermove', (e) => {
    const t = e.target.closest && e.target.closest('[data-tilt]');
    if (lastTilt && lastTilt !== t) lastTilt.style.transform = '';
    if (t && t.classList.contains('in')) {
      const b = t.getBoundingClientRect();
      const tx = (e.clientX - b.left) / b.width - .5, ty = (e.clientY - b.top) / b.height - .5;
      t.style.transform = `perspective(1000px) rotateY(${tx * 6}deg) rotateX(${-ty * 6}deg) translateY(-4px)`;
    }
    lastTilt = t;
    const m = e.target.closest && e.target.closest('[data-magnet]');
    if (lastMag && lastMag !== m) lastMag.style.transform = '';
    if (m) {
      const b = m.getBoundingClientRect();
      m.style.transform = `translate(${(e.clientX - b.left - b.width / 2) * .16}px, ${(e.clientY - b.top - b.height / 2) * .28}px)`;
    }
    lastMag = m;
  });
})();
