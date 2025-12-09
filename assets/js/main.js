document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.querySelector(".slb-nav-links");
  const navRight = document.querySelector(".slb-nav-right");
  const themeToggle = document.getElementById("themeToggle");

  // =========================
  // NAVBAR MOBILE TOGGLE
  // =========================
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("nav-open");
      if (navRight) {
        navRight.classList.toggle("nav-open");
      }
    });

    // tutup menu kalau salah satu link diklik (mobile)
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("nav-open");
        if (navRight) {
          navRight.classList.remove("nav-open");
        }
      });
    });
  }

  // =========================
  // THEME TOGGLE (DARK / LIGHT)
  // =========================

  const THEME_KEY = "simlab-theme";

  function applyTheme(theme) {
    if (!body.classList.contains("simlab-body")) return;

    const safeTheme = theme === "light" ? "light" : "dark";
    body.dataset.theme = safeTheme;

    if (themeToggle) {
      themeToggle.textContent = safeTheme === "light" ? "☀️" : "🌙";
    }

    try {
      localStorage.setItem(THEME_KEY, safeTheme);
    } catch (e) {
      // kalau localStorage diblok, skip aja
    }
  }

  // load tema dari localStorage
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem(THEME_KEY);
  } catch (e) {
    savedTheme = null;
  }

  if (savedTheme === "light" || savedTheme === "dark") {
    applyTheme(savedTheme);
  } else {
    applyTheme("dark"); // default
  }

  // klik tombol theme
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = body.dataset.theme === "light" ? "light" : "dark";
      const next = current === "light" ? "dark" : "light";
      applyTheme(next);
    });
  }
});
// =========================
// PAGE LOAD FADE
// =========================
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("page-loaded");
});
