import { comparisons, eras, formulas, mathematicians } from "./history-data.js";
import katex from "katex";
import "katex/dist/katex.min.css";

const LEARN_TOPICS = new Set([
  "Euclid and geometry",
  "Pythagoras and mathematical relationships",
  "Archimedes and measurement",
  "The development of mathematical proof",
  "Al-Khwarizmi and algebra",
  "From arithmetic to symbolic mathematics",
  "The development of equations",
  "Important contributors to algebra",
  "Descartes and analytic geometry",
  "Probability and statistics",
  "Abstract algebra",
  "Modern geometry",
  "Mathematical logic",
  "Data science",
]);

const PORTRAITS = {
  Pythagoras: "Pythagoras.jpg",
  Euclid: "Euclid.webp",
  Archimedes: "Archimedes.jpg",
  Brahmagupta: "brahmagupta.jpg",
  "Al-Khwarizmi": "Al-Khwarizmi.webp",
  "René Descartes": "Rene.jpg",
  "Isaac Newton": "Isaac_newton.jpg",
  "Gottfried Wilhelm Leibniz": "Gottfried_Wilhelm_Leibniz.webp",
  "Leonhard Euler": "Leonhard_Euler.jpg",
  "Carl Friedrich Gauss": "Carl_Friedrich_Gauss.jpg",
  "Emmy Noether": "Emmy_Noether.jpg",
  "Alan Turing": "Alan_Turing_portrait.webp",
};

/* One archival accent per person; the portrait and text remain the focus. */
const PROFILE_ACCENTS = [
  "#b8963e", "#799bb1", "#759673", "#bf8652", "#9079ad", "#7c9caf",
  "#bc9150", "#8479a6", "#8f8d8a", "#73958b", "#b77e78", "#668d92",
];

const PROFILE_SUMMARIES = {
  Pythagoras: "A later tradition associated his school with mathematical relationships and number.",
  Euclid: "Compiled the influential geometric and arithmetic work Elements.",
  Archimedes: "Advanced geometry, measurement, and mathematical mechanics.",
  Brahmagupta: "Set out arithmetic rules involving zero and negative numbers.",
  "Al-Khwarizmi": "Systematized methods for solving linear and quadratic equations.",
  "René Descartes": "Connected algebraic equations and geometric curves.",
  "Isaac Newton": "Developed calculus methods and applied them to mechanics and astronomy.",
  "Gottfried Wilhelm Leibniz": "Developed calculus and notation that became widely adopted.",
  "Leonhard Euler": "Shaped analysis, mechanics, graph theory, and mathematical notation.",
  "Carl Friedrich Gauss": "Made major contributions to number theory, astronomy, statistics, and geometry.",
  "Emmy Noether": "Transformed abstract algebra and connected symmetry with conservation laws.",
  "Alan Turing": "Formalized a model of computation and contributed to codebreaking.",
};

const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const pad = (value) => String(value).padStart(2, "0");

function renderHero() {
  return `<section class="hero" id="top"><div class="hero-copy"><p class="eyebrow">The Mathematics Observatory presents</p><p class="hero-script">A Special Exploration</p><h1>History of Mathematics</h1><span class="hero-rule" aria-hidden="true"></span><p class="hero-intro">The History section of The Mathematics Observatory explores how mathematics developed from early counting systems into the modern mathematical ideas we use today.</p><a class="text-link" href="#contents">Enter the exhibition <span aria-hidden="true">↓</span></a></div><aside class="hero-index" aria-label="Page index"><p>Exhibition notes</p><div><span>On view</span><a href="#eras">${eras.length} historical galleries</a></div><div><span>Archive</span><a href="#people">${mathematicians.length} mathematical lives</a></div><div><span>Study</span><a href="#instruments">Three interactive rooms</a></div></aside></section>`;
}

