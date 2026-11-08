import * as THREE from 'three';
export const makeMaterial = (color: THREE.ColorRepresentation, roughness = 0.78, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

export const makeBox = (
  parent: THREE.Object3D,
  size: [number, number, number],
  material: THREE.Material,
  position: [number, number, number],
  bevel = 0,
) => {
  const geometry = new THREE.BoxGeometry(...size);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  if (bevel > 0) {
    // A small bevel-like edge highlight is built as a separate material sheen;
    // the compact road kit intentionally keeps the visible geometry inexpensive.
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }
  parent.add(mesh);
  return mesh;
};

export const makeCylinder = (
  parent: THREE.Object3D,
  topRadius: number,
  bottomRadius: number,
  height: number,
  material: THREE.Material,
  position: [number, number, number],
  radialSegments = 12,
) => {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(topRadius, bottomRadius, height, radialSegments),
    material,
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
};

export function makeFallbackCar(): THREE.Group {
  const car = new THREE.Group();
  const bodyMat = makeMaterial(0x111918, 0.28, 0.55);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x66827f,
    roughness: 0.18,
    metalness: 0.12,
    transparent: true,
    opacity: 0.73,
  });
  const tireMat = makeMaterial(0x15191a, 0.92);
  const rimMat = makeMaterial(0xb9c1be, 0.3, 0.75);
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xe9fff1 });
  makeBox(car, [1.84, 0.63, 3.72], bodyMat, [0, 0.63, 0]);
  makeBox(car, [1.5, 0.68, 1.8], glassMat, [0, 1.18, -0.1]);
  makeBox(car, [1.9, 0.24, 0.48], bodyMat, [0, 0.9, -1.61]);
  makeBox(car, [1.9, 0.22, 0.42], bodyMat, [0, 0.88, 1.56]);
  for (const x of [-0.91, 0.91])
    for (const z of [-1.2, 1.18]) {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.2, 20), tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(x, 0.42, z);
      car.add(tire);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.208, 16), rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.copy(tire.position);
      car.add(rim);
    }
  makeBox(car, [0.46, 0.13, 0.045], lampMat, [-0.52, 0.72, -1.89]);
  makeBox(car, [0.46, 0.13, 0.045], lampMat, [0.52, 0.72, -1.89]);
  return car;
}

export function createPedestrian(
  palette: { coat: number; pants: number; skin: number },
  position: [number, number, number],
): { root: THREE.Group; walk: (time: number, moving: boolean) => void } {
  const root = new THREE.Group();
  root.position.set(...position);
  const coat = makeMaterial(palette.coat, 0.8);
  const pants = makeMaterial(palette.pants, 0.86);
  const skin = makeMaterial(palette.skin, 0.84);
  const dark = makeMaterial(0x303334, 0.9);
  const trunk = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.45, 4, 8), coat);
  trunk.position.y = 0.88;
  root.add(trunk);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 10), skin);
  head.position.y = 1.42;
  root.add(head);
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.148, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52),
    dark,
  );
  hair.position.y = 1.47;
  root.add(hair);
  const armL = new THREE.Group();
  const armR = new THREE.Group();
  for (const [arm, x] of [
    [armL, -0.205],
    [armR, 0.205],
  ] as const) {
    arm.position.set(x, 1.08, 0);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.31, 3, 6), coat);
    upper.position.y = -0.2;
    arm.add(upper);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), skin);
    hand.position.y = -0.4;
    arm.add(hand);
    root.add(arm);
  }
  const legL = new THREE.Group();
  const legR = new THREE.Group();
  for (const [leg, x] of [
    [legL, -0.095],
    [legR, 0.095],
  ] as const) {
    leg.position.set(x, 0.67, 0);
    const shaft = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.34, 3, 7), pants);
    shaft.position.y = -0.22;
    leg.add(shaft);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.22), dark);
    shoe.position.set(0, -0.46, -0.035);
    leg.add(shoe);
    root.add(leg);
  }
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return {
    root,
    walk: (time, moving) => {
      const swing = moving ? Math.sin(time * 4.6) * 0.48 : Math.sin(time * 1.7) * 0.035;
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.62;
      armR.rotation.x = swing * 0.62;
    },
  };
}
