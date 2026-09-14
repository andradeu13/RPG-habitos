/* ============================================================
   home.js — animaciones exclusivas del home
   Requiere GSAP + ScrollTrigger cargados antes (defer en index.html).
============================================================ */

// espera a que GSAP + ScrollTrigger existan (ambos se cargan con `defer`,
// así que corren en orden pero conviene proteger igual)
/* ---------- arc gallery: aro giratorio de imágenes de Galápagos ---------- */
(function(){
  const ring = document.getElementById('garcRing');
  const section = document.getElementById('garcSection');
  if(!ring) return;

  const items = Array.from(ring.querySelectorAll('.garc-item'));
  const total = items.length;
  if(!total) return;

  /* radio adaptativo — elipse abierta horizontalmente alrededor del texto central */
  function getRadius(){
    const w = window.innerWidth;
    if(w < 480) return { x: 190, y: 120 };
    if(w < 768) return { x: 300, y: 165 };
    if(w < 1100) return { x: 420, y: 210 };
    return { x: 540, y: 250 };
  }

  /* 1 vuelta completa cada ~160 s (velocidad de crucero) */
  const SPEED = (2 * Math.PI) / (160 * 1000); // rad / ms

  /* entrada en espiral: arranca girando rápido y creciendo desde el centro,
     luego desacelera hasta la velocidad de crucero */
  const INTRO_MS = 2600;
  const SPIN_BOOST = 5.5; // veces más rápido al inicio
  function easeOutCubic(p){ return 1 - Math.pow(1 - p, 3); }

  let raf = null;
  let angle = 0;
  let lastTs = null;
  let introStart = null;
  let radius = getRadius();

  window.addEventListener('resize', ()=>{ radius = getRadius(); }, { passive:true });

  function tick(ts){
    if(lastTs === null) lastTs = ts;
    if(introStart === null) introStart = ts;

    const dt = ts - lastTs;
    lastTs = ts;

    const p = Math.min((ts - introStart) / INTRO_MS, 1);
    const ease = easeOutCubic(p);
    const speedMult = 1 + (SPIN_BOOST - 1) * (1 - ease); // 5.5x -> 1x
    const radiusScale = 0.06 + 0.94 * ease;              // crece desde el centro
    const itemScale = 0.4 + 0.6 * ease;                  // grow-in por ítem
    const itemOpacity = ease;                             // fade-in

    angle += SPEED * dt * speedMult;

    items.forEach((item, i)=>{
      const a = angle + (i / total) * Math.PI * 2;
      const x = (Math.sin(a) * radius.x * radiusScale).toFixed(2);
      const y = (-Math.cos(a) * radius.y * radiusScale).toFixed(2);
      item.style.transform = `translate(${x}px,${y}px) scale(${itemScale.toFixed(3)})`;
      item.style.opacity = itemOpacity.toFixed(3);
    });

    raf = requestAnimationFrame(tick);
  }

  /* pausar animación cuando la sección está fuera de pantalla;
     al reaparecer, repite la entrada en espiral */
  if(typeof IntersectionObserver !== 'undefined' && section){
    const io = new IntersectionObserver(entries=>{
      if(entries[0].isIntersecting){
        if(!raf){ raf = requestAnimationFrame(tick); }
      } else {
        if(raf){ cancelAnimationFrame(raf); raf = null; lastTs = null; introStart = null; }
      }
    }, { threshold: 0.01 });
    io.observe(section);
  } else {
    raf = requestAnimationFrame(tick);
  }
})();