function renderContents() {
  return `<section class="contents-section" id="contents"><div class="corner-ornament" aria-hidden="true"></div><div class="contents-heading"><p class="script-label">Exhibition guide</p><h2>Contents</h2><p>Eight rooms trace the changing language of number, proof, form, and calculation.</p></div><ol class="contents-list">${eras.map((era, index) => `<li><a href="#${esc(era.id)}"><span>${pad(index + 1)}</span>${esc(era.title)}</a></li>`).join("")}</ol></section>`;
}

function renderEra(era, index) {
  const dark = index === 2 || index === 5;
  return `<section class="era-section${dark ? " era-dark" : ""}" id="${esc(era.id)}"><div class="era-meta"><span>${pad(index + 1)}</span><p>${esc(era.period)}</p></div><div class="era-body"><p class="eyebrow">Gallery ${pad(index + 1)}</p><h2>${esc(era.title)}</h2><p class="era-intro">${esc(era.intro)}</p><div class="topic-grid">${era.topics.map((topic) => `<article class="topic-card"><h3>${esc(topic.title)}</h3><p>${esc(topic.text)}</p>${LEARN_TOPICS.has(topic.title) ? '<a class="learn-chip" href="learn.html">View in Learn <span aria-hidden="true">↗</span></a>' : ""}</article>`).join("")}</div></div></section>${index % 2 === 0 && era.fact ? `<aside class="fact-callout" aria-label="Did you know"><span class="fact-medallion">Did you know?</span><p>${esc(era.fact)}</p></aside>` : ""}`;
}

function renderPeople() {
  return `<section class="people-section" id="people"><div class="section-heading"><p class="script-label">The hands behind the work</p><h2>Mathematicians</h2><p>Twelve figures whose writing, teaching, and discoveries shaped the mathematical collection. Select a portrait to open its catalog note.</p></div><div class="profile-grid">${mathematicians.map((person) => `<button class="profile-card" type="button" aria-expanded="false"><span class="portrait-frame"><img src="assets/images/mathematicians/${esc(PORTRAITS[person.name] || "Euclid.webp")}" alt="" width="166" height="210" loading="lazy" decoding="async"></span><span class="profile-summary"><span class="profile-name">${esc(person.name)}</span><span class="profile-years">${esc(person.years)}</span><span class="profile-region">${esc(person.region)}</span><span class="profile-contribution">${esc(PROFILE_SUMMARIES[person.name] || person.contribution)}</span><span class="profile-action"><span>View catalog note</span><i aria-hidden="true">+</i></span></span><span class="profile-details"><span class="profile-explanation">${esc(person.contribution)}</span><span class="detail-label">What they worked on</span><span class="idea-list">${person.ideas.map((idea) => `<span>${esc(idea)}</span>`).join("")}</span><span class="profile-note">${esc(person.note)}</span></span></button>`).join("")}</div></section>`;
}

function wirePeopleProfiles() {
  const cards = [...document.querySelectorAll(".profile-card")];
  cards.forEach((card) => card.addEventListener("click", () => {
    const shouldExpand = card.getAttribute("aria-expanded") !== "true";
    cards.forEach((other) => {
      const expanded = other === card && shouldExpand;
      other.setAttribute("aria-expanded", String(expanded));
      other.classList.toggle("is-expanded", expanded);
    });
  }));
}

