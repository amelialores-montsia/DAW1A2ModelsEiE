// Marca que hi ha JavaScript (activa les animacions d'entrada del CSS)
document.documentElement.classList.add("js");

// ---- Mode clar / fosc (recorda l'elecció) ----
const arrel = document.documentElement;

try {
  const desat = localStorage.getItem("tema");
  if (desat === "dark" || desat === "light") {
    arrel.setAttribute("data-theme", desat);
  }
} catch (e) {
  // Sense localStorage: no passa res, s'usa el tema del sistema
}

// ---- Sons: generats pel navegador (Web Audio), sense fitxers ----
let soActiu = false;
try {
  soActiu = localStorage.getItem("so") === "on";
} catch (e) {
  // Per defecte, desactivat
}

let contextAudio = null;

// Cada so: [freqüència inicial, freqüència final, durada en segons]
const SONS = {
  obre:  [520, 780, 0.12],
  tanca: [620, 420, 0.12],
  tema:  [440, 660, 0.16],
  activa: [600, 900, 0.14],
};

function reprodueixSo(nom) {
  if (!soActiu || !SONS[nom]) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  if (!contextAudio) contextAudio = new AudioCtx();
  if (contextAudio.state === "suspended") contextAudio.resume();

  const [inici, final, durada] = SONS[nom];
  const t = contextAudio.currentTime;
  const oscil = contextAudio.createOscillator();
  const volum = contextAudio.createGain();

  oscil.type = "sine";
  oscil.frequency.setValueAtTime(inici, t);
  oscil.frequency.exponentialRampToValueAtTime(final, t + durada);

  // Volum baix, amb entrada i sortida suaus perquè no faci "clic" ni molesti
  volum.gain.setValueAtTime(0.0001, t);
  volum.gain.exponentialRampToValueAtTime(0.1, t + 0.01);
  volum.gain.exponentialRampToValueAtTime(0.0001, t + durada);

  oscil.connect(volum);
  volum.connect(contextAudio.destination);
  oscil.start(t);
  oscil.stop(t + durada + 0.02);
}

document.addEventListener("DOMContentLoaded", () => {
  // ---- Botó de mode clar / fosc ----
  const boto = document.getElementById("tema");
  if (boto) {
    boto.addEventListener("click", () => {
      const fosc =
        arrel.getAttribute("data-theme") === "dark" ||
        (!arrel.getAttribute("data-theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      const nou = fosc ? "light" : "dark";
      arrel.setAttribute("data-theme", nou);
      try { localStorage.setItem("tema", nou); } catch (e) { /* res */ }
      reprodueixSo("tema");
    });
  }

  // ---- Botó d'activar / silenciar els sons ----
  const botoSo = document.getElementById("so");
  if (botoSo) {
    botoSo.setAttribute("aria-pressed", String(soActiu));
    botoSo.addEventListener("click", () => {
      soActiu = !soActiu;
      botoSo.setAttribute("aria-pressed", String(soActiu));
      try { localStorage.setItem("so", soActiu ? "on" : "off"); } catch (e) { /* res */ }
      reprodueixSo("activa");
    });
  }

  // ---- Targetes desplegables: clic per fixar o tancar ----
  document.querySelectorAll(".desplegable .obre").forEach((botoTargeta) => {
    botoTargeta.addEventListener("click", () => {
      const targeta = botoTargeta.closest(".desplegable");
      const obert = botoTargeta.getAttribute("aria-expanded") === "true";
      botoTargeta.setAttribute("aria-expanded", String(!obert));
      targeta.classList.toggle("oberta", !obert);
      reprodueixSo(obert ? "tanca" : "obre");
    });
  });

  // ---- Les targetes apareixen en entrar a la pantalla ----
  const elements = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    elements.forEach((el) => el.classList.add("visible"));
    return;
  }
  const observador = new IntersectionObserver(
    (entrades) => {
      entrades.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visible");
          observador.unobserve(entrada.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  elements.forEach((el, i) => {
    el.style.transitionDelay = (i % 3) * 80 + "ms";
    observador.observe(el);
  });
});
