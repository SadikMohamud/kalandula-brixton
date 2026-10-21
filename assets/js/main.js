(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  let menuOpen = false;

  $("#js-year").textContent = new Date().getFullYear();

  /* Menu: build tabs and list from data */
  const data = window.KALANDULA_MENU || [];
  const tabs = $("#js-tabs");
  const list = $("#js-list");
  const photo = $("#js-menu-photo");
  const money = (n) => "£" + n.toFixed(2);

  function renderCategory(i) {
    const cat = data[i];
    $$(".menu__tab", tabs).forEach((t, j) => t.setAttribute("aria-selected", String(i === j)));
    list.innerHTML = cat.items.map((it) => `
      <li class="menu__item">
        <h3>${it.title}</h3>
        <span class="menu__price">${money(it.price)}</span>
        ${it.description ? `<p>${it.description}</p>` : ""}
      </li>`).join("");
    if (window.gsap && !reduce) {
      gsap.fromTo($$(".menu__item", list), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.04 });
      gsap.fromTo(photo, { scale: 1.15, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 1.1, ease: "expo.out" });
    }
    photo.src = cat.photo;
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  data.forEach((cat, i) => {
    const b = document.createElement("button");
    b.className = "menu__tab";
    b.setAttribute("role", "tab");
    b.textContent = cat.title;
    b.addEventListener("click", () => renderCategory(i));
    tabs.appendChild(b);
  });
  if (data.length) renderCategory(0);

  /* Cascade images */
  const cascadeSrc = ["food-7", "food-one", "food-3", "food-9", "food-2", "food-6", "food-4", "food-8", "food-5", "interior", "food-one", "chef"];
  const cascadeAlt = ["Chicken skewers", "Grilled fish and chicken", "Pork skewers with pineapple and rice", "Grilled meat platter", "Bean stew", "Meat stew with chips", "Grilled meat on a wooden spatula", "Steak with rice and onions", "Grilled meat", "The dining room", "Grilled fish and chicken", "Our chef"];
  const ratios = ["3/2", "4/3", "5/4", "7/5"];
  const cascade = $("#js-cascade");
  cascadeSrc.forEach((src, i) => {
    const fig = document.createElement("figure");
    fig.className = "cascade__img";
    fig.style.aspectRatio = ratios[i % ratios.length];
    fig.innerHTML = `<img src="assets/img/${src}.webp" alt="${cascadeAlt[i]}" loading="lazy">`;
    cascade.appendChild(fig);
  });

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  /* Smooth scroll */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      e.preventDefault();
      closeMenu();
      lenis.scrollTo(id === "#top" ? 0 : id, { offset: -20, duration: 1.4 });
    }));
  }

  /* Header: solid after hero, hides on scroll down */
  const bar = $("#bar");
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: (self) => {
      const y = self.scroll();
      const pastHero = y > window.innerHeight * 2.6;
      bar.classList.toggle("is-solid", pastHero);
      bar.classList.toggle("is-hidden", pastHero && y > lastY + 4 && !menuOpen);
      if (y < lastY - 4) bar.classList.remove("is-hidden");
      lastY = y;
    }
  });

  /* Ink reveal navigation */
  const toggle = $("#js-toggle");
  const menu = $("#js-menu");
  const content = $("#js-content");
  const circle = $("#js-clip-circle");
  const links = $$(".ink__link", menu);
  const proxy = { r: 0 };
  let geo = {};
  function measure() {
    const r = toggle.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = Math.max(cx, innerWidth - cx), dy = Math.max(cy, innerHeight - cy);
    geo = { cx, cy, max: Math.hypot(dx, dy) + 20 };
  }
  function paint() {
    circle.setAttribute("cx", geo.cx); circle.setAttribute("cy", geo.cy); circle.setAttribute("r", proxy.r);
    content.style.setProperty("--cx", geo.cx + "px");
    content.style.setProperty("--cy", geo.cy + "px");
    content.style.setProperty("--cr", proxy.r + "px");
  }
  measure(); paint();
  gsap.set(links, { yPercent: 60, opacity: 0 });
  const tl = gsap.timeline({ paused: true })
    .to(proxy, { r: () => geo.max, duration: 0.9, ease: "power3.inOut", onUpdate: paint })
    .to(links, { yPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.06 }, "-=0.35");
  function openMenu() {
    measure(); menuOpen = true; tl.invalidate().play();
    menu.classList.add("is-open"); menu.setAttribute("aria-hidden", "false");
    toggle.classList.add("is-open"); toggle.setAttribute("aria-expanded", "true");
    toggle.style.background = "var(--ink)";
    $$("span", toggle).forEach((s) => (s.style.background = "var(--gold)"));
    document.body.classList.add("menu-open");
    lenis && lenis.stop();
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false; tl.reverse();
    menu.classList.remove("is-open"); menu.setAttribute("aria-hidden", "true");
    toggle.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false");
    toggle.style.background = "";
    $$("span", toggle).forEach((s) => (s.style.background = ""));
    document.body.classList.remove("menu-open");
    lenis && lenis.start();
  }
  toggle.addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());
  addEventListener("resize", () => { measure(); if (menuOpen) { proxy.r = geo.max; paint(); } });

  if (reduce) return;

  /* Hero: the falls grow out of the wordmark */
  const mask = $("#js-mask");
  const falls = $("#js-falls");
  const over = $("#js-over");
  const startSize = () => (innerWidth < 860 ? 92 : 70);
  let target = 0, eased = 0;
  ScrollTrigger.create({
    trigger: falls, start: "top top", end: "bottom bottom",
    onUpdate: (self) => (target = self.progress)
  });
  gsap.ticker.add(() => {
    eased += (target - eased) * 0.12;
    const grow = Math.min(eased / 0.72, 1);
    const size = startSize() + Math.pow(grow, 2.4) * 4200;
    mask.style.webkitMaskSize = size + "%";
    mask.style.maskSize = size + "%";
    const fade = Math.max(0, 1 - eased * 6);
    $("#js-kicker").style.opacity = fade;
    $("#js-hint").style.opacity = fade;
    const show = gsap.utils.clamp(0, 1, (eased - 0.7) / 0.2);
    over.style.opacity = show;
    over.classList.toggle("is-live", show > 0.6);
    if (grow >= 1 && mask.style.webkitMaskImage !== "none") { mask.style.webkitMaskImage = "none"; mask.style.maskImage = "none"; }
    if (grow < 1 && mask.style.webkitMaskImage === "none") { mask.style.webkitMaskImage = ""; mask.style.maskImage = ""; }
  });

  /* Story lede: words light up as you read */
  $$(".js-words").forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    gsap.to($$(".w", el), {
      opacity: 1, stagger: 0.08, ease: "none",
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true }
    });
  });

  /* Parallax images */
  $$(".js-par").forEach((fig) => {
    const img = $("img", fig);
    const speed = parseFloat(fig.dataset.speed || 0.1);
    gsap.fromTo(img, { yPercent: -8 + speed * 40 }, {
      yPercent: -8 - speed * 40, ease: "none",
      scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* Counters */
  $$("[data-count]").forEach((b) => {
    const end = +b.dataset.count, o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 1.8, ease: "power2.out",
      scrollTrigger: { trigger: b, start: "top 90%", once: true },
      onUpdate: () => (b.textContent = Math.round(o.v))
    });
  });

  /* Section headings rise in */
  $$(".display--md").forEach((h) => {
    gsap.from(h, { yPercent: 30, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: h, start: "top 88%" } });
  });

  /* Cascade: images flow down the page like water over the falls */
  const items = $$(".cascade__img");
  const total = items.length;
  const W = { base: { amp: 0.1, freq: 1, speed: 1, phase: 5 }, flow: { amp: 0.15, freq: 5, speed: 5, phase: 10 }, detail: { amp: 0.025, freq: 5, speed: 1.5, phase: 2.5 } };
  function sizeCascade() {
    const f = Math.min(innerWidth / 750, 1);
    const shrinkStart = Math.floor(total * 0.75);
    items.forEach((it, i) => {
      const s = i >= shrinkStart ? (i - shrinkStart + 1) / (total - shrinkStart) : 0;
      it.style.height = Math.round(400 * f * (1 - s * 0.5)) + "px";
    });
  }
  sizeCascade();
  items.forEach((it, i) => {
    const n = i / (total - 1);
    ScrollTrigger.create({
      trigger: it, start: "top bottom", end: "bottom top",
      onUpdate: ({ progress: p }) => {
        const vw = innerWidth;
        const x = (vw - it.offsetWidth) / 2 - vw * 0.1
          + Math.sin(n * W.base.freq + (1 - p) * W.base.speed + W.base.phase) * vw * W.base.amp
          + (0.5 + Math.sin(n * W.flow.freq + W.flow.phase + p * W.flow.speed)) * vw * W.flow.amp
          + (0.5 + Math.sin(n * W.detail.freq + W.detail.phase + p * W.detail.speed)) * vw * W.detail.amp;
        const clip = Math.pow(Math.abs(p - 0.5) * 2, 2) * 20;
        it.style.translate = x + "px";
        it.style.clipPath = `inset(0 ${clip}% 0 ${clip}%)`;
      }
    });
  });
  addEventListener("resize", () => { sizeCascade(); ScrollTrigger.refresh(); });

  /* Magnetic buttons */
  if (matchMedia("(hover: hover)").matches) {
    $$(".pill").forEach((p) => {
      p.addEventListener("mousemove", (e) => {
        const r = p.getBoundingClientRect();
        gsap.to(p, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4, ease: "power3.out" });
      });
      p.addEventListener("mouseleave", () => gsap.to(p, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" }));
    });
  }
})();
