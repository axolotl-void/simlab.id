// simulasi/tata-surya/script.js
// =====================================================
// Tata Surya 2D sederhana untuk SimLab.id
// - Planet mengorbit Matahari
// - Bisa tambah planet / asteroid dengan klik kanvas
// - Drag & drop planet
// - Tabrakan: objek kecil meledak & hilang
// - Tombol reset mengembalikan kondisi awal
// =====================================================

const canvas = document.getElementById('solarCanvas');
const ctx = canvas.getContext('2d');

// Ukuran kanvas (boleh kamu sesuaikan di HTML/CSS juga)
canvas.width = 1400;
canvas.height = 650;

const W = canvas.width;
const H = canvas.height;
const CX = W / 2;
const CY = H / 2;

// ----------------- STATE UTAMA -----------------
const bodies = [];          // semua objek (sun + planet + asteroid)
let timeScale = 1;          // dikontrol slider
let showTrails = true;      // toggle jejak orbit
let lastTimestamp = 0;
let isPaused = false;

let addMode = null;         // 'planet' | 'asteroid' | null
let clickPosition = null;   // {x, y} untuk penambahan objek

let draggingBody = null;
let dragOffset = { x: 0, y: 0 };

const explosions = [];      // efek ledakan kecil

// ----------------- KONTROL UI -----------------
const speedRange   = document.getElementById('speedRange');
const trailToggle  = document.getElementById('trailToggle');
const addPlanetBtn = document.getElementById('addPlanetBtn');
const addAsteroidBtn = document.getElementById('addAsteroidBtn');
const resetBtn     = document.getElementById('resetBtn');

// elemen info (kalau ada di HTML–kalau nggak, ini aman aja)
const infoName     = document.getElementById('infoName');
const infoType     = document.getElementById('infoType');
const infoDistance = document.getElementById('infoDistance');
const infoPeriod   = document.getElementById('infoPeriod');
const tafsirAyat   = document.getElementById('tafkirAyat') || document.getElementById('tafakkurAyat');
const tafsirRef    = document.getElementById('tafkirRef') || document.getElementById('tafakkurRef');

let selectedBody = null;

// Gravitasi fiksi (biar gampang diatur)
const G = 0.0008;

// Matahari kita treat sebagai objek spesial
const SUN_MASS = 5000;

// ----------------- UTIL -----------------
function createBody({ name, type, mass, radius, distance, speed, color, angle }) {
  const a = angle ?? Math.random() * Math.PI * 2;
  const x = CX + distance * Math.cos(a);
  const y = CY + distance * Math.sin(a);

  // kecepatan awal tegak lurus radius (biar kira-kira orbit)
  const dirX = -(y - CY);
  const dirY = x - CX;
  const len  = Math.hypot(dirX, dirY) || 1;

  const vx = (dirX / len) * speed;
  const vy = (dirY / len) * speed;

  return { name, type, mass, radius, x, y, vx, vy, color, distance0: distance, exploded: false };
}

function resetSystem() {
  bodies.length = 0;
  explosions.length = 0;
  selectedBody = null;

  // SUN (sedikit dibesarkan)
  bodies.push({
    name: 'Matahari',
    type: 'sun',
    mass: SUN_MASS,
    radius: 32,        // 26 -> 32
    x: CX,
    y: CY,
    vx: 0,
    vy: 0,
    color: '#ffcf4a'
  });

  // Planet awal (jarak & speed fiksi) — radius dibesarkan sedikit
  const basePlanets = [
    {
      name: 'Merkurius',
      type: 'planet',
      mass: 10,
      radius: 9,       // 7 -> 9
      distance: 80,
      speed: 0.35,
      color: '#c0b39b'
    },
    {
      name: 'Venus',
      type: 'planet',
      mass: 15,
      radius: 11,      // 9 -> 11
      distance: 120,
      speed: 0.28,
      color: '#f5d6a2'
    },
    {
      name: 'Bumi',
      type: 'planet',
      mass: 18,
      radius: 12,      // 10 -> 12
      distance: 170,
      speed: 0.23,
      color: '#5bc0ff'
    },
    {
      name: 'Mars',
      type: 'planet',
      mass: 14,
      radius: 11,      // 9 -> 11
      distance: 220,
      speed: 0.20,
      color: '#ff8a5b'
    },
    {
      name: 'Jupiter',
      type: 'planet',
      mass: 60,
      radius: 20,      // 18 -> 20
      distance: 280,
      speed: 0.16,
      color: '#e3c6a1'
    }
  ];

  basePlanets.forEach(p => bodies.push(createBody(p)));
}

resetSystem();

