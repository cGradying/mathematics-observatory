import gsap from 'gsap';
import { createObservatory } from './scene.js';
import { createScrollExperience } from './scroll.js';
import './styles.css';

const canvas = document.querySelector('.scene-canvas');
const preloader = document.querySelector('.scene-preloader');
const progress = preloader?.querySelector('.preloader-track span');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let sceneRig;
let scrollRig;
let destroyed = false;

function hidePreloader() {
  if (progress) progress.style.width = '100%';
  window.setTimeout(() => preloader?.classList.add('is-ready'), 160);
}

function teardown() {
  if (destroyed) return;
  destroyed = true;
  if (renderTicker) gsap.ticker.remove(renderTicker);
  scrollRig?.destroy();
  sceneRig?.destroy();
}

const renderTicker = (time) => sceneRig?.render(time, reducedMotion);

try {
  if (progress) progress.style.width = '32%';
  sceneRig = createObservatory(canvas);
  window.addEventListener('observatory:quality', (event) => {
    document.body.dataset.sceneQuality = event.detail.quality;
  });
  canvas?.addEventListener('webglcontextlost', () => {
    document.body.classList.add('webgl-unavailable');
    document.body.dataset.sceneQuality = 'fallback';
  }, { once: true });

  if (progress) progress.style.width = '68%';
  await sceneRig.prepare();
  gsap.ticker.add(renderTicker);
  scrollRig = createScrollExperience(sceneRig, { reducedMotion });
  document.body.classList.add('scene-ready');
  hidePreloader();
} catch (error) {
  console.error('The observatory scene could not start; the history remains available in reading mode.', error);
  document.body.classList.add('webgl-unavailable', 'scene-ready');
  document.body.dataset.sceneQuality = 'fallback';
  hidePreloader();
}

window.addEventListener('pagehide', teardown, { once: true });
