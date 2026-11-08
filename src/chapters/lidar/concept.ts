import * as THREE from 'three';
import { makeMaterial } from './model';

/** Functional teaching schematic, distinct from the licensed housing. */
export function createConceptParts(conceptGroup: THREE.Group) {
  let conceptRotor: THREE.Group | null = null;
  const channelEmitters: THREE.Mesh[] = [];
  const channelReceivers: THREE.Mesh[] = [];
  const conceptPartRoots = new Map<string, THREE.Object3D>();
  const conceptOffsetTargets = new Map<string, number>();
  const conceptBaseZ = new Map<string, number>();

  // The licensed housing stays exact. These functional cutaway parts are a
  // scale-matched teaching schematic in the source mesh's meter coordinates.
  // They are intentionally not presented as an official VLP-16 teardown.
  const mat = {
    board: makeMaterial(0x28665d, 0.48, 0.35),
    boardEdge: makeMaterial(0x153e39, 0.38, 0.62),
    copper: makeMaterial(0xb97845, 0.3, 0.78),
    dark: makeMaterial(0x263333, 0.28, 0.82),
    steel: makeMaterial(0x9eaaa4, 0.24, 0.84),
    cyan: new THREE.MeshStandardMaterial({
      color: 0x67f1dc,
      emissive: 0x20bba7,
      emissiveIntensity: 1.1,
      roughness: 0.2,
      metalness: 0.32,
    }),
    amber: new THREE.MeshStandardMaterial({
      color: 0xffc875,
      emissive: 0xb96b21,
      emissiveIntensity: 0.55,
      roughness: 0.2,
      metalness: 0.26,
    }),
    ceramic: makeMaterial(0xd8ddd5, 0.22, 0.15),
  };
  const tagPart = (root: THREE.Object3D, id: string) => {
    root.traverse((object) => {
      if (!object.userData.partId) object.userData.partId = id;
    });
  };
  const zCylinder = (
    radiusTop: number,
    radiusBottom: number,
    depth: number,
    material: THREE.Material,
    radialSegments = 40,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, depth, radialSegments),
      material,
    );
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  };
  const addPart = (id: string, group: THREE.Group) => {
    group.name = id;
    tagPart(group, id);
    conceptGroup.add(group);
    conceptPartRoots.set(id, group);
    conceptOffsetTargets.set(id, 0);
    conceptBaseZ.set(id, group.position.z);
    return group;
  };

  // Stationary rotating-head drive: bearing seats, stator and central shaft.
  const drive = addPart('lidar_motor', new THREE.Group());
  const stator = zCylinder(0.0155, 0.0175, 0.005, mat.dark, 48);
  stator.position.z = 0.03;
  drive.add(stator);
  [0.0265, 0.0415].forEach((z) => {
    const bearing = new THREE.Mesh(new THREE.TorusGeometry(0.017, 0.0018, 8, 48), mat.steel);
    bearing.position.z = z;
    drive.add(bearing);
    const bearingSeat = zCylinder(0.019, 0.019, 0.0012, mat.boardEdge, 48);
    bearingSeat.position.z = z;
    drive.add(bearingSeat);
  });
  const shaft = zCylinder(0.0022, 0.0022, 0.025, mat.steel, 20);
  shaft.position.z = 0.034;
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    const coil = new THREE.Mesh(new THREE.BoxGeometry(0.0032, 0.002, 0.0055), mat.copper);
    coil.position.set(Math.cos(angle) * 0.0135, Math.sin(angle) * 0.0135, 0.03);
    coil.rotation.z = angle;
    drive.add(coil);
  }

  // Rotor carries the vertically spaced channel pairs; each channel has a
  // distinct transmitter and receiver, rather than 16 emitters around a ring.
  conceptRotor = new THREE.Group();
  conceptRotor.name = 'ROTATING_OPTICAL_HEAD';
  conceptRotor.position.z = 0.034;
  conceptGroup.add(conceptRotor);
  // The shaft and rotor cup turn with the optical head; the stator and coils
  // above stay fixed to the base.
  const rotorCup = zCylinder(0.012, 0.014, 0.004, mat.steel, 48);
  rotorCup.position.z = -0.004;
  rotorCup.userData.partId = 'lidar_motor';
  conceptRotor.add(rotorCup, shaft);
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const magnet = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.0022, 0.003), mat.copper);
    magnet.position.set(Math.cos(angle) * 0.012, Math.sin(angle) * 0.012, -0.004);
    magnet.rotation.z = angle;
    magnet.userData.partId = 'lidar_motor';
    conceptRotor.add(magnet);
  }
  const optical = addPart('lidar_optical_array', new THREE.Group());
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.0035, 0.03), mat.dark);
  rail.position.set(0.041, 0, 0);
  optical.add(rail);
  const channelEmitterMaterial = mat.cyan.clone();
  const channelReceiverMaterial = mat.amber.clone();
  for (let index = 0; index < 16; index += 1) {
    const channelZ = THREE.MathUtils.lerp(-0.0142, 0.0142, index / 15);
    const emitter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.00125, 0.00125, 0.0011, 12),
      channelEmitterMaterial.clone(),
    );
    emitter.rotation.z = -Math.PI / 2;
    emitter.position.set(0.044, -0.00125, channelZ);
    emitter.userData.channel = index + 1;
    const receiver = new THREE.Mesh(
      new THREE.CylinderGeometry(0.00125, 0.00125, 0.0011, 12),
      channelReceiverMaterial.clone(),
    );
    receiver.rotation.z = -Math.PI / 2;
    receiver.position.set(0.044, 0.00125, channelZ);
    receiver.userData.channel = index + 1;
    optical.add(emitter, receiver);
    channelEmitters.push(emitter);
    channelReceivers.push(receiver);
  }
  tagPart(optical, 'lidar_optical_array');
  conceptRotor.add(optical);
  conceptPartRoots.set('lidar_optical_array', conceptRotor);
  conceptBaseZ.set('lidar_optical_array', 0.034);

  // The angle encoder disc turns with the rotor; its pickup is fixed to the base.
  const encoder = addPart('lidar_encoder', new THREE.Group());
  const encoderPickup = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.0045, 0.002), mat.cyan);
  encoderPickup.position.set(0.0127, 0, 0.02);
  encoder.add(encoderPickup);
  // Reparent the optical angle disc into the moving assembly, retaining the
  // fixed pickup on the base so the angle-feedback relationship is visible.
  const movingEncoder = new THREE.Group();
  movingEncoder.position.z = 0.034;
  const movingDisc = zCylinder(0.0105, 0.0105, 0.0007, mat.steel, 40);
  movingDisc.position.z = -0.013;
  movingEncoder.add(movingDisc);
  for (let index = 0; index < 24; index += 1) {
    const angle = (index / 24) * Math.PI * 2;
    const notch = new THREE.Mesh(new THREE.BoxGeometry(0.0012, 0.0007, 0.0008), mat.dark);
    notch.position.set(Math.cos(angle) * 0.0092, Math.sin(angle) * 0.0092, -0.0125);
    movingEncoder.add(notch);
  }
  tagPart(movingEncoder, 'lidar_encoder');
  encoder.add(encoderPickup);
  conceptRotor.add(movingEncoder);

  // Time-of-flight / signal board with visible chips and copper routing.
  const timing = addPart('lidar_tof_board', new THREE.Group());
  const pcb = zCylinder(0.029, 0.029, 0.0022, mat.board, 56);
  pcb.position.z = 0.018;
  timing.add(pcb);
  const pcbRim = new THREE.Mesh(new THREE.TorusGeometry(0.0275, 0.00065, 6, 64), mat.copper);
  pcbRim.position.z = 0.01925;
  timing.add(pcbRim);
  const chips: [number, number, number][] = [
    [0.012, 0.006, 0.02],
    [-0.011, 0.008, 0.02],
    [0.008, -0.014, 0.02],
    [-0.014, -0.009, 0.02],
  ];
  chips.forEach(([x, y, z], index) => {
    const chip = new THREE.Mesh(
      new THREE.BoxGeometry(index === 0 ? 0.008 : 0.006, index === 0 ? 0.007 : 0.005, 0.002),
      index === 0 ? mat.dark : mat.steel,
    );
    chip.position.set(x, y, z);
    timing.add(chip);
  });
  const tracePaths: [number, number, number][][] = [
    [
      [0.014, 0.006, 0.0195],
      [0.022, 0.006, 0.0195],
      [0.024, 0.012, 0.0195],
    ],
    [
      [-0.011, 0.008, 0.0195],
      [-0.022, 0.008, 0.0195],
      [-0.023, 0.014, 0.0195],
    ],
    [
      [0.008, -0.014, 0.0195],
      [0.018, -0.018, 0.0195],
      [0.021, -0.012, 0.0195],
    ],
    [
      [-0.014, -0.009, 0.0195],
      [-0.022, -0.015, 0.0195],
      [-0.021, -0.019, 0.0195],
    ],
  ];
  tracePaths.forEach((path) => {
    const curve = new THREE.CatmullRomCurve3(path.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    timing.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.00048, 5, false), mat.copper));
  });

  // Power/data connector and flexible harness between the base and timing board.
  const io = addPart('lidar_io', new THREE.Group());
  const connectorBody = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.008, 0.005), mat.dark);
  connectorBody.position.set(0.027, 0, 0.0105);
  io.add(connectorBody);
  for (let index = 0; index < 4; index += 1) {
    const pin = new THREE.Mesh(
      new THREE.BoxGeometry(0.0011, 0.0011, 0.0065),
      index < 2 ? mat.copper : mat.cyan,
    );
    pin.position.set(0.024 + index * 0.002, 0, 0.012);
    io.add(pin);
    const wire = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.024 + index * 0.002, 0, 0.015),
      new THREE.Vector3(0.018 + index * 0.001, 0.002, 0.017),
      new THREE.Vector3(0.014 + index * 0.001, 0.003, 0.0185),
    ]);
    io.add(
      new THREE.Mesh(new THREE.TubeGeometry(wire, 10, 0.00038, 5, false), index < 2 ? mat.copper : mat.cyan),
    );
  }

  return {
    conceptRotor,
    channelEmitters,
    channelReceivers,
    conceptPartRoots,
    conceptOffsetTargets,
    conceptBaseZ,
  };
}
