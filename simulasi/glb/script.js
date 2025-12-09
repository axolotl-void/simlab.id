// =========================
// Simulasi GLB & GLBB
// =========================

const objEl = document.getElementById("glb-object");
const infoT = document.getElementById("info-t");
const infoX = document.getElementById("info-x");
const infoV = document.getElementById("info-v");

const modeEl = document.getElementById("mode");
const v0Slider = document.getElementById("v0");
const aSlider = document.getElementById("a");
const tmaxSlider = document.getElementById("tmax");

const v0Label = document.getElementById("v0-label");
const aLabel = document.getElementById("a-label");
const tmaxLabel = document.getElementById("tmax-label");

const btnPlay = document.getElementById("btn-play");
const btnPause = document.getElementById("btn-pause");
const btnReset = document.getElementById("btn-reset");

// parameter lintasan (meter -> pixel)
const trackEl = document.querySelector(".glb-track");
let trackWidthPx = 0;
let startXpx = 0;
let endXpx = 0;
const trackLengthM = 20; // 0 - 20 meter

function updateTrackMetrics() {
  const rect = trackEl.getBoundingClientRect();
  startXpx = 24; // padding kiri (lihat CSS .glb-track::before)
  endXpx = rect.width - 24; // padding kanan
  trackWidthPx = endXpx - startXpx;
}

window.addEventListener("resize", updateTrackMetrics);
updateTrackMetrics();

// state simulasi
let running = false;
let t = 0;
let lastTime = null;

// ambil nilai dari kontrol
function getParams() {
  const mode = modeEl.value;
  const v0 = parseFloat(v0Slider.value);
  let a = parseFloat(aSlider.value);
  if (mode === "glb") {
    a = 0; // GLB percepatan nol
  }
  const tmax = parseFloat(tmaxSlider.value);
  return { mode, v0, a, tmax };
}

// update label slider
function updateLabels() {
  v0Label.textContent = parseFloat(v0Slider.value).toFixed(1);
  aLabel.textContent = parseFloat(aSlider.value).toFixed(1);
  tmaxLabel.textContent = tmaxSlider.value;
}
updateLabels();

v0Slider.addEventListener("input", updateLabels);
aSlider.addEventListener("input", updateLabels);
tmaxSlider.addEventListener("input", updateLabels);
modeEl.addEventListener("change", () => {
  // cuma info, tidak wajib
});

// reset posisi & info
function resetSim() {
  running = false;
  t = 0;
  lastTime = null;
  updateObjectPosition(0);
  updateInfo(0, 0, getParams().v0);
}

function updateObjectPosition(xMeters) {
  const ratio = xMeters / trackLengthM; // 0..1
  let xPx = startXpx + ratio * trackWidthPx;
  if (xPx < startXpx) xPx = startXpx;
  if (xPx > endXpx) xPx = endXpx;

  objEl.style.left = `${xPx}px`;
}

function updateInfo(tSec, xMeters, v) {
  infoT.textContent = tSec.toFixed(2);
  infoX.textContent = xMeters.toFixed(2);
  infoV.textContent = v.toFixed(2);
}

function step(timestamp) {
  if (!running) return;

  if (lastTime == null) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000; // ke detik
  lastTime = timestamp;

  const { v0, a, tmax } = getParams();

  // update waktu
  t += dt;
  if (t > tmax) {
    t = tmax;
    running = false;
  }

  // rumus gerak lurus
  const x = 0 + v0 * t + 0.5 * a * t * t;
  const v = v0 + a * t;

  updateObjectPosition(x);
  updateInfo(t, x, v);

  // kalau benda keluar dari lintasan, stop
  if (x < 0 || x > trackLengthM) {
    running = false;
  }

  if (running) {
    requestAnimationFrame(step);
  }
}

// tombol kontrol
btnPlay.addEventListener("click", () => {
  if (!running) {
    running = true;
    lastTime = null;
    requestAnimationFrame(step);
  }
});

btnPause.addEventListener("click", () => {
  running = false;
});

btnReset.addEventListener("click", () => {
  resetSim();
});

// mulai dari kondisi awal
resetSim();
