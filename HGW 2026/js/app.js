// Gedeelde init voor elke pagina: topbar rendering, nav-highlighting,
// countdown, sync-mode badge.

import { WEEKEND } from "../config.js";
import { getMode } from "./data.js";

const PAGES = [
  { href: "index.html", label: "Home" },
  { href: "smoelenboek.html", label: "Smoelenboek" },
  { href: "programma.html", label: "Programma" },
  { href: "kamers.html", label: "Kamers" },
  { href: "kids.html", label: "Kids" },
  { href: "quiz.html", label: "Quiz" },
  { href: "quotes.html", label: "Quotes" },
  { href: "fotos.html", label: "Foto's" },
];

export function renderTopbar() {
  const el = document.querySelector(".topbar");
  if (!el) return;
  const current = location.pathname.split("/").pop() || "index.html";
  const links = PAGES.map(
    (p) =>
      `<a href="${p.href}"${p.href === current ? ' class="active"' : ""}>${p.label}</a>`
  ).join("");
  el.innerHTML = `
    <div class="brand"><a href="index.html">★ ${WEEKEND.name}</a></div>
    <nav>${links}</nav>
  `;
}

export function renderCountdown(targetEl) {
  if (!targetEl) return;
  const target = new Date(WEEKEND.startDate);
  const end = new Date(WEEKEND.endDate);

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function tick() {
    const now = new Date();
    let diff = target - now;
    let label = "tot de kick-off";
    let done = false;

    if (now >= target && now < end) {
      diff = end - now;
      label = "nog te gaan";
    } else if (now >= end) {
      done = true;
    }

    if (done) {
      targetEl.innerHTML = `<div class="empty">Het weekend zit erop. Tot de volgende editie! 🍻</div>`;
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    targetEl.innerHTML = `
      <div class="countdown-unit"><span class="num">${days}</span><span class="label">dagen</span></div>
      <div class="countdown-unit"><span class="num">${pad(hours)}</span><span class="label">uur</span></div>
      <div class="countdown-unit"><span class="num">${pad(minutes)}</span><span class="label">min</span></div>
      <div class="countdown-unit"><span class="num">${pad(seconds)}</span><span class="label">sec</span></div>
    `;
    const wrapper = targetEl.closest(".countdown-wrap");
    if (wrapper) {
      const cap = wrapper.querySelector(".countdown-caption");
      if (cap) cap.textContent = label;
    }
  }

  tick();
  setInterval(tick, 1000);
}

export function renderSyncBadge() {
  const el = document.querySelector("[data-sync-badge]");
  if (!el) return;
  // Wacht kort zodat data-layer init kan draaien
  setTimeout(() => {
    const mode = getMode();
    el.textContent = mode === "supabase" ? "Sync: aan" : "Lokaal";
    el.classList.add(mode === "supabase" ? "supabase" : "local");
  }, 250);
}

export function initPage() {
  renderTopbar();
  renderSyncBadge();
}