// ----------------- FISIKA & SIM -----------------
function update(dt) {
  if (isPaused) return;

  // Konversi dt ms ke "unit waktu" simulasi
  const step = dt * 0.06 * timeScale;

  const sun = bodies[0];

  // hitung gaya gravitasi Matahari ke setiap objek (kecuali Matahari)
  for (let i = 1; i < bodies.length; i++) {
    const b = bodies[i];
    if (b.exploded) continue;

    const dx = sun.x - b.x;
    const dy = sun.y - b.y;
    const r2 = dx * dx + dy * dy;
    const r = Math.sqrt(r2) || 1;

    const force = (G * sun.mass * b.mass) / r2;
    const ax = (force / b.mass) * (dx / r);
    const ay = (force / b.mass) * (dy / r);

    b.vx += ax * step;
    b.vy += ay * step;

    b.x += b.vx * step;
    b.y += b.vy * step;
  }

  // deteksi tabrakan
  handleCollisions();

  // update ledakan
  for (const ex of explosions) {
    ex.radius += ex.growth * step;
    ex.life -= dt;
  }
  for (let i = explosions.length - 1; i >= 0; i--) {
    if (explosions[i].life <= 0) explosions.splice(i, 1);
  }
}

function handleCollisions() {
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i];
      const b = bodies[j];
      if (a.exploded || b.exploded) continue;

      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + b.radius) {
        // pilih yang lebih kecil buat "meledak"
        const victim = a.mass <= b.mass ? a : b;
        makeExplosion(victim.x, victim.y, victim.color);
        victim.exploded = true;
      }
    }
  }

  // hapus yang exploded
  for (let i = bodies.length - 1; i >= 0; i--) {
    if (bodies[i].exploded && bodies[i].type !== 'sun') {
      if (selectedBody === bodies[i]) selectedBody = null;
      bodies.splice(i, 1);
    }
  }
}

function makeExplosion(x, y, color) {
  explosions.push({
    x,
    y,
    radius: 5,
    growth: 0.3,
    life: 600,  // ms
    color
  });
}

// ----------------- DRAW -----------------
function clearCanvas() {
  // sedikit glow gelap
  ctx.fillStyle = '#050819';
  ctx.fillRect(0, 0, W, H);
}

