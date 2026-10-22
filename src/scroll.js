import * as THREE from 'three';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const lightPalettes = [
  { blue: '#70c9ed', amber: '#e8b864', tint: '#142532' },
  { blue: '#78b9d3', amber: '#dda85a', tint: '#302418' },
  { blue: '#87a9de', amber: '#e8bb72', tint: '#1a2634' },
  { blue: '#65bde5', amber: '#f0cf7e', tint: '#282022' },
  { blue: '#78c4e6', amber: '#dcb974', tint: '#132a35' },
  { blue: '#9aaddf', amber: '#dfb978', tint: '#211d31' },
  { blue: '#82d0dc', amber: '#f0cb7a', tint: '#142d31' },
  { blue: '#b1d8e7', amber: '#f1d18a', tint: '#23271f' },
];

const toRgb = (hex) => new THREE.Color(hex);

export function createScrollExperience(sceneRig, { reducedMotion = false } = {}) {
  const chapters = [...document.querySelectorAll('.story-chapter')];
  const progress = document.querySelector('.history-reading-progress');
  const progressFill = progress?.querySelector('span');
  const backdrop = document.querySelector('.scene-backdrop');
  const cursor = document.querySelector('.scene-cursor');
  const links = [...document.querySelectorAll('.history-jump a[href^="#"]')];
  let destroyed = false;
  let lenis;
  let master;
  let lenisTicker;
  let cursorX;
  let cursorY;

  if (!reducedMotion) {
    lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: false,
      anchors: true,
      wheelMultiplier: 0.9,
    });
    lenis.on('scroll', ScrollTrigger.update);
    lenisTicker = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(lenisTicker);
    gsap.ticker.lagSmoothing(0);

    const mobile = window.matchMedia('(max-width: 620px)').matches;
    const cameraState = { progress: 0 };
    const chapterCount = Math.max(chapters.length, 2);
    const initialCamera = sceneRig.setCameraProgress;

    // One master timeline maps each viewport-sized chapter to a point on the
    // Catmull-Rom flight. The curve lives in scene.js; only its normalized time is scrubbed here.
    master = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        id: 'history-story',
        trigger: '#story',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => updateReadingState(self.progress),
        onRefresh: (self) => updateReadingState(self.progress),
      },
    });

    master.to(cameraState, {
      progress: 1,
      duration: chapterCount,
      ease: 'none',
      onUpdate: () => initialCamera(cameraState.progress),
    }, 0);

    chapters.forEach((chapter, index) => {
      const beat = Math.min(index, lightPalettes.length - 1);
      const palette = lightPalettes[beat];
      const start = index;
      const blue = toRgb(palette.blue);
      const amber = toRgb(palette.amber);
      const isHero = chapter.classList.contains('story-hero');
      const splitLines = isHero ? chapter.querySelectorAll('.title-line > span') : [];
      const text = chapter.querySelectorAll(isHero
        ? '.hero-deck,.journey-link'
        : '.chapter-index,h1,h2,.chapter-deck,.era-note,.mind-note,.ideas-index article,.finale-links');

      master.to(sceneRig.blueLight.color, { r: blue.r, g: blue.g, b: blue.b, duration: 0.9, ease: 'power3.inOut' }, start);
      master.to(sceneRig.amberLight.color, { r: amber.r, g: amber.g, b: amber.b, duration: 0.9, ease: 'power3.inOut' }, start);
      master.to(sceneRig.fog.color, { r: blue.r * 0.12, g: blue.g * 0.15, b: blue.b * 0.18, duration: 0.9, ease: 'power3.inOut' }, start);
      if (backdrop) master.to(backdrop, { '--scene-tint': palette.tint, duration: 0.9, ease: 'power3.inOut' }, start);

      const fieldOfView = mobile ? [49, 43, 38, 44, 48, 44, 39, 53][beat] : [42, 35, 31, 43, 42, 39, 33, 48][beat];
      master.to(sceneRig.camera, { fov: fieldOfView, duration: 0.86, ease: 'power3.inOut', onUpdate: sceneRig.camera.updateProjectionMatrix.bind(sceneRig.camera) }, start);

      if (index > 0) {
        master.to(sceneRig.model.rotation, {
          y: index * 0.54 + (index % 2 ? 0.25 : -0.2),
          x: index % 2 ? 0.18 : -0.12,
          duration: 0.95,
          ease: 'power3.inOut',
        }, start);
      }

      // The fourth chapter fans the separate rings and satellites out, then draws
      // every component back into the armillary as the next scene comes into view.
      if (chapter.dataset.beat === 'expansion') {
        sceneRig.parts.forEach(({ mesh, separated, assembled }) => {
          master.to(mesh.position, { x: separated.x, y: separated.y, z: separated.z, duration: 0.44, ease: 'power3.out' }, start + 0.2);
          master.to(mesh.position, { x: assembled.x, y: assembled.y, z: assembled.z, duration: 0.56, ease: 'expo.inOut' }, start + 0.62);
        });
      }

      if (splitLines.length) {
        master.fromTo(splitLines,
          { autoAlpha: 0, yPercent: 110, filter: 'blur(5px)' },
          { autoAlpha: 1, yPercent: 0, filter: 'blur(0px)', duration: 0.76, ease: 'power3.out', stagger: 0.1, immediateRender: false },
          start + 0.08,
        );
      }
      if (text.length) {
        master.fromTo(text,
          { autoAlpha: 0, y: 26, filter: 'blur(5px)' },
          { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.68, ease: 'power3.out', stagger: 0.055, immediateRender: false },
          start + (isHero ? 0.25 : 0.12),
        );
      }
    });

    if (cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.body.classList.add('has-pointer');
      cursorX = gsap.quickTo(cursor, 'x', { duration: 0.42, ease: 'power3' });
      cursorY = gsap.quickTo(cursor, 'y', { duration: 0.42, ease: 'power3' });
      const onPointerMove = (event) => {
        cursorX(event.clientX);
        cursorY(event.clientY);
        sceneRig.setPointer((event.clientX / window.innerWidth - 0.5) * 2, (event.clientY / window.innerHeight - 0.5) * 2);
      };
      const onPointerOver = (event) => cursor.classList.toggle('is-hovering', Boolean(event.target.closest('a,button')));
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      document.addEventListener('pointerover', onPointerOver, { passive: true });
      cursor.cleanup = () => {
        window.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerover', onPointerOver);
        document.body.classList.remove('has-pointer');
      };
    }

    updateReadingState(ScrollTrigger.getById('history-story')?.progress ?? 0);
    ScrollTrigger.refresh();
  } else {
    sceneRig.setCameraProgress(0);
    chapters.forEach((chapter) => chapter.classList.add('is-current'));
    updateReadingState(0);
  }

  function updateReadingState(storyProgress) {
    const value = storyProgress == null ? null : Math.max(0, Math.min(1, storyProgress));
    let index;
    if (value == null || reducedMotion) {
      const readingLine = window.innerHeight * 0.38;
      index = 0;
      chapters.forEach((chapter, chapterIndex) => {
        if (chapter.getBoundingClientRect().top <= readingLine) index = chapterIndex;
      });
    } else {
      index = Math.min(chapters.length - 1, Math.floor(value * chapters.length));
    }
    chapters.forEach((chapter, chapterIndex) => chapter.classList.toggle('is-current', chapterIndex === index));

    const activeHash = index >= 6 ? '#discoveries' : index >= 4 ? '#mathematicians' : index >= 1 ? '#timeline' : '';
    links.forEach((link) => {
      if (link.hash === activeHash) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });

    if (progress && progressFill) {
      const pageRange = document.documentElement.scrollHeight - window.innerHeight;
      const pageProgress = pageRange > 0 ? Math.min(100, Math.max(0, window.scrollY / pageRange * 100)) : 0;
      progress.style.setProperty('--page-progress', `${pageProgress}%`);
      progress.setAttribute('aria-valuenow', String(Math.round(pageProgress)));
    }
  }

  if (progress) progress.hidden = false;
  const onNativeScroll = () => {
    if (reducedMotion) updateReadingState();
    else if (progress && progressFill) {
      const range = document.documentElement.scrollHeight - window.innerHeight;
      const value = range > 0 ? Math.min(100, Math.max(0, window.scrollY / range * 100)) : 0;
      progress.style.setProperty('--page-progress', `${value}%`);
      progress.setAttribute('aria-valuenow', String(Math.round(value)));
    }
  };
  window.addEventListener('scroll', onNativeScroll, { passive: true });
  window.addEventListener('resize', onNativeScroll, { passive: true });

  return {
    lenis,
    master,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (lenisTicker) gsap.ticker.remove(lenisTicker);
      cursor?.cleanup?.();
      window.removeEventListener('scroll', onNativeScroll);
      window.removeEventListener('resize', onNativeScroll);
      master?.scrollTrigger?.kill();
      master?.kill();
      lenis?.destroy();
      gsap.ticker.lagSmoothing(500, 33);
    },
  };
}
