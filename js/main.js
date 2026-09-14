// ---------- botones: brillo de borde + sombra interna que siguen el cursor, contenidos dentro del botón ----------
document.querySelectorAll('.btn, .island-nav').forEach(btn=>{
  btn.addEventListener('mousemove', (e)=>{
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    btn.style.setProperty('--mx', (x / rect.width) * 100 + '%');
    btn.style.setProperty('--my', (y / rect.height) * 100 + '%');
    btn.style.setProperty('--gx', ((x / rect.width) - 0.5) * -36 + 'px');
    btn.style.setProperty('--gy', ((y / rect.height) - 0.5) * -36 + 'px');
  });
  btn.addEventListener('mouseleave', ()=>{
    btn.style.setProperty('--mx', '50%');
    btn.style.setProperty('--my', '50%');
    btn.style.setProperty('--gx', '0px');
    btn.style.setProperty('--gy', '0px');
  });
});

// ---------- nav: collapses horizontally on scroll down, expands back open on scroll up ----------
// Pure CSS-transition driven (not keyframes) so the easing curve does the elastic
// overshoot naturally — smoother and less mechanical than stepped keyframes.
(function(){
  const header = document.querySelector('header');
  if(!header) return;
  let lastY = window.scrollY;
  let ticking = false;

  function onScroll(){
    const y = window.scrollY;
    if(y > 40 && y > lastY){
      header.classList.add('nav-hidden');
    } else if(y < lastY || y <= 40){
      header.classList.remove('nav-hidden');
    }
    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', ()=>{
    if(!ticking){ window.requestAnimationFrame(onScroll); ticking = true; }
  }, {passive:true});
})();

// ---------- mobile hamburger menu (nav-center is hidden below 900px) ----------
(function(){
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMobile');
  if(!toggle || !menu) return;

  function setOpen(open){
    menu.classList.toggle('is-open', open);
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  toggle.addEventListener('click', ()=> setOpen(!menu.classList.contains('is-open')));
  menu.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> setOpen(false)));
  document.addEventListener('click', (e)=>{
    if(menu.classList.contains('is-open') && !menu.contains(e.target) && !toggle.contains(e.target)){
      setOpen(false);
    }
  });
  window.addEventListener('resize', ()=>{
    if(window.innerWidth > 900) setOpen(false);
  });
})();

