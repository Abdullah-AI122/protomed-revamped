/* ProtoMed revamp — shared script for every page. Each feature only runs if its markup is on the page. In WordPress: enqueue in the footer. */
/* ---- Booking calendar flow: copied unchanged from the live site ---- */
document.addEventListener("DOMContentLoaded", function () {

    const buttons = document.querySelectorAll(".talk-expert-btn");
    const modal = document.getElementById("calendly-popup");
    const closeBtn = document.querySelector(".calendly-close");
    const bookingUrl = "https://bookings.cloud.microsoft/bookwithme/user/e970a48453704eb682ed6feef7ede3d9%40protomed.co/meetingtype/qdyVpYt5eUGWjYifoErOHg2?anonymous&ismsaljsauthenabled";

    function isMobile() {
        return window.matchMedia("(max-width:768px)").matches;
    }

    buttons.forEach(function (button) {
        button.addEventListener("click", function (e) {
            e.preventDefault();

            if (isMobile()) {
                // Show the styled popup card briefly, then hand off to a new tab
                modal.classList.add("active");
                document.body.style.overflow = "hidden";

                setTimeout(function () {
                    window.open(bookingUrl, "_blank", "noopener,noreferrer");
                    modal.classList.remove("active");
                    document.body.style.overflow = "";
                }, 600);

            } else {
                // Desktop: real centered popup window
                const width = 900;
                const height = 750;
                const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
                const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;
                const screenWidth = window.innerWidth || document.documentElement.clientWidth || window.screen.width;
                const screenHeight = window.innerHeight || document.documentElement.clientHeight || window.screen.height;
                const left = ((screenWidth / 2) - (width / 2)) + dualScreenLeft;
                const top = ((screenHeight / 2) - (height / 2)) + dualScreenTop;

                const popup = window.open(
                    bookingUrl,
                    "bookingPopup",
                    `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no`
                );
                if (popup) popup.focus();
            }
        });
    });

    closeBtn.addEventListener("click", function () {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    });

    modal.addEventListener("click", function (e) {
        if (e.target === modal) {
            modal.classList.remove("active");
            document.body.style.overflow = "";
        }
    });

});

