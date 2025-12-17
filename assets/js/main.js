// main.js — SimLab.id (navbar + theme + active nav + indicator + home loader)

(() => {
  "use strict";

  // =========================
  // Helpers
  // =========================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // =========================
  // Core Init
  // =========================
  document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;

    // Elements
    const navToggle = $("#navToggle");
    const navLinks = $(".slb-nav-links");
    const navRight = $(".slb-nav-right");
    const themeToggle = $("#themeToggle");

    // Optional indicator pill/line
    const indicator = $(".nav-indicator");

    // =========================
    // 1) PAGE LOAD FADE
    // =========================
    body.classList.add("page-loaded");

    // =========================
    // 2) NAVBAR MOBILE TOGGLE
    // =========================
    if (navToggle && navLinks) {
      navToggle.addEventListener("click", () => {
        navLinks.classList.toggle("nav-open");
        if (navRight) navRight.classList.toggle("nav-open");
      });

      // Close menu when clicking a link (mobile)
      $$("a", navLinks).forEach((link) => {
        link.addEventListener("click", () => {
          navLinks.classList.remove("nav-open");
          if (navRight) navRight.classList.remove("nav-open");
        });
      });
    }

    // =========================
    // 3) THEME TOGGLE (DARK/LIGHT)
    // =========================
    const THEME_KEY = "simlab-theme";

    function applyTheme(theme) {
      // Kalau body bukan simlab-body, skip (biar ga ngeganggu halaman lain)
      if (!body.classList.contains("simlab-body")) return;

      const safeTheme = theme === "light" ? "light" : "dark";
      body.dataset.theme = safeTheme;

      if (themeToggle) {
        themeToggle.textContent = safeTheme === "light" ? "☀️" : "🌙";
      }

      try {
        localStorage.setItem(THEME_KEY, safeTheme);
      } catch (e) {}
    }

    // Load saved theme
    let savedTheme = null;
    try {
      savedTheme = localStorage.getItem(THEME_KEY);
    } catch (e) {}

    if (savedTheme === "light" || savedTheme === "dark") {
      applyTheme(savedTheme);
    } else {
      applyTheme("dark");
    }

    // Toggle theme on click
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const current = body.dataset.theme === "light" ? "light" : "dark";
        applyTheme(current === "light" ? "dark" : "light");
      });
    }

    // =========================
    // 4) ACTIVE NAV (AUTO pindah "active")
    // =========================
    function setActiveNav() {
      if (!navLinks) return;

      const links = $$("a", navLinks);
      if (!links.length) return;

      // Reset
      links.forEach((a) => a.classList.remove("active"));

      const path = (location.pathname || "").toLowerCase();
      const hash = (location.hash || "").toLowerCase();

      // Default
      let key = "beranda";

      // Halaman spesifik
      if (path.endsWith("/about.html")) key = "tentang";
      else if (path.endsWith("/sains-quran.html")) key = "quran";
      else if (path.includes("/simulasi/")) key = "simulasi";

      // Hash di index.html
      if (hash === "#tema") key = "simulasi";
      if (hash === "#guru") key = "guru";

      // Apply active
      const target = $(`.slb-nav-links a[data-nav="${key}"]`);
      if (target) target.classList.add("active");

      // Sync indicator
      if (indicator && target) moveIndicator(target);
    }

    // =========================
    // 5) NAV INDICATOR (opsional)
    // =========================
    function moveIndicator(el) {
      if (!indicator || !navLinks || !el) return;

      const rect = el.getBoundingClientRect();
      const parentRect = navLinks.getBoundingClientRect();

      // Pastikan indicator tampil
      indicator.style.width = rect.width + "px";
      indicator.style.left = rect.left - parentRect.left + "px";
    }

    // Init active nav
    setActiveNav();

    // Re-apply on hash change (klik #tema / #guru)
    window.addEventListener("hashchange", () => {
      setActiveNav();
    });

    // Reposition indicator on resize
    window.addEventListener("resize", () => {
      const active = $(".slb-nav-links a.active");
      if (active) moveIndicator(active);
    });

    // Hover movement (kalau indicator ada)
    if (navLinks && indicator) {
      const links = $$("a", navLinks);

      // Move to active on start
      const active = $(".slb-nav-links a.active");
      if (active) moveIndicator(active);

      links.forEach((link) => {
        link.addEventListener("mouseenter", () => moveIndicator(link));
        link.addEventListener("focus", () => moveIndicator(link));
      });

      // Balikin ke active saat mouse keluar nav
      navLinks.addEventListener("mouseleave", () => {
        const act = $(".slb-nav-links a.active");
        if (act) moveIndicator(act);
      });
    }

    // =========================
    // 6) HOME LOADER (index.html only)
    // =========================
    const loader = $("#slbLoader");
    if (loader) {
      const KEY = "simlab-home-loader-shown";
      try {
        if (sessionStorage.getItem(KEY) === "1") {
          loader.remove();
        } else {
          const HIDE_AFTER = 3000; // 3 detik
          setTimeout(() => {
            loader.classList.add("is-hiding");
            setTimeout(() => loader.remove(), 500);
            try {
              sessionStorage.setItem(KEY, "1");
            } catch (e) {}
          }, HIDE_AFTER);
        }
      } catch (e) {
        // fallback: tetep hide setelah 3s
        setTimeout(() => {
          loader.classList.add("is-hiding");
          setTimeout(() => loader.remove(), 500);
        }, 3000);
      }
    }
  });
})();