// ---------- scroll reveal ----------
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); } });
}, {threshold:0.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// ---------- FAQ accordion ----------
document.querySelectorAll('.faq-item').forEach(item=>{
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  if(item.classList.contains('open')){ a.style.maxHeight = a.scrollHeight + 'px'; }
  q.addEventListener('click', ()=>{
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i=>{ i.classList.remove('open'); i.querySelector('.faq-a').style.maxHeight = null; });
    if(!isOpen){ item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
  });
});

// ---------- hero: stagger word-by-word reveal ----------
document.querySelectorAll('.hero h1 .word').forEach((word, i)=>{
  word.style.animationDelay = (0.15 + i * 0.06) + 's';
});

// ---------- hero: cursor-reactive spotlight (21st.dev-style), independent of the floating blobs ----------
const heroSection = document.querySelector('.hero');
if(heroSection){
  heroSection.addEventListener('mousemove', (e)=>{
    const rect = heroSection.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    heroSection.style.setProperty('--spot-x', x + '%');
    heroSection.style.setProperty('--spot-y', y + '%');
  });
}

// ---------- about: iguana caminando en loop dentro del CTA hacia "Nosotros" ----------
// Ya no es un slider arrastrable — el CTA es un link normal (navega con un click
// normal a nosotros.html) y la iguana es puramente decorativa: camina de un lado
// al otro del track, en horizontal, en loop infinito, y se voltea al llegar al borde.
(function(){
  const track = document.getElementById('slideCta');
  const iguana = document.getElementById('slideIguana');
  if(!track || !iguana || typeof gsap === 'undefined') return;

  const frames = [
    'images/iguana%20nado/1.webp',
    'images/iguana%20nado/2.webp',
    'images/iguana%20nado/3.webp',
    'images/iguana%20nado/4.webp'
  ];
  let frameIndex = 0;
  setInterval(()=>{
    frameIndex = (frameIndex + 1) % frames.length;
    iguana.src = frames[frameIndex];
  }, 180);

  const PAD = 8;
  function getMax(){ return Math.max(track.clientWidth - iguana.offsetWidth - PAD * 2, 0); }

  let dir = 1;
  gsap.set(iguana, { left: PAD, scaleX: 1 });

  function step(){
    const max = getMax();
    const dest = dir === 1 ? PAD + max : PAD;
    const dist = Math.max(max, 1);
    gsap.to(iguana, {
      left: dest,
      duration: Math.min(Math.max(dist / 55, 1.6), 4.5),
      ease: 'sine.inOut',
      onComplete: ()=>{
        dir *= -1;
        gsap.to(iguana, { scaleX: dir === 1 ? 1 : -1, duration: .3, ease: 'power1.out' });
        step();
      }
    });
  }
  step();
})();

// ---------- pain: scroll timeline — no visible line, a big iguana descends (and cycles its
// 4 swim frames + flips on scroll-up) while the cards to its right fade in one by one as it reaches them ----------
(function(){
  const timeline = document.getElementById('painTimeline');
  const swimmer = document.getElementById('timelineSwimmer');
  if(!timeline || !swimmer) return;

  const frames = [
    'images/iguana%20nado/1.webp',
    'images/iguana%20nado/2.webp',
    'images/iguana%20nado/3.webp',
    'images/iguana%20nado/4.webp'
  ];
  let lastFrameIndex = -1;
  let lastScrollY = window.scrollY;
  let ticking = false;

  function update(){
    const currentY = window.scrollY;
    const scrollingUp = currentY < lastScrollY;
    lastScrollY = currentY;

    swimmer.classList.toggle('reverse', scrollingUp);

    const rect = timeline.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = rect.height + vh;
    const scrolled = vh - rect.top;
    let progress = scrolled / total;
    progress = Math.min(Math.max(progress, 0), 1);

    swimmer.style.top = (progress * rect.height) + 'px';

    const frameIndex = Math.floor((progress * 100) / 1.5) % frames.length;
    if(frameIndex !== lastFrameIndex){
      swimmer.src = frames[frameIndex];
      lastFrameIndex = frameIndex;
    }

    ticking = false;
  }

  window.addEventListener('scroll', ()=>{
    if(!ticking){ window.requestAnimationFrame(update); ticking = true; }
  }, {passive:true});
  window.addEventListener('resize', update);
  update();
})();

// ---------- nosotros hero: fan reveal con GSAP ----------
(function(){
  const fan = document.querySelector('.nh-fan');
  if(!fan || typeof gsap === 'undefined') return;

  const cards = Array.from(fan.querySelectorAll('.nh-card'));
  if(!cards.length) return;

  // initial state: all stacked at center, invisible
  gsap.set(cards, { opacity: 0, y: 30, scale: 0.88 });

  // stagger reveal once fan enters viewport
  if(typeof ScrollTrigger !== 'undefined'){
    gsap.to(cards, {
      opacity:1, y:0, scale:1,
      duration:.75, ease:'power3.out',
      stagger:{ each:0.09, from:'center' },
      scrollTrigger:{ trigger:'.nh-stage', start:'top 82%', once:true }
    });
    // badges
    gsap.from('.nh-badge', {
      opacity:0, scale:.78, duration:.55, ease:'back.out(1.4)',
      stagger:0.14, delay:.3,
      scrollTrigger:{ trigger:'.nh-stage', start:'top 82%', once:true }
    });
  }
})();

// ---------- nosotros hero: 3D flip card (Antes / Ahora) — legacy ----------
(function(){
  const card = document.getElementById('evolveCard');
  const toggle = document.getElementById('evolveToggle');
  if(!card || !toggle) return;

  function flip(){ card.classList.toggle('flipped'); }

  toggle.addEventListener('click', (e)=>{ e.stopPropagation(); flip(); });
  card.addEventListener('click', flip);
})();

// ---------- precios hero: island size picker (Baltra / Isabela) ----------
(function(){
  const picker = document.getElementById('islandPicker');
  const preview = document.getElementById('islandPreview');
  const caption = document.getElementById('islandCaption');
  if(!picker || !preview || !caption) return;

  const captions = {
    baltra: 'Baltra es la puerta de entrada a Galápagos — el aeropuerto por donde llega casi todo el mundo. Tu primer paso, con el número de Iguana Corp.',
    isabela: 'Isabela es, ella sola, más de la mitad de Galápagos y tiene el volcán más alto del archipiélago. Todo el territorio, operando bajo tu propia marca.'
  };

  picker.querySelectorAll('.island-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const island = btn.dataset.island;
      picker.querySelectorAll('.island-btn').forEach(b=> b.classList.toggle('is-active', b === btn));
      picker.dataset.active = island;
      preview.dataset.active = island;
      caption.textContent = captions[island] || '';
    });
  });
})();