/* ---- Design interactions (progressive enhancement; page works without JS) ---- */
(function () {
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header: transparent over the hero, solid after scrolling */
  var header = document.getElementById("siteHeader");
  var hero = document.querySelector(".pm-hero");
  function setHeader() {
    var limit = hero ? hero.offsetHeight - header.offsetHeight - 40 : 10;
    header.classList.toggle("is-solid", window.scrollY > Math.min(limit, 120));
  }
  setHeader();
  window.addEventListener("scroll", setHeader, { passive: true });

  /* Lenis smooth scrolling (skipped for reduced motion; page scrolls natively without it) */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    (function loop(t) { lenis.raf(t); requestAnimationFrame(loop); })(performance.now());
    /* in-page anchors (#process, #top …) glide too, offset under the sticky header */
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      var target = id === "#top" ? 0 : (id.length > 1 && document.querySelector(id));
      if (target === null || target === false) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: target === 0 ? 0 : -(header.offsetHeight + 16) });
    });
  }

  /* Stacking (2 places): a [data-pin] section holds once its bottom reaches the viewport bottom,
     then shrinks/dims slightly while the following [data-cover] section slides over it. */
  var pins = Array.prototype.slice.call(document.querySelectorAll("main > section[data-pin]"));
  /* phones + short laptop windows: no cover-up effect — heroes taller than the screen would have their buttons covered */
  if (pins.length && "CSS" in window && CSS.supports("position", "sticky") && !window.matchMedia("(max-width: 600px), (max-height: 620px)").matches) {
    doc.classList.add("js-stack");
    var vh = 0, ticking = false;
    var pairs = pins.map(function (s) { return { pin: s, cover: s.nextElementSibling }; })
                    .filter(function (pr) { return pr.cover && pr.cover.hasAttribute("data-cover"); });
    function measure() {
      vh = window.innerHeight;
      pairs.forEach(function (pr) { pr.pin.style.setProperty("--stick", Math.min(0, vh - pr.pin.offsetHeight) + "px"); });
      paint();
    }
    function paint() {
      ticking = false;
      pairs.forEach(function (pr) {
        var top = pr.cover.getBoundingClientRect().top;
        var p = Math.max(0, Math.min(1, (vh - top) / vh));          /* 0 → cover just entering, 1 → fully covering */
        pr.pin.style.setProperty("--dim", (p * 0.45).toFixed(3));
        pr.pin.style.transform = (!reduce && p > 0 && p < 1) ? "scale(" + (1 - p * 0.015).toFixed(4) + ")" : (p >= 1 && !reduce ? "scale(0.985)" : "");   /* very slight shrink: small side margins */
        pr.pin.style.visibility = p >= 1 && top < -vh ? "hidden" : "";   /* fully buried: stop painting it */
      });
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();
  }

  /* Services dropdown: hover on pointer devices, click/keyboard everywhere */
  var scrim = document.querySelector(".pm-scrim");
  document.querySelectorAll("[data-menu]").forEach(function (item) {
    var btn = item.querySelector(".pm-nav__caret");
    var timer;
    function open(v) {
      item.classList.toggle("is-open", v);
      header.classList.toggle("menu-open", v);
      if (scrim) scrim.classList.toggle("is-on", v);
      btn.setAttribute("aria-expanded", v ? "true" : "false");
    }
    if (scrim) scrim.addEventListener("click", function () { open(false); });
    var hoverOpenedAt = 0;
    btn.addEventListener("click", function () {
      /* a click right after hover opened the menu should keep it open (point-then-click), not close it */
      if (item.classList.contains("is-open") && Date.now() - hoverOpenedAt < 600) return;
      open(!item.classList.contains("is-open"));
    });
    if (window.matchMedia("(hover: hover)").matches) {
      item.addEventListener("mouseenter", function () { clearTimeout(timer); if (!item.classList.contains("is-open")) hoverOpenedAt = Date.now(); open(true); });
      item.addEventListener("mouseleave", function () { timer = setTimeout(function () { open(false); }, 140); });
    }
    item.addEventListener("focusout", function (e) { if (!item.contains(e.relatedTarget)) open(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && item.classList.contains("is-open")) { open(false); btn.focus(); } });
    document.addEventListener("click", function (e) { if (!item.contains(e.target)) open(false); });
  });

  /* Mega menu preview: hovered/focused service drives the photo + caption on the right */
  var preview = document.querySelector(".pm-mega__preview");
  if (preview) {
    var rows = Array.prototype.slice.call(document.querySelectorAll(".pm-menu__item[data-img]"));
    var frames = preview.querySelector(".pm-mega__frames");
    var body = preview.querySelector(".pm-mega__body");
    var pCount = preview.querySelector(".pm-mega__count b");
    var pTitle = preview.querySelector(".pm-mega__ptitle");
    var pText = preview.querySelector(".pm-mega__ptext");
    var imgs = [], built = false, active = 0;
    function build() {            /* photos load only the first time the menu opens */
      if (built) return; built = true;
      rows.forEach(function (r, i) {
        var im = new Image();
        im.alt = ""; im.decoding = "async"; im.src = r.getAttribute("data-img");
        if (i === active) im.className = "is-on";
        frames.appendChild(im); imgs.push(im);
      });
    }
    function show(i) {
      if (i === active) return;
      active = i;
      var r = rows[i];
      rows.forEach(function (x, j) { x.classList.toggle("is-active", j === i); });
      imgs.forEach(function (im, j) { im.classList.toggle("is-on", j === i); });
      preview.href = r.href;
      pCount.textContent = (i < 9 ? "0" : "") + (i + 1);
      pTitle.textContent = r.lastChild.textContent.trim();
      pText.textContent = r.getAttribute("data-text");
      body.classList.remove("is-swap"); void body.offsetWidth; body.classList.add("is-swap");
    }
    rows.forEach(function (r, i) {
      r.addEventListener("mouseenter", function () { show(i); });
      r.addEventListener("focus", function () { build(); show(i); });
    });
    document.querySelectorAll("[data-menu]").forEach(function (item) {
      item.addEventListener("mouseenter", build);
      item.querySelector(".pm-nav__caret").addEventListener("click", build);
    });
  }

  /* Mobile drawer */
  var drawer = document.getElementById("pm-drawer");
  var burger = document.querySelector(".pm-burger");
  function setDrawer(v) {
    drawer.classList.toggle("is-open", v);
    drawer.setAttribute("aria-hidden", v ? "false" : "true");
    burger.setAttribute("aria-expanded", v ? "true" : "false");
    document.body.style.overflow = v ? "hidden" : "";
    if (lenis) { if (v) lenis.stop(); else lenis.start(); }   /* page behind the open drawer does not scroll */
    if (v) drawer.querySelector(".pm-drawer__close").focus(); else burger.focus();
  }
  burger.addEventListener("click", function () { setDrawer(true); });
  drawer.querySelectorAll("[data-close]").forEach(function (el) { el.addEventListener("click", function () { setDrawer(false); }); });
  drawer.querySelectorAll(".pm-drawer__nav a, .pm-drawer__foot a").forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) setDrawer(false); });
  drawer.querySelectorAll(".pm-drawer__acc").forEach(function (acc) {
    acc.addEventListener("click", function () {
      var sub = document.getElementById(acc.getAttribute("aria-controls"));
      var v = acc.getAttribute("aria-expanded") !== "true";
      acc.setAttribute("aria-expanded", v ? "true" : "false");
      sub.hidden = !v;
    });
  });

  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".pm-reveal").forEach(function (el) { el.classList.add("is-in"); });
    return;
  }

  /* Scroll reveal */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  document.querySelectorAll(".pm-reveal").forEach(function (el) { io.observe(el); });
  /* safety net: after a fast jump (anchor link, scrollbar drag) anything already above the fold is shown even if the
     observer skipped it */
  var revT = 0;
  function revealPassed() {
    revT = 0;
    var vh = window.innerHeight;
    document.querySelectorAll(".pm-reveal:not(.is-in)").forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.92) { el.classList.add("is-in"); io.unobserve(el); }
    });
  }
  window.addEventListener("scroll", function () { if (!revT) revT = setTimeout(revealPassed, 120); }, { passive: true });

  /* Stat counters */
  var co = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target, end = +el.getAttribute("data-count"), t0 = null;
      co.unobserve(el);
      if (reduce) return;
      function tick(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / 1400, 1), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased);
        if (p < 1) requestAnimationFrame(tick);
      }
      el.textContent = "0";
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach(function (el) { co.observe(el); });

  /* States globe: scrolling turns a 3D dot globe from the Atlantic to the US and zooms in. Then requests run between
     Augusta, GA and the states: a claim comes in (light streak), the payment goes back out (gold streak) and the state lights up.
     Paused off-screen. Reduced motion: the final view, drawn once, no traffic. */
  (function () {   /* own scope: keeps canvas/size variables apart from the other scenes */
  var gw = document.querySelector("[data-globe]");
  var gsrc = document.getElementById("pm-globe-data");
  if (gw && gsrc && window.HTMLCanvasElement) {
    var G = JSON.parse(gsrc.textContent);
    var stage = gw.querySelector(".pm-globe__stage");
    var cv = stage.querySelector("canvas");
    /* phones / tablets / short laptops: the stage sits in a tall "track" and sticks in the middle of the screen
       while the user scrolls through the track, so the globe animation is spread over a long, smooth scroll */
    var track = document.createElement("div");
    track.className = "pm-globe__track";
    stage.parentNode.insertBefore(track, stage);
    track.appendChild(stage);
    var gTop = 0;
    var ctx = cv.getContext("2d");
    var RAD = Math.PI / 180;
    var B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", B = {};
    for (var bi = 0; bi < 64; bi++) B[B64.charAt(bi)] = bi;
    function vec(lon, lat) { var c = Math.cos(lat * RAD); return [c * Math.cos(lon * RAD), c * Math.sin(lon * RAD), Math.sin(lat * RAD)]; }
    function unpack(s) {
      var n = s.length / 4, out = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) {
        var j = i * 4;
        var v = vec((B[s[j]] * 64 + B[s[j + 1]]) / 10 - 180, (B[s[j + 2]] * 64 + B[s[j + 3]]) / 10 - 90);
        out[i * 3] = v[0]; out[i * 3 + 1] = v[1]; out[i * 3 + 2] = v[2];
      }
      return out;
    }
    var LAND = unpack(G.land), US = unpack(G.us);
    var FEAT = { "california": "r", "texas": "b", "florida": "r", "new-york": "t", "illinois": "l", "pennsylvania": "r" };
    var WEIGHT = { "california": 0.3, "alaska": 0.04, "hawaii": 0.04 };
    var ST = [], off = 0, bySlug = {};
    G.states.forEach(function (s, i) {
      ST.push({ name: s.n, slug: s.slug, from: off, to: off + s.c, a: vec(s.a[0], s.a[1]), feat: !!FEAT[s.slug], side: FEAT[s.slug], hitAt: -1e9,
                w: WEIGHT[s.slug] != null ? WEIGHT[s.slug] : (FEAT[s.slug] ? 1 : 0.1) });
      bySlug[s.slug] = i; off += s.c;
    });
    var HQ = vec(-81.9748, 33.4735);
    /* every state has a point (its anchor); each dot knows its angular distance from that point so a hit can ripple outward */
    var DA = new Float32Array(US.length / 3);
    ST.forEach(function (s) {
      var m = 0;
      for (var i = s.from; i < s.to; i++) {
        var c = US[i * 3] * s.a[0] + US[i * 3 + 1] * s.a[1] + US[i * 3 + 2] * s.a[2];
        DA[i] = Math.acos(Math.max(-1, Math.min(1, c))); if (DA[i] > m) m = DA[i];
      }
      s.maxD = Math.max(m, 0.012);
    });
    var WAVE = 1300;                                   /* ms for the wave to cross a state */

    var mq = window.matchMedia("(min-width: 901px) and (min-height: 640px)");
    var scrub = false, W = 0, H = 0, DPR = 1, headerH = 76, freeL = 0;
    function size() {
      scrub = mq.matches && !reduce;
      gw.classList.toggle("is-scrub", scrub);
      headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 76;
      W = stage.clientWidth; H = stage.clientHeight;
      var cr = gw.querySelector(".pm-globe__copy").getBoundingClientRect(), sr = stage.getBoundingClientRect();
      freeL = cr.right - sr.left + 32;                    /* first free x to the right of the text */
      if (!scrub) {
        var vh = window.innerHeight;
        gTop = Math.max(headerH + 8, headerH + (vh - headerH - H) / 2);       /* centred under the header */
        track.style.setProperty("--gtop", gTop + "px");
        track.style.height = (H + Math.max(vh * 1.5, 900)) + "px";          /* scroll length while pinned (close to large screens) */
      } else { track.style.height = ""; }
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function progress() {
      if (reduce) return 1;
      if (scrub) {
        var r = gw.getBoundingClientRect();
        var span = r.height - (window.innerHeight - headerH);
        return span > 0 ? clamp((headerH - r.top) / span) : 1;
      }
      /* phones, tablets, short laptops: 0 until the globe reaches its pinned spot (fully in view, centred),
         then it turns as the user scrolls through the track; 1 just before it unpins (scrolling back reverses it) */
      var t = track.getBoundingClientRect();
      return clamp((gTop - t.top) / Math.max(1, t.height - H));
    }

    /* camera for this frame */
    var cam = { cl: 1, sl: 0, cp: 1, sp: 0, R: 100, cx: 0, cy: 0 };
    var P = [0, 0, 0];                               /* projected: screen x, screen y, depth (>0 = facing us) */
    function project(x, y, z, h) {
      var x1 = x * cam.cl + y * cam.sl, y1 = -x * cam.sl + y * cam.cl;
      P[2] = x1 * cam.cp + z * cam.sp;
      P[0] = cam.cx + cam.R * h * y1;
      P[1] = cam.cy - cam.R * h * (-x1 * cam.sp + z * cam.cp);
      return P;
    }
    function dots(arr, from, to, r, rgb, alpha) {
      /* three depth bands so the dots fade toward the edge of the globe */
      var bands = [new Path2D(), new Path2D(), new Path2D()], any = [0, 0, 0];
      for (var i = from; i < to; i++) {
        var p = project(arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2], 1);
        if (p[2] <= 0.02) continue;
        var b = p[2] < 0.22 ? 0 : p[2] < 0.45 ? 1 : 2;
        bands[b].moveTo(p[0] + r, p[1]); bands[b].arc(p[0], p[1], r, 0, 6.2832); any[b] = 1;
      }
      ctx.fillStyle = "rgb(" + rgb + ")";
      for (var k = 0; k < 3; k++) if (any[k]) { ctx.globalAlpha = alpha * [0.3, 0.65, 1][k]; ctx.fill(bands[k]); }
      ctx.globalAlpha = 1;
    }
    function tag(text, x, y, side, hot, a) {
      /* high-contrast pills so the labels read at a glance: white (gold when highlighted) with dark navy text */
      ctx.font = "600 13px Poppins, system-ui, sans-serif";
      var tw = ctx.measureText(text).width, pw = tw + 24, ph = 28, gap = 12;
      var lx = side === "l" ? x - gap - pw : side === "r" ? x + gap : x - pw / 2;
      var ly = side === "t" ? y - gap - ph : side === "b" ? y + gap : y - ph / 2;
      ctx.globalAlpha = a;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(lx, ly, pw, ph, 14); else ctx.rect(lx, ly, pw, ph);
      ctx.shadowColor = "rgba(0, 12, 22, 0.45)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3;
      ctx.fillStyle = hot ? "#C8A951" : "#FFFFFF"; ctx.fill();
      ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.fillStyle = "#01233A"; ctx.textBaseline = "middle";
      ctx.fillText(text, lx + 12, ly + ph / 2 + 0.5);
      ctx.globalAlpha = 1;
    }

    /* traffic */
    var SEG = 0.07, SPEED = 0.00022;                 /* streak length (radians), travel speed (radians/ms) */
    var live = [], queue = [], rings = [], burstT = null, gvisible = false, trafficOn = false;
    function send(a, b, out, si, delay) {
      var dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      var ang = Math.acos(Math.max(-1, Math.min(1, dot)));
      if (ang < 0.004) return;
      queue.push({ a: a, b: b, ang: ang, sin: Math.sin(ang), k: 0.03 + 0.3 * ang, out: out, si: si,
                  t0: performance.now() + delay, dur: (ang + SEG) / SPEED, arrived: false });
    }
    function along(k, t) {
      var s1 = Math.sin((1 - t) * k.ang) / k.sin, s2 = Math.sin(t * k.ang) / k.sin, h = 1 + k.k * Math.sin(Math.PI * t);
      return project(k.a[0] * s1 + k.b[0] * s2, k.a[1] * s1 + k.b[1] * s2, k.a[2] * s1 + k.b[2] * s2, h);
    }
    function hit(si, v, now) {
      var s = ST[si];
      s.hitAt = now;
      for (var b = 0; b < 2; b++) rings.push({ v: s.a, t0: now + b * 450, gold: true, si: si });   /* two small pulses */
    }
    /* the hit wave: a bright band of gold travels from the state's point to its edges, leaving a soft glow behind */
    function wave(s, t, r) {
      var rw = (t / WAVE) * s.maxD * 1.15, bw = Math.max(0.012, s.maxD * 0.2);
      var fade = t < WAVE ? 1 : Math.max(0, 1 - (t - WAVE) / 900);
      var bands = [new Path2D(), new Path2D(), new Path2D(), new Path2D()], any = [0, 0, 0, 0];
      for (var i = s.from; i < s.to; i++) {
        var x = (DA[i] - rw) / bw;
        var k = (Math.exp(-x * x) + (DA[i] < rw ? 0.3 : 0)) * fade;
        if (k < 0.08) continue;
        var q = project(US[i * 3], US[i * 3 + 1], US[i * 3 + 2], 1);
        if (q[2] <= 0.02) continue;
        var b = k > 0.75 ? 3 : k > 0.45 ? 2 : k > 0.22 ? 1 : 0, rr = r * (1 + 0.45 * Math.min(1, k));
        bands[b].moveTo(q[0] + rr, q[1]); bands[b].arc(q[0], q[1], rr, 0, 6.2832); any[b] = 1;
      }
      ctx.fillStyle = "#C8A951";
      for (var j = 0; j < 4; j++) if (any[j]) { ctx.globalAlpha = [0.25, 0.5, 0.78, 1][j]; ctx.fill(bands[j]); }
      ctx.globalAlpha = 1;
    }
    function burst() {
      if (!gvisible || !trafficOn) { burstT = null; return; }
      /* weighted pick of 2–4 states per wave; long routes (California) and the far states are picked less often */
      var pool = ST.map(function (s, i) { return { i: i, k: Math.pow(Math.random(), 1 / s.w) }; })
                   .sort(function (x, y) { return y.k - x.k; });
      var n = 2 + Math.floor(Math.random() * 3);
      for (var j = 0; j < n; j++) {
        var si = pool[j].i, s = ST[si];
        var reqs = s.feat && s.slug !== "california" ? 1 + Math.floor(Math.random() * 3) : 1;
        var offset = Math.random() * 500;
        for (var q = 0; q < reqs; q++) send(s.a, HQ, false, si, offset + q * 240);
      }
      burstT = setTimeout(burst, 450 + Math.random() * 750);
    }

    function streak(k, now) {
      var p = (now - k.t0) / k.dur;
      if (p < 0) return true;
      var span = k.ang + SEG, head = Math.min(p * span, k.ang), tail = Math.max(0, p * span - SEG);
      if (!k.arrived && p * span >= k.ang) {
        k.arrived = true;
        if (k.out) hit(k.si, k.b, now);
        else { rings.push({ v: HQ, t0: now, gold: false }); send(HQ, k.a, true, k.si, 120); }   /* claim in → payment out */
      }
      if (p >= 1) return false;
      if (head <= tail) return true;
      var N = 10, prev = null;
      ctx.lineCap = "round";
      ctx.strokeStyle = k.out ? "#C8A951" : "#E8EDF1";
      for (var i = 0; i <= N; i++) {
        var t = (tail + (head - tail) * i / N) / k.ang;
        var q = along(k, t);
        var cur = [q[0], q[1], q[2]];
        if (prev && cur[2] > -0.05 && prev[2] > -0.05) {
          ctx.globalAlpha = (k.out ? 1 : 0.8) * (i / N);
          ctx.lineWidth = k.out ? 2.6 : 1.8;
          ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(cur[0], cur[1]); ctx.stroke();
        }
        prev = cur;
      }
      if (prev && prev[2] > -0.05) {
        ctx.globalAlpha = 1; ctx.fillStyle = k.out ? "#C8A951" : "#FFFFFF";
        ctx.beginPath(); ctx.arc(prev[0], prev[1], k.out ? 2.6 : 1.9, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      return true;
    }

    function draw(now) {
      var p = progress();
      var pr = ease(clamp(p / 0.5)), pz = ease(clamp((p - 0.3) / 0.4));
      var rise = clamp((p - 0.25) / 0.35), tagA = clamp((p - 0.55) / 0.15);
      trafficOn = p > 0.55 && !reduce;
      if (trafficOn && gvisible && !burstT) burstT = setTimeout(burst, 300);

      var lon = lerp(18, -95.5, pr) + (reduce ? 0 : Math.sin(now / 5200) * 1.4 * pz);
      var lat = lerp(14, 36.5, pr);
      cam.cl = Math.cos(lon * RAD); cam.sl = Math.sin(lon * RAD);
      cam.cp = Math.cos(lat * RAD); cam.sp = Math.sin(lat * RAD);
      var base = Math.min(W, H) * (scrub ? 0.44 : 0.43);
      var small = W < 480;                               /* phones: bigger zoom, only the HQ tag */
      var endR = base * (scrub ? 3.4 : small ? 2.15 : 2.2), endX = W / 2;
      if (scrub) {                                          /* desktop: the US fills the space right of the text, never under it */
        var avail = W - 28 - freeL;                         /* US spans ~0.39 R west and ~0.33 R east of its centre */
        endR = Math.min(endR, avail / 0.72);
        endX = freeL + 0.39 * endR + (avail - 0.72 * endR) / 2;
      }
      cam.R = base * lerp(1, endR / base, pz);
      cam.cx = scrub ? lerp(W * 0.68, endX, pz) : W / 2;
      cam.cy = H / 2 + base * (scrub ? 0.3 : 0.22) * pz;   /* nudge down a little so the US sits in the optical centre */
      var focus = {}, dim = 0;
      var R = cam.R;

      ctx.clearRect(0, 0, W, H);
      /* atmosphere + sphere */
      var g = ctx.createRadialGradient(cam.cx, cam.cy, R * 0.92, cam.cx, cam.cy, R * 1.22);
      g.addColorStop(0, "rgba(29,82,122,0.45)"); g.addColorStop(1, "rgba(29,82,122,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cam.cx, cam.cy, R * 1.22, 0, 6.2832); ctx.fill();
      g = ctx.createRadialGradient(cam.cx - R * 0.35, cam.cy - R * 0.4, R * 0.05, cam.cx, cam.cy, R * 1.05);
      g.addColorStop(0, "rgba(29,82,122,0.9)"); g.addColorStop(0.65, "rgba(13,52,82,0.95)"); g.addColorStop(1, "rgba(1,35,58,1)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cam.cx, cam.cy, R, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = "rgba(138,155,170,0.28)"; ctx.lineWidth = 1; ctx.stroke();

      /* dots: world land, then all 50 states, then the labelled states, then states lit by a payment */
      dots(LAND, 0, LAND.length / 3, Math.max(0.7, Math.min(scrub ? 4 : 2.4, R * 0.0045)), "138,155,170", 0.5 * (1 - 0.5 * dim));
      var ur = Math.max(0.8, Math.min(scrub ? 5.5 : 2.6, R * 0.0031));
      ST.forEach(function (s, si) {
        var a = s.feat ? lerp(0.6, 0.95, rise) : lerp(0.45, 0.62, rise), fw = focus[si] || 0;
        a = lerp(a * (1 - 0.6 * dim), 1, fw);                /* the state in focus stays bright, the rest dim */
        dots(US, s.from, s.to, ur * (1 + 0.2 * fw), fw > 0.5 ? "255,255,255" : "232,237,241", a);
      });
      ST.forEach(function (s) {
        var t = now - s.hitAt;
        if (t >= 0 && t < WAVE + 900) wave(s, t, ur);
      });
      /* one point per state; it turns gold while its wave runs */
      var pr0 = Math.max(2, Math.min(scrub ? 6 : 3.4, R * 0.004));
      ST.forEach(function (s) {
        var q = project(s.a[0], s.a[1], s.a[2], 1);
        if (q[2] <= 0.05) return;
        var t = now - s.hitAt, hot = t >= 0 && t < WAVE + 400;
        ctx.globalAlpha = Math.min(1, q[2] * 3) * lerp(0.5, 1, rise);
        ctx.fillStyle = hot ? "#C8A951" : "#FFFFFF";
        ctx.strokeStyle = hot ? "rgba(200,169,81,0.35)" : "rgba(1,35,58,0.9)"; ctx.lineWidth = hot ? 6 : 2;
        ctx.beginPath(); ctx.arc(q[0], q[1], hot ? pr0 * 1.3 : pr0, 0, 6.2832); ctx.stroke(); ctx.fill();
      });
      ctx.globalAlpha = 1;

      /* request streaks + arrival rings */
      if (!reduce) {
        live = live.filter(function (k) { return streak(k, now); }).concat(queue); queue = [];
        rings = rings.filter(function (r) {
          var dur = r.si != null ? 1400 : 760, t = (now - r.t0) / dur; if (t >= 1) return false;
          if (t < 0) return true;
          var q = project(r.v[0], r.v[1], r.v[2], 1); if (q[2] <= 0) return true;
          if (r.si != null) {                          /* small soft pulse, same as the Augusta point */
            ctx.globalAlpha = 0.5 * (1 - t); ctx.fillStyle = "#C8A951";
            ctx.beginPath(); ctx.arc(q[0], q[1], 4 + 12 * t, 0, 6.2832); ctx.fill();
          } else {
            ctx.globalAlpha = 0.85 * (1 - t); ctx.strokeStyle = r.gold ? "#C8A951" : "#E8EDF1"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(q[0], q[1], 3 + 18 * (1 - Math.pow(1 - t, 3)), 0, 6.2832); ctx.stroke();
          }
          ctx.globalAlpha = 1; return true;
        });
      }

      /* HQ: Augusta, GA */
      var h = project(HQ[0], HQ[1], HQ[2], 1);
      if (h[2] > 0) {
        var hx = h[0], hy = h[1], pulse = reduce ? 0 : (now % 2400) / 2400;
        ctx.globalAlpha = 0.5 * (1 - pulse); ctx.fillStyle = "#C8A951";
        ctx.beginPath(); ctx.arc(hx, hy, 5 + 13 * pulse, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(hx, hy, 5, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2; ctx.stroke();
        if (tagA > 0) tag("Augusta, GA", hx, hy, small ? "l" : "r", false, tagA);
      }
      /* canvas tags for the labelled states (the same names are real text in the list beside the globe) */
      if (tagA > 0 && !small) ST.forEach(function (s) {
        if (!s.feat) return;
        var q = project(s.a[0], s.a[1], s.a[2], 1);
        if (q[2] > 0.15) tag(s.name, q[0], q[1], s.side, now - s.hitAt < 1500 || (focus[ST.indexOf(s)] || 0) > 0.5, tagA);
      });
      /* soft oval edge so the zoomed globe never shows the canvas rectangle */
      ctx.save();
      ctx.globalCompositeOperation = "destination-in";
      if (scrub) {
        g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.1, "#000"); g.addColorStop(0.88, "#000"); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      } else {
        ctx.translate(W / 2, H / 2); ctx.scale(1, H / W);
        g = ctx.createRadialGradient(0, 0, W * lerp(0.47, 0.34, pz), 0, 0, W * 0.5);
        g.addColorStop(0, "#000"); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.fillRect(-W / 2, -W / 2, W, W);
      }
      ctx.restore();
    }

    var graf = 0;
    function loop(now) { draw(now); graf = gvisible && !reduce ? requestAnimationFrame(loop) : 0; }
    function kick() { if (!graf) graf = requestAnimationFrame(loop); }
    size();
    draw(performance.now());
    if (window.ResizeObserver) new ResizeObserver(function () { size(); draw(performance.now()); }).observe(stage);
    else window.addEventListener("resize", function () { size(); draw(performance.now()); });
    if (mq.addEventListener) mq.addEventListener("change", function () { size(); draw(performance.now()); });
    new IntersectionObserver(function (en) {
      gvisible = en[0].isIntersecting;
      if (gvisible) { if (reduce) draw(performance.now()); else kick(); }
      else { clearTimeout(burstT); burstT = null; }
    }, { rootMargin: "120px 0px" }).observe(gw);
  }

  
  })();
/* Process: three linked columns. Clicking a step (or arrow keys in the list) shows it; while the section is on screen
     the steps advance by themselves (a gold line fills under the active step), pausing on hover or keyboard focus. */
  var flow = document.querySelector("[data-flow]");
  if (flow) {
    var fTabs = Array.prototype.slice.call(flow.querySelectorAll(".pm-flow__tab"));
    var fPanels = Array.prototype.slice.call(flow.querySelectorAll(".pm-flow__panel"));
    var fIcons = Array.prototype.slice.call(flow.querySelectorAll(".pm-flow__icons svg"));
    var fVis = flow.querySelector(".pm-flow__visual"), fBig = flow.querySelector(".pm-flow__big > span"), fNum = flow.querySelector("[data-flow-n]");
    var DWELL = 6000, fCur = 0, fTimer = null, fSeen = false, fHold = false;
    flow.style.setProperty("--dwell", DWELL + "ms");
    function fShow(i, focus) {
      fCur = (i + fTabs.length) % fTabs.length;
      fTabs.forEach(function (t) { t.setAttribute("aria-selected", "false"); t.tabIndex = -1; });
      void flow.offsetWidth;                                   /* restart the gold fill on the active step */
      fTabs[fCur].setAttribute("aria-selected", "true"); fTabs[fCur].tabIndex = 0;
      fPanels.forEach(function (pn, k) { pn.classList.toggle("is-on", k === fCur); });
      fIcons.forEach(function (ic, k) { ic.classList.toggle("is-on", k === fCur); });
      fBig.style.setProperty("--i", fCur);
      fNum.textContent = fCur + 1;
      if (fSegs) fSegs.forEach(function (sg, k) { sg.classList.toggle("is-done", k <= fCur); sg.classList.toggle("is-now", k === fCur); });
      fVis.classList.remove("is-beat"); void fVis.offsetWidth; fVis.classList.add("is-beat");
      if (focus) fTabs[fCur].focus();
      fSchedule();
    }
    function fSchedule() {
      clearTimeout(fTimer); fTimer = null;
      var auto = fSeen && !fHold && !reduce;
      flow.classList.toggle("is-auto", !reduce);
      flow.classList.toggle("is-paused", !auto);
      if (auto) fTimer = setTimeout(function () { fShow(fCur + 1); }, DWELL);
    }
    fTabs.forEach(function (t, k) {
      t.addEventListener("click", function () { fShow(k); });
      t.addEventListener("keydown", function (ev) {
        var d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[ev.key];
        if (d) { ev.preventDefault(); fShow(fCur + d, true); }
        else if (ev.key === "Home") { ev.preventDefault(); fShow(0, true); }
        else if (ev.key === "End") { ev.preventDefault(); fShow(fTabs.length - 1, true); }
      });
    });
    /* pause while the pointer or keyboard focus is inside; leaving restarts the current step */
    flow.addEventListener("mouseenter", function () { fHold = true; fSchedule(); });
    flow.addEventListener("mouseleave", function () { fHold = false; fShow(fCur); });
    flow.addEventListener("focusin", function () { fHold = true; fSchedule(); });
    flow.addEventListener("focusout", function (ev) { if (!flow.contains(ev.relatedTarget)) { fHold = false; fSchedule(); } });
    new IntersectionObserver(function (en) {
      var was = fSeen; fSeen = en[0].isIntersecting;
      if (fSeen && !was) fShow(fCur); else fSchedule();
    }, { threshold: 0.35 }).observe(flow);
    /* polish (decorative, added here so the markup stays simple): a segmented progress ring around the icon,
       one segment per step, and Previous / Next arrow buttons under the step text */
    var SVGNS = "http://www.w3.org/2000/svg", fRings = flow.querySelector(".pm-flow__rings"), fSegs = [];
    if (fRings) {
      var ring = document.createElementNS(SVGNS, "svg");
      ring.setAttribute("class", "pm-flow__progress"); ring.setAttribute("viewBox", "0 0 100 100"); ring.setAttribute("aria-hidden", "true");
      var n = fTabs.length, seg = 100 / n, gap = 2.2;
      for (var s = 0; s < n; s++) {
        var c = document.createElementNS(SVGNS, "circle");
        c.setAttribute("cx", "50"); c.setAttribute("cy", "50"); c.setAttribute("r", "46"); c.setAttribute("pathLength", "100");
        c.setAttribute("stroke-dasharray", (seg - gap) + " " + (100 - seg + gap));
        c.setAttribute("stroke-dashoffset", String(-(s * seg + gap / 2)));
        ring.appendChild(c); fSegs.push(c);
      }
      fRings.appendChild(ring);
    }
    var fPanelsBox = flow.querySelector(".pm-flow__panels");
    if (fPanelsBox) {
      var nav = document.createElement("div");
      nav.className = "pm-flow__nav";
      var arrow = '<svg class="pm-icon" aria-hidden="true"><use href="#i-arrow-right"/></svg>';
      nav.innerHTML = '<button type="button" class="pm-flow__step pm-flow__step--prev" aria-label="Previous step">' + arrow + '</button>' +
                      '<button type="button" class="pm-flow__step" aria-label="Next step">' + arrow + '</button>';
      fPanelsBox.appendChild(nav);
      /* small screens: the arrows sit right under the visual card (before the step text); desktop: under the text */
      var mq = window.matchMedia("(max-width: 1080px)");
      var placeNav = function () {
        if (mq.matches) { if (fVis && nav.previousElementSibling !== fVis) fVis.insertAdjacentElement("afterend", nav); }
        else if (nav.parentNode !== fPanelsBox) fPanelsBox.appendChild(nav);
      };
      placeNav();
      if (mq.addEventListener) mq.addEventListener("change", placeNav); else if (mq.addListener) mq.addListener(placeNav);
      nav.children[0].addEventListener("click", function () { fShow(fCur - 1); });
      nav.children[1].addEventListener("click", function () { fShow(fCur + 1); });
    }
    fShow(0);
  }
})();

/* Local preview only: on any host other than protomed.co, point internal links at the local copy of each page.
   Has no effect on the live site; drop it in WordPress. */
(function () {
  if (/(^|\.)protomed\.co$/.test(location.hostname)) return;
  /* every page is a flat file next to index.html: /services/medical-billing/ → medical-billing.html, / → index.html */
  document.querySelectorAll('a[href^="https://protomed.co/"]').forEach(function (a) {
    var u = new URL(a.href), parts = u.pathname.split("/").filter(Boolean);
    if (parts.length && /^wp-/.test(parts[0])) return;
    var local = parts.length ? parts[parts.length - 1] + ".html" : "index.html";
    a.setAttribute("href", local + u.hash);
  });
})();


/* Custom dropdowns for form selects (progressive enhancement).
   The native <select> stays in the form (visually hidden) and keeps its name/value, so submission is unchanged.
   The custom control is an ARIA listbox: Enter/Space/Arrow keys open it, arrows move, Enter picks, Esc closes,
   typing jumps to a match; long lists get a search box. Without JS the native select is used as-is. */
(function () {
  var selects = document.querySelectorAll(".pm-field select");
  if (!selects.length) return;
  var uid = 0, openOne = null;
  var check = '<svg class="pm-icon" aria-hidden="true"><use href="#i-check"/></svg>';
  var chev = '<svg class="pm-icon pm-select__chev" aria-hidden="true"><use href="#i-chevron-down"/></svg>';

  selects.forEach(function (sel) {
    var id = "pm-sel-" + (++uid);
    var label = document.querySelector('label[for="' + sel.id + '"]');
    var wrap = document.createElement("div");
    wrap.className = "pm-select";
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add("pm-select__native");
    sel.tabIndex = -1;
    sel.setAttribute("aria-hidden", "true");

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pm-select__btn";
    btn.id = id + "-btn";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", id + "-list");
    if (label) { label.id = label.id || id + "-label"; label.setAttribute("for", btn.id); btn.setAttribute("aria-labelledby", label.id + " " + btn.id); }
    btn.innerHTML = '<span class="pm-select__value"></span>' + chev;
    wrap.appendChild(btn);

    var panel = document.createElement("div");
    panel.className = "pm-select__panel";
    panel.setAttribute("data-lenis-prevent", "");     /* wheel/touch scroll stays inside the open list (Lenis leaves it alone) */
    var opts = Array.prototype.slice.call(sel.options);
    var search = null;
    if (opts.length > 12) {
      search = document.createElement("input");
      search.type = "text";
      search.className = "pm-select__search";
      search.placeholder = "Search…";
      search.setAttribute("aria-label", "Search " + (label ? label.textContent.replace("*", "").trim() : "options"));
      search.setAttribute("aria-controls", id + "-list");
      search.autocomplete = "off";
      panel.appendChild(search);
    }
    var list = document.createElement("ul");
    list.className = "pm-select__list";
    list.id = id + "-list";
    list.setAttribute("role", "listbox");
    list.tabIndex = -1;
    if (label) list.setAttribute("aria-labelledby", label.id);
    panel.appendChild(list);
    wrap.appendChild(panel);

    /* build options (optgroups become small headings) */
    var items = [], lastGroup = null;
    opts.forEach(function (o, i) {
      var g = o.parentNode.tagName === "OPTGROUP" ? o.parentNode : null;
      if (g && g !== lastGroup) {
        var h = document.createElement("li");
        h.className = "pm-select__group";
        h.setAttribute("role", "presentation");
        h.textContent = g.label;
        list.appendChild(h);
        lastGroup = g;
      }
      var li = document.createElement("li");
      li.className = "pm-select__opt" + (o.value === "" ? " is-placeholder" : "");
      li.id = id + "-o" + i;
      li.setAttribute("role", "option");
      li.innerHTML = '<span></span>' + check;
      li.firstChild.textContent = o.text;
      li.dataset.index = i;
      li.addEventListener("mousedown", function (e) { e.preventDefault(); });
      li.addEventListener("click", function () { choose(i); close(true); });
      li.addEventListener("mousemove", function () { setActive(visible().indexOf(li)); });   /* index among the shown options */
      list.appendChild(li);
      items.push(li);
    });

    var active = -1;
    function visible() { return items.filter(function (li) { return !li.hidden && !li.classList.contains("is-placeholder"); }); }
    function setActive(k) {
      var v = visible(); if (!v.length) return;
      k = Math.max(0, Math.min(v.length - 1, k));
      items.forEach(function (li) { li.classList.remove("is-active"); });
      var li = v[k]; li.classList.add("is-active");
      active = items.indexOf(li);
      (search || list).setAttribute("aria-activedescendant", li.id);
      var top = li.offsetTop, bottom = top + li.offsetHeight;
      if (top < list.scrollTop) list.scrollTop = top - 6;
      else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 6;
    }
    function sync() {
      var o = sel.options[sel.selectedIndex];
      var v = btn.querySelector(".pm-select__value");
      v.textContent = o ? o.text : "";
      btn.classList.toggle("is-placeholder", !o || o.value === "");
      items.forEach(function (li, i) { var on = i === sel.selectedIndex; li.classList.toggle("is-selected", on); li.setAttribute("aria-selected", on ? "true" : "false"); });
    }
    function choose(i) {
      if (sel.selectedIndex !== i) { sel.selectedIndex = i; sel.dispatchEvent(new Event("change", { bubbles: true })); }
      sync();
    }
    function open() {
      if (openOne && openOne !== close) openOne();
      wrap.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      /* open upwards if there is no room below */
      var r = btn.getBoundingClientRect();
      wrap.classList.toggle("is-up", window.innerHeight - r.bottom < 300 && r.top > 300);
      if (search) { search.value = ""; filter(""); search.focus(); } else list.focus();
      setActive(Math.max(0, visible().indexOf(items[sel.selectedIndex])));
      openOne = close;
    }
    function close(focusBtn) {
      if (!wrap.classList.contains("is-open")) return;
      wrap.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      if (focusBtn) btn.focus();
      if (openOne === close) openOne = null;
    }
    function filter(q) {
      q = q.trim().toLowerCase();
      items.forEach(function (li, i) { li.hidden = !!q && (sel.options[i].value === "" || li.textContent.toLowerCase().indexOf(q) === -1); });
      list.querySelectorAll(".pm-select__group").forEach(function (h) {
        var n = h.nextElementSibling, any = false;
        while (n && !n.classList.contains("pm-select__group")) { if (!n.hidden) any = true; n = n.nextElementSibling; }
        h.hidden = !any;
      });
      setActive(0);
    }
    var typed = "", typedT = 0;
    function keys(e) {
      var v = visible(), k = v.indexOf(items[active]);
      switch (e.key) {
        case "ArrowDown": e.preventDefault(); setActive(k + 1); break;
        case "ArrowUp": e.preventDefault(); setActive(k - 1); break;
        case "Home": if (!search) { e.preventDefault(); setActive(0); } break;
        case "End": if (!search) { e.preventDefault(); setActive(v.length - 1); } break;
        case "Enter": e.preventDefault(); if (active > -1) choose(active); close(true); break;
        case " ": if (!search) { e.preventDefault(); if (active > -1) choose(active); close(true); } break;
        case "Escape": e.preventDefault(); close(true); break;
        case "Tab": if (active > -1) choose(active); close(false); break;
        default:
          if (!search && e.key.length === 1) {            /* type-ahead */
            clearTimeout(typedT); typed += e.key.toLowerCase(); typedT = setTimeout(function () { typed = ""; }, 600);
            var m = v.findIndex(function (li) { return li.textContent.trim().toLowerCase().indexOf(typed) === 0; });
            if (m > -1) setActive(m);
          }
      }
    }
    btn.addEventListener("click", function () { wrap.classList.contains("is-open") ? close(true) : open(); });
    btn.addEventListener("keydown", function (e) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].indexOf(e.key) > -1) { e.preventDefault(); open(); }
    });
    list.addEventListener("keydown", keys);
    /* scrolling over the open list scrolls the list only — never the page behind it */
    list.addEventListener("wheel", function (e) {
      var step = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? list.clientHeight : 1;
      list.scrollTop += e.deltaY * step;
      e.preventDefault(); e.stopPropagation();
    }, { passive: false });
    panel.addEventListener("wheel", function (e) { e.preventDefault(); e.stopPropagation(); }, { passive: false });
    list.addEventListener("touchmove", function (e) { e.stopPropagation(); }, { passive: true });
    if (search) {
      search.addEventListener("keydown", keys);
      search.addEventListener("input", function () { filter(search.value); });
    }
    document.addEventListener("mousedown", function (e) { if (!wrap.contains(e.target)) close(false); });
    sel.addEventListener("change", sync);
    if (sel.form) sel.form.addEventListener("reset", function () { setTimeout(sync, 0); });
    sync();
  });
})();