function drawOrbits() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;

  // Orbit lingkaran samar (berdasar jarak awal planet)
  for (let i = 1; i < bodies.length; i++) {
    const b = bodies[i];
    if (!b.distance0) continue;
    ctx.beginPath();
    ctx.arc(CX, CY, b.distance0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBodies() {
  for (const b of bodies) {
    ctx.save();

    // highlight kalau selected
    if (b === selectedBody) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // body utama
    const grad = ctx.createRadialGradient(
      b.x - b.radius / 3, b.y - b.radius / 3, b.radius / 4,
      b.x, b.y, b.radius
    );
    if (b.type === 'sun') {
      grad.addColorStop(0, '#fffbe8');
      grad.addColorStop(1, '#ffb93a');
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, b.color || '#4aa3ff');
    }

    ctx.beginPath();
    ctx.fillStyle = grad;
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();

    // ---------- LABEL NAMA PLANET (DIBESARKAN) ----------
    if (b.name) {
      // ukuran font dinamis, tapi minimal 12px
      const fontSize = Math.max(12, b.radius + 3);
      ctx.font = `${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';

      const labelY = b.y - b.radius - 6; // di atas planet sedikit
      ctx.fillText(b.name, b.x, labelY);
    }
    // ----------------------------------------------------

    ctx.restore();
  }
}

function drawExplosions() {
  ctx.save();
  for (const ex of explosions) {
    const alpha = Math.max(ex.life / 600, 0);
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 200, 120, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
}

function render(timestamp) {
  const dt = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  update(dt);

  clearCanvas();
  if (showTrails) {
    // kalau mau jejak orbit, kita nggak clear full (tapi udah simple aja dulu)
  }
  drawOrbits();
  drawBodies();
  drawExplosions();

  requestAnimationFrame(render);
}

requestAnimationFrame(ts => {
  lastTimestamp = ts;
  requestAnimationFrame(render);
});

// ----------------- INPUT: KLIK, DRAG, TAMBAH -----------------
function getMousePos(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) * (canvas.width / rect.width),
    y: (evt.clientY - rect.top) * (canvas.height / rect.height)
  };
}

canvas.addEventListener('mousedown', (e) => {
  const pos = getMousePos(e);
  clickPosition = pos;

  // cek apakah klik di atas sebuah body
  const clicked = bodies.find(b => {
    const d = Math.hypot(pos.x - b.x, pos.y - b.y);
    return d <= b.radius + 3 && b.type !== 'sun';
  });

  if (clicked) {
    draggingBody = clicked;
    dragOffset.x = pos.x - clicked.x;
    dragOffset.y = pos.y - clicked.y;
    selectedBody = clicked;
    updateInfoPanel(clicked);
  } else if (addMode) {
    // mode tambah planet / asteroid
    addBodyAtClick(pos, addMode);
    addMode = null;
    updateAddButtonsUI();
  } else {
    // klik kosong -> clear selection
    selectedBody = null;
    updateInfoPanel(null);
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!draggingBody) return;
  const pos = getMousePos(e);
  draggingBody.x = pos.x - dragOffset.x;
  draggingBody.y = pos.y - dragOffset.y;
  // ketika di-drag, velocity di-nol-kan supaya orbit baru dimulai dari posisi itu
  draggingBody.vx = 0;
  draggingBody.vy = 0;
});

canvas.addEventListener('mouseup', () => {
  draggingBody = null;
});

canvas.addEventListener('mouseleave', () => {
  draggingBody = null;
});

// tambah objek baru
function addBodyAtClick(pos, mode) {
  const dx = pos.x - CX;
  const dy = pos.y - CY;
  const dist = Math.hypot(dx, dy);

  // kalau terlalu dekat dengan Matahari, geser dikit
  const safeDist = Math.max(dist, 60);

  const colorPlanet   = '#6ecbff';
  const colorAsteroid = '#c5c5c5';

  const params = {
    name: mode === 'planet' ? 'Planet Baru' : 'Asteroid',
    type: mode,
    mass: mode === 'planet' ? 15 : 5,
    radius: mode === 'planet' ? 11 : 5,   // 9 -> 11 biar lebih kelihatan
    distance: safeDist,
    // rumus speed kira-kira berbanding 1/sqrt(r)
    speed: (mode === 'planet' ? 0.25 : 0.3) * (170 / safeDist),
    color: mode === 'planet' ? colorPlanet : colorAsteroid,
    angle: Math.atan2(dy, dx)
  };

  const body = createBody(params);
  bodies.push(body);
}

// ----------------- PANEL INFO & TAFKKUR -----------------
const quranMap = {
  'Matahari': {
    ayat: 'وَجَعَلَ الشَّمْسَ سِرَاجًا',
    ref: 'QS. Nuh [71]: 16'
  },
  'Bumi': {
    ayat: 'الَّذِي جَعَلَ لَكُمُ الْأَرْضَ فِرَاشًا',
    ref: 'QS. Al-Baqarah [2]: 22'
  },
  'Merkurius': {
    ayat: 'وَكُلٌّ فِي فَلَكٍ يَسْبَحُونَ',
    ref: 'QS. Yasin [36]: 40'
  },
  'Venus': {
    ayat: 'وَهُوَ الَّذِي خَلَقَ اللَّيْلَ وَالنَّهَارَ وَالشَّمْسَ وَالْقَمَرَ',
    ref: 'QS. Al-Anbiya [21]: 33'
  },
  'Mars': {
    ayat: 'إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ ...',
    ref: 'QS. Ali \'Imran [3]: 190'
  }
};

function updateInfoPanel(body) {
  if (!infoName || !infoType) return; // kalau HTML belum ada panel, skip

  if (!body) {
    infoName.textContent = 'Belum ada objek terpilih';
    infoType.textContent = '-';
    infoDistance.textContent = '-';
    infoPeriod.textContent = '-';
    if (tafsirAyat && tafsirRef) {
      tafsirAyat.textContent = 'Pilih planet untuk melihat kutipan ayat.';
      tafsirRef.textContent = '';
    }
    return;
  }

  infoName.textContent = body.name;
  infoType.textContent = body.type === 'planet'
    ? 'Planet'
    : body.type === 'asteroid'
    ? 'Asteroid'
    : 'Bintang';

  // jarak relatif
  const dist = Math.hypot(body.x - CX, body.y - CY);
  infoDistance.textContent = dist.toFixed(0) + ' unit (relatif)';

  // periode orbit fiksi: fungsi jarak
  const period = (dist / 50) ** 1.5;
  infoPeriod.textContent = period.toFixed(1) + ' tahun (relatif Bumi)';

  if (tafsirAyat && tafsirRef) {
    const q = quranMap[body.name] || quranMap['Matahari'];
    tafsirAyat.textContent = q.ayat;
    tafsirRef.textContent = q.ref;
  }
}

// ----------------- EVENT LISTENER KONTROL -----------------
if (speedRange) {
  speedRange.min = 0.1;
  speedRange.max = 3;
  speedRange.step = 0.1;
  speedRange.value = 1;

  speedRange.addEventListener('input', (e) => {
    timeScale = parseFloat(e.target.value) || 1;
  });
}

if (trailToggle) {
  trailToggle.checked = true;
  trailToggle.addEventListener('change', (e) => {
    showTrails = e.target.checked;
    // kalau dimatikan, kita clear full tiap frame (sudah otomatis di clearCanvas)
  });
}

function updateAddButtonsUI() {
  if (!addPlanetBtn || !addAsteroidBtn) return;
  addPlanetBtn.classList.toggle('active', addMode === 'planet');
  addAsteroidBtn.classList.toggle('active', addMode === 'asteroid');
}

if (addPlanetBtn) {
  addPlanetBtn.addEventListener('click', () => {
    addMode = addMode === 'planet' ? null : 'planet';
    updateAddButtonsUI();
  });
}

if (addAsteroidBtn) {
  addAsteroidBtn.addEventListener('click', () => {
    addMode = addMode === 'asteroid' ? null : 'asteroid';
    updateAddButtonsUI();
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    resetSystem();
  });
}