// ---------- es-para-ti: full step-by-step quiz, no scroll needed to complete it ----------
// NOTE: the final form only shows a client-side confirmation message — it is not wired to
// any real backend/WhatsApp number/CRM yet. That destination is still pending confirmation.
(function(){
  const card = document.getElementById('quizCard');
  if(!card) return;

  const steps = Array.from(card.querySelectorAll('.quiz-step'));
  const progressFill = document.getElementById('quizProgressFill');
  const backBtn = document.getElementById('quizBack');
  const restartBtn = document.getElementById('quizRestart');
  const resultTag = document.getElementById('quizResultTag');
  const resultTitle = document.getElementById('quizResultTitle');
  const resultText = document.getElementById('quizResultText');
  const form = document.getElementById('quizForm');
  const formNote = document.getElementById('quizFormNote');

  const order = ['1', '2', '3', '4', 'result'];
  let current = 0;
  const answers = {};

  function render(){
    steps.forEach(s=> s.classList.toggle('active', s.dataset.step === order[current]));
    const pct = (current / (order.length - 1)) * 100;
    progressFill.style.width = Math.min(pct, 100) + '%';
    backBtn.hidden = current === 0;
    restartBtn.hidden = order[current] !== 'result';
  }

  function goNext(){ if(current < order.length - 1){ current++; render(); } }
  function goBack(){ if(current > 0){ current--; render(); } }

  function computeResult(){
    let fit = 0;
    if(answers.repetitivo === 'Sí, todo el tiempo') fit++;
    if(answers.volumen && answers.volumen !== 'Menos de 10') fit++;
    if(answers.negocio) fit++;

    const plan = answers.numero === 'Mi propio número' ? 'Plan Isabela' : 'Plan Baltra';

    if(fit >= 2){
      resultTitle.textContent = 'Iguana Corp sí es para ti.';
      resultText.textContent = `Con lo que nos cuentas — ${answers.negocio.toLowerCase()}, atención repetitiva por WhatsApp — te recomendamos empezar con el ${plan}.`;
    } else {
      resultTitle.textContent = 'Puede que aplique, con matices.';
      resultText.textContent = `Tu caso es distinto al de los negocios donde más ayudamos hoy, pero igual vale la pena conversar — el ${plan} podría servirte.`;
    }
  }

  card.querySelectorAll('.quiz-option').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const step = btn.closest('.quiz-step');
      step.querySelectorAll('.quiz-option').forEach(b=> b.classList.toggle('chosen', b === btn));
      answers[btn.dataset.q] = btn.dataset.value;
      setTimeout(()=>{
        if(order[current] === '4'){ computeResult(); }
        goNext();
      }, 220);
    });
  });

  if(backBtn){ backBtn.addEventListener('click', goBack); }
  if(restartBtn){
    restartBtn.addEventListener('click', ()=>{
      current = 0;
      Object.keys(answers).forEach(k=> delete answers[k]);
      card.querySelectorAll('.quiz-option.chosen').forEach(b=> b.classList.remove('chosen'));
      if(form){ form.reset(); form.style.display = ''; }
      if(formNote){ formNote.textContent = ''; }
      render();
    });
  }

  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      formNote.textContent = '¡Gracias! Te contactaremos pronto a este WhatsApp.';
      form.style.display = 'none';
    });
  }

  render();
})();

