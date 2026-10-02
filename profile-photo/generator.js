/* TechNext profile photo generator.
   Upload a PNG of yourself with the background already removed -> it is placed in the branded ring, in front of
   the ring's lower half -> PNG download. Everything runs in the browser; nothing is uploaded or downloaded.
   The layout follows the original sample photos (profiles/sample-*.png): the ring touches the edges and is
   5.5% thick, #5579D1 to #75A1F4 left to right; the logo is 48% wide, centred 20% from the top; the head
   starts 26% from the top and is about 28% of the frame wide. A PNG without transparency is shown with its
   own background inside the ring, below a white cap that holds the logo. */
(function () {
  'use strict';
  var S = 1024;                        // export size (px)
  var CX = 512, CY = 512;              // ring centre
  var R_OUT = 512, R_IN = 456;         // the ring touches the edges and is 56 px thick
  var LOGO_W = 496, LOGO_Y = 174;      // logo width and top edge
  var HEAD_TOP = 266, HEAD_W = 287;    // head top; head width measured 10% of the frame below it
  var CAP = 230;                       // a photo with its own background starts below a white cap this deep
  var RINGS = { blue: ['#5579D1', '#75A1F4'], deep: ['#2F63C6', '#4F86E8'] };

  var cv = document.getElementById('pp-canvas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var file = $('pp-file'), drop = $('pp-drop'), status = $('pp-status'), zoom = $('pp-zoom');

  var st = {
    src: null,       // the uploaded image (canvas)
    cut: null,       // the same image when it has a transparent background
    map: null,       // where the cut-out is opaque (see analyse)
    ring: 'blue',    // blue | deep
    bg: 'white',     // white | soft | none
    pop: true,       // shoulders in front of the ring's lower half
    fit: 1, z: 1, x: CX, y: CY   // auto-fit scale, user zoom, image centre
  };

  var logo = new Image();
  logo.onload = draw;
  logo.src = 'profile-photo/logo-h.svg';

  function setStatus(msg, kind) {
    status.textContent = msg || '';
    status.className = 'pp-status' + (kind ? ' ' + kind : '');
  }

  function photo() { return st.cut || st.src; }

  function drawPhoto(img) {
    var sc = st.fit * st.z;
    ctx.drawImage(img, st.x - img.width * sc / 2, st.y - img.height * sc / 2, img.width * sc, img.height * sc);
  }

  // A photo edge that cuts the shoulders would show in the corners beside them.
  function edgeShows() {
    var m = st.map; if (!m) return false;
    var w = st.cut.width * st.fit * st.z;
    return (m.touchL && st.x - w / 2 > 0.5) || (m.touchR && st.x + w / 2 < S - 0.5);
  }

  function draw() {
    ctx.clearRect(0, 0, S, S);
    if (st.bg !== 'none') { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, S, S); }

    // inner disc
    ctx.beginPath(); ctx.arc(CX, CY, R_IN, 0, Math.PI * 2);
    if (st.bg === 'soft') {
      var f = ctx.createLinearGradient(0, CY - R_IN, 0, CY + R_IN);
      f.addColorStop(0, '#FFFFFF'); f.addColorStop(1, '#DDE7F8'); ctx.fillStyle = f;
    } else ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    var img = photo();

    // a photo with its own background fills the disc below a white cap that holds the logo
    if (img && !st.cut) {
      ctx.save();
      ctx.beginPath(); ctx.arc(CX, CY, R_IN, 0, Math.PI * 2); ctx.clip();
      drawPhoto(img);
      var fade = ctx.createLinearGradient(0, CAP, 0, CAP + 70);
      fade.addColorStop(0, '#FFFFFF'); fade.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, S, CAP);
      ctx.fillStyle = fade; ctx.fillRect(0, CAP, S, 70);
      ctx.restore();
    }

    // ring, lighter to the right
    var c = RINGS[st.ring] || RINGS.blue, g = ctx.createLinearGradient(0, 0, S, 0);
    g.addColorStop(0, c[0]); g.addColorStop(1, c[1]);
    ctx.beginPath(); ctx.arc(CX, CY, (R_IN + R_OUT) / 2, 0, Math.PI * 2);
    ctx.lineWidth = R_OUT - R_IN; ctx.strokeStyle = g; ctx.stroke();

    if (logo.complete && logo.naturalWidth) ctx.drawImage(logo, CX - LOGO_W / 2, LOGO_Y, LOGO_W, LOGO_W * 176 / 1275);

    if (st.cut) {
      // the head stays inside the ring; below the centre line the shoulders come out in front of it
      ctx.save();
      ctx.beginPath();
      if (st.pop) {
        ctx.arc(CX, CY, R_IN, Math.PI, 0);
        if (edgeShows()) ctx.arc(CX, CY, R_OUT, 0, Math.PI);
        else { ctx.lineTo(S, CY); ctx.lineTo(S, S); ctx.lineTo(0, S); ctx.lineTo(0, CY); }
      } else ctx.arc(CX, CY, R_IN, 0, Math.PI * 2);
      ctx.closePath(); ctx.clip();
      ctx.shadowColor = 'rgba(31,31,61,.30)'; ctx.shadowBlur = 34; ctx.shadowOffsetX = 14; ctx.shadowOffsetY = 12;
      drawPhoto(st.cut);
      ctx.restore();
    } else if (!img) {
      // empty state: a soft silhouette
      ctx.save();
      ctx.beginPath(); ctx.arc(CX, CY, R_IN, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#C9D6EE';
      ctx.beginPath(); ctx.arc(CX, 420, 122, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(CX, 880, 300, 300, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // Where the cut-out is opaque, on a map at most 400 px across, and whether the body runs into the
  // image's bottom or side edges (a photo that cuts the person off there).
  function analyse(img) {
    var k = Math.min(1, 400 / Math.max(img.width, img.height));
    var w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
    var d = x.getImageData(0, 0, w, h).data, m = new Uint8Array(w * h), t = -1, b = -1, l = w, r = -1, i, yy, xx;
    for (i = 0; i < w * h; i++) {
      if (d[i * 4 + 3] <= 128) continue;
      m[i] = 1; yy = (i / w) | 0; xx = i - yy * w;
      if (t < 0) t = yy;
      b = yy; if (xx < l) l = xx; if (xx > r) r = xx;
    }
    if (t < 0) return null;
    var A = { w: w, h: h, k: k, m: m, t: t, b: b, l: l, r: r, touchB: false, touchL: false, touchR: false };
    for (xx = 0; xx < w; xx++) if (m[(h - 1) * w + xx] || m[Math.max(0, h - 2) * w + xx]) { A.touchB = true; break; }
    for (yy = Math.round(t + 0.35 * (b - t)); yy < h; yy++) {
      if (m[yy * w] || m[yy * w + Math.min(1, w - 1)]) A.touchL = true;
      if (m[yy * w + w - 1] || m[yy * w + Math.max(0, w - 2)]) A.touchR = true;
    }
    return A;
  }

  // Centre of the top of the head.
  function topX(A) {
    var sx = 0, n = 0, y1 = Math.min(A.b, A.t + Math.max(2, Math.round(0.02 * A.h)));
    for (var yy = A.t; yy <= y1; yy++) for (var xx = 0; xx < A.w; xx++) if (A.m[yy * A.w + xx]) { sx += xx; n++; }
    return n ? sx / n : (A.l + A.r) / 2;
  }

  // The opaque run on map row y nearest column x0, bridging small gaps (so a hand beside the head is not counted).
  function runAt(A, y, x0) {
    y = Math.round(Math.max(A.t, Math.min(A.b, y)));
    var row = y * A.w, gap = Math.max(2, Math.round(A.w * 0.015)), best = -1, dist = 1e9, x, g, L, R;
    for (x = 0; x < A.w; x++) if (A.m[row + x] && Math.abs(x - x0) < dist) { dist = Math.abs(x - x0); best = x; }
    if (best < 0 || dist > A.w * 0.15) return null;
    L = R = best;
    for (x = best - 1, g = 0; x >= 0 && g <= gap; x--) { if (A.m[row + x]) { L = x; g = 0; } else g++; }
    for (x = best + 1, g = 0; x < A.w && g <= gap; x++) { if (A.m[row + x]) { R = x; g = 0; } else g++; }
    return { l: L, r: R };
  }

  // Place the subject as in the samples: head top 26% down, head 28% of the frame wide, centred, with a
  // cut-off body reaching the bottom edge. A photo with its own background fills the disc from the cap down.
  function autoFit() {
    var img = photo(); if (!img) return;
    st.z = 1; zoom.value = 100;
    var A = st.map;
    if (!A) {
      st.fit = Math.max(2 * R_IN / img.width, 2 * R_IN / img.height);
      st.x = CX; st.y = CAP + img.height * st.fit / 2;
      return;
    }
    // f: canvas px per map px. The head is measured 10% of the frame below its top, which depends on f,
    // so settle it in a few rounds.
    var hx = topX(A), f = 0, run = runAt(A, A.t + 0.15 * (A.b - A.t), hx), fh = (S - HEAD_TOP) / (A.b - A.t + 1);
    for (var i = 0; i < 5 && run; i++) {
      f = HEAD_W / Math.max(3, run.r - run.l + 1);
      hx = (run.l + run.r) / 2;
      run = runAt(A, A.t + 0.1 * S / f, hx) || run;
    }
    f = f ? Math.max(0.55 * fh, Math.min(f, 2.2 * fh)) : fh;   // a mis-read head must not make the person tiny or huge
    var top = HEAD_TOP;
    if (A.touchB) {
      // the image's bottom edge must not show: move the head down a little, then zoom in if needed
      var need = S - (top + (A.h - A.t) * f);
      if (need > 0) { var mv = Math.min(need, 0.36 * S - top); top += mv; need -= mv; }
      if (need > 0) f = (S - top) / (A.h - A.t);
    }
    st.fit = f * A.k;
    st.x = CX + (img.width / 2 - hx / A.k) * st.fit;
    st.y = top + (img.height / 2 - A.t / A.k) * st.fit;
  }

  function hasTransparency(c) {
    var t = document.createElement('canvas'); t.width = 64; t.height = 64;
    var x = t.getContext('2d'); x.drawImage(c, 0, 0, 64, 64);
    var d = x.getImageData(0, 0, 64, 64).data, n = 0;
    for (var i = 3; i < d.length; i += 4) if (d[i] < 20) n++;
    return n > 64 * 64 * 0.08;
  }

  function loadImage(blob) {
    return new Promise(function (ok, bad) {
      var u = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { URL.revokeObjectURL(u); ok(im); };
      im.onerror = function () { URL.revokeObjectURL(u); bad(new Error('Could not read that image.')); };
      im.src = u;
    });
  }

  // The image on a canvas, at most max px on its long side.
  function toCanvas(img, max) {
    var k = Math.min(1, max / Math.max(img.width, img.height));
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  var job = 0;
  async function handle(f) {
    if (!f) return;
    if (f.type !== 'image/png' && !/\.png$/i.test(f.name || '')) {
      setStatus('Please upload a PNG file: a photo of you with the background removed.', 'err'); return;
    }
    var my = ++job, im;
    try { im = await loadImage(f); }
    catch (e) { if (my === job) setStatus('That file could not be opened. Please upload a PNG file.', 'err'); return; }
    if (my !== job) return;
    $('pp-tools').hidden = false; document.querySelector('.pp').classList.add('has');
    st.src = toCanvas(im, 2000);
    var clear = hasTransparency(st.src);
    st.cut = clear ? st.src : null; st.map = clear ? analyse(st.src) : null;
    autoFit(); draw();
    var small = Math.max(im.width, im.height) < 600 ? ' This image is small (' + im.width + ' x ' + im.height + ' px); a larger one will look sharper.' : '';
    if (clear) setStatus('Done. Drag the photo to position it, use the slider to zoom, then download.' + small, 'ok');
    else setStatus('This PNG still has its background, so it is shown inside the ring. For the pop-out look, upload a PNG with the background removed.' + small);
  }

  // upload
  file.addEventListener('change', function () { handle(file.files[0]); file.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { handle(e.dataTransfer.files[0]); });

  // drag to position (canvas pixels are scaled by CSS)
  var drag = null;
  cv.addEventListener('pointerdown', function (e) {
    if (!photo()) { file.click(); return; }
    drag = { x: e.clientX, y: e.clientY, sx: st.x, sy: st.y }; cv.setPointerCapture(e.pointerId); cv.classList.add('grab');
  });
  cv.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var k = S / cv.getBoundingClientRect().width;
    st.x = drag.sx + (e.clientX - drag.x) * k; st.y = drag.sy + (e.clientY - drag.y) * k; draw();
  });
  function endDrag() { drag = null; cv.classList.remove('grab'); }
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('wheel', function (e) {
    if (!photo()) return;
    e.preventDefault();
    zoom.value = Math.max(+zoom.min, Math.min(+zoom.max, +zoom.value - Math.sign(e.deltaY) * 4));
    st.z = zoom.value / 100; draw();
  }, { passive: false });
  // keyboard nudging for accessibility
  cv.addEventListener('keydown', function (e) {
    var step = e.shiftKey ? 20 : 5, m = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!m || !photo()) return;
    e.preventDefault(); st.x += m[0]; st.y += m[1]; draw();
  });
  zoom.addEventListener('input', function () { st.z = zoom.value / 100; draw(); });
  $('pp-reset').addEventListener('click', function () { autoFit(); draw(); });

  // option chips
  document.querySelectorAll('.pp [data-opt]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.dataset.opt;
      st[k] = b.dataset.val;
      document.querySelectorAll('.pp [data-opt="' + k + '"]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      draw();
    });
  });
  $('pp-pop').addEventListener('change', function () { st.pop = this.checked; draw(); });

  // downloads
  document.querySelectorAll('.pp [data-size]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!photo()) { setStatus('Upload a PNG first.', 'err'); return; }
      var n = +b.dataset.size, out = cv;
      if (n !== S) { out = document.createElement('canvas'); out.width = out.height = n; out.getContext('2d').drawImage(cv, 0, 0, n, n); }
      out.toBlob(function (blob) {
        var a = document.createElement('a'), name = ($('pp-name').value || 'Profile').trim().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'Profile';
        a.href = URL.createObjectURL(blob); a.download = 'TechNext-' + name + '-' + n + '.png';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      }, 'image/png');
    });
  });

  draw();
})();
