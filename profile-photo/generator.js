/* TechNext profile photo generator.
   Upload a photo -> the background is removed in the browser (nothing is uploaded) ->
   the person is placed in the branded ring, popping out over its lower half -> PNG download.
   Background removal: @imgly/background-removal, loaded from jsDelivr only when a photo is chosen. */
(function () {
  'use strict';
  var S = 1024;                       // export size (px)
  var CX = 512, CY = 500;             // ring centre
  var R_IN = 420, R_OUT = 462;        // inner fill radius / outer edge of the ring
  var LIB = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm';

  var cv = document.getElementById('pp-canvas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var file = $('pp-file'), drop = $('pp-drop'), status = $('pp-status'), zoom = $('pp-zoom');

  var st = {
    src: null,       // original photo (ImageBitmap / Image)
    cut: null,       // background-removed photo
    ring: 'blue',    // blue | navy
    bg: 'white',     // white | soft | none
    pop: true,       // body pops out over the ring
    keep: false,     // keep original background (no cut-out)
    fit: 1, z: 1, x: CX, y: CY   // auto-fit scale, user zoom, image centre
  };

  var logo = new Image();
  logo.onload = draw;
  logo.src = 'profile-photo/logo-h.svg';

  function setStatus(msg, kind) {
    status.textContent = msg || '';
    status.className = 'pp-status' + (kind ? ' ' + kind : '');
  }

  function ringGrad() {
    var g = ctx.createLinearGradient(CX - R_OUT, CY + R_OUT, CX + R_OUT, CY - R_OUT);
    if (st.ring === 'navy') { g.addColorStop(0, '#16367A'); g.addColorStop(1, '#3167CA'); }
    else { g.addColorStop(0, '#3167CA'); g.addColorStop(1, '#6FA0F5'); }
    return g;
  }

  function photo() { return st.keep ? st.src : (st.cut || st.src); }

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

    // ring
    ctx.beginPath(); ctx.arc(CX, CY, (R_IN + R_OUT) / 2, 0, Math.PI * 2);
    ctx.lineWidth = R_OUT - R_IN; ctx.strokeStyle = ringGrad(); ctx.stroke();

    // logo
    if (logo.complete && logo.naturalWidth) {
      var lw = 330, lh = lw * 176 / 1275;
      ctx.drawImage(logo, CX - lw / 2, 150, lw, lh);
    }

    var img = photo();
    if (img) {
      var sc = st.fit * st.z, w = img.width * sc, h = img.height * sc;
      ctx.save();
      ctx.beginPath();
      var cutout = !st.keep && st.cut;
      if (cutout && st.pop) {
        ctx.arc(CX, CY, R_OUT, Math.PI, 0);            // top half: stay inside the ring
        ctx.lineTo(S, CY); ctx.lineTo(S, S); ctx.lineTo(0, S); ctx.lineTo(0, CY);   // bottom: free to overlap
        ctx.closePath();
      } else {
        ctx.arc(CX, CY, R_IN, 0, Math.PI * 2);
      }
      ctx.clip();
      if (cutout) {
        ctx.shadowColor = 'rgba(31,31,61,.30)'; ctx.shadowBlur = 34; ctx.shadowOffsetX = 14; ctx.shadowOffsetY = 12;
      }
      ctx.drawImage(img, st.x - w / 2, st.y - h / 2, w, h);
      ctx.restore();
    } else {
      // empty state: a soft silhouette
      ctx.save();
      ctx.beginPath(); ctx.arc(CX, CY, R_IN, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#C9D6EE';
      ctx.beginPath(); ctx.arc(CX, 470, 118, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(CX, 900, 290, 290, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // Place the subject: head near the top of the ring, shoulders across the bottom.
  function autoFit() {
    var img = photo(); if (!img) return;
    var box = { t: 0, b: img.height, l: 0, r: img.width, hx: img.width / 2 };
    if (!st.keep && st.cut) box = alphaBox(st.cut) || box;
    var bw = box.r - box.l, bh = box.b - box.t;
    if (!st.keep && st.cut) {
      // head about a quarter of the frame wide, but never smaller than fitting the whole subject
      st.fit = box.hw ? 0.27 * S / box.hw : 0;
      st.fit = Math.max(st.fit, Math.min((S - 250) / bh, 0.86 * S / bw));
      st.fit = Math.min(st.fit, Math.max((S - 250) / bh, 1.25 * S / bw));   // guard against a mis-read head
      st.x = CX + (img.width / 2 - box.hx) * st.fit;
      st.y = 250 + (img.height / 2 - box.t) * st.fit;
    } else {
      st.fit = Math.max(2 * R_IN / img.width, 2 * R_IN / img.height);
      st.x = CX; st.y = CY;
    }
    st.z = 1; zoom.value = 100;
  }

  // Bounding box of opaque pixels + x-centre of the head (top quarter of the subject).
  function alphaBox(img) {
    var k = Math.min(1, 320 / Math.max(img.width, img.height));
    var w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
    var d = x.getImageData(0, 0, w, h).data, t = -1, b = -1, l = w, r = -1;
    for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
      if (d[(yy * w + xx) * 4 + 3] > 128) { if (t < 0) t = yy; b = yy; if (xx < l) l = xx; if (xx > r) r = xx; }
    }
    if (t < 0) return null;
    var lim = t + (b - t) * 0.25, sx = 0, n = 0;
    for (yy = t; yy <= lim; yy++) for (xx = 0; xx < w; xx++) if (d[(yy * w + xx) * 4 + 3] > 128) { sx += xx; n++; }
    // head width: the opaque span a little below the top of the hair
    var hy = Math.round(t + Math.min((b - t) * 0.12, w * 0.12)), hl = -1, hr = -1;
    for (xx = 0; xx < w; xx++) if (d[(hy * w + xx) * 4 + 3] > 128) { if (hl < 0) hl = xx; hr = xx; }
    return { t: t / k, b: (b + 1) / k, l: l / k, r: (r + 1) / k, hx: (n ? sx / n : (l + r) / 2) / k, hw: hl < 0 ? 0 : (hr - hl + 1) / k };
  }

  function hasTransparency(img) {
    var c = document.createElement('canvas'); c.width = 64; c.height = 64;
    var x = c.getContext('2d'); x.drawImage(img, 0, 0, 64, 64);
    var d = x.getImageData(0, 0, 64, 64).data, n = 0;
    for (var i = 3; i < d.length; i += 4) if (d[i] < 20) n++;
    return n > 64 * 64 * 0.08;
  }

  function loadImage(blob) {
    return new Promise(function (ok, bad) {
      var u = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { ok(im); };
      im.onerror = function () { bad(new Error('Could not read that image.')); };
      im.src = u;
    });
  }

  // Downscale very large photos first so the cut-out stays fast.
  function shrink(img, max) {
    var k = Math.min(1, max / Math.max(img.width, img.height));
    if (k === 1) return img;
    var c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  function toBlob(c) { return new Promise(function (ok) { c.toBlob(ok, 'image/png'); }); }

  var lib = null;
  function getLib() { return lib || (lib = import(LIB)); }

  var job = 0;
  async function handle(f) {
    if (!f || !/^image\//.test(f.type)) { setStatus('Please choose a JPG or PNG photo.', 'err'); return; }
    var my = ++job;
    $('pp-tools').hidden = false; document.querySelector('.pp').classList.add('has');
    try {
      var im = await loadImage(f);
      st.src = shrink(im, 2000); st.cut = null; st.keep = $('pp-keep').checked;
      autoFit(); draw();
      if (hasTransparency(st.src)) { st.cut = st.src; autoFit(); draw(); setStatus('Transparent PNG detected, no cut-out needed. Drag to position.', 'ok'); return; }
      if (st.keep) { setStatus('Showing your photo with its own background. Drag to position.', 'ok'); return; }
      setStatus('Loading the cut-out tool (first time only, about 60 MB)...');
      var m = await getLib();
      if (my !== job) return;
      setStatus('Removing the background... this takes a few seconds.');
      var blob = await m.removeBackground(await toBlob(st.src instanceof HTMLCanvasElement ? st.src : drawToCanvas(st.src)), {
        model: 'isnet_quint8',
        output: { format: 'image/png' },
        progress: function (key, cur, tot) {
          if (my === job && tot && cur < tot) setStatus('Downloading the cut-out tool... ' + Math.round(cur / tot * 100) + '%');
        }
      });
      if (my !== job) return;
      st.cut = await loadImage(blob);
      autoFit(); draw();
      setStatus('Done. Drag the photo to position it, use the slider to zoom, then download.', 'ok');
    } catch (e) {
      if (my !== job) return;
      console.error(e);
      st.keep = true; $('pp-keep').checked = true; autoFit(); draw();
      setStatus('The background could not be removed here, so your photo is shown with its own background. Try Chrome or Edge, or send it on WhatsApp below.', 'err');
    }
  }
  function drawToCanvas(img) {
    var c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0); return c;
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
  $('pp-keep').addEventListener('change', function () {
    st.keep = this.checked;
    if (!st.keep && st.src && !st.cut) { var f = st.src; st.src = null; job++; reprocess(f); return; }
    autoFit(); draw();
  });
  function reprocess(src) { toBlob(src instanceof HTMLCanvasElement ? src : drawToCanvas(src)).then(function (b) { handle(new File([b], 'photo.png', { type: 'image/png' })); }); }

  // downloads
  document.querySelectorAll('.pp [data-size]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!photo()) { setStatus('Upload a photo first.', 'err'); return; }
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