window.addEventListener('DOMContentLoaded', ()=>{
  if(typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- pain-cards: carpeta apilada con pestañas, al hacer scroll ----------
     Todo el efecto es CSS (position:sticky con "top" escalonado por card —
     ver styles.css): cada card se detiene más abajo que la anterior, dejando
     ver la pestaña (.card-tab) de las de atrás, como una carpeta con
     separadores. El movimiento lo da el scroll mismo, sin pines ni JS —
     así se evitan los bugs de los intentos anteriores (saltos, desincronía,
     cards que se pasaban de sección). No hace falta nada más acá. */

  /* ---------- "pain" tapa a "working": pin real de ScrollTrigger (no CSS sticky) ----------
     position:sticky sin un contenedor propio se queda pegado indefinidamente (nunca se
     libera). ScrollTrigger.pin sí sabe soltar la sección exactamente cuando "pain" terminó
     de pasar por encima, dejando el resto de la página (quiebre negro, compare, etc.) libre. */
  (function(){
    const working = document.querySelector('.working');
    const pain = document.querySelector('.pain');
    if(!working || !pain) return;

    ScrollTrigger.create({
      trigger: working,
      start: 'top top',
      endTrigger: pain,
      end: 'bottom top',
      pin: true,
      pinSpacing: false
    });
  })();

  // recalcula posiciones una vez que todo (imágenes, fuentes) terminó de cargar,
  // para que los pines de arriba midan alturas finales correctas
  window.addEventListener('load', ()=> ScrollTrigger.refresh());

  /* ---------- parallax del hero: cada capa se mueve a distinta velocidad ---------- */
  const layers = document.querySelectorAll('[data-parallax]');
  if(layers.length){
    layers.forEach(el=>{
      const depth = parseFloat(el.dataset.parallax) || 0;
      gsap.to(el, {
        yPercent: -depth * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5
        }
      });
    });
  }

  /* ---------- palabra que cicla en el hero ("más manos." -> "más horas." -> ...) ---------- */
  (function(){
    const el = document.querySelector('h1 .word.cycle');
    if(!el) return;
    let options;
    try{ options = JSON.parse(el.dataset.cycle); }catch(e){ return; }
    if(!Array.isArray(options) || options.length < 2) return;

    let i = 0;
    function next(){
      i = (i + 1) % options.length;
      gsap.to(el, {
        opacity: 0, y: -8, filter: 'blur(6px)', duration: .3, ease: 'power2.in',
        onComplete: ()=>{
          el.textContent = options[i];
          gsap.fromTo(el,
            { opacity: 0, y: 12, filter: 'blur(6px)' },
            { opacity: 1, y: 0, filter: 'blur(0px)', duration: .5, ease: 'power2.out' }
          );
        }
      });
    }
    setInterval(next, 2400);
  })();

  /* ---------- abanico de fotos ("Sigue explorando"): revelación desde la derecha ----------
     Cada foto ya tiene su rotación final (--r) por CSS y todas comparten el mismo
     transform-origin, así la curva sale sola. Acá solo se anima la LLEGADA:
     entran apiladas desde la derecha y caen en cascada abriéndose en abanico. */
  (function(){
    const photos = gsap.utils.toArray('.fan-photo');
    const fan = document.querySelector('.explore-fan');
    if(!photos.length || !fan) return;
    // arrancan todas juntas a la derecha, sin rotación, planas
    gsap.set(photos, { xPercent: 100, rotate: 0, opacity: 0 });
    gsap.to(photos, {
      xPercent: 0, opacity: 1, rotate: 0,
      duration: .9, ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: { trigger: fan, start: 'top 85%' },
      // al terminar, cada card recupera su rotación de CSS (var(--r))
      onComplete(){ gsap.set(photos, { clearProps: 'transform,opacity' }); }
    });
  })();

  /* ---------- statement negro: se ilumina palabra por palabra al hacer scroll ---------- */
  (function(){
    const wrap = document.getElementById('darkStatement');
    if(!wrap) return;
    const words = wrap.querySelectorAll('.statement-word');
    if(!words.length) return;

    gsap.to(words, {
      className: '+=is-lit',
      stagger: { each: 1 / words.length, from: 'start' },
      scrollTrigger: {
        trigger: wrap,
        start: 'top 75%',
        end: 'bottom 30%',
        scrub: true
      }
    });
  })();

  /* ---------- reveal genérico con stagger: cada .stat-card / .proj-card / .feat-card / .roadmap-card
              entra por separado con un pequeño delay entre sí al hacer scroll ---------- */
  const staggerSelectors = [
    { parent: '.stats-grid', child: '.stat-card' },
    { parent: '.proj-row',   child: '.proj-card' },
    { parent: '.feat-grid',  child: '.feat-card' },
    { parent: '.stepper',    child: '.t-item' },
    { parent: '.roadmap-grid', child: '.roadmap-card' }
  ];
  staggerSelectors.forEach(({ parent, child })=>{
    document.querySelectorAll(parent).forEach(container=>{
      const items = container.querySelectorAll(child);
      if(!items.length) return;
      gsap.from(items, {
        opacity: 0, y: 40,
        duration: .7, ease: 'power3.out',
        stagger: 0.09,
        scrollTrigger: { trigger: container, start: 'top 82%' }
      });
    });
  });

  /* ---------- contador de números en las stat cards ---------- */
  document.querySelectorAll('.stat-card .num').forEach(numEl=>{
    const raw = numEl.textContent.trim();
    // capturar el primer número entero al principio; conservar el resto (sup/símbolos)
    const match = raw.match(/^(\d+)/);
    if(!match) return;
    const target = parseInt(match[1], 10);
    const rest = raw.slice(match[1].length);
    const supHTML = numEl.querySelector('sup') ? numEl.querySelector('sup').outerHTML : '';
    const restText = rest.replace(/<sup[\s\S]*?<\/sup>/, '');

    const counter = { val: 0 };
    ScrollTrigger.create({
      trigger: numEl,
      start: 'top 85%',
      once: true,
      onEnter: ()=>{
        gsap.to(counter, {
          val: target, duration: 1.4, ease: 'power2.out',
          onUpdate: ()=>{
            numEl.innerHTML = Math.round(counter.val) + restText + supHTML;
          }
        });
      }
    });
  });

  /* ---------- arc gallery: revelación con fade-in al entrar en viewport ---------- */
  (function(){
    const content = document.querySelector('.garc-content');
    if(!content || typeof ScrollTrigger === 'undefined') return;
    gsap.from(content.children, {
      opacity:0, y:28,
      duration:.85, ease:'power3.out',
      stagger:0.12,
      scrollTrigger:{ trigger:'.garc-section', start:'top 70%' }
    });
  })();

  /* ---------- marquee negro: pausar en hover (opcional, elegante) ---------- */
  document.querySelectorAll('.marquee-track').forEach(track=>{
    track.addEventListener('mouseenter', ()=> track.style.animationPlayState = 'paused');
    track.addEventListener('mouseleave', ()=> track.style.animationPlayState = 'running');
  });

  /* ---------- section reveal de headers (pill + h2) por separado ---------- */
  document.querySelectorAll('.working-head, .compare-head, .features-head, .timeline-head, .roadmap-head, .faq-head, .explore-head, .pain-head, .islands-3d-copy').forEach(head=>{
    const pill = head.querySelector('.pill');
    const heading = head.querySelector('h2') || head.querySelector('h1');
    const lead = head.querySelector('.lead');
    const targets = [pill, heading, lead].filter(Boolean);
    if(!targets.length) return;
    gsap.from(targets, {
      opacity: 0, y: 24,
      duration: .8, ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: { trigger: head, start: 'top 82%' }
    });
  });
});

/* ---------- scatter 3D: inicia rotación al entrar en viewport ---------- */
(function(){
  const scene = document.getElementById('scatterScene');
  if(!scene) return;
  if(typeof IntersectionObserver !== 'undefined'){
    const io = new IntersectionObserver(entries=>{
      if(entries[0].isIntersecting){
        scene.classList.add('is-spinning');
      } else {
        scene.classList.remove('is-spinning');
      }
    }, { threshold: 0.05 });
    io.observe(scene.closest('.scatter-section') || scene);
  } else {
    scene.classList.add('is-spinning');
  }
})();