function renderInstruments() {
    return `<section class="instruments" id="instruments"><div class="section-heading"><p class="script-label">The study collection</p><h2>Ideas, translated.</h2><p>Change a reading, slide between two eras of notation, and compare historical phrasing with the language used now.</p></div><article class="instrument-panel"><div class="panel-heading"><span>01</span><div><p class="eyebrow">Number systems · live instrument</p><h3>One number, four scripts</h3></div></div><label class="number-field"><span>Enter a whole number from 1 to 9,999</span><input id="history-number" inputmode="numeric" min="1" max="9999" type="number" value="42" placeholder="Enter a number"></label><div class="number-grid" id="number-output" aria-live="polite"></div></article><article class="instrument-panel"><div class="panel-heading"><span>02</span><div><p class="eyebrow">Notation through time</p><h3>Before &amp; after</h3></div></div><div class="comparison-tabs" aria-label="Comparison example">${comparisons.map((item, index) => `<button type="button" class="${index === 0 ? "is-active" : ""}" data-comparison="${index}">${esc(item.label)}</button>`).join("")}</div><div class="comparison-stage"><div class="comparison-side old-side"><span id="old-label"></span><strong id="old-value"></strong></div><div class="comparison-side modern-side" id="modern-side"><span id="modern-label"></span><strong id="modern-value"></strong></div><svg class="comparison-line" id="comparison-line" aria-hidden="true" preserveAspectRatio="none"><path></path></svg><span class="comparison-rule" id="comparison-rule"></span><input id="comparison-slider" aria-label="Reveal earlier or modern notation" type="range" min="0" max="100" value="50"></div><p class="comparison-caption" id="comparison-caption" aria-live="polite"></p></article><article class="instrument-panel formula-panel"><div class="panel-heading"><span>03</span><div><p class="eyebrow">Translation table</p><h3>An idea, in two notations</h3></div></div><div class="formula-grid">${formulas.map((formula) => `<div class="formula-card"><p>${esc(formula.context)}</p><h4>${esc(formula.title)}</h4><blockquote>${esc(formula.original)}</blockquote><div><span>Modern notation</span><strong class="formula-math">${katex.renderToString(formula.latex, { throwOnError: false, strict: "ignore", output: "htmlAndMathml" })}</strong></div></div>`).join("")}</div></article></section>`;
}

function renderPage() {
  const main = document.querySelector("main");
  main.innerHTML = `${renderHero()}${renderContents()}<div id="eras">${eras.map(renderEra).join("")}</div>${renderPeople()}${renderInstruments()}<section class="stats-band" aria-label="Exhibition statistics"><p class="script-label">The collection in view</p><div><span><strong>${eras.length}</strong><small>Historical eras</small></span><span><strong>${mathematicians.length}</strong><small>Mathematicians</small></span><span><strong>3000+</strong><small>Years of ideas</small></span><span><strong>4</strong><small>Number systems</small></span></div></section>`;
}

const egyptianSymbols = ["𓏺", "𓎆", "𓍢", "𓆼", "𓂭", "𓆐", "𓁨"];
function toEgyptian(value) {
  return (
    String(value)
      .split("")
      .map((digit, position, digits) =>
        egyptianSymbols[digits.length - position - 1].repeat(Number(digit)),
      )
      .filter(Boolean)
      .join(" ") || "—"
  );
}
function toRoman(value) {
  const numerals = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let rest = value;
  return numerals
    .map(([amount, symbol]) => {
      let output = "";
      while (rest >= amount) {
        output += symbol;
        rest -= amount;
      }
      return output;
    })
    .join("");
}
function toBabylonian(value) {
  const places = [];
  let rest = value;
  do {
    places.unshift(rest % 60);
    rest = Math.floor(rest / 60);
  } while (rest);
  return places
    .map((place) =>
      place === 0
        ? "○"
        : `${"𒌋".repeat(Math.floor(place / 10))}${"𒁹".repeat(place % 10)}`,
    )
    .join("  ");
}
function updateNumerals() {
  const input = document.querySelector("#history-number");
  const value = Number(input.value);
  const valid = Number.isInteger(value) && value > 0 && value < 10000;
  input.setAttribute("aria-invalid", String(!valid));
  document.querySelector("#number-output").innerHTML = valid
    ? [
        ["Egyptian", toEgyptian(value), "Additive hieroglyphs"],
        ["Babylonian", toBabylonian(value), "Base 60 place values"],
        ["Roman", toRoman(value), "Subtractive Latin numerals"],
        [
          "Hindu–Arabic",
          value.toLocaleString("en-US"),
          "Positional decimal notation",
        ],
      ]
        .map(
          ([name, numeral, note]) =>
            `<div class="number-card"><span>${name}</span><strong>${numeral || "—"}</strong><small>${note}</small></div>`,
        )
        .join("")
    : '<div class="number-empty"><strong>Awaiting observation</strong><span>Enter a whole number from 1 to 9,999 to compare four systems.</span></div>';
}

