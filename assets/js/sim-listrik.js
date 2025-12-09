// === SIMULASI VISUAL RANGKAIAN LISTRIK – BOARD 1200x600 ===
// Panel komponen di atas, papan di bawah, komponen bisa di-drag.

(function () {
  const canvas = document.getElementById("circuitBoard");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const toolbarButtons = document.querySelectorAll(".tool-btn");

  const W = canvas.width;
  const H = canvas.height;

  // State komponen di papan
  const components = [];

  // Ukuran default komponen (untuk hit detection & gambar simbol)
  const SIZE = {
    lamp: { w: 80, h: 80 },
    battery: { w: 80, h: 60 },
    resistor: { w: 80, h: 40 },
    switch: { w: 90, h: 40 },
    wire: { w: 80, h: 20 }
  };

  function createComponent(type, x, y) {
    const sz = SIZE[type] || { w: 60, h: 40 };
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      type,
      x: x - sz.w / 2,
      y: y - sz.h / 2,
      w: sz.w,
      h: sz.h
    };
  }

  // Tambah komponen ketika icon di toolbar diklik
  toolbarButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      // Spawn di tengah papan
      const comp = createComponent(type, W / 2, H / 2 + 40);
      components.push(comp);
    });
  });

  // ======== DRAG & DROP =========
  let dragging = null;
  let dragOffset = { x: 0, y: 0 };

  function hitComponent(x, y) {
    // Ambil yang paling depan
    for (let i = components.length - 1; i >= 0; i--) {
      const c = components[i];
      if (
        x >= c.x &&
        x <= c.x + c.w &&
        y >= c.y &&
        y <= c.y + c.h
      ) {
        return c;
      }
    }
    return null;
  }

  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;

    const target = hitComponent(x, y);
    if (target) {
      dragging = target;
      dragOffset.x = x - target.x;
      dragOffset.y = y - target.y;

      // bawa ke "atas" (pindah ke akhir array)
      const idx = components.indexOf(target);
      components.splice(idx, 1);
      components.push(target);
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;

    dragging.x = x - dragOffset.x;
    dragging.y = y - dragOffset.y;

    // Batas biar ga keluar papan
    dragging.x = Math.max(40, Math.min(dragging.x, W - dragging.w - 40));
    dragging.y = Math.max(90, Math.min(dragging.y, H - dragging.h - 40));
  });

  window.addEventListener("mouseup", () => {
    dragging = null;
  });

  // ======== GAMBAR ========

  function drawBoardBackground() {
    // Background navy
    ctx.fillStyle = "#050029";
    ctx.fillRect(0, 0, W, H);

    // Border kuning dalam (biar mirip mockup)
    const pad = 22;
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(pad, pad, W - pad * 2, H - pad * 2, 20);
    ctx.stroke();
  }

  // gambar simbol berdasarkan jenis
  function drawComponent(c) {
    const cx = c.x + c.w / 2;
    const cy = c.y + c.h / 2;

    ctx.save();

    // Highlight body tipis untuk semua komponen
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "rgba(148, 163, 184, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.roundRect(c.x, c.y, c.w, c.h, 10);
    ctx.fill();
    ctx.stroke();

    if (c.type === "lamp") {
      // Lampu bohlam sederhana
      const r = Math.min(c.w, c.h) * 0.35;

      const grad = ctx.createRadialGradient(
        cx,
        cy - 4,
        4,
        cx,
        cy,
        r + 8
      );
      grad.addColorStop(0, "rgba(254, 252, 232, 0.9)");
      grad.addColorStop(0.4, "rgba(250, 204, 21, 0.9)");
      grad.addColorStop(1, "rgba(30, 64, 175, 0.25)");

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = "rgba(248, 250, 252, 0.9)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // filament
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.5, cy);
      ctx.lineTo(cx - r * 0.2, cy - 4);
      ctx.lineTo(cx, cy + 2);
      ctx.lineTo(cx + r * 0.2, cy - 4);
      ctx.lineTo(cx + r * 0.5, cy);
      ctx.stroke();
    } else if (c.type === "battery") {
      // Baterai: dua garis beda panjang
      const midY = cy;
      const left = c.x + c.w * 0.25;
      const right = c.x + c.w * 0.75;

      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 3;

      // garis panjang (+)
      ctx.beginPath();
      ctx.moveTo(right - 6, midY - 12);
      ctx.lineTo(right - 6, midY + 12);
      ctx.stroke();

      // garis pendek (-)
      ctx.beginPath();
      ctx.moveTo(left + 6, midY - 8);
      ctx.lineTo(left + 6, midY + 8);
      ctx.stroke();

      // label
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("+", right + 8, midY - 12);
      ctx.fillText("-", left - 8, midY - 8);
    } else if (c.type === "resistor") {
      // Resistor zig-zag
      const y = cy;
      const x1 = c.x + 12;
      const x2 = c.x + c.w - 12;

      ctx.strokeStyle = "#fb923c";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(x1, y);
      let x = x1;
      const step = (x2 - x1) / 6;
      let up = true;
      for (let i = 0; i < 6; i++) {
        x += step;
        const yy = y + (up ? -8 : 8);
        ctx.lineTo(x, yy);
        up = !up;
      }
      ctx.lineTo(x2, y);
      ctx.stroke();
    } else if (c.type === "switch") {
      // Saklar
      const leftX = c.x + 16;
      const rightX = c.x + c.w - 16;
      const y = cy;

      // titik
      ctx.fillStyle = "#e5e7eb";
      ctx.beginPath();
      ctx.arc(leftX, y, 4, 0, Math.PI * 2);
      ctx.arc(rightX, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // lengan saklar (default tertutup)
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(leftX, y);
      ctx.lineTo(rightX, y);
      ctx.stroke();

      ctx.fillStyle = "#e5e7eb";
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Saklar", cx, c.y + c.h - 6);
    } else if (c.type === "wire") {
      // Kabel lurus pendek
      const x1 = c.x + 10;
      const x2 = c.x + c.w - 10;
      const y = cy;

      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawAll() {
    drawBoardBackground();

    components.forEach(c => {
      drawComponent(c);
    });
  }

  function loop() {
    drawAll();
    requestAnimationFrame(loop);
  }

  // Start
  loop();
})();