/* FAQ accordion: one answer open at a time. Opening a question closes the other one; both answers animate
   their real height (measured), so the closing one glides shut as smoothly as the new one opens.
   Uses native <details>, so it still works (without animation) if this script does not run. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-faq]").forEach(function (faq) {
    var items = Array.prototype.slice.call(faq.querySelectorAll("details"));
    function after(a, fn) {
      if (reduce) { fn(); return; }
      var done = false;
      function end(e) { if (e && (e.target !== a || e.propertyName !== "height")) return; if (done) return; done = true; a.removeEventListener("transitionend", end); fn(); }
      a.addEventListener("transitionend", end);
      setTimeout(end, 520);                                  /* safety net if transitionend never fires */
    }
    function shut(d) {
      if (!d.open || d._closing) return;
      var a = d.querySelector(".pm-faq__a");
      d._closing = true;
      a.style.height = a.scrollHeight + "px";                 /* from its real height … */
      void a.offsetHeight;
      d.classList.remove("is-open");
      a.style.height = "0px";                                 /* … down to 0 */
      after(a, function () { d.open = false; d._closing = false; a.style.height = ""; });
    }
    function show(d) {
      var a = d.querySelector(".pm-faq__a");
      d._closing = false;
      d.open = true;
      a.style.height = "0px";
      void a.offsetHeight;
      d.classList.add("is-open");
      a.style.height = a.scrollHeight + "px";                 /* 0 → real height */
      after(a, function () { if (d.classList.contains("is-open")) a.style.height = ""; });   /* then auto, so text can reflow */
    }
    items.forEach(function (d) {
      if (d.open) d.classList.add("is-open");
      d.querySelector("summary").addEventListener("click", function (e) {
        e.preventDefault();
        if (d.classList.contains("is-open")) { shut(d); return; }
        items.forEach(function (o) { if (o !== d) shut(o); });
        show(d);
      });
    });
  });
})();