function updateComparison(index) {
  const item = comparisons[index];
  document.querySelector("#old-label").textContent = item.oldLabel;
  document.querySelector("#old-value").textContent = item.old;
  document.querySelector("#modern-label").textContent = item.newLabel;
  const modernValue = document.querySelector("#modern-value");
  if (item.modern === "dy/dx") {
    modernValue.innerHTML = '<span class="leibniz-fraction" role="math" aria-label="d y over d x"><span>dy</span><span>dx</span></span>';
    modernValue.classList.add("leibniz-notation");
  } else {
    modernValue.textContent = item.modern;
    modernValue.classList.remove("leibniz-notation");
  }
  document.querySelector("#comparison-caption").textContent = item.caption;
  document
    .querySelectorAll("[data-comparison]")
    .forEach((button, buttonIndex) =>
      button.classList.toggle("is-active", buttonIndex === index),
    );
}

function wirePeopleCarousel() {
  const viewport = document.querySelector("#people-marquee-viewport");
  const track = viewport.querySelector(".people-marquee-track");
  const cards = [...track.querySelectorAll(".marquee-portrait-card")];
  const previous = document.querySelector("#people-previous");
  const next = document.querySelector("#people-next");
  const profilePanel = document.querySelector(".mathematician-feature");
  let pointer = null;
  let selectedIndex = mathematicians.length;
  let suppressClickUntil = 0;
  let normalizeCopiesTimer;

  const layoutCards = (dragOffset = 0) => {
    if (!cards.length) return;
    const cardWidth = cards[0].getBoundingClientRect().width;
    const step = Math.min(cardWidth * 0.74, viewport.clientWidth * 0.34);
    cards.forEach((card, cardIndex) => {
      const distance = cardIndex - selectedIndex;
      const depth = Math.abs(distance);
      card.style.setProperty("--card-offset", `${(distance * step).toFixed(1)}px`);
      card.style.setProperty("--card-scale", depth === 0 ? "1" : depth === 1 ? "0.78" : "0.56");
      card.style.setProperty("--card-opacity", depth === 0 ? "1" : depth === 1 ? "0.72" : depth === 2 ? "0.3" : "0");
      card.style.zIndex = String(20 - depth);
      card.style.visibility = depth <= 2 ? "visible" : "hidden";
      card.classList.toggle("is-selected", depth === 0);
      card.setAttribute("aria-pressed", String(depth === 0));
      card.setAttribute("aria-hidden", String(depth > 2));
      card.tabIndex = depth <= 2 ? 0 : -1;
    });
    track.style.setProperty("--drag-offset", `${dragOffset}px`);
  };

  const selectPerson = (index) => {
    selectedIndex = index;
    const personIndex = ((selectedIndex % mathematicians.length) + mathematicians.length) % mathematicians.length;
    const person = mathematicians[personIndex];
    profilePanel.style.setProperty("--historian-accent", PROFILE_ACCENTS[personIndex % PROFILE_ACCENTS.length]);
    document.querySelector("#profile-number").textContent = pad(personIndex + 1);
    document.querySelector("#profile-name").textContent = person.name;
    document.querySelector("#profile-years").textContent = person.years;
    document.querySelector("#profile-region").textContent = person.region;
    document.querySelector("#profile-contribution").textContent = person.contribution;
    document.querySelector("#profile-ideas").innerHTML = person.ideas.map((idea) => `<i>${esc(idea)}</i>`).join("");
    document.querySelector("#profile-note").textContent = person.note;
    layoutCards();
    window.clearTimeout(normalizeCopiesTimer);
    normalizeCopiesTimer = window.setTimeout(() => {
      const middleCopyIndex = mathematicians.length + personIndex;
      if (selectedIndex === middleCopyIndex) return;
      cards.forEach((card) => { card.style.transition = "none"; });
      track.style.transition = "none";
      selectedIndex = middleCopyIndex;
      layoutCards();
      requestAnimationFrame(() => {
        cards.forEach((card) => { card.style.transition = ""; });
        track.style.transition = "";
      });
    }, 480);
  };

  layoutCards();
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => layoutCards()).observe(viewport);
  } else {
    window.addEventListener("resize", () => layoutCards());
  }

  previous.addEventListener("click", () => selectPerson(selectedIndex - 1));
  next.addEventListener("click", () => selectPerson(selectedIndex + 1));
  cards.forEach((card) => card.addEventListener("click", () => {
    if (viewport.classList.contains("is-dragging")) return;
    selectPerson(Number(card.dataset.sequenceIndex));
  }));
  viewport.addEventListener("click", (event) => {
    if (performance.now() >= suppressClickUntil) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  viewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectPerson(selectedIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectPerson(selectedIndex + 1);
    }
  });

  /* Drag the entire portrait deck; the individual photos remain unselectable. */
  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    window.clearTimeout(normalizeCopiesTimer);
    pointer = { id: event.pointerId, x: event.clientX, dragged: false };
    cards.forEach((card) => { card.style.transition = "none"; });
    try { viewport.setPointerCapture(event.pointerId); } catch { /* scripted pointer */ }
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const deltaX = event.clientX - pointer.x;
    if (Math.abs(deltaX) > 8) {
      pointer.dragged = true;
      viewport.classList.add("is-dragging");
      event.preventDefault();
    }
    const dragLimit = viewport.clientWidth * 0.46;
    const resistedOffset = Math.max(-dragLimit, Math.min(dragLimit, deltaX));
    track.style.transition = "none";
    layoutCards(resistedOffset);
  });
  const finishDrag = (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const finalDistance = event.clientX - pointer.x;
    if (!pointer.dragged && Math.abs(finalDistance) > 8) pointer.dragged = true;
    const dragged = pointer.dragged;
    pointer = null;
    viewport.classList.remove("is-dragging");
    try { viewport.releasePointerCapture(event.pointerId); } catch { /* capture ended */ }
    cards.forEach((card) => { card.style.transition = ""; });
    track.style.transition = "transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1)";
    if (dragged) {
      suppressClickUntil = performance.now() + 350;
      const swipeThreshold = Math.max(28, viewport.clientWidth * 0.07);
      if (event.type === "pointerup" && Math.abs(finalDistance) >= swipeThreshold) {
        selectPerson(selectedIndex + (finalDistance < 0 ? 1 : -1));
      } else {
        layoutCards();
      }
    } else {
      layoutCards();
    }
    window.setTimeout(() => { track.style.transition = ""; }, 440);
  };
  viewport.addEventListener("pointerup", finishDrag);
  viewport.addEventListener("pointercancel", finishDrag);
  viewport.addEventListener("selectstart", (event) => event.preventDefault());
  viewport.addEventListener("dragstart", (event) => event.preventDefault());
}

