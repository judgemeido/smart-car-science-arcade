import {
  makePbrMaterial,
  createProceduralCar,
  createRoad,
  createCityBackdrop,
  configureClone,
} from './scene';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

export type GameMode = 'manual' | 'autopilot' | 'crashed' | 'paused' | 'ready';

export interface TrafficGameController {
  start(): void;
  pause(): void;
  restart(): void;
  setAutopilot(enabled?: boolean): void;
  destroy(): void;
}

export interface TrafficGameOptions {
  modelUrl?: string;
  initialTraffic?: number;
  maxTraffic?: number;
}

type TrafficVehicle = {
  root: THREE.Group;
  lane: number;
  speed: number;
  passed: boolean;
  box: THREE.Box3;
};

const LANES = [-3.1, 0, 3.1];
const ROAD_WIDTH = 11.2;
const ROAD_LENGTH = 230;

const getEl = <T extends HTMLElement>(root: HTMLElement, selector: string) => root.querySelector<T>(selector);

function setText(root: HTMLElement, selector: string, value: string) {
  const node = getEl<HTMLElement>(root, selector);
  if (node) node.textContent = value;
}

function setVisible(root: HTMLElement, selector: string, visible: boolean) {
  const node = getEl<HTMLElement>(root, selector);
  if (!node) return;
  node.classList.toggle('is-visible', visible);
  node.setAttribute('aria-hidden', String(!visible));
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const wholeSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${wholeSeconds}`;
}

export function initTrafficGame(root: HTMLElement, options: TrafficGameOptions = {}): TrafficGameController {
  const canvas = getEl<HTMLCanvasElement>(root, '[data-game-canvas]') ?? root.querySelector('canvas');
  if (!canvas) throw new Error('Traffic game requires a canvas[data-game-canvas].');

  const scene = new THREE.Scene();
  // Daylight palette: blue sky, pale atmospheric haze, and a warm sun make
  // the moving city readable without changing any gameplay coordinates.
  scene.background = new THREE.Color(0xaed7e8);
  scene.fog = new THREE.Fog(0xaed7e8, 72, 240);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 300);
  // The player vehicle is the visual anchor of this chapter. Keep the chase
  // camera close enough that the imported GLB reads as a real car instead of
  // a tiny silhouette at the bottom of the road.
  camera.position.set(0, 4.55, 4.8);
  camera.lookAt(0, 0.9, -14.5);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const hemi = new THREE.HemisphereLight(0xe1f3ff, 0x6c7b82, 2.15);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff1d2, 4.2);
  key.position.set(-22, 32, 16);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -22;
  key.shadow.camera.right = 22;
  key.shadow.camera.top = 28;
  key.shadow.camera.bottom = -10;
  key.shadow.camera.far = 90;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xa9d9ff, 1.35);
  fill.position.set(14, 12, 8);
  scene.add(fill);

  const road = createRoad(scene);
  const city = createCityBackdrop(scene);
  const player = new THREE.Group();
  player.name = 'PlayerVehicle';
  // Keep the player car inside the camera's near field. The road is authored
  // along -Z and the camera is pitched toward the traffic stream; placing the
  // vehicle at z=4.7 put it below the lower edge of the frustum, making a
  // successfully loaded GLB look like it had not been imported.
  player.position.set(0, 0.05, -3.4);
  scene.add(player);
  const fallbackPlayer = createProceduralCar(0x080b0e, 1.02);
  player.add(fallbackPlayer);

  let modelLoaded = false;
  let disposed = false;
  const loader = new GLTFLoader();
  setText(root, '[data-game-status]', '曜境 S9 模型加载中…');
  loader.load(
    options.modelUrl ?? '/assets/yaojing-s9.glb',
    (gltf) => {
      if (disposed) return;
      const model = cloneSkeleton(gltf.scene);
      configureClone(model, 2.7);
      // The museum GLB is authored with the vehicle's nose along +X. The game
      // road runs toward -Z, so rotate the imported car into the driving axis
      // before it replaces the procedural placeholder.
      model.rotation.y = Math.PI / 2;
      model.visible = true;
      model.traverse((object) => {
        object.visible = true;
      });
      player.remove(fallbackPlayer);
      player.add(model);
      modelLoaded = true;
      setText(root, '[data-game-status]', '曜境 S9 已接入 / READY');
    },
    (event) => {
      const loaded = event.loaded || 0;
      const total = event.total || 0;
      if (total > 0)
        setText(root, '[data-game-status]', `曜境 S9 加载中 ${Math.round((loaded / total) * 100)}%`);
    },
    () => {
      setText(root, '[data-game-status]', '程序化车辆已就绪 / READY');
    },
  );

  const traffic: TrafficVehicle[] = [];
  const palette = [0x4d5b68, 0x8b3438, 0x9d865b, 0x3e6b6c, 0x7c7c83, 0x253c54];
  const maxTraffic = options.maxTraffic ?? 11;
  const initialTraffic = options.initialTraffic ?? 5;
  const clock = new THREE.Clock();
  let animationFrame = 0;
  let running = false;
  let paused = false;
  let mode: GameMode = 'ready';
  let autopilot = false;
  let playerTargetX = 0;
  let playerX = 0;
  let autopilotLane = 1;
  let gameTime = 0;
  let score = 0;
  let energy = 0;
  let dodged = 0;
  let spawnAccumulator = 0;
  let difficulty = 1;
  let invulnerable = 0;
  let lastTime = 0;

  const updateUi = () => {
    setText(root, '[data-game-score]', Math.floor(score).toLocaleString('en-US'));
    setText(root, '[data-game-time]', formatClock(gameTime));
    setText(root, '[data-game-energy]', `${Math.round(energy)}%`);
    const energyBar = getEl<HTMLElement>(root, '[data-game-energy-bar]');
    if (energyBar) {
      const energyPercent = Math.max(0, Math.min(100, energy));
      energyBar.style.setProperty('--energy', `${energyPercent}%`);
      energyBar.style.width = `${energyPercent}%`;
    }
    setText(
      root,
      '[data-game-mode]',
      autopilot
        ? '智驾模式 / AUTO'
        : mode === 'crashed'
          ? '碰撞 / RESET'
          : mode === 'paused'
            ? '暂停 / PAUSED'
            : '手动驾驶 / MANUAL',
    );
    const status = getEl<HTMLElement>(root, '[data-game-status]');
    if (status && mode !== 'ready' && mode !== 'crashed')
      status.textContent = autopilot ? '智驾模式已接管方向' : paused ? '游戏已暂停' : '道路运行中 / 保持车道';
    const statusCopy = getEl<HTMLElement>(root, '[data-game-status-copy]');
    if (statusCopy && mode !== 'ready' && mode !== 'crashed')
      statusCopy.textContent = autopilot
        ? '系统正在寻找更安全的车道，能量会持续消耗。'
        : '躲避来车以获得分数与能量，撞击会中断本轮旅程。';
    setVisible(root, '[data-game-start-screen]', mode === 'ready' && !running);
    setVisible(root, '[data-game-over]', mode === 'crashed');
    const message = getEl<HTMLElement>(root, '[data-game-message]');
    if (message) {
      message.classList.toggle('is-visible', mode === 'crashed' || autopilot || energy >= 100);
      if (mode === 'crashed') message.textContent = '发生碰撞，重新开始以再次出发';
      else if (autopilot) message.textContent = '智驾模式已接管';
      else if (energy >= 100) message.textContent = '能量充满：智驾模式可用';
    }
    const autopilotButton = getEl<HTMLButtonElement>(root, '[data-game-autopilot]');
    if (autopilotButton) {
      autopilotButton.disabled = !autopilot && energy < 100;
      autopilotButton.classList.toggle('is-active', autopilot);
      autopilotButton.setAttribute('aria-pressed', String(autopilot));
    }
  };

  const makeTraffic = (lane: number, z: number) => {
    const isTruck = Math.random() > 0.77;
    const vehicle = createProceduralCar(
      palette[Math.floor(Math.random() * palette.length)],
      isTruck ? 1.15 : 0.9,
    );
    vehicle.position.set(LANES[lane], 0, z);
    scene.add(vehicle);
    // Keep the traffic stream on one controlled speed. Small random speed
    // differences used to let separate waves catch up and form a three-wide
    // wall after several seconds, even when each wave started with a gap.
    const entry: TrafficVehicle = { root: vehicle, lane, speed: 8.2, passed: false, box: new THREE.Box3() };
    traffic.push(entry);
    return entry;
  };

  const clearTraffic = () => {
    traffic.splice(0).forEach((item) => scene.remove(item.root));
  };

  // Keep a readable escape lane around every incoming wave. A wave can fill
  // at most two of the three lanes, and a new car is never placed in a lane
  // that is already occupied at roughly the same depth. This prevents a
  // random spawn sequence from creating an impossible three-car wall.
  const SPAWN_WINDOW = 28;
  const WAVE_GAP = 52;
  const WAVE_JITTER = 12;
  const getNearbyTraffic = (z: number) =>
    traffic.filter((item) => Math.abs(item.root.position.z - z) < SPAWN_WINDOW);
  const getOpenLanes = (z: number) =>
    LANES.map((_, lane) => lane).filter(
      (lane) =>
        !traffic.some((item) => item.lane === lane && Math.abs(item.root.position.z - z) < SPAWN_WINDOW),
    );
  const COLLISION_HORIZON = 7.5;
  const getEta = (z: number) => {
    if (z >= player.position.z + 4) return Number.POSITIVE_INFINITY;
    const worldSpeed = 12.5 * difficulty;
    const closingSpeed = Math.max(0.7, worldSpeed - 8.2);
    return Math.max(0, player.position.z - z) / closingSpeed;
  };
  const preservesEscapeLane = (lane: number, z: number) => {
    const occupied = LANES.map((_, targetLane) =>
      traffic.some((item) => item.lane === targetLane && getEta(item.root.position.z) <= COLLISION_HORIZON),
    );
    if (getEta(z) <= COLLISION_HORIZON) occupied[lane] = true;
    return occupied.some((blocked) => !blocked);
  };

  const spawnTraffic = (count = 1) => {
    let remaining = count;
    let wave = 0;
    let attempts = 0;
    while (remaining > 0 && attempts < count * 8) {
      // Separate waves longitudinally so their guaranteed gap remains
      // visible as traffic approaches the player. The old 28m step overlapped
      // with the random range and allowed a third car to fill the last lane.
      const z = -58 - Math.random() * WAVE_JITTER - wave * WAVE_GAP;
      const nearbyTraffic = getNearbyTraffic(z);
      // A traffic group may contain one or two cars only. If two cars already
      // occupy this depth band, reject the candidate instead of filling the
      // remaining lane and creating an unavoidable three-car wall.
      if (nearbyTraffic.length >= LANES.length - 1) {
        wave += 1;
        attempts += 1;
        continue;
      }
      const openLanes = getOpenLanes(z);
      if (openLanes.length === 0) {
        wave += 1;
        attempts += 1;
        continue;
      }

      // Reserve at least one lane in this wave. Shuffle the available lanes
      // so the safe lane changes naturally between waves.
      openLanes.sort(() => Math.random() - 0.5);
      const waveCount = Math.min(remaining, LANES.length - 1 - nearbyTraffic.length, openLanes.length);
      if (waveCount <= 0) {
        wave += 1;
        attempts += 1;
        continue;
      }
      const spawnableLanes = openLanes.filter((lane) => preservesEscapeLane(lane, z));
      if (spawnableLanes.length === 0) {
        wave += 1;
        attempts += 1;
        continue;
      }
      const safeWaveCount = Math.min(waveCount, spawnableLanes.length);
      for (let index = 0; index < safeWaveCount; index += 1) makeTraffic(spawnableLanes[index], z);
      remaining -= safeWaveCount;
      wave += 1;
      attempts += 1;
    }
  };

  const setMode = (next: GameMode) => {
    mode = next;
    const startScreen = getEl<HTMLElement>(root, '[data-game-start-screen]');
    const overScreen = getEl<HTMLElement>(root, '[data-game-over]');
    const message = getEl<HTMLElement>(root, '[data-game-message]');
    const isReady = next === 'ready';
    const isCrashed = next === 'crashed';
    startScreen?.classList.toggle('is-visible', isReady);
    overScreen?.classList.toggle('is-visible', isCrashed);
    overScreen?.setAttribute('aria-hidden', String(!isCrashed));
    if (message) {
      message.textContent = isCrashed
        ? '车辆发生碰撞，重新规划路线'
        : next === 'paused'
          ? '游戏已暂停'
          : autopilot
            ? '智驾模式正在寻找安全车道'
            : isReady
              ? '准备进入道路'
              : '保持移动，避开来车';
      message.classList.toggle('is-visible', next !== 'manual' && next !== 'autopilot');
    }
    setText(root, '[data-game-result-time]', `${gameTime.toFixed(1)} s`);
    setText(root, '[data-game-result-score]', Math.floor(score).toLocaleString('en-US'));
    setText(root, '[data-game-result-dodged]', String(dodged).padStart(2, '0'));
    updateUi();
  };

  const restart = () => {
    clearTraffic();
    gameTime = 0;
    score = 0;
    energy = 0;
    dodged = 0;
    difficulty = 1;
    spawnAccumulator = 0;
    invulnerable = 0;
    playerTargetX = 0;
    playerX = 0;
    autopilotLane = 1;
    player.position.x = 0;
    autopilot = false;
    paused = false;
    spawnTraffic(initialTraffic);
    setMode('ready');
    setText(root, '[data-game-result-time]', formatClock(gameTime));
    setText(root, '[data-game-result-score]', '0000');
    setText(root, '[data-game-result-dodged]', '00');
    updateUi();
  };

  const start = () => {
    if (mode === 'crashed') restart();
    running = true;
    paused = false;
    setMode('manual');
    clock.start();
    lastTime = performance.now();
  };

  const pause = () => {
    if (!running || mode === 'crashed') return;
    paused = !paused;
    setMode(paused ? 'paused' : autopilot ? 'autopilot' : 'manual');
    if (!paused) clock.start();
  };

  const setAutopilot = (enabled = !autopilot) => {
    if (enabled && energy < 100) {
      setText(root, '[data-game-status]', '能量不足：继续躲避车辆以充能');
      return;
    }
    autopilot = enabled;
    // A full bar is the fuel reserve for autonomous driving. Keep it at 100%
    // when the mode is engaged, then consume it continuously in update().
    // Subtracting the activation cost here would disable autopilot on its
    // first frame because the energy bar would immediately reach zero.
    if (autopilot) energy = 100;
    if (mode !== 'crashed' && !paused) setMode(autopilot ? 'autopilot' : 'manual');
    updateUi();
  };

  const chooseAutopilotLane = () => {
    const currentLane = LANES.reduce(
      (best, lane, index) => (Math.abs(lane - playerX) < Math.abs(LANES[best] - playerX) ? index : best),
      autopilotLane,
    );
    const worldSpeed = 12.5 * difficulty;
    const dangerByLane = LANES.map((_, lane) =>
      traffic.reduce((total, item) => {
        if (item.lane !== lane) return total;
        const dz = item.root.position.z - player.position.z;
        // Traffic only reaches the player while it is ahead of us. Predict the
        // closing time instead of scoring only the current distance; this gives
        // the controller time to finish a lane change before impact.
        if (dz >= 4 || dz < -118) return total;
        const closingSpeed = Math.max(0.7, worldSpeed - item.speed);
        const eta = Math.max(0, -dz) / closingSpeed;
        if (eta > 7.5) return total;
        const urgency = eta < 1.5 ? 280 : eta < 3.4 ? 150 : 58;
        const proximity = Math.max(0, 16 - Math.abs(dz));
        return total + urgency + proximity * 4;
      }, 0),
    );

    // Keep the current lane when it is safe to avoid oscillation. Otherwise
    // choose the least dangerous lane, with a small lane-change cost.
    let bestLane = currentLane;
    let bestScore = dangerByLane[currentLane];
    dangerByLane.forEach((danger, index) => {
      const score = danger + Math.abs(index - currentLane) * 8;
      if (score < bestScore) {
        bestScore = score;
        bestLane = index;
      }
    });
    autopilotLane = bestLane;
    return LANES[bestLane];
  };

  const dangerByLaneForEmergency = (blockedItem: TrafficVehicle) => {
    const candidates = LANES.map((_, lane) => lane).filter((lane) => lane !== blockedItem.lane);
    const worldSpeed = 12.5 * difficulty;
    const safeCandidates = candidates.filter(
      (lane) =>
        !traffic.some((item) => {
          if (item === blockedItem || item.lane !== lane) return false;
          const dz = item.root.position.z - player.position.z;
          if (dz > 18 || dz < -92) return false;
          const closingSpeed = Math.max(0.7, worldSpeed - item.speed);
          const eta = Math.max(0, -dz) / closingSpeed;
          return eta < 4.2 || Math.abs(dz) < 10;
        }),
    );
    if (safeCandidates.length === 0) return -1;
    return safeCandidates.reduce(
      (best, lane) => (Math.abs(LANES[lane] - playerX) < Math.abs(LANES[best] - playerX) ? lane : best),
      safeCandidates[0],
    );
  };

  const crash = () => {
    if (invulnerable > 0 || mode === 'crashed') return;
    invulnerable = 1.4;
    energy = Math.max(0, energy - 28);
    score = Math.max(0, score - 180);
    setText(root, '[data-game-status]', '发生碰撞，按重新开始继续');
    setText(root, '[data-game-status-copy]', '车辆与来车发生碰撞，本轮得分已锁定。');
    setText(root, '[data-game-result-time]', formatClock(gameTime));
    setText(root, '[data-game-result-score]', Math.floor(score).toLocaleString('en-US'));
    setText(root, '[data-game-result-dodged]', dodged.toString().padStart(2, '0'));
    setMode('crashed');
    running = false;
  };

  const update = (delta: number) => {
    if (!running || paused || mode === 'crashed') return;
    const dt = Math.min(0.045, delta);
    gameTime += dt;
    difficulty = 1 + Math.min(1.4, gameTime / 95);
    score += dt * (autopilot ? 14 : 10);
    invulnerable = Math.max(0, invulnerable - dt);

    const desiredX = autopilot ? chooseAutopilotLane() : playerTargetX;
    playerX = THREE.MathUtils.damp(playerX, desiredX, autopilot ? 10.5 : 8.5, dt);
    player.position.x = playerX;
    player.rotation.z = THREE.MathUtils.damp(player.rotation.z, (desiredX - playerX) * -0.055, 7, dt);

    const worldSpeed = 12.5 * difficulty;
    road.updateRoad(dt, worldSpeed);
    spawnAccumulator += dt;
    const spawnEvery = Math.max(0.72, 1.55 - gameTime / 160);
    if (spawnAccumulator > spawnEvery && traffic.length < maxTraffic) {
      spawnAccumulator = 0;
      spawnTraffic(1);
    }

    const playerBox = new THREE.Box3(
      new THREE.Vector3(player.position.x - 0.92, 0.15, player.position.z - 1.75),
      new THREE.Vector3(player.position.x + 0.92, 1.75, player.position.z + 1.75),
    );
    traffic.slice().forEach((item) => {
      item.root.position.z += (worldSpeed - item.speed) * dt;
      item.root.rotation.y = Math.sin(gameTime * 0.6 + item.lane) * 0.006;
      item.box.setFromObject(item.root);
      if (!item.passed && item.root.position.z > player.position.z + 2.8) {
        item.passed = true;
        dodged += 1;
        energy = autopilot ? energy : Math.min(100, energy + 9);
        score += autopilot ? 105 : 120;
        if (!autopilot && energy >= 100)
          setText(root, '[data-game-status]', '智驾能量已充满，点击“智驾模式”');
      }
      if (invulnerable <= 0 && playerBox.intersectsBox(item.box)) {
        if (autopilot) {
          // An emergency correction is the final safety net for a late spawn
          // or a partially completed lane change. The traffic rule guarantees
          // at least one open lane, so auto mode can recover without ending
          // the run as long as a safe lane exists.
          const safeLane = dangerByLaneForEmergency(item);
          if (safeLane >= 0) {
            autopilotLane = safeLane;
            playerTargetX = LANES[safeLane];
            playerX = LANES[safeLane];
            player.position.x = playerX;
            invulnerable = Math.max(invulnerable, 0.45);
          } else {
            // The traffic generator reserves an escape lane. If two cars
            // converge in the same frame, let auto mode perform a controlled
            // intervention instead of ending an otherwise recoverable run.
            item.root.position.z = player.position.z - 6;
            item.passed = true;
            energy = Math.max(0, energy - 10);
            invulnerable = 0.6;
          }
        } else crash();
      }
      if (item.root.position.z > 26) {
        scene.remove(item.root);
        const index = traffic.indexOf(item);
        if (index >= 0) traffic.splice(index, 1);
      }
    });
    if (autopilot) {
      energy = Math.max(0, energy - dt * 4.5);
      if (energy <= 0) {
        autopilot = false;
        setMode('manual');
        setText(root, '[data-game-status]', '智驾能量耗尽，回到手动驾驶');
      }
    }
    updateUi();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a')
      playerTargetX = Math.max(-3.1, playerTargetX - 3.1);
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd')
      playerTargetX = Math.min(3.1, playerTargetX + 3.1);
    if (event.code === 'Space') setAutopilot();
    if (event.key.toLowerCase() === 'p') pause();
  };
  const moveLeft = () => {
    playerTargetX = Math.max(-3.1, playerTargetX - 3.1);
  };
  const moveRight = () => {
    playerTargetX = Math.min(3.1, playerTargetX + 3.1);
  };
  const movePointer = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.buttons === 0) return;
    const rect = canvas.getBoundingClientRect();
    const normalized = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    playerTargetX = THREE.MathUtils.clamp(normalized * 4.2, -3.1, 3.1);
  };

  window.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('pointermove', movePointer);
  getEl<HTMLButtonElement>(root, '[data-game-left]')?.addEventListener('pointerdown', moveLeft);
  getEl<HTMLButtonElement>(root, '[data-game-right]')?.addEventListener('pointerdown', moveRight);
  getEl<HTMLButtonElement>(root, '[data-game-start]')?.addEventListener('click', start);
  getEl<HTMLButtonElement>(root, '[data-game-pause]')?.addEventListener('click', pause);
  getEl<HTMLButtonElement>(root, '[data-game-restart]')?.addEventListener('click', () => {
    restart();
    start();
  });
  getEl<HTMLButtonElement>(root, '[data-game-autopilot]')?.addEventListener('click', () => setAutopilot());

  const resize = () => {
    const width = root.clientWidth || canvas.clientWidth || window.innerWidth;
    const height = root.clientHeight || canvas.clientHeight || window.innerHeight;
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);
  resize();

  const animate = (time: number) => {
    if (disposed) return;
    animationFrame = requestAnimationFrame(animate);
    const dt = Math.max(0, Math.min(0.05, (time - lastTime) / 1000 || 0));
    lastTime = time;
    update(dt);
    // Keep the skyline alive on the ready screen and while paused. During a
    // run it inherits the road speed; at rest it drifts slowly like a moving
    // city backdrop rather than freezing into a static curtain.
    const citySpeed = running && !paused && mode !== 'crashed' ? 12.5 * difficulty : 3.2;
    city.updateCity(dt, citySpeed);
    const cameraZ = player.position.z + 8.2;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, player.position.x * 0.2, 4.2, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 4.55, 4.2, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraZ, 4.2, dt);
    camera.lookAt(player.position.x * 0.18, 0.9, player.position.z - 11);
    renderer.render(scene, camera);
  };

  restart();
  animationFrame = requestAnimationFrame(animate);

  return {
    start,
    pause,
    restart,
    setAutopilot,
    destroy: () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('pointermove', movePointer);
      renderer.dispose();
      traffic.splice(0).forEach((item) => scene.remove(item.root));
    },
  };
}

export default initTrafficGame;
