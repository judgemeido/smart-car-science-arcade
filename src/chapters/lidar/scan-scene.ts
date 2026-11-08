import * as THREE from 'three';

/** Procedural point cloud and scan effects, independent from chapter UI. */
export function createScanScene(scanGroup: THREE.Group) {
  const pointCount = 720;
  const pointsGeometry = new THREE.BufferGeometry();
  const pointPositions = new Float32Array(pointCount * 3);
  const pointColors = new Float32Array(pointCount * 3);
  const pointTemplate = new Float32Array(pointCount * 3);
  const pointSeed = (index: number) => {
    const x = Math.sin(index * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  for (let i = 0; i < pointCount; i += 1) {
    const seededA = pointSeed(i * 3 + 1);
    const seededB = pointSeed(i * 3 + 2);
    const seededC = pointSeed(i * 3 + 3);
    let x: number;
    let y: number;
    let z: number;
    if (i < 360) {
      // Two roadside surfaces: the points form rows and planes, not a random sphere.
      x = (i % 2 === 0 ? -1 : 1) * (0.36 + seededA * 0.2);
      y = -0.08 + seededB * 0.58;
      z = 0.12 + seededC * 0.85;
    } else if (i < 630) {
      // A broad target surface in front of the sensor.
      x = -0.36 + seededA * 0.72;
      y = -0.08 + seededB * 0.46;
      z = 0.91 + (seededC - 0.5) * 0.035;
    } else {
      // Road-edge returns sit low and run toward the target.
      x = (i % 2 === 0 ? -1 : 1) * (0.29 + seededA * 0.12);
      y = -0.19 + seededB * 0.025;
      z = 0.1 + seededC * 0.88;
    }
    pointTemplate[i * 3] = x;
    pointTemplate[i * 3 + 1] = y;
    pointTemplate[i * 3 + 2] = z;
    pointPositions[i * 3] = x;
    pointPositions[i * 3 + 1] = y;
    pointPositions[i * 3 + 2] = z;
    const color = new THREE.Color().setHSL(
      0.48 + pointSeed(i + 88) * 0.1,
      0.75,
      0.55 + pointSeed(i + 16) * 0.2,
    );
    pointColors[i * 3] = color.r;
    pointColors[i * 3 + 1] = color.g;
    pointColors[i * 3 + 2] = color.b;
  }
  pointsGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
  pointsGeometry.setAttribute('color', new THREE.BufferAttribute(pointColors, 3));
  const pointCloud = new THREE.Points(
    pointsGeometry,
    new THREE.PointsMaterial({
      size: 0.022,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.86,
    }),
  );
  pointCloud.name = 'CONCEPT_POINT_CLOUD';
  scanGroup.add(pointCloud);
  pointCloud.visible = false;

  const rayLines: THREE.Line[] = [];
  const rayMaterial = new THREE.LineBasicMaterial({ color: 0x4debd9, transparent: true, opacity: 0.42 });
  for (let i = 0; i < 22; i += 1) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.18, 0),
      new THREE.Vector3(1, 0.18, 0),
    ]);
    const ray = new THREE.Line(geometry, rayMaterial.clone());
    ray.rotation.y = (i / 22) * Math.PI * 2;
    scanGroup.add(ray);
    rayLines.push(ray);
  }
  const scanRing = new THREE.Mesh(
    new THREE.RingGeometry(0.965, 1, 96),
    new THREE.MeshBasicMaterial({
      color: 0x3fe0d1,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
    }),
  );
  scanRing.rotation.x = -Math.PI / 2;
  scanRing.position.y = 0.17;
  scanGroup.add(scanRing);
  const sweep = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.018, 0.022),
    new THREE.MeshBasicMaterial({ color: 0xc4fff5, transparent: true, opacity: 0.98 }),
  );
  sweep.position.y = 0.18;
  scanGroup.add(sweep);

  const targetGroup = new THREE.Group();
  targetGroup.name = 'SIMULATED_TARGET_ECHO';
  const targetMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffcb70, transparent: true, opacity: 0.96 }),
  );
  const targetFrame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 0.58, 0.48)),
    new THREE.LineBasicMaterial({ color: 0xffd48a, transparent: true, opacity: 0.78 }),
  );
  targetFrame.position.y = 0.18;
  targetGroup.add(targetFrame, targetMarker);
  scanGroup.add(targetGroup);
  const echoBeamGeometry = new THREE.BufferGeometry();
  const echoBeam = new THREE.Line(
    echoBeamGeometry,
    new THREE.LineBasicMaterial({ color: 0xffd48a, transparent: true, opacity: 0.84 }),
  );
  scanGroup.add(echoBeam);
  const scanPulse = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 12, 8),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x9affed,
      emissiveIntensity: 1.2,
      roughness: 0.24,
      metalness: 0.08,
    }),
  );
  scanGroup.add(scanPulse);

  rayMaterial.dispose();
  return {
    pointCount,
    pointsGeometry,
    pointTemplate,
    pointCloud,
    rayLines,
    scanRing,
    sweep,
    targetGroup,
    targetMarker,
    targetFrame,
    echoBeamGeometry,
    echoBeam,
    scanPulse,
  };
}