function wirePage() {
  wirePeopleProfiles();
  document
    .querySelector("#history-number")
    .addEventListener("input", updateNumerals);
  updateNumerals();
  let activeComparison = 0;
  document.querySelectorAll("[data-comparison]").forEach((button) =>
    button.addEventListener("click", () => {
      activeComparison = Number(button.dataset.comparison);
      updateComparison(activeComparison);
    }),
  );
  const slider = document.querySelector("#comparison-slider");
  const stage = document.querySelector(".comparison-stage");
  const modernSide = document.querySelector("#modern-side");
  const rule = document.querySelector("#comparison-rule");
  const line = document.querySelector("#comparison-line");
  const linePath = line.querySelector("path");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let position = Number(slider.value) / 100;
  let bend = 0;
  let frame = 0;
  let previousTime = 0;
  let target = null;
  let drag = null;
  const ends = { x: position, velocity: 0 };

  /* Adapted from Bencho Image Compare (MIT): the handle tracks the finger
     directly while the wipe edge trails it on a damped spring. */
  const drawWipe = () => {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    const x = position * width;
    const top = x - bend;
    const control = x + bend;
    const middle = height / 2;
    const cut = `path("M ${top.toFixed(2)} 0 Q ${control.toFixed(2)} ${middle.toFixed(2)} ${top.toFixed(2)} ${height.toFixed(2)} L ${width.toFixed(2)} ${height.toFixed(2)} L ${width.toFixed(2)} 0 Z")`;
    modernSide.style.clipPath = cut;
    modernSide.style.webkitClipPath = cut;
    rule.style.left = `${x}px`;
    line.setAttribute("viewBox", `0 0 ${width} ${height}`);
    linePath.setAttribute("d", `M ${top.toFixed(2)} 0 Q ${control.toFixed(2)} ${middle.toFixed(2)} ${top.toFixed(2)} ${height.toFixed(2)}`);
    slider.setAttribute("aria-valuenow", String(Math.round(position * 100)));
  };

  /* The endpoint curve catches up with the center point and settles smoothly.
     The capped timestep keeps the spring stable across dropped animation frames. */
  const animateWipe = () => {
    if (frame) return;
    previousTime = performance.now();
    const step = (time) => {
      const dt = Math.min(0.033, (time - previousTime) / 1000);
      previousTime = time;
      if (target !== null) {
        position += (target - position) * (1 - Math.pow(0.0004, dt));
        if (Math.abs(target - position) < 0.0005) {
          position = target;
          target = null;
        }
        slider.value = String(Math.round(position * 100));
      }
      /* These spring and damping values give the edge a brief flex without
         letting it wobble for long after the slider stops. */
      const acceleration = (position - ends.x) * 620 - ends.velocity * 44;
      ends.velocity += acceleration * dt;
      ends.x += ends.velocity * dt;
      bend = Math.max(-9, Math.min(9, (position - ends.x) * stage.clientWidth * 0.5));
      drawWipe();

      const settled = target === null && Math.abs(position - ends.x) < 0.0006 && Math.abs(ends.velocity) < 0.002;
      if (settled) {
        ends.x = position;
        ends.velocity = 0;
        bend = 0;
        drawWipe();
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  };

  drawWipe();
  if ("ResizeObserver" in window) {
    new ResizeObserver(drawWipe).observe(stage);
  } else {
    window.addEventListener("resize", drawWipe);
  }
  slider.addEventListener("pointerdown", (event) => {
    const bounds = stage.getBoundingClientRect();
    const now = performance.now();
    const value = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    drag = { last: value, time: now, velocity: 0 };
  });
  slider.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const bounds = stage.getBoundingClientRect();
    const now = performance.now();
    const value = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    drag.velocity = (value - drag.last) / Math.max(1, now - drag.time) * 1000;
    drag.last = value;
    drag.time = now;
  });
  slider.addEventListener("pointerup", () => {
    const flick = drag?.velocity ?? 0;
    drag = null;
    if (!reducedMotion && Math.abs(flick) > 0.65) {
      target = flick > 0 ? 1 : 0;
      animateWipe();
    }
  });
  slider.addEventListener("pointercancel", () => { drag = null; });
  slider.addEventListener("input", () => {
    target = null;
    position = Number(slider.value) / 100;
    if (reducedMotion) {
      ends.x = position;
      ends.velocity = 0;
      bend = 0;
      drawWipe();
    } else {
      animateWipe();
    }
  });
  updateComparison(activeComparison);
}

renderPage();
wirePage();