/* ---------- home — mapa del archipiélago con cámara animada (GSAP) ---------- */
(function(){
  const picker = document.getElementById('homeIslandPicker');
  const thumb = document.getElementById('homeIslandThumb');
  const prevBtn = document.getElementById('islandPrev');
  const nextBtn = document.getElementById('islandNext');
  const caption = document.getElementById('homeIslandCaption');
  const stage = document.getElementById('islandsStage');
  const world = document.getElementById('mapWorld');
  const dots = document.getElementById('islandDots');
  if(!picker || !stage || !world) return;

  const hasGsap = typeof gsap !== 'undefined';

  // orden real, de oeste a este: Fernandina/Isabela primero, Santiago al
  // norte-centro, Santa Cruz al centro, San Cristóbal al sureste.
  // El picker siempre muestra 2 islas vecinas de esta lista (ventana deslizante).
  const ORDER = ['fernandina', 'isabela', 'santiago', 'santacruz', 'sancristobal'];

  const NAMES = {
    fernandina: 'Fernandina', isabela: 'Isabela', santiago: 'Santiago',
    santacruz: 'Santa Cruz', sancristobal: 'San Cristóbal'
  };

  // posiciones y tamaños relativos ajustados al mapa real de Galápagos:
  // Isabela domina (~58% del territorio); Fernandina, Santiago, Santa Cruz
  // y San Cristóbal son mucho más parecidas entre sí en tamaño real.
  // Coordenadas deben coincidir con el left/top de cada .map-island en el HTML.
  const islands = {
    fernandina:  { x:90,  y:235, zoom:2.2 },
    isabela:     { x:260, y:270, zoom:1.0 },
    santiago:    { x:380, y:175, zoom:2.3 },
    santacruz:   { x:560, y:250, zoom:1.9 },
    sancristobal:{ x:820, y:300, zoom:2.3 }
  };

  const captions = {
    isabela: 'Isabela es, ella sola, más de la mitad de Galápagos, con el volcán más alto del archipiélago. El plan más completo, con tu propio número.',
    santacruz: 'Santa Cruz es la única isla con un pueblo real, Puerto Ayora — más pequeña que Isabela, pero el corazón del archipiélago. Un plan a su medida.',
    fernandina: 'Fernandina es la isla más joven y volcánicamente activa de Galápagos, casi sin especies introducidas. Todavía sin plan asignado. [ PENDIENTE ]',
    santiago: 'Santiago fue parada frecuente de piratas y balleneros en los siglos XVII-XIX, y Darwin pasó semanas explorándola en 1835. Todavía sin plan asignado. [ PENDIENTE ]',
    sancristobal: 'San Cristóbal fue la primera isla que pisó Darwin, en 1835, y hoy tiene la capital de la provincia. Todavía sin plan asignado. [ PENDIENTE ]'
  };

  let index = ORDER.indexOf('isabela'); // arranca directo en Isabela, sin plano general
  let current = ORDER[index];
  let manualZoom = null; // si el usuario hizo scroll-zoom, guarda {x,y,scale} temporal

  function targetFor(name){
    const cfg = islands[name];
    const stageW = stage.clientWidth;
    const stageH = stage.clientHeight;
    return {
      x: stageW / 2 - cfg.x * cfg.zoom,
      y: stageH / 2 - cfg.y * cfg.zoom,
      scale: cfg.zoom
    };
  }

  function applyCamera(t, animate){
    if(hasGsap && animate){
      gsap.to(world, { x:t.x, y:t.y, scale:t.scale, duration:1.15, ease:'power3.inOut' });
    }else if(hasGsap){
      gsap.set(world, { x:t.x, y:t.y, scale:t.scale });
    }else{
      world.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.scale})`;
    }
  }

  function renderPicker(){
    picker.querySelectorAll('.island-btn').forEach(b=> b.remove());
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'island-btn is-active';
    btn.dataset.island = current;
    btn.textContent = NAMES[current];
    btn.addEventListener('click', (e)=> e.stopPropagation());
    picker.appendChild(btn);
    requestAnimationFrame(()=>{
      if(!thumb) return;
      thumb.style.width = btn.offsetWidth + 'px';
      thumb.style.transform = `translateX(${btn.offsetLeft}px)`;
    });
  }

  function markCurrent(name){
    world.querySelectorAll('.map-island').forEach(el=>{
      el.classList.toggle('is-current', el.dataset.island === name);
    });
  }

  // puntos debajo del mapa: uno por isla, en el mismo orden que ORDER
  function renderDots(){
    if(!dots) return;
    if(!dots.childElementCount){
      ORDER.forEach(name=>{
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'island-dot';
        dot.dataset.island = name;
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', NAMES[name]);
        dot.addEventListener('click', ()=> goTo(name, true));
        dots.appendChild(dot);
      });
    }
    dots.querySelectorAll('.island-dot').forEach(dot=>{
      const active = dot.dataset.island === current;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function goTo(name, animate){
    if(!islands[name]) return;
    index = ORDER.indexOf(name);
    current = name;
    manualZoom = null;
    applyCamera(targetFor(name), animate);
    markCurrent(name);
    if(caption){
      caption.style.opacity = 0;
      setTimeout(()=>{
        caption.textContent = captions[name] || '';
        caption.style.opacity = 1;
      }, 180);
    }
    renderPicker();
    renderDots();
  }

  function step(dir){
    // avanza/retrocede en la lista y hace bucle: de la última vuelve a la primera
    index = (index + dir + ORDER.length) % ORDER.length;
    goTo(ORDER[index], true);
  }

  if(prevBtn) prevBtn.addEventListener('click', ()=> step(-1));
  if(nextBtn) nextBtn.addEventListener('click', ()=> step(1));

  // cualquier isla del mapa (real o placeholder): clic/tap dispara el movimiento
  world.querySelectorAll('.map-island').forEach(el=>{
    el.addEventListener('click', (e)=>{
      e.stopPropagation();
      goTo(el.dataset.island, true);
    });
  });

  // sin zoom ni paneo por scroll/wheel: el mapa no debe capturar el scroll de
  // la página. La navegación entre islas es exclusivamente con las flechas
  // ‹ › (o clic directo sobre una isla del mapa).

  window.addEventListener('resize', ()=> applyCamera(targetFor(current), false));

  applyCamera(targetFor(current), false);
  markCurrent(current);
  renderPicker();
  renderDots();
})();

/* ---------- precios — slider de planes por isla ---------- */
(function(){
  const slider = document.getElementById('plansSlider');
  const prevBtn = document.getElementById('planPrev');
  const nextBtn = document.getElementById('planNext');
  const thumb = document.getElementById('planThumb');
  const nameEl = document.getElementById('planName');
  const nextLabel = document.getElementById('planNextLabel');
  const card = document.getElementById('planCard');
  const cardTab = document.getElementById('planCardTab');
  const cardSub = document.getElementById('planCardSub');
  const cardList = document.getElementById('planCardList');
  const cardNote = document.getElementById('planCardNote');
  if(!slider || !card) return;

  const hasGsap = typeof gsap !== 'undefined';

  // mismo orden real del archipiélago que en el home; solo Isabela y Santa Cruz
  // tienen plan confirmado hoy, el resto queda como "próximamente".
  const ORDER = ['isabela', 'santacruz', 'fernandina', 'santiago', 'sancristobal'];
  const NAMES = {
    isabela:'Isabela', santacruz:'Santa Cruz', fernandina:'Fernandina',
    santiago:'Santiago', sancristobal:'San Cristóbal'
  };

  const PLANS = {
    isabela: {
      img:'images/isla-isabela.webp', tag:'Plan Isabela', featured:true,
      sub:'Todo el territorio, a tu nombre',
      list:[
        'Todo lo del Plan Santa Cruz',
        'Integrado directo a tu propio número de WhatsApp Business',
        'Costo de implementación adicional (pago único) + suscripción mensual'
      ],
      note:'Isabela es, ella sola, más de la mitad de Galápagos. Este plan es el negocio completo, operando bajo tu propia marca.'
    },
    santacruz: {
      img:'images/isla-santacruz.webp', tag:'Plan Santa Cruz', featured:false,
      sub:'La puerta de entrada',
      list:[
        'Atiendes desde el número de WhatsApp de Iguana Corp',
        'Suscripción mensual baja y accesible',
        'Agente de WhatsApp + dashboard de agenda',
        'Cancelas cuando quieras'
      ],
      note:'Santa Cruz es la única isla con un pueblo real, Puerto Ayora — el corazón habitado del archipiélago. Este plan es tu primer paso.'
    },
    fernandina: {
      img:'images/isla-fernandina.webp', tag:'Próximamente', featured:false, sub:'Plan por definir',
      list:[], note:'Fernandina es la isla más joven y volcánicamente activa de Galápagos. Todavía sin plan asignado. [ PENDIENTE ]'
    },
    santiago: {
      img:'images/isla-santiago.webp', tag:'Próximamente', featured:false, sub:'Plan por definir',
      list:[], note:'Santiago fue parada frecuente de piratas y balleneros, y Darwin la exploró en 1835. Todavía sin plan asignado. [ PENDIENTE ]'
    },
    sancristobal: {
      img:'images/isla-sancristobal.webp', tag:'Próximamente', featured:false, sub:'Plan por definir',
      list:[], note:'San Cristóbal fue la primera isla que pisó Darwin, en 1835. Todavía sin plan asignado. [ PENDIENTE ]'
    }
  };

  let index = 0;

  function render(animate){
    const name = ORDER[index];
    const data = PLANS[name];
    const nextName = NAMES[ORDER[(index + 1) % ORDER.length]];

    function paint(){
      if(thumb){
        if(data.img){ thumb.src = data.img; thumb.alt = 'Isla ' + NAMES[name]; thumb.style.display = ''; }
        else{ thumb.style.display = 'none'; }
      }
      if(nameEl) nameEl.textContent = NAMES[name];
      if(nextLabel) nextLabel.textContent = 'Siguiente: ' + nextName;

      if(cardTab) cardTab.textContent = data.tag;
      if(cardSub) cardSub.textContent = data.sub;
      if(cardList){
        cardList.innerHTML = '';
        data.list.forEach(item=>{
          const li = document.createElement('li');
          li.textContent = item;
          cardList.appendChild(li);
        });
      }
      if(cardNote) cardNote.textContent = data.note;
      card.classList.toggle('featured', !!data.featured);
    }

    if(animate && hasGsap){
      gsap.to([card, document.getElementById('planIslandStack')], {
        opacity:0, y:8, duration:.18, ease:'power1.in',
        onComplete:()=>{
          paint();
          gsap.fromTo([card, document.getElementById('planIslandStack')],
            { opacity:0, y:-8 }, { opacity:1, y:0, duration:.35, ease:'power2.out' });
        }
      });
    }else{
      paint();
    }
  }

  function step(dir){
    index = (index + dir + ORDER.length) % ORDER.length;
    render(true);
  }

  if(prevBtn) prevBtn.addEventListener('click', ()=> step(-1));
  if(nextBtn) nextBtn.addEventListener('click', ()=> step(1));

  render(false);
})();

/* ---------- nosotros — 3D carousel "Por qué Galápagos" ---------- */
(function(){
  const stage = document.getElementById('originStage');
  const textPanel = document.getElementById('originTextPanel');
  const prevBtn = document.getElementById('originPrev');
  const nextBtn = document.getElementById('originNext');
  const dotsWrap = document.getElementById('originDots');
  if(!stage) return;

  const cards = Array.from(stage.querySelectorAll('.origin-crd'));
  const slides = textPanel ? Array.from(textPanel.querySelectorAll('.origin-text-slide')) : [];
  const total = cards.length;
  let active = 0;
  let busy = false;

  // x offset, rotateY, scale, blur, opacity, zIndex for offsets 0, +1, -1, +2, -2
  const POS = {
    0:  { x:0,    ry:0,   s:1,    b:0,  o:1,    z:10 },
    1:  { x:310,  ry:-40, s:0.80, b:4,  o:0.68, z:7  },
   '-1':{ x:-310, ry:40,  s:0.80, b:4,  o:0.68, z:7  },
    2:  { x:530,  ry:-54, s:0.62, b:9,  o:0.32, z:4  },
   '-2':{ x:-530, ry:54,  s:0.62, b:9,  o:0.32, z:4  },
  };

  function offset(idx){
    let off = (idx - active + total) % total;
    if(off > total / 2) off -= total;
    return off;
  }

  function applyCards(){
    cards.forEach((card, i)=>{
      const off = offset(i);
      const p = POS[off] || POS[Math.sign(off) * 2] || null;
      if(!p || Math.abs(off) > 2){
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
        return;
      }
      card.style.transform = `translateX(${p.x}px) rotateY(${p.ry}deg) scale(${p.s})`;
      card.style.filter = p.b ? `blur(${p.b}px)` : 'none';
      card.style.opacity = String(p.o);
      card.style.zIndex = String(p.z);
      card.style.pointerEvents = off === 0 ? 'auto' : 'none';
    });
    dotsWrap.querySelectorAll('.origin-dot').forEach((d,i)=> d.classList.toggle('is-active', i === active));
  }

  function animateText(nextIdx, dir){
    const prev = slides[active];
    const next = slides[nextIdx];
    if(!next) return;
    if(prev && prev !== next){
      prev.classList.remove('is-active');
      prev.classList.add(dir > 0 ? 'exit-left' : 'exit-right');
      setTimeout(()=> prev.classList.remove('exit-left','exit-right'), 460);
    }
    next.style.transform = `translateX(${dir > 0 ? 54 : -54}px)`;
    next.style.opacity = '0';
    next.style.transition = 'none';
    requestAnimationFrame(()=> requestAnimationFrame(()=>{
      next.style.transition = '';
      next.classList.add('is-active');
      next.style.transform = '';
      next.style.opacity = '';
    }));
  }

  function goTo(i, dir){
    if(busy) return;
    busy = true;
    animateText(i, dir);
    active = i;
    applyCards();
    setTimeout(()=> busy = false, 680);
  }

  // dots
  cards.forEach((_, i)=>{
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'origin-dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', 'Idea ' + (i+1));
    dot.addEventListener('click', ()=> goTo(i, i > active ? 1 : -1));
    dotsWrap.appendChild(dot);
  });

  // clic en cards laterales → navegar a ellas
  cards.forEach((card, i)=>{
    card.addEventListener('click', ()=>{
      const off = offset(i);
      if(off !== 0) goTo(i, off > 0 ? 1 : -1);
    });
  });

  if(prevBtn) prevBtn.addEventListener('click', ()=>{
    const next = (active - 1 + total) % total;
    goTo(next, -1);
  });
  if(nextBtn) nextBtn.addEventListener('click', ()=>{
    const next = (active + 1) % total;
    goTo(next, 1);
  });

  applyCards();
})();

/* ---------- nosotros — stepper interactivo "Tu negocio, antes y después" ---------- */
(function(){
  const stepper = document.getElementById('storyStepper');
  const panels = document.getElementById('storyPanels');
  const dotsWrap = document.getElementById('storyDots');
  const nextBtn = document.getElementById('storyNextBtn');
  const fill = document.getElementById('storyProgressFill');
  if(!stepper || !panels) return;

  const panelEls = Array.from(panels.querySelectorAll('.story-panel'));
  const dotEls = Array.from(dotsWrap.querySelectorAll('.story-dot'));
  const total = panelEls.length;
  let step = 0;

  function render(){
    panelEls.forEach((p, i)=> p.classList.toggle('is-active', i === step));
    dotEls.forEach((d, i)=> d.classList.toggle('is-active', i === step));
    if(fill) fill.style.width = ((step + 1) / total * 100) + '%';
    stepper.classList.toggle('is-dark', step === total - 1);

    if(nextBtn){
      if(step === total - 1){
        nextBtn.textContent = 'Quiero mi Diagnóstico Gratis';
        nextBtn.onclick = ()=> window.location.href = 'es-para-ti.html';
      }else{
        nextBtn.textContent = 'Siguiente →';
        nextBtn.onclick = ()=>{ step = Math.min(total - 1, step + 1); render(); };
      }
    }
  }

  dotEls.forEach((dot, i)=>{
    dot.addEventListener('click', ()=>{ step = i; render(); });
  });

  render();

  if(typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined'){
    gsap.from(stepper, {
      opacity:0, y:40, duration:.9, ease:'power3.out',
      scrollTrigger:{ trigger:stepper, start:'top 82%' }
    });
  }
})();
