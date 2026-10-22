import * as THREE from 'three';

const colorHex = (hex) => new THREE.Color(hex);

export function createObservatory(canvas) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x080d13, 0.018);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  camera.position.set(0, 0.25, 10.8);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene.add(new THREE.HemisphereLight(0x9acbea, 0x18202a, 1.35));
  const keyLight = new THREE.DirectionalLight(0xffe0a8, 3.1);
  keyLight.position.set(-4.5, 7, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -8;
  keyLight.shadow.camera.right = 8;
  keyLight.shadow.camera.top = 8;
  keyLight.shadow.camera.bottom = -8;
  keyLight.shadow.bias = -0.00025;
  scene.add(keyLight);

  const blueLight = new THREE.PointLight(0x70c9ed, 34, 20, 1.8);
  blueLight.position.set(4, 1.5, -1.5);
  scene.add(blueLight);
  const amberLight = new THREE.PointLight(0xe8b864, 24, 18, 1.6);
  amberLight.position.set(-3.5, -1, 3.5);
  scene.add(amberLight);

  // Procedural armillary: a faceted center held inside three tilted mathematical rings.
  // Keeping every element as a separate mesh makes the later split/reassembly beat editable.
  const idleRig = new THREE.Group();
  const model = new THREE.Group();
  idleRig.add(model);
  scene.add(idleRig);
  const parts = [];
  const addPart = (mesh, position, splitDirection, amount = 2.4) => {
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    model.add(mesh);
    parts.push({
      mesh,
      assembled: position.clone(),
      separated: position.clone().add(splitDirection.clone().normalize().multiplyScalar(amount)),
    });
    return mesh;
  };

  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x8bcfe8,
    metalness: 0.62,
    roughness: 0.22,
    clearcoat: 0.84,
    clearcoatRoughness: 0.2,
  });
  addPart(
    new THREE.Mesh(new THREE.IcosahedronGeometry(0.92, 2), coreMaterial),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.15, 0.2, 1),
    1.35,
  );

  const goldMetal = new THREE.MeshStandardMaterial({ color: 0xd9b56d, metalness: 0.82, roughness: 0.3 });
  const coolMetal = new THREE.MeshStandardMaterial({ color: 0x7dbbd4, metalness: 0.75, roughness: 0.26 });
  const ringSpecs = [
    { radius: 1.58, tube: 0.032, tilt: [0.2, 0, 0.45], mat: goldMetal, direction: [1, 0.35, 0.2] },
    { radius: 1.88, tube: 0.021, tilt: [1.18, 0.35, 0], mat: coolMetal, direction: [-0.35, 0.3, 1] },
    { radius: 2.18, tube: 0.018, tilt: [0.48, 1.08, 0.55], mat: goldMetal, direction: [0.4, -1, -0.45] },
  ];
  ringSpecs.forEach(({ radius, tube, tilt, mat, direction }) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 180), mat);
    ring.rotation.set(...tilt);
    addPart(ring, new THREE.Vector3(), new THREE.Vector3(...direction), 2.1);
  });

  const beadMaterial = new THREE.MeshPhysicalMaterial({ color: 0xf0d595, metalness: 0.72, roughness: 0.23, clearcoat: 0.9 });
  const beadGeometry = new THREE.SphereGeometry(0.065, 18, 14);
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const position = new THREE.Vector3(Math.cos(angle) * 1.58, Math.sin(angle) * 1.58, 0);
    const bead = new THREE.Mesh(beadGeometry, beadMaterial);
    bead.scale.setScalar(index % 2 === 0 ? 1 : 0.72);
    addPart(bead, position, new THREE.Vector3(position.x, position.y * 0.8, index % 2 ? 1 : -1), 2.8);
  }

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.ShadowMaterial({ opacity: 0.28 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3.2;
  floor.receiveShadow = true;
  scene.add(floor);

  // A low-cost point cloud gives the camera a sense of distance without a texture download.
  const particleCount = 420;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleBaseY = new Float32Array(particleCount);
  const particlePhases = new Float32Array(particleCount);
  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    particlePositions[offset] = (Math.random() - 0.5) * 24;
    particlePositions[offset + 1] = (Math.random() - 0.5) * 16;
    particleBaseY[index] = particlePositions[offset + 1];
    particlePositions[offset + 2] = -9 - Math.random() * 35;
    particlePhases[index] = Math.random() * Math.PI * 2;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));
  const particleMaterial = new THREE.PointsMaterial({ color: 0xb6dced, size: 0.035, transparent: true, opacity: 0.58, sizeAttenuation: true, depthWrite: false });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  const cameraPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.2, 0.45, 11.4),
    new THREE.Vector3(3.4, 0.8, 9.2),
    new THREE.Vector3(-3.2, 2.2, 8.5),
    new THREE.Vector3(2.9, -2.1, 8.2),
    new THREE.Vector3(0.6, 1.5, 6.1),
    new THREE.Vector3(-2.5, -0.4, 8.8),
    new THREE.Vector3(2.4, 0.7, 8.2),
    new THREE.Vector3(-0.25, 0.2, 13.2),
  ], false, 'centripetal', 0.4);
  const targetPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.55, 0.05, 0),
    new THREE.Vector3(0.3, 0.45, 0),
    new THREE.Vector3(-0.2, -0.15, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.1, 0, 0),
    new THREE.Vector3(0, 0.12, 0),
    new THREE.Vector3(0, 0, 0),
  ], false, 'centripetal', 0.4);
  const desiredCameraPosition = new THREE.Vector3();
  const desiredLookAt = new THREE.Vector3();
  const currentParallax = new THREE.Vector2();
  const desiredParallax = new THREE.Vector2();
  const sample = (progress) => {
    const mobile = window.matchMedia('(max-width: 620px)').matches;
    const t = THREE.MathUtils.clamp(progress, 0, 1);
    cameraPath.getPointAt(t, desiredCameraPosition);
    targetPath.getPointAt(t, desiredLookAt);
    if (mobile) {
      desiredCameraPosition.x *= 0.66;
      desiredCameraPosition.y *= 0.78;
      desiredCameraPosition.z += 1.35;
      desiredLookAt.x *= 0.7;
    }
  };
  sample(0);
  camera.position.copy(desiredCameraPosition);
  camera.lookAt(desiredLookAt);

  let quality = 'high';
  let sampleFrames = 0;
  let sampleStart = 0;
  let totalFrames = 0;
  let totalStart = 0;
  let destroyed = false;
  const onResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    idleRig.position.x = width < 620 ? 2.6 : 1.25;
    idleRig.scale.setScalar(width < 620 ? 0.9 : 1);
    camera.aspect = width / Math.max(height, 1);
    camera.fov = width < 620 ? 50 : 42;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(quality === 'high' ? Math.min(window.devicePixelRatio || 1, 2) : 1);
  };
  onResize();
  window.addEventListener('resize', onResize, { passive: true });

  const lowerQuality = (fps) => {
    if (quality === 'low') return;
    quality = 'low';
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = false;
    particleGeometry.setDrawRange(0, 170);
    particleMaterial.size = 0.027;
    window.dispatchEvent(new CustomEvent('observatory:quality', { detail: { quality, fps: Math.round(fps) } }));
  };

  return {
    scene,
    camera,
    renderer,
    model,
    idleRig,
    parts,
    blueLight,
    amberLight,
    fog: scene.fog,
    baseBackground: colorHex('#0b141d'),
    get quality() { return quality; },
    setCameraProgress(progress) { sample(progress); },
    setPointer(x, y) { desiredParallax.set(x, y); },
    render(time = 0, reducedMotion = false) {
      if (destroyed) return;
      // The subtle idle is attached to a parent so the scrubbed model rotation stays deterministic.
      idleRig.rotation.y = reducedMotion ? 0 : Math.sin(time * 0.42) * 0.065;
      idleRig.rotation.x = reducedMotion ? 0 : Math.cos(time * 0.31) * 0.025;
      currentParallax.lerp(desiredParallax, reducedMotion ? 1 : 0.045);
      camera.position.copy(desiredCameraPosition);
      camera.position.x += currentParallax.x * 0.22;
      camera.position.y -= currentParallax.y * 0.14;
      const look = desiredLookAt.clone();
      look.x += currentParallax.x * 0.12;
      look.y -= currentParallax.y * 0.08;
      camera.lookAt(look);

      const positions = particleGeometry.attributes.position.array;
      const visibleParticles = quality === 'low' ? 170 : particleCount;
      for (let index = 0; index < visibleParticles; index += 1) {
        const offset = index * 3;
        positions[offset + 1] = particleBaseY[index] + (reducedMotion ? 0 : Math.sin(time * 0.24 + particlePhases[index]) * 0.12);
      }
      particleGeometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);

      totalFrames += 1;
      if (!totalStart) totalStart = time;
      if (time - totalStart >= 5) {
        const averageFps = totalFrames / (time - totalStart);
        if (averageFps < 48) lowerQuality(averageFps);
        totalStart = time;
        totalFrames = 0;
      }
      sampleFrames += 1;
      if (!sampleStart) sampleStart = time;
      if (time - sampleStart >= 2) {
        const recentFps = sampleFrames / (time - sampleStart);
        if (recentFps < 48) lowerQuality(recentFps);
        sampleStart = time;
        sampleFrames = 0;
      }
    },
    async prepare() {
      if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
      renderer.render(scene, camera);
    },
    destroy() {
      destroyed = true;
      window.removeEventListener('resize', onResize);
      scene.traverse((object) => {
        if (!object.isMesh && !object.isPoints) return;
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material?.dispose());
      });
      renderer.dispose();
    },
  };
}
