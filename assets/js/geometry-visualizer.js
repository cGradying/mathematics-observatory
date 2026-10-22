import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createGeometryVisualizer(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0d0f14');
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(4, 4, 6);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor('#0d0f14');
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.replaceChildren(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
  directionalLight.position.set(5, 8, 5);
  scene.add(directionalLight);
  scene.add(new THREE.GridHelper(20, 20, 0x5a5364, 0x302b37));

  let mesh = null;
  let edgeLines = null;
  let animationFrame = 0;
  let disposed = false;

  function resize() {
    if (disposed) return;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function clearShape() {
    if (mesh) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh = null;
    }
    if (edgeLines) {
      scene.remove(edgeLines);
      edgeLines.geometry.dispose();
      edgeLines.material.dispose();
      edgeLines = null;
    }
  }

  function update({ shape, a, b, c, style, color, outline }) {
    if (disposed) return;
    clearShape();
    let geometry;
    if (shape === 'cube') geometry = new THREE.BoxGeometry(a, a, a);
    else if (shape === 'rectangle') geometry = new THREE.BoxGeometry(a, b, c);
    else if (shape === 'cylinder') geometry = new THREE.CylinderGeometry(a, a, b, 40);
    else if (shape === 'cone') geometry = new THREE.ConeGeometry(a, b, 40);
    else geometry = new THREE.SphereGeometry(a, 40, 24);

    // Ground solids on the grid plane (y = 0) instead of centering them on it.
    // Spheres rest at their lowest point; box/cylinder/cone solids rest on the base.
    const groundOffset = shape === 'sphere' ? a : (shape === 'cube' ? a : b) / 2;
    geometry.translate(0, groundOffset, 0);

    const materialOptions = { color: new THREE.Color(color), roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide };
    if (style === 'wireframe') materialOptions.wireframe = true;
    if (style === 'transparent') { materialOptions.transparent = true; materialOptions.opacity = 0.5; }
    mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial(materialOptions));
    scene.add(mesh);

    if (style === 'filled' || style === 'transparent') {
      edgeLines = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: new THREE.Color(outline) }),
      );
      scene.add(edgeLines);
    }
  }

  function animate() {
    if (disposed) return;
    animationFrame = window.requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(container);
  window.addEventListener('resize', resize);
  resize();
  animate();

  return {
    update,
    dispose() {
      if (disposed) return;
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      controls.dispose();
      clearShape();
      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
          else object.material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
