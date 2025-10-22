/* ----------  local-storage helpers  ---------- */
const WRAP_KEY = "navidrome_wrapped";
function saveWrap(data) {
  try {
    localStorage.setItem(WRAP_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}
function loadWrap() {
  try {
    const raw = localStorage.getItem(WRAP_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    // expire after 90 days
    if (Date.now() - obj.ts > 90 * 24 * 60 * 60 * 1000) return null;
    return obj.data;
  } catch {
    return null;
  }
}

function daysSinceYYYYMMDD(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (![y, m, d].every(Number.isFinite)) return null;

  // midnight UTC for the given day
  const thenUTC = Date.UTC(y, m - 1, d);

  const now = new Date();
  // midnight UTC for *today* so we count full calendar days
  const todayUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  return Math.floor((todayUTC - thenUTC) / 24 / 60 / 60 / 1000);
}

/* --------------------
   Comic-style tooltip
----------------------- */
const TT_ID = "chart-comic-tooltip";

/* create on first use */
const getTip = () => {
  let el = document.getElementById(TT_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = TT_ID;
    el.innerHTML = `<span class="txt"></span><span class="tri"></span>`;
    el.className = "chart-comic-tooltip";
    document.body.appendChild(el);
  }
  return el;
};

/* hover logic */
document.addEventListener(
  "mouseover",
  (e) => {
    const seg = e.target.closest(".chart-segment");
    if (!seg) return;

    const tip = getTip();
    const txt = tip.querySelector(".txt");
    txt.textContent = `${seg.dataset.label}  |  ${seg.dataset.songs} songs  |  ${seg.dataset.plays} plays (${seg.dataset.pct})`;

    const r = seg.getBoundingClientRect();
    const tipW = tip.offsetWidth;
    const tipH = tip.offsetHeight;

    /* centre horizontally, place above bar */
    const left = r.left + r.width / 2 - tipW / 2;
    const top = r.top - tipH - 8;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
    tip.classList.add("show");
  },
  { passive: true }
);

/* mouse-leave segment */
document.addEventListener(
  "mouseout",
  (e) => {
    if (e.target.closest(".chart-segment")) {
      const tip = document.getElementById(TT_ID);
      if (tip) tip.classList.remove("show");
    }
  },
  { passive: true }
);

/* ----------  restore previous wrapped (if any)  ---------- */
var cached = loadWrap();
if (cached) {
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("resultsSection").style.display = "block";
    document.getElementById(
      "quickStats"
    ).innerHTML = `<p>Welcome back! your last wrapped is still here!</p>`;
  });
}
