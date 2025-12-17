// === SIMULASI RANGKAIAN LISTRIK AC SEDERHANA – SimLab.id ===
// Board 1200x600, komponen drag & drop, kabel elastis + snap magnet, tombol hapus,
// kontrol tegangan + panel status + tombol reset.

(function () {
  const canvas = document.getElementById("circuitBoard");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const toolbarButtons = document.querySelectorAll(".tool-btn");

  const W = canvas.width;
  const H = canvas.height;

  // ---------- DOM KONTROL BAWAH ----------
  const voltageSlider = document.getElementById("voltageSlider");
  const voltageValue = document.getElementById("voltageValue");
  const statusHint = document.getElementById("statusHint");
  const statusLine = document.getElementById("statusLine");
  const resetBtn = document.getElementById("resetSimBtn");

  // ---------- UTIL ----------

  function roundRectSafe(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
    } else {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.moveTo(x + rr, y);
      ctx.lineTo(x + w - rr, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
      ctx.lineTo(x + w, y + h - rr);
      ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
      ctx.lineTo(x + rr, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
      ctx.lineTo(x, y + rr);
      ctx.quadraticCurveTo(x, y, x + rr, y);
    }
  }

  function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    return { x, y };
  }

  function makeId() {
    return (
      Date.now().toString(36) + Math.random().toString(36).slice(2)
    );
  }

  // ---------- PROFIL FISIKA ----------

  const PROFILE = {
    batteryVoltage: 6, // V AC sederhana (nilai awal slider)
    lampResistance: 12,
    resistorDefault: 8,
    wireResistance: 0.2,
    switchResistance: 0.1,
    nominalCurrent: 0.5 // lampu normal bright
  };

  // tegangan yang dipakai hitungan (dikontrol slider)
  let sourceVoltage = PROFILE.batteryVoltage;

  // ---------- STATE ----------

  const components = []; // semua komponen termasuk wire

  const SIZE = {
    lamp: { w: 90, h: 120 },
    battery: { w: 70, h: 110 },
    switch: { w: 90, h: 80 },
    resistor: { w: 90, h: 70 }
  };

  let mode = "idle"; // idle | wire | delete
  let drawingWire = null; // wire yang sedang dibuat

  let draggingComp = null;
  let dragOffset = { x: 0, y: 0 };
  let clickCandidate = null;
  let hasMoved = false;

  let draggingEndpoint = null; // { wire, index }

  // ---------- INISIALISASI SLIDER + RESET UI ----------

  if (voltageSlider) {
    if (!voltageSlider.min) voltageSlider.min = "1";
    if (!voltageSlider.max) voltageSlider.max = "12";
    voltageSlider.value = String(PROFILE.batteryVoltage);

    const updateVoltageLabel = () => {
      if (voltageValue) {
        voltageValue.textContent = `${sourceVoltage} V AC`;
      }
    };

    sourceVoltage = Number(voltageSlider.value) || PROFILE.batteryVoltage;
    updateVoltageLabel();

    voltageSlider.addEventListener("input", () => {
      sourceVoltage = Number(voltageSlider.value) || PROFILE.batteryVoltage;
      updateVoltageLabel();
    });
  }

  function updateStatusPanel(stats) {
    if (!statusHint || !statusLine) return;
    const { lit, burned, maxCurrent } = stats;
    let hint;
    if (burned > 0) {
      hint =
        "Beberapa lampu terbakar! Coba kecilkan tegangan atau tambahkan resistor di jalur lampu.";
    } else if (lit > 0 && maxCurrent > PROFILE.nominalCurrent * 1.2) {
      hint =
        "Lampu menyala terang. Tegangan cukup tinggi, hati-hati kalau masih dinaikkan.";
    } else if (lit > 0) {
      hint = "Tegangan aman, lampu menyala normal. Coba ubah saklar / resistor.";
    } else {
      hint =
        "Tegangan rendah → semua lampu aman. Coba naikkan pelan-pelan untuk melihat pengaruhnya.";
    }
    statusHint.textContent = hint;
    statusLine.textContent = `Lampu hidup: ${lit} • Lampu terbakar: ${burned} • Arus maksimum: ${maxCurrent.toFixed(
      2
    )} A`;
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      // hapus semua komponen
      components.length = 0;

      // reset mode & drag state
      mode = "idle";
      drawingWire = null;
      draggingComp = null;
      draggingEndpoint = null;
      clickCandidate = null;
      hasMoved = false;

      // reset tegangan ke default
      sourceVoltage = PROFILE.batteryVoltage;
      if (voltageSlider) {
        voltageSlider.value = String(PROFILE.batteryVoltage);
      }
      if (voltageValue) {
        voltageValue.textContent = `${PROFILE.batteryVoltage} V AC`;
      }

      // reset status panel
      updateStatusPanel({ lit: 0, burned: 0, maxCurrent: 0 });
    });
  }

  // ---------- BUAT KOMPONEN ----------

  function createComponent(type, x, y) {
    const sz = SIZE[type] || { w: 80, h: 80 };
    const c = {
      id: makeId(),
      type,
      x: x - sz.w / 2,
      y: y - sz.h / 2,
      w: sz.w,
      h: sz.h,
      current: 0,
      brightness: 0,
      burned: false,
      terminalsIndex: []
    };

    if (type === "lamp") {
      c.resistance = PROFILE.lampResistance;
    } else if (type === "resistor") {
      c.resistance = PROFILE.resistorDefault;
    } else if (type === "switch") {
      c.resistance = PROFILE.switchResistance;
      c.closed = true;
    } else if (type === "battery") {
      c.isSource = true;
      c.voltage = PROFILE.batteryVoltage;
    }

    return c;
  }

  function createWire(x, y) {
    return {
      id: makeId(),
      type: "wire",
      x1: x,
      y1: y,
      x2: x + 80,
      y2: y,
      resistance: PROFILE.wireResistance,
      current: 0,
      // anchor ujung kabel ke terminal komponen (biar ikut gerak)
      anchor1: null, // { compId, termIndex }
      anchor2: null,
      terminalsIndex: []
    };
  }

  // ---------- TERMINAL POSISI ----------

  function getComponentTerminals(c) {
    const res = [];
    if (c.type === "lamp") {
      const baseY = c.y + c.h - 12;
      const leftX = c.x + c.w / 2 - 18;
      const rightX = c.x + c.w / 2 + 18;
      res.push({ x: leftX, y: baseY });
      res.push({ x: rightX, y: baseY });
    } else if (c.type === "battery") {
      const midY = c.y + c.h / 2;
      res.push({ x: c.x + 12, y: midY });
      res.push({ x: c.x + c.w - 12, y: midY });
    } else if (c.type === "switch") {
      const midY = c.y + c.h / 2;
      res.push({ x: c.x + 14, y: midY });
      res.push({ x: c.x + c.w - 14, y: midY });
    } else if (c.type === "resistor") {
      const midY = c.y + c.h / 2;
      res.push({ x: c.x + 12, y: midY });
      res.push({ x: c.x + c.w - 12, y: midY });
    } else {
      const midY = c.y + c.h / 2;
      res.push({ x: c.x + 10, y: midY });
      res.push({ x: c.x + c.w - 10, y: midY });
    }
    return res;
  }

  function collectTerminals() {
    const list = [];
    let idx = 0;
    components.forEach((c) => {
      c.terminalsIndex = [];
      if (c.type === "wire") {
        const t0 = { comp: c, termIndex: 0, x: c.x1, y: c.y1, index: idx++ };
        const t1 = { comp: c, termIndex: 1, x: c.x2, y: c.y2, index: idx++ };
        c.terminalsIndex[0] = t0.index;
        c.terminalsIndex[1] = t1.index;
        list.push(t0, t1);
      } else {
        const ts = getComponentTerminals(c);
        ts.forEach((p, i) => {
          const t = {
            comp: c,
            termIndex: i,
            x: p.x,
            y: p.y,
            index: idx++
          };
          c.terminalsIndex[i] = t.index;
          list.push(t);
        });
      }
    });
    return list;
  }

  function findSnapTarget(px, py, exclude) {
    const SNAP_DIST2 = 22 * 22;
    const terminals = collectTerminals();
    let best = null;
    let bestD2 = SNAP_DIST2;

    terminals.forEach((t) => {
      if (
        exclude &&
        exclude.compId === t.comp.id &&
        exclude.termIndex === t.termIndex
      )
        return;
      const d2 = dist2(px, py, t.x, t.y);
      if (d2 < bestD2) {
        bestD2 = d2;
        best = t;
      }
    });

    if (!best) return null;
    return {
      x: best.x,
      y: best.y,
      anchor: { compId: best.comp.id, termIndex: best.termIndex }
    };
  }

  function updateWireAnchors() {
    components.forEach((c) => {
      if (c.type !== "wire") return;
      if (c.anchor1) {
        const comp = components.find((k) => k.id === c.anchor1.compId);
        if (comp) {
          const ts = getComponentTerminals(comp);
          const p = ts[c.anchor1.termIndex];
          if (p) {
            c.x1 = p.x;
            c.y1 = p.y;
          }
        }
      }
      if (c.anchor2) {
        const comp = components.find((k) => k.id === c.anchor2.compId);
        if (comp) {
          const ts = getComponentTerminals(comp);
          const p = ts[c.anchor2.termIndex];
          if (p) {
            c.x2 = p.x;
            c.y2 = p.y;
          }
        }
      }
    });
  }

  // ---------- UNION-FIND & GRAF ----------

  function makeUF(n) {
    const parent = new Array(n);
    const rank = new Array(n).fill(0);
    for (let i = 0; i < n; i++) parent[i] = i;

    function find(x) {
      if (parent[x] !== x) parent[x] = find(parent[x]);
      return parent[x];
    }
    function union(a, b) {
      let ra = find(a);
      let rb = find(b);
      if (ra === rb) return;
      if (rank[ra] < rank[rb]) parent[ra] = rb;
      else if (rank[ra] > rank[rb]) parent[rb] = ra;
      else {
        parent[rb] = ra;
        rank[ra]++;
      }
    }
    return { find, union };
  }

  function buildCircuitGraph() {
    const terminals = collectTerminals();
    const N = terminals.length;
    if (!N) return null;

    const uf = makeUF(N);
    const SNAP2 = 12 * 12;

    for (let i = 0; i < N; i++) {
      const a = terminals[i];
      for (let j = i + 1; j < N; j++) {
        const b = terminals[j];
        if (dist2(a.x, a.y, b.x, b.y) <= SNAP2) {
          uf.union(i, j);
        }
      }
    }

    const nodeMap = new Map();
    let nodeCount = 0;
    const nodeOf = new Array(N);
    for (let i = 0; i < N; i++) {
      const root = uf.find(i);
      if (!nodeMap.has(root)) nodeMap.set(root, nodeCount++);
      nodeOf[i] = nodeMap.get(root);
    }

    const graph = Array.from({ length: nodeCount }, () => []);
    const sourceEdges = [];

    components.forEach((c) => {
      const idxs = c.terminalsIndex;
      if (!idxs || idxs.length < 2) return;

      if (c.type === "switch" && !c.closed) {
        c.current = 0;
        return;
      }

      const na = nodeOf[idxs[0]];
      const nb = nodeOf[idxs[1]];
      if (na === nb) return;

      const edge = { comp: c, a: na, b: nb };
      graph[na].push({ to: nb, edge });
      graph[nb].push({ to: na, edge });

      if (c.isSource) sourceEdges.push(edge);
    });

    return { nodeOf, graph, sourceEdges };
  }

  function findLampPath(graphData, lamp) {
    if (!graphData) return null;
    const { graph, nodeOf, sourceEdges } = graphData;
    if (!lamp.terminalsIndex || lamp.terminalsIndex.length < 2) return null;
    if (!sourceEdges.length) return null;

    const start = nodeOf[lamp.terminalsIndex[0]];
    const end = nodeOf[lamp.terminalsIndex[1]];

    const visited = new Set();

    function dfs(node, usedSrc, prevEdge, path) {
      const key = node + "|" + (usedSrc ? 1 : 0);
      if (visited.has(key)) return null;
      visited.add(key);

      if (node === end && usedSrc) return path.slice();

      for (const { to, edge } of graph[node]) {
        if (edge === prevEdge) continue;
        const isSrc = sourceEdges.includes(edge);
        path.push(edge);
        const res = dfs(to, usedSrc || isSrc, edge, path);
        if (res) return res;
        path.pop();
      }
      return null;
    }

    return dfs(start, false, null, []);
  }

  // ---------- HITUNG ARUS ----------

  function solveCurrents() {
    updateWireAnchors();

    const graphData = buildCircuitGraph();

    components.forEach((c) => {
      c.current = 0;
      if (c.type === "lamp") {
        c.brightness = 0;
        c.burned = false;
      }
    });

    if (!graphData || !graphData.sourceEdges.length) {
      updateStatusPanel({ lit: 0, burned: 0, maxCurrent: 0 });
      return;
    }

    const V = sourceVoltage;
    const blowCurrent = PROFILE.nominalCurrent * 1.6;

    let litCount = 0;
    let burnedCount = 0;
    let maxCurrent = 0;

    components.forEach((c) => {
      if (c.type !== "lamp") return;

      const path = findLampPath(graphData, c);
      if (!path) return;

      const used = new Set();
      let Rtotal = 0;
      path.forEach((edge) => {
        const comp = edge.comp;
        if (used.has(comp.id)) return;
        used.add(comp.id);
        if (
          comp.type === "lamp" ||
          comp.type === "resistor" ||
          comp.type === "wire" ||
          comp.type === "switch"
        ) {
          Rtotal += comp.resistance || 0;
        }
      });

      if (Rtotal <= 0) return;

      const I = V / Rtotal;
      c.current = I;
      maxCurrent = Math.max(maxCurrent, Math.abs(I));

      if (Math.abs(I) > blowCurrent) {
        c.brightness = 0;
        c.burned = true;
        burnedCount++;
      } else {
        let b = I / PROFILE.nominalCurrent;
        if (b < 0) b = 0;
        if (b > 1.5) b = 1.5;
        c.brightness = b;
        if (b > 0.05) litCount++;
      }

      path.forEach((edge) => {
        edge.comp.current = I;
      });
    });

    updateStatusPanel({
      lit: litCount,
      burned: burnedCount,
      maxCurrent: maxCurrent || 0
    });
  }

  // ---------- TOOLBAR MODE ----------

  toolbarButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      if (!type) return;

      if (type === "delete") {
        mode = "delete";
        drawingWire = null;
        draggingComp = null;
        draggingEndpoint = null;
        return;
      }

      if (type === "wire") {
        mode = "wire";
        drawingWire = null;
        draggingComp = null;
        draggingEndpoint = null;
        return;
      }

      mode = "idle";
      drawingWire = null;
      const comp = createComponent(type, W / 2, H / 2 + 60);
      components.push(comp);
    });
  });

  // ---------- HIT TEST ----------

  function hitComponentBox(x, y) {
    for (let i = components.length - 1; i >= 0; i--) {
      const c = components[i];
      if (c.type === "wire") continue;
      if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
        return c;
      }
    }
    return null;
  }

  function hitWireEndpoint(x, y) {
    const R2 = 12 * 12;
    for (let i = components.length - 1; i >= 0; i--) {
      const c = components[i];
      if (c.type !== "wire") continue;
      if (dist2(x, y, c.x1, c.y1) <= R2) {
        return { wire: c, index: 0 };
      }
      if (dist2(x, y, c.x2, c.y2) <= R2) {
        return { wire: c, index: 1 };
      }
    }
    return null;
  }

  function hitForDelete(x, y) {
    const R2 = 10 * 10;
    for (let i = components.length - 1; i >= 0; i--) {
      const c = components[i];
      if (c.type === "wire") {
        if (dist2(x, y, c.x1, c.y1) <= R2) return c;
        if (dist2(x, y, c.x2, c.y2) <= R2) return c;
        const dx = c.x2 - c.x1;
        const dy = c.y2 - c.y1;
        const len2 = dx * dx + dy * dy || 1;
        const t = Math.max(
          0,
          Math.min(1, ((x - c.x1) * dx + (y - c.y1) * dy) / len2)
        );
        const px = c.x1 + t * dx;
        const py = c.y1 + t * dy;
        if (dist2(x, y, px, py) <= R2) return c;
      } else {
        if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
          return c;
        }
      }
    }
    return null;
  }

  // ---------- MOUSE EVENTS ----------

  canvas.addEventListener("mousedown", (e) => {
    const { x, y } = canvasPos(e);

    if (mode === "delete") {
      const target = hitForDelete(x, y);
      if (target) {
        const idx = components.indexOf(target);
        if (idx >= 0) components.splice(idx, 1);
      }
      return;
    }

    if (mode === "wire") {
      if (!drawingWire) {
        const snap = findSnapTarget(x, y, null);
        const startX = snap ? snap.x : x;
        const startY = snap ? snap.y : y;
        const wire = createWire(startX, startY);
        if (snap) {
          wire.anchor1 = snap.anchor;
        }
        wire.x2 = startX;
        wire.y2 = startY;
        components.push(wire);
        drawingWire = wire;
      } else {
        const exclude = { compId: drawingWire.id, termIndex: 1 };
        const snap = findSnapTarget(x, y, exclude);
        if (snap) {
          drawingWire.x2 = snap.x;
          drawingWire.y2 = snap.y;
          drawingWire.anchor2 = snap.anchor;
        } else {
          drawingWire.x2 = x;
          drawingWire.y2 = y;
          drawingWire.anchor2 = null;
        }
        drawingWire = null;
        mode = "idle";
      }
      return;
    }

    const ep = hitWireEndpoint(x, y);
    if (ep) {
      draggingEndpoint = ep;
      if (ep.index === 0) ep.wire.anchor1 = null;
      else ep.wire.anchor2 = null;
      return;
    }

    const target = hitComponentBox(x, y);
    if (target) {
      draggingComp = target;
      dragOffset.x = x - target.x;
      dragOffset.y = y - target.y;
      clickCandidate = target;
      hasMoved = false;

      const idx = components.indexOf(target);
      components.splice(idx, 1);
      components.push(target);
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    const { x, y } = canvasPos(e);

    if (mode === "wire" && drawingWire) {
      const exclude = { compId: drawingWire.id, termIndex: 1 };
      const snap = findSnapTarget(x, y, exclude);
      if (snap) {
        drawingWire.x2 = snap.x;
        drawingWire.y2 = snap.y;
      } else {
        drawingWire.x2 = x;
        drawingWire.y2 = y;
      }
      return;
    }

    if (draggingEndpoint) {
      const { wire, index } = draggingEndpoint;
      const exclude = { compId: wire.id, termIndex: index };
      const snap = findSnapTarget(x, y, exclude);
      if (index === 0) {
        if (snap) {
          wire.x1 = snap.x;
          wire.y1 = snap.y;
          wire.anchor1 = snap.anchor;
        } else {
          wire.x1 = x;
          wire.y1 = y;
          wire.anchor1 = null;
        }
      } else {
        if (snap) {
          wire.x2 = snap.x;
          wire.y2 = snap.y;
          wire.anchor2 = snap.anchor;
        } else {
          wire.x2 = x;
          wire.y2 = y;
          wire.anchor2 = null;
        }
      }
      return;
    }

    if (draggingComp) {
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      if (
        Math.abs(newX - draggingComp.x) > 1 ||
        Math.abs(newY - draggingComp.y) > 1
      ) {
        hasMoved = true;
      }

      draggingComp.x = Math.max(
        40,
        Math.min(newX, W - draggingComp.w - 40)
      );
      draggingComp.y = Math.max(
        70,
        Math.min(newY, H - draggingComp.h - 40)
      );
    }
  });

  window.addEventListener("mouseup", () => {
    if (
      clickCandidate &&
      !hasMoved &&
      clickCandidate.type === "switch"
    ) {
      clickCandidate.closed = !clickCandidate.closed;
    }
    draggingComp = null;
    clickCandidate = null;
    draggingEndpoint = null;
  });

  // ---------- GAMBAR ----------

  function drawBoardBackground() {
    ctx.fillStyle = "#050029";
    ctx.fillRect(0, 0, W, H);

    const pad = 22;
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 4;
    ctx.beginPath();
    roundRectSafe(ctx, pad, pad, W - pad * 2, H - pad * 2, 26);
    ctx.stroke();
  }

  function drawWire(c, t) {
    const { x1, y1, x2, y2 } = c;
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;

    ctx.save();
    ctx.lineWidth = 10;
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, "#991b1b");
    grad.addColorStop(0.5, "#ef4444");
    grad.addColorStop(1, "#991b1b");
    ctx.strokeStyle = grad;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#f9fafb";
    ctx.beginPath();
    ctx.moveTo(x1 + ux * 4, y1 + uy * 4);
    ctx.lineTo(x2 - ux * 4, y2 - uy * 4);
    ctx.stroke();

    if (Math.abs(c.current || 0) > 0.01) {
      const speed = 80;
      const phase = ((t * speed) % len) / len;
      const segLen = Math.min(40, len / 3);
      const start = phase * (len + segLen) - segLen;
      const s = Math.max(0, start);
      const e = Math.min(len, start + segLen);
      if (e > s) {
        const sx = x1 + ux * s;
        const sy = y1 + uy * s;
        const ex = x1 + ux * e;
        const ey = y1 + uy * e;
        ctx.strokeStyle = "rgba(250, 204, 21, 0.9)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
    }

    [{ x: x1, y: y1 }, { x: x2, y: y2 }].forEach((p) => {
      ctx.fillStyle = "#f9fafb";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  function drawComponent(c, t) {
    if (c.type === "wire") {
      drawWire(c, t);
      return;
    }

    const cx = c.x + c.w / 2;
    const cy = c.y + c.h / 2;

    ctx.save();

    ctx.fillStyle = "rgba(15,23,42,0.96)";
    ctx.strokeStyle = "rgba(148,163,184,0.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    roundRectSafe(ctx, c.x, c.y, c.w, c.h, 12);
    ctx.fill();
    ctx.stroke();

    if (c.type === "lamp") {
      const r = Math.min(c.w * 0.28, 26);
      const bulbY = cy - 8;

      const base = c.brightness || 0;
      const flick = 0.6 + 0.4 * Math.abs(Math.sin(t * 2 * Math.PI * 2.2));
      const intensity = c.burned ? 0 : base * flick;

      const grad = ctx.createRadialGradient(
        cx,
        bulbY - 4,
        4,
        cx,
        bulbY,
        r + 16 + intensity * 10
      );
      grad.addColorStop(0, `rgba(254,252,232,${0.3 + 0.3 * intensity})`);
      grad.addColorStop(0.4, `rgba(250,204,21,${0.5 + 0.4 * intensity})`);
      grad.addColorStop(
        1,
        `rgba(30,64,175,${0.15 + 0.3 * intensity})`
      );
      if (!c.burned && intensity > 0) {
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, bulbY, r + 6 + intensity * 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = c.burned ? "#6b7280" : "#facc15";
      ctx.beginPath();
      ctx.ellipse(cx, bulbY, r, r * 1.25, 0, Math.PI, 0, true);
      ctx.fill();

      if (!c.burned) {
        ctx.fillStyle = "rgba(254, 252, 232, 0.7)";
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.4, bulbY - r * 0.2);
        ctx.quadraticCurveTo(
          cx - r * 0.2,
          bulbY - r * 0.9,
          cx,
          bulbY - r * 0.8
        );
        ctx.quadraticCurveTo(
          cx - r * 0.1,
          bulbY - r * 0.1,
          cx - r * 0.4,
          bulbY
        );
        ctx.fill();
      }

      const baseY = bulbY + r * 0.9;
      ctx.fillStyle = "#e5e7eb";
      ctx.beginPath();
      roundRectSafe(ctx, cx - r * 0.7, baseY, r * 1.4, 8, 3);
      ctx.fill();

      ctx.strokeStyle = "#cbd5f5";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.65, baseY + 3 + i * 4);
        ctx.lineTo(cx + r * 0.65, baseY + 3 + i * 4);
        ctx.stroke();
      }

      if (c.burned) {
        ctx.strokeStyle = "rgba(248,113,113,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.5, bulbY - r * 0.5);
        ctx.lineTo(cx + r * 0.5, bulbY + r * 0.5);
        ctx.moveTo(cx + r * 0.5, bulbY - r * 0.5);
        ctx.lineTo(cx - r * 0.5, bulbY + r * 0.5);
        ctx.stroke();
      }
    } else if (c.type === "battery") {
      const top = c.y + 10;
      const bottom = c.y + c.h - 10;
      const bodyH = bottom - top;

      const bodyGrad = ctx.createLinearGradient(cx, top, cx, bottom);
      bodyGrad.addColorStop(0, "#f97316");
      bodyGrad.addColorStop(0.55, "#ea580c");
      bodyGrad.addColorStop(0.56, "#020617");
      bodyGrad.addColorStop(1, "#020617");
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      roundRectSafe(ctx, c.x + 8, top, c.w - 16, bodyH, 8);
      ctx.fill();

      ctx.fillStyle = "#e5e7eb";
      ctx.beginPath();
      roundRectSafe(ctx, c.x + 18, top - 8, c.w - 36, 10, 4);
      ctx.fill();

      ctx.fillStyle = "#f9fafb";
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("+", cx, top + bodyH * 0.25);
      ctx.fillText("−", cx, top + bodyH * 0.75);

      ctx.fillStyle = "#fed7aa";
      ctx.font = "10px system-ui, sans-serif";
      ctx.fillText(`${sourceVoltage} V AC`, cx, bottom - 6);
    } else if (c.type === "switch") {
      ctx.fillStyle = "#e5e7eb";
      ctx.beginPath();
      roundRectSafe(ctx, c.x + 8, c.y + 8, c.w - 16, c.h - 16, 10);
      ctx.fill();

      const leverW = c.w * 0.28;
      const leverH = c.h * 0.55;
      const lx = cx - leverW / 2;
      const ly = cy - leverH / 2 + (c.closed ? 4 : -4);

      ctx.fillStyle = "#f9fafb";
      ctx.beginPath();
      roundRectSafe(ctx, lx, ly, leverW, leverH, 6);
      ctx.fill();
      ctx.strokeStyle = "#d1d5db";
      ctx.stroke();

      ctx.fillStyle = "rgba(148,163,184,0.35)";
      ctx.beginPath();
      roundRectSafe(ctx, lx + 2, ly + leverH - 6, leverW - 4, 6, 3);
      ctx.fill();

      ctx.fillStyle = c.closed ? "#16a34a" : "#f97316";
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(c.closed ? "ON" : "OFF", cx, c.y + c.h - 6);
    } else if (c.type === "resistor") {
      const y = cy;
      const x1 = c.x + 16;
      const x2 = c.x + c.w - 16;

      const heat = Math.min(1, Math.abs(c.current || 0) / 0.8);
      const col =
        heat > 0
          ? `rgba(248,113,113,${0.4 + 0.4 * heat})`
          : "rgba(251,146,60,0.9)";

      ctx.strokeStyle = col;
      ctx.lineWidth = 2.4;

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

      ctx.strokeStyle = "rgba(148,163,184,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 6, y - 10);
      ctx.lineTo(cx - 6, y + 10);
      ctx.moveTo(cx + 2, y - 10);
      ctx.lineTo(cx + 2, y + 10);
      ctx.stroke();
    }

    const ts = getComponentTerminals(c);
    ts.forEach((p) => {
      ctx.fillStyle = "#f9fafb";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  function drawAll(timestamp) {
    const t = timestamp / 1000;
    drawBoardBackground();
    components.forEach((c) => drawComponent(c, t));
  }

  function loop(timestamp) {
    solveCurrents();
    drawAll(timestamp);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
