// === SIMULASI TATA SURYA 2D – SimLab.id ===
// 8 planet, mode orbit/ekor, zoom, drag, satelit alami, asteroid bernama.

(function () {
  const canvas = document.getElementById("solarCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const speedSlider = document.getElementById("speedSlider");
  const orbitToggle = document.getElementById("trailToggle");
  const addPlanetBtn = document.getElementById("addPlanetBtn");
  const addAsteroidBtn = document.getElementById("addAsteroidBtn");
  const resetBtn = document.getElementById("resetBtn");
  const zoomSlider = document.getElementById("zoomSlider");

  // Panel info
  const infoName = document.getElementById("infoName");
  const infoDesc = document.getElementById("infoDesc");
  const infoType = document.getElementById("infoType");
  const infoDist = document.getElementById("infoDist");
  const infoPeriod = document.getElementById("infoPeriod");

  const tafText = document.getElementById("tafakkurText");
  const tafAyat = document.getElementById("tafakkurAyat");
  const tafRef = document.getElementById("tafakkurRef");

  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;

  // ====== DATA DASAR 8 PLANET ======
  const basePlanets = [
    {
      name: "Merkurius",
      type: "Planet",
      color: "#f5c07a",
      orbitAU: 0.6,
      radius: 10,           // bigger
      period: 0.24,
      desc: "Planet terdekat dari Matahari dengan permukaan berbatu yang panas.",
      quran: {
        ayat: "﴿ وَهُوَ الَّذِي جَعَلَ الشَّمْسَ ضِيَاءً وَالْقَمَرَ نُورًا ﴾",
        ref: "QS. Yunus [10]: 5",
        taf: "Perbedaan cahaya Matahari dan pantulan cahaya pada planet mengingatkan keteraturan ciptaan Allah."
      }
    },
    {
      name: "Venus",
      type: "Planet",
      color: "#f7e3a3",
      orbitAU: 0.9,
      radius: 13,           // bigger
      period: 0.62,
      desc: "Sering disebut bintang fajar/senja, dengan atmosfer yang sangat tebal.",
      quran: {
        ayat: "﴿ وَزَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ ﴾",
        ref: "QS. Al-Mulk [67]: 5",
        taf: "Cahaya benda-benda langit yang tampak dari Bumi adalah bagian dari hiasan langit yang Allah ciptakan."
      }
    },
    {
      name: "Bumi",
      type: "Planet",
      color: "#74c7ec",
      orbitAU: 1.2,
      radius: 15,          // bigger
      period: 1,
      desc: "Planet tempat kita hidup, satu-satunya yang diketahui memiliki kehidupan.",
      quran: {
        ayat: "﴿ الَّذِي جَعَلَ لَكُمُ الْأَرْضَ فِرَاشًا وَالسَّمَاءَ بِنَاءً ﴾",
        ref: "QS. Al-Baqarah [2]: 22",
        taf: "Bumi dijadikan tempat tinggal yang stabil, sementara langit di atasnya sebagai atap yang kokoh."
      }
    },
    {
      name: "Mars",
      type: "Planet",
      color: "#ff7b72",
      orbitAU: 1.6,
      radius: 13,          // bigger
      period: 1.88,
      desc: "Planet merah yang sering dikaitkan dengan eksplorasi masa depan manusia.",
      quran: {
        ayat: "﴿ أَفَلَا يَنْظُرُونَ إِلَى السَّمَاءِ فَوْقَهُمْ كَيْفَ بَنَيْنَاهَا ﴾",
        ref: "QS. ق [50]: 6",
        taf: "Seruan untuk terus meneliti dan memperhatikan ciptaan Allah di langit dan ruang angkasa."
      }
    },
    {
      name: "Jupiter",
      type: "Planet",
      color: "#f2c094",
      orbitAU: 2.3,
      radius: 22,          // bigger
      period: 11.9,
      desc: "Planet terbesar di tata surya, sering disebut sebagai perisai karena menarik banyak asteroid.",
      quran: {
        ayat: "﴿ لَخَلْقُ السَّمَاوَاتِ وَالْأَرْضِ أَكْبَرُ مِنْ خَلْقِ النَّاسِ ﴾",
        ref: "QS. Ghāfir [40]: 57",
        taf: "Kebesaran benda-benda langit mengingatkan manusia bahwa kekuasaan Allah jauh melampaui makhluk-Nya."
      }
    },
    {
      name: "Saturnus",
      type: "Planet",
      color: "#f9e3ae",
      orbitAU: 3.0,
      radius: 19,          // bigger
      period: 29.5,
      desc: "Dikenal dengan cincin yang indah mengelilinginya.",
      quran: {
        ayat: "﴿ تَبَارَكَ الَّذِي جَعَلَ فِي السَّمَاءِ بُرُوجًا وَجَعَلَ فِيهَا سِرَاجًا وَقَمَرًا مُنِيرًا ﴾",
        ref: "QS. Al-Furqān [25]: 61",
        taf: "Keindahan susunan bintang dan planet adalah bukti kebesaran dan kerapian ciptaan Allah."
      }
    },
    {
      name: "Uranus",
      type: "Planet",
      color: "#a5b4fc",
      orbitAU: 4.3,
      radius: 18,          // bigger
      period: 84,
      desc: "Planet raksasa es dengan kemiringan sumbu rotasi hampir 90°.",
      quran: {
        ayat: "﴿ وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ ﴾",
        ref: "QS. Al-Anbiyā’ [21]: 30",
        taf: "Kandungan es dan air di alam semesta mengingatkan bahwa sumber kehidupan pun Allah yang ciptakan."
      }
    },
    {
      name: "Neptunus",
      type: "Planet",
      color: "#60a5fa",
      orbitAU: 5.5,
      radius: 18,          // bigger
      period: 165,
      desc: "Planet terluar yang diketahui di tata surya, berwarna biru tua.",
      quran: {
        ayat: "﴿ مَا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ ﴾",
        ref: "QS. Al-Mulk [67]: 3",
        taf: "Jarak yang sangat jauh antar planet menunjukkan tidak ada cacat dalam ciptaan Allah."
      }
    }
  ];

  // ====== DATA SATELIT ALAMI (MOON) ======
  const moonDefs = [
    // Bumi
    { parent: "Bumi",   name: "Bulan",  radius: 7,  orbitFactor: 3.0, period: 0.32, color: "#e5e7eb" },

    // Mars
    { parent: "Mars",   name: "Phobos", radius: 4.5, orbitFactor: 2.3, period: 0.25, color: "#f97316" },
    { parent: "Mars",   name: "Deimos", radius: 4,   orbitFactor: 3.0, period: 0.3,  color: "#fed7aa" },

    // Jupiter (ambil 4 Galilean)
    { parent: "Jupiter", name: "Io",       radius: 5.5, orbitFactor: 2.4, period: 0.3, color: "#fed7aa" },
    { parent: "Jupiter", name: "Europa",   radius: 5,   orbitFactor: 3.0, period: 0.35, color: "#bfdbfe" },
    { parent: "Jupiter", name: "Ganymede", radius: 6,   orbitFactor: 3.7, period: 0.4,  color: "#e5e7eb" },
    { parent: "Jupiter", name: "Callisto", radius: 5.5, orbitFactor: 4.3, period: 0.45, color: "#9ca3af" },

    // Saturnus
    { parent: "Saturnus", name: "Titan",    radius: 6,   orbitFactor: 3.2, period: 0.5,  color: "#fde68a" },
    { parent: "Saturnus", name: "Enceladus",radius: 4.5, orbitFactor: 2.4, period: 0.45, color: "#e5e7eb" },
    { parent: "Saturnus", name: "Rhea",     radius: 4.8, orbitFactor: 3.8, period: 0.55, color: "#cbd5f5" },
    { parent: "Saturnus", name: "Iapetus",  radius: 4.8, orbitFactor: 4.5, period: 0.6,  color: "#9ca3af" },

    // Uranus (dua contoh)
    { parent: "Uranus",  name: "Titania", radius: 5, orbitFactor: 3.0, period: 0.6, color: "#e5e7eb" },
    { parent: "Uranus",  name: "Oberon",  radius: 5, orbitFactor: 3.6, period: 0.7, color: "#cbd5f5" },

    // Neptunus
    { parent: "Neptunus", name: "Triton", radius: 5.5, orbitFactor: 3.2, period: 0.7, color: "#bfdbfe" }
  ];

  // ====== DATA ASTEROID TERKENAL ======
  const asteroidCatalog = [
    { name: "Ceres",   radius: 7,  color: "#e5e7eb", period: 4.6 },
    { name: "Vesta",   radius: 6,  color: "#facc15", period: 3.6 },
    { name: "Pallas",  radius: 6,  color: "#f97316", period: 4.2 },
    { name: "Hygiea",  radius: 5.5,color: "#9ca3af", period: 5.0 },
    { name: "Apophis", radius: 5,  color: "#f97316", period: 0.9 },
    { name: "Bennu",   radius: 5,  color: "#fbbf24", period: 1.2 },
    { name: "Psyche",  radius: 6.5,color: "#a3a3a3", period: 4.9 },
    { name: "Ryugu",   radius: 5,  color: "#4b5563", period: 1.5 }
  ];
  let nextAsteroidIndex = 0;

  const defaultQuran = {
    ayat:
      "﴿ إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ وَاخْتِلَافِ اللَّيْلِ وَالنَّهَارِ لَآيَاتٍ لِأُولِي الْأَلْبَابِ ﴾",
    ref: "QS. Ali ‘Imrān [3]: 190",
    taf:
      "Perbedaan siang dan malam serta gerak benda langit adalah tanda-tanda bagi orang yang mau berpikir."
  };

  // skala jarak
  const maxOrbitAU = 5.6;
  const orbitScale = (Math.min(W, H) * 0.42) / maxOrbitAU;

  const baseAngularSpeed = 0.6;

  let objects = [];
  let explosions = [];
  let lastTime = 0;
  let speedFactor = 1;
  let zoomFactor = 1;
  let showOrbitLines = true;
  let showTails = false;

  let selected = null;
  let dragging = null;
  let dragOffset = { x: 0, y: 0 };
  let lastClickPos = null;

  // ====== BACKGROUND STARS ======
  const stars = [];
  function initStars() {
    const count = 260;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.5 + Math.random() * 1.6,
        baseAlpha: 0.25 + Math.random() * 0.45,
        twinkleSpeed: 0.4 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function makeId() {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  }

  // ====== OBJECT FACTORY ======
  function createObjectFromBase(base) {
    return {
      id: makeId(),
      name: base.name,
      type: base.type,
      color: base.color,
      orbitAU: base.orbitAU,
      baseRadius: base.radius,
      radius: base.radius,
      period: base.period,
      angle: Math.random() * Math.PI * 2,
      quran: base.quran || defaultQuran,
      custom: false,
      isMoon: false,
      parentId: null
    };
  }

  function createMoon(def, parentObj) {
    const orbitPx = parentObj.baseRadius * def.orbitFactor;
    return {
      id: makeId(),
      name: def.name,
      type: "Satelit Alami",
      color: def.color,
      orbitAU: parentObj.orbitAU, // info saja
      baseRadius: def.radius,
      radius: def.radius,
      period: def.period,
      angle: Math.random() * Math.PI * 2,
      quran: parentObj.quran || defaultQuran,
      custom: false,
      isMoon: true,
      parentId: parentObj.id,
      orbitPx
    };
  }

  function createCustomObject(kind, x, y, def) {
    const dx = x - cx;
    const dy = y - cy;
    const distPx = Math.sqrt(dx * dx + dy * dy);
    const orbitAU = Math.max(0.4, (distPx / orbitScale) / zoomFactor);

    const isPlanet = kind === "planet";

    const name = def?.name || (isPlanet ? "Planet Baru" : "Asteroid");
    const color = def?.color || (isPlanet ? "#7dd3fc" : "#f97316");
    const radius = def?.radius || (isPlanet ? 11 : 7);
    const period = def?.period || (isPlanet
      ? 1 + Math.random() * 4
      : 3 + Math.random() * 10);

    return {
      id: makeId(),
      name,
      type: isPlanet ? "Planet" : "Asteroid",
      color,
      orbitAU,
      baseRadius: radius,
      radius,
      period,
      angle: Math.atan2(dy, dx),
      quran: defaultQuran,
      custom: !def,
      isMoon: false,
      parentId: null
    };
  }

  function resetSystem() {
    objects = basePlanets.map(createObjectFromBase);

    // ====== TAMBAHKAN MOON (DINONAKTIFKAN) ======
    // const byName = new Map(objects.map(o => [o.name, o]));
    // moonDefs.forEach(def => {
    //   const parent = byName.get(def.parent);
    //   if (!parent) return;
    //   const moon = createMoon(def, parent);
    //   objects.push(moon);
    // });

    explosions = [];
    selected = null;
    updateInfoPanel(null);
  }

  // ====== DRAWING ======
  function drawBackground(timeMs) {
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, W, H);

    const t = timeMs / 1000;
    ctx.save();
    for (const s of stars) {
      const alphaRaw =
        s.baseAlpha + 0.25 * Math.sin(t * s.twinkleSpeed + s.phase);
      const alpha = Math.max(0, Math.min(alphaRaw, 1));
      ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSun() {
    const r = 34 * zoomFactor;
    const gradient = ctx.createRadialGradient(
      cx - r * 0.25,
      cy - r * 0.25,
      r * 0.1,
      cx,
      cy,
      r
    );
    gradient.addColorStop(0, "#fef9c3");
    gradient.addColorStop(0.4, "#fbbf24");
    gradient.addColorStop(1, "#f97316");

    ctx.save();
    ctx.shadowColor = "rgba(251, 191, 36, 0.9)";
    ctx.shadowBlur = 50;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawOrbits() {
    if (!showOrbitLines) return;

    ctx.save();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    ctx.lineWidth = 1;

    const uniqueOrbits = [...new Set(objects
      .filter(o => !o.isMoon) // orbit utama dari planet & asteroid
      .map((o) => o.orbitAU))].sort(
      (a, b) => a - b
    );

    uniqueOrbits.forEach((au) => {
      const radius = au * orbitScale * zoomFactor;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawTail(obj) {
    if (!showTails) return;
    if (obj.type === "Asteroid" || obj.isMoon) return;

    const centerX = cx;
    const centerY = cy;
    const orbitR = obj.orbitAU * orbitScale * zoomFactor;
    const segments = 10;
    const maxOffset = 0.4;

    ctx.save();
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const ang = obj.angle - t * maxOffset;
      const x = centerX + Math.cos(ang) * orbitR;
      const y = centerY + Math.sin(ang) * orbitR;
      const r = obj.baseRadius * zoomFactor * (0.65 * (1 - t * 0.7));

      ctx.globalAlpha = 0.18 * (1 - t) + 0.04;
      ctx.beginPath();
      ctx.fillStyle = obj.color;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  const rockyNames = new Set(["Merkurius", "Venus", "Bumi", "Mars"]);
  const gasNames = new Set(["Jupiter", "Saturnus"]);
  const iceNames = new Set(["Uranus", "Neptunus"]);

  function drawObjects(dt) {
    ctx.save();

    const byId = new Map(objects.map(o => [o.id, o]));

    objects.forEach((obj) => {
      // update sudut orbit
      const angVel =
        (baseAngularSpeed * speedFactor) / Math.max(obj.period, 0.1);
      obj.angle += angVel * dt;

      let centerX = cx;
      let centerY = cy;
      let orbitR;

      if (obj.isMoon && obj.parentId) {
        const parent = byId.get(obj.parentId);
        if (parent && typeof parent.screenX === "number") {
          centerX = parent.screenX;
          centerY = parent.screenY;
        }
        orbitR = (obj.orbitPx || parent.baseRadius * 3) * zoomFactor;
      } else {
        orbitR = obj.orbitAU * orbitScale * zoomFactor;
      }

      const x = centerX + Math.cos(obj.angle) * orbitR;
      const y = centerY + Math.sin(obj.angle) * orbitR;
      obj.screenX = x;
      obj.screenY = y;

      // mode ekor
      drawTail(obj);

      // gambar planet / asteroid / moon
      const r = obj.baseRadius * zoomFactor;
      const isAsteroid = obj.type === "Asteroid";
      const isMoon = obj.isMoon;

      if (!isAsteroid) {
        const g = ctx.createRadialGradient(
          x - r * 0.4,
          y - r * 0.4,
          r * 0.1,
          x,
          y,
          r
        );

        if (isMoon) {
          g.addColorStop(0, "#f9fafb");
          g.addColorStop(0.5, obj.color);
          g.addColorStop(1, "#9ca3af");
        } else if (rockyNames.has(obj.name)) {
          g.addColorStop(0, "#f9fafb");
          g.addColorStop(0.4, obj.color);
          g.addColorStop(1, "#4b5563");
        } else if (gasNames.has(obj.name)) {
          g.addColorStop(0, "#fff7ed");
          g.addColorStop(0.3, obj.color);
          g.addColorStop(1, "#b45309");
        } else if (iceNames.has(obj.name)) {
          g.addColorStop(0, "#e0f2fe");
          g.addColorStop(0.4, obj.color);
          g.addColorStop(1, "#1d4ed8");
        } else {
          g.addColorStop(0, "#f9fafb");
          g.addColorStop(0.5, obj.color);
          g.addColorStop(1, "#111827");
        }

        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = obj.color;
      }

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // detail Jupiter (garis-garis)
      if (obj.name === "Jupiter" && !isMoon) {
        ctx.save();
        ctx.strokeStyle = "rgba(148, 85, 40, 0.8)";
        ctx.lineWidth = 1.2 * zoomFactor;
        for (let k = -1; k <= 1; k++) {
          const yy = y + k * r * 0.4;
          ctx.beginPath();
          ctx.arc(x, yy, r * 0.9, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // cincin Saturnus
      if (obj.name === "Saturnus" && !isMoon) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(obj.angle);
        ctx.strokeStyle = "rgba(249, 250, 251, 0.8)";
        ctx.lineWidth = 2 * zoomFactor;
        const ringR = r * 1.9;
        ctx.beginPath();
        ctx.ellipse(0, 0, ringR, r * 1.1, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // highlight kalau terpilih
      if (selected && selected.id === obj.id) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // label nama (lebih besar)
      ctx.save();
      const labelOffset = r + 22;
      const lx = x + Math.cos(obj.angle) * labelOffset;
      const ly = y + Math.sin(obj.angle) * labelOffset;

      const fontSize = Math.max(14, obj.baseRadius * zoomFactor + 6);
      ctx.font =
        `${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(226, 232, 240, 0.95)";
      ctx.fillText(obj.name, lx, ly);
      ctx.restore();
    });

    ctx.restore();
  }

  function drawExplosions(dt) {
    explosions.forEach((exp) => {
      exp.age += dt;
    });
    explosions = explosions.filter((e) => e.age < e.life);

    explosions.forEach((exp) => {
      const t = exp.age / exp.life;
      const radius = exp.maxRadius * (0.8 + 0.4 * t);
      const alpha = 1 - t;

      const gradient = ctx.createRadialGradient(
        exp.x,
        exp.y,
        0,
        exp.x,
        exp.y,
        radius
      );
      gradient.addColorStop(0, `rgba(248, 250, 252, ${alpha})`);
      gradient.addColorStop(0.4, `rgba(251, 191, 36, ${alpha})`);
      gradient.addColorStop(1, `rgba(239, 68, 68, 0)`);

      ctx.save();
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ====== COLLISION ======
  function handleCollisions() {
    const toRemove = new Set();

    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const a = objects[i];
        const b = objects[j];

        const dx = a.screenX - b.screenX;
        const dy = a.screenY - b.screenY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist =
          a.baseRadius * zoomFactor + b.baseRadius * zoomFactor;

        if (dist < minDist * 0.9) {
          const smaller = a.baseRadius <= b.baseRadius ? a : b;
          const bigger = a.baseRadius > b.baseRadius ? a : b;

          toRemove.add(smaller.id);

          explosions.push({
            x: smaller.screenX,
            y: smaller.screenY,
            maxRadius: smaller.baseRadius * zoomFactor * 5,
            age: 0,
            life: 0.8
          });

          // efek "massa" – yang besar makin besar
          bigger.baseRadius *= 1.05;
        }
      }
    }

    if (toRemove.size > 0) {
      objects = objects.filter((o) => !toRemove.has(o.id));
      if (selected && toRemove.has(selected.id)) {
        selected = null;
        updateInfoPanel(null);
      }
    }
  }

  // ====== PANEL INFO ======
  function updateInfoPanel(obj) {
    if (!obj) {
      infoName.textContent = "Belum ada objek terpilih";
      infoDesc.textContent =
        "Klik salah satu planet, satelit alami, atau asteroid di kanvas untuk melihat detailnya.";
      infoType.textContent = "-";
      infoDist.textContent = "-";
      infoPeriod.textContent = "-";

      tafText.textContent =
        "Pilih planet untuk menampilkan ayat Al-Qur’an yang mengajak kita merenungkan keteraturan alam semesta.";
      tafAyat.textContent = defaultQuran.ayat;
      tafRef.textContent = defaultQuran.ref;
      return;
    }

    infoName.textContent = obj.name;
    infoDesc.textContent =
      obj.desc ||
      (obj.isMoon
        ? "Satelit alami yang mengorbit planet induknya."
        : obj.custom
        ? "Objek ini ditambahkan secara manual di simulasi."
        : "Benda langit di sistem Tata Surya.");

    infoType.textContent = obj.type || "-";
    infoDist.textContent = `${obj.orbitAU.toFixed(2)} AU (relatif)`;
    infoPeriod.textContent = `${obj.period.toFixed(2)} tahun Bumi (relatif)`;

    const q = obj.quran || defaultQuran;
    tafText.textContent = q.taf;
    tafAyat.textContent = q.ayat;
    tafRef.textContent = q.ref;
  }

  // ====== PICK & DRAG ======
  function pickObjectAt(x, y) {
    let nearest = null;
    let minDist = Infinity;

    objects.forEach((obj) => {
      const dx = x - obj.screenX;
      const dy = y - obj.screenY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < obj.baseRadius * zoomFactor + 6 && dist < minDist) {
        nearest = obj;
        minDist = dist;
      }
    });

    return nearest;
  }

  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;

    lastClickPos = { x, y };

    const obj = pickObjectAt(x, y);
    if (obj) {
      // hanya boleh drag planet & asteroid (bukan moon)
      if (!obj.isMoon) {
        dragging = obj;
        dragOffset.x = x - obj.screenX;
        dragOffset.y = y - obj.screenY;
      } else {
        dragging = null;
      }
      selected = obj;
      updateInfoPanel(obj);
    } else {
      dragging = null;
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;

    const px = x - dragOffset.x;
    const py = y - dragOffset.y;

    const dx = px - cx;
    const dy = py - cy;

    const distPx = Math.sqrt(dx * dx + dy * dy);
    dragging.orbitAU = Math.max(0.4, (distPx / orbitScale) / zoomFactor);
    dragging.angle = Math.atan2(dy, dx);
  });

  window.addEventListener("mouseup", () => {
    dragging = null;
  });

  // ====== TOMBOL TAMBAH / RESET ======
  if (addPlanetBtn) {
    addPlanetBtn.addEventListener("click", () => {
      if (!lastClickPos) return;
      const obj = createCustomObject("planet", lastClickPos.x, lastClickPos.y);
      objects.push(obj);
      selected = obj;
      updateInfoPanel(obj);
    });
  }

  if (addAsteroidBtn) {
    addAsteroidBtn.addEventListener("click", () => {
      if (!lastClickPos) return;
      const def = asteroidCatalog[nextAsteroidIndex % asteroidCatalog.length];
      nextAsteroidIndex++;
      const obj = createCustomObject("asteroid", lastClickPos.x, lastClickPos.y, def);
      objects.push(obj);
      selected = obj;
      updateInfoPanel(obj);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetSystem();
    });
  }

  // ====== SLIDER & TOGGLE ======
  if (speedSlider) {
    speedSlider.addEventListener("input", () => {
      const v = parseFloat(speedSlider.value);
      speedFactor = isNaN(v) ? 1 : v;
    });
  }

  if (zoomSlider) {
    zoomSlider.addEventListener("input", () => {
      const v = parseFloat(zoomSlider.value);
      zoomFactor = isNaN(v) ? 1 : v;
    });
  }

  if (orbitToggle) {
    orbitToggle.checked = true;
    showOrbitLines = true;
    showTails = false;

    orbitToggle.addEventListener("change", () => {
      showOrbitLines = orbitToggle.checked;
      showTails = !orbitToggle.checked;
    });
  }

  // ====== LOOP ANIMASI ======
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    drawBackground(timestamp);
    drawOrbits();
    drawSun();
    drawObjects(dt);
    handleCollisions();
    drawExplosions(dt);

    requestAnimationFrame(loop);
  }

  // ====== START ======
  initStars();
  resetSystem();
  updateInfoPanel(null);
  drawBackground(0);
  requestAnimationFrame(loop);
})();
