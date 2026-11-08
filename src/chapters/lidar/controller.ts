import { createScanScene } from './scan-scene';
import { createScene } from './scene';
import { loadDae } from './model';
import { partById, lessonSteps, type LidarMode } from './data';
import { createExperimentState, reduceExperiment, type ExperimentAction } from './experiment-state';
import { roundTripNanoseconds } from './measurement';
import { bindLidarInteraction } from './interaction';
import { createModelRig } from './model-rig';
import { createScanAnimation } from './scan-animation';
import { createScope, createAnimationLoop } from '../../shared/lifecycle';
import { disposeObject } from '../../shared/three-resources';
import type { ChapterController } from '../../app/types';
import { watchWebglContext, reportChapterError } from '../../shared/webgl';
import * as THREE from 'three';
import { lidarLearningContent } from './learning-data';
import { createLidarLearningState, reduceLidarLearning, type LidarLearningAction } from './learning-state';
import {
  createWeatherLearningState,
  reduceWeatherLearning,
  type WeatherLearningAction,
  type LearningWeather,
} from './weather-state';
import { createDistanceTargets, worldTargets, type MeterTarget } from './learning-measurement';
import { createLidarLearningWorld } from './learning-world';
import { renderLidarLearningGuide, updateLidarLearningView, type LidarLearningTab } from './learning-view';
import {
  captureLidarCamera,
  restoreLidarCamera,
  installWithLearningCamera,
  type LidarCameraSnapshot,
} from './learning-camera';

export type LidarExplorerController = (() => void) &
  ChapterController & {
    setMode?: (mode: LidarMode) => void;
    setScan?: (active: boolean) => void;
    selectPart?: (id: string) => void;
  };

export function mount(host: HTMLElement): LidarExplorerController {
  const scope = createScope();
  try {
    return createController(host, scope);
  } catch (error) {
    scope.dispose();
    throw error;
  }
}

function createController(host: HTMLElement, scope: ReturnType<typeof createScope>): LidarExplorerController {
  const stage = host.querySelector<HTMLElement>('.lidar-stage') ?? host;
  const canvas = stage.querySelector<HTMLCanvasElement>('[data-lidar-canvas]');
  if (!canvas) throw new Error('激光雷达展厅缺少画布');
  const scene = createScene(canvas, scope);
  const { camera, renderer, controls } = scene;
  watchWebglContext(canvas, scope, host);
  const rig = createModelRig({ ...scene, getStageWidth: () => stage.clientWidth }, scope);
  const scanObjects = createScanScene(scene.scanGroup);
  const scanAnimation = createScanAnimation({ scanGroup: scene.scanGroup, ...rig.scanParts }, scanObjects);
  let state = createExperimentState();
  let loadVersion = 0;
  let disposed = false;
  let assetStatus: 'loading' | 'ready' | 'degraded' = 'loading';
  const learningHost = host.querySelector<HTMLElement>('[data-lidar-learning]');
  const learningToggle = host.querySelector<HTMLElement>('[data-lidar-learning-toggle]');
  const learningLabels = host.querySelector<HTMLElement>('[data-lidar-learning-labels]');
  const learningNote = host.querySelector<HTMLElement>('[data-lidar-learning-stage-note]');
  let learningState = createLidarLearningState();
  let weatherState = createWeatherLearningState();
  let learningOpen = false;
  let learningTab: LidarLearningTab = 'guide';
  let learningScanRunning = true;
  let selectedWorldId: string | null = null;
  let worldVisible = false;
  let displayedTargets: readonly MeterTarget[] = [];
  let savedCamera: LidarCameraSnapshot | null = null;
  const learningParent = new THREE.Group();
  scene.scene.add(learningParent);
  const learningWorld = createLidarLearningWorld(learningParent, scope);
  if (learningHost) renderLidarLearningGuide(learningHost, lidarLearningContent);

  const statusElement = host.querySelector<HTMLElement>('[data-lidar-status]');
  const partNameElement = host.querySelector<HTMLElement>('[data-lidar-part-name]');
  const partCopyElement = host.querySelector<HTMLElement>('[data-lidar-part-copy]');
  const partFactElement = host.querySelector<HTMLElement>('[data-lidar-part-fact]');
  const rangeElement = host.querySelector<HTMLElement>('[data-lidar-range]');
  const pointElement = host.querySelector<HTMLElement>('[data-lidar-points]');
  const modeElement = host.querySelector<HTMLElement>('[data-lidar-mode-label]');
  const timeElements = [...host.querySelectorAll<HTMLElement>('[data-lidar-time]')];
  const distanceSlider = host.querySelector<HTMLInputElement>('[data-lidar-distance]');
  const distanceValueElement = host.querySelector<HTMLElement>('[data-lidar-distance-value]');
  const scanLabelElement = host.querySelector<HTMLElement>('[data-lidar-scan-label]');
  const scanHudElement = host.querySelector<HTMLElement>('[data-lidar-scan-hud]');
  const lessonButtons = [...host.querySelectorAll<HTMLElement>('[data-lidar-step]')];
  const scanToggleButtons = [...host.querySelectorAll<HTMLElement>('[data-lidar-scan-toggle]')];
  const scanTabButtons = [
    ...host.querySelectorAll<HTMLElement>('[data-lidar-view="scan"], [data-lidar-view="sensor"]'),
  ];
  const modeButtons = [...host.querySelectorAll<HTMLElement>('[data-lidar-mode]')];
  state = reduceExperiment(state, {
    type: 'distance',
    meters: Number(distanceSlider?.value || state.distanceMeters),
  });

  const setText = (element: HTMLElement | null, value: string) => {
    if (element) element.textContent = value;
  };
  const syncLearningScene = () => {
    const visible = learningOpen && learningTab !== 'guide';
    if (visible && !worldVisible) {
      savedCamera = captureLidarCamera(camera, controls);
      controls.minDistance = 1.8;
      controls.maxDistance = 9;
      camera.position.set(3.5, 3.8, 4.7);
      controls.target.set(0, 0, -0.35);
      controls.update();
    } else if (!visible && worldVisible && savedCamera) {
      restoreLidarCamera(camera, controls, savedCamera);
      savedCamera = null;
    }
    worldVisible = visible;
    learningWorld.setVisible(visible);
    scene.modelGroup.visible = !visible;
    scene.exhibitPedestal.visible = !visible;
    const hotspots = scene.scene.getObjectByName('SEMANTIC_HOTSPOTS');
    if (hotspots) hotspots.visible = !visible;
    scene.scanGroup.visible = !visible && state.scanActive;
    host.classList.toggle('is-learning-world', visible);
    if (learningLabels) learningLabels.hidden = !visible;
    if (learningNote) {
      learningNote.hidden = !visible;
      learningNote.textContent = `${assetStatus === 'degraded' ? '模型载入失败；教学几何仍可使用 · ' : ''}教学模型与点云 · 目标底部标记是距离参考点`;
    }
    canvas.setAttribute(
      'aria-label',
      visible
        ? '教学目标与点云，可拖动旋转、缩放；也可用目标列表选择'
        : 'Velodyne VLP-16 激光雷达三维模型，可拖动旋转并缩放',
    );
  };
  const syncLearning = () => {
    if (learningHost) {
      learningHost.hidden = !learningOpen;
      updateLidarLearningView(
        learningHost,
        lidarLearningContent,
        learningState,
        weatherState,
        learningTab,
        learningScanRunning,
        selectedWorldId,
      );
    }
    learningToggle?.setAttribute('aria-expanded', String(learningOpen));
    setText(learningToggle, learningOpen ? '收起传感器实验室' : '打开传感器实验室');
    const targets =
      learningTab === 'distance'
        ? createDistanceTargets(lidarLearningContent.distance.rounds[learningState.roundIndex])
        : worldTargets;
    if (targets.map((target) => target.id).join() !== displayedTargets.map((target) => target.id).join()) {
      displayedTargets = targets;
      learningWorld.setTargets(targets);
      if (learningLabels) {
        learningLabels.replaceChildren(
          ...targets.map((target) => {
            const label = document.createElement('button');
            label.type = 'button';
            label.dataset.lidarSceneTarget = target.id;
            label.textContent = target.label;
            return label;
          }),
        );
      }
    }
    learningWorld.setWeather(learningTab === 'weather' ? weatherState.weather : 'normal');
    learningWorld.setScanRunning(learningScanRunning);
    const selected = learningTab === 'distance' ? learningState.selectedTargetId : selectedWorldId;
    learningWorld.setSelectedTarget(selected);
    learningLabels
      ?.querySelectorAll<HTMLElement>('[data-lidar-scene-target]')
      .forEach((label) =>
        label.setAttribute('aria-pressed', String(label.dataset.lidarSceneTarget === selected)),
      );
    syncLearningScene();
  };
  const dispatchLearning = (action: LidarLearningAction) => {
    if (disposed) return;
    learningState = reduceLidarLearning(learningState, action, lidarLearningContent);
    syncLearning();
  };
  const dispatchWeather = (action: WeatherLearningAction) => {
    if (disposed) return;
    weatherState = reduceWeatherLearning(weatherState, action, lidarLearningContent.weather.questions);
    syncLearning();
  };
  scope.listen(window, 'pagehide', () => {
    if (disposed) return;
    learningState = createLidarLearningState();
    weatherState = createWeatherLearningState();
    selectedWorldId = null;
    learningScanRunning = true;
    learningOpen = false;
    learningTab = 'guide';
    syncLearning();
  });
  const chooseTarget = (id: string) => {
    if (!displayedTargets.some((target) => target.id === id)) return;
    if (learningTab === 'distance') dispatchLearning({ type: 'select-target', id });
    else {
      selectedWorldId = id;
      syncLearning();
    }
  };
  scope.listen<MouseEvent>(host, 'click', (event) => {
    if (!(event.target instanceof Element) || disposed) return;
    const button = event.target.closest<HTMLButtonElement>('button');
    if (!button || !host.contains(button) || button.disabled) return;
    if (
      button.hasAttribute('data-lidar-learning-toggle') ||
      button.hasAttribute('data-lidar-learning-close')
    ) {
      learningOpen = button.hasAttribute('data-lidar-learning-close') ? false : !learningOpen;
      syncLearning();
      if (learningOpen) learningHost?.scrollIntoView({ block: 'nearest' });
      else learningToggle?.focus({ preventScroll: true });
    } else if (button.dataset.lidarLearningTab) {
      const tab = button.dataset.lidarLearningTab;
      if (tab === 'guide' || tab === 'world' || tab === 'distance' || tab === 'weather') {
        learningTab = tab;
        syncLearning();
      }
    } else if (button.dataset.lidarTarget)
      dispatchLearning({ type: 'select-target', id: button.dataset.lidarTarget });
    else if (button.dataset.lidarRangeChoice)
      dispatchLearning({ type: 'select-range', id: button.dataset.lidarRangeChoice });
    else if (button.dataset.lidarSensor)
      dispatchLearning({ type: 'select-sensor', id: button.dataset.lidarSensor });
    else if (button.hasAttribute('data-lidar-learning-submit')) dispatchLearning({ type: 'submit' });
    else if (button.hasAttribute('data-lidar-learning-continue')) dispatchLearning({ type: 'continue' });
    else if (button.hasAttribute('data-lidar-distance-reset')) dispatchLearning({ type: 'reset' });
    else if (button.dataset.lidarWeather)
      dispatchWeather({ type: 'set-weather', weather: button.dataset.lidarWeather as LearningWeather });
    else if (button.dataset.lidarWeatherChoice)
      dispatchWeather({
        type: 'answer',
        questionId: lidarLearningContent.weather.questions[weatherState.questionIndex].id,
        choiceId: button.dataset.lidarWeatherChoice,
      });
    else if (button.hasAttribute('data-lidar-weather-continue')) dispatchWeather({ type: 'continue' });
    else if (button.hasAttribute('data-lidar-weather-reset')) dispatchWeather({ type: 'reset' });
    else if (button.hasAttribute('data-lidar-learning-scan')) {
      learningScanRunning = !learningScanRunning;
      syncLearning();
    } else if (button.dataset.lidarWorldTarget) chooseTarget(button.dataset.lidarWorldTarget);
    else if (button.dataset.lidarSceneTarget) chooseTarget(button.dataset.lidarSceneTarget);
  });
  const setStatus = (value: string) => {
    const prefix =
      assetStatus === 'degraded'
        ? '模型载入失败，仍可查看概念扫描演示 · '
        : assetStatus === 'loading'
          ? '模型正在载入 · '
          : '';
    setText(statusElement, `${prefix}${value}`);
  };
  const updateMeasurement = () => {
    setText(rangeElement, `${state.distanceMeters.toFixed(1)} m`);
    setText(pointElement, state.scanActive && state.stepIndex === 3 ? '720 pts / 示意' : '—');
    const roundTripNs = roundTripNanoseconds(state.distanceMeters);
    timeElements.forEach((element) => setText(element, `约 ${roundTripNs.toFixed(1)} ns`));
    setText(distanceValueElement, `${state.distanceMeters.toFixed(0)} m`);
    setText(
      scanHudElement?.querySelector<HTMLElement>('[data-lidar-target-distance]') ?? null,
      `模拟目标 ${state.distanceMeters.toFixed(0)} m`,
    );
  };
  const announcePart = () => {
    const part = state.selectedPartId ? partById.get(state.selectedPartId) : undefined;
    setText(partNameElement, part?.name ?? '选择一个部件');
    setText(partCopyElement, part?.copy ?? '点击模型上的高亮标记，认识激光雷达的组成。');
    setText(partFactElement, part?.fact ?? '交互说明：旋转、缩放并点击标记');
    host.dispatchEvent(new CustomEvent('lidar:part-select', { detail: part ?? null }));
  };
  const syncLessonUI = () => {
    lessonButtons.forEach((button) => {
      const active = Number(button.dataset.lidarStep) === state.stepIndex;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    });
    setText(host.querySelector<HTMLElement>('[data-lidar-step-copy]'), lessonSteps[state.stepIndex].copy);
  };
  const showLessonStatus = () =>
    setStatus(`原理 ${String(state.stepIndex + 1).padStart(2, '0')} / ${lessonSteps[state.stepIndex].title}`);
  const showScanStatus = () =>
    setStatus(`扫描演示：${lessonSteps[state.stepIndex].title} · 目标 ${state.distanceMeters.toFixed(0)} 米`);
  const showMode = () => {
    modeButtons.forEach((button) => {
      const active = button.dataset.lidarMode === state.mode;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    });
    setText(
      modeElement,
      state.mode === 'assembly' ? '装配视图' : state.mode === 'exploded' ? '内部零件拆解' : '原理透明剖视',
    );
    setStatus(
      state.mode === 'assembly'
        ? '装配模型已就绪'
        : state.mode === 'exploded'
          ? '内部原理零件已展开'
          : '外壳半透明 · 原理结构可见',
    );
    host.dispatchEvent(new CustomEvent('lidar:mode-change', { detail: { mode: state.mode } }));
  };
  const showScan = () => {
    const active = state.scanActive;
    scanToggleButtons.forEach((button) => button.setAttribute('aria-pressed', String(active)));
    scanTabButtons.forEach((button) => {
      const selected = (button.dataset.lidarView === 'scan') === active;
      button.setAttribute('aria-selected', String(selected));
      button.classList.toggle('is-active', selected);
    });
    setText(scanLabelElement, active ? '停止扫描演示' : '开始扫描演示');
    scanHudElement?.setAttribute('aria-hidden', String(!active));
    scanHudElement?.classList.toggle('is-visible', active);
    if (active) showScanStatus();
    else setStatus(state.mode === 'assembly' ? '装配模型已就绪' : '结构视图已就绪');
    host.dispatchEvent(new CustomEvent('lidar:scan-change', { detail: { active } }));
  };
  const dispatch = (action: ExperimentAction) => {
    if (disposed) return;
    const previous = state;
    state = reduceExperiment(state, action);
    switch (action.type) {
      case 'mode':
        rig.apply(state);
        showMode();
        break;
      case 'scan':
        if (state.scanActive && !previous.scanActive) {
          syncLessonUI();
          announcePart();
        }
        showScan();
        break;
      case 'step':
        showScan();
        syncLessonUI();
        announcePart();
        showLessonStatus();
        break;
      case 'select-part':
        if (action.id === null || partById.has(action.id)) announcePart();
        break;
      case 'reset':
        rig.apply(state);
        showMode();
        showScan();
        syncLessonUI();
        showLessonStatus();
        announcePart();
        rig.resetCamera();
        break;
      case 'distance':
        if (state.scanActive) showScanStatus();
        break;
      case 'tick':
        if (state.stepIndex !== previous.stepIndex) {
          syncLessonUI();
          announcePart();
          showLessonStatus();
        }
        if (state.scanActive) updateMeasurement();
        return;
    }
    if (
      action.type === 'scan' ||
      action.type === 'step' ||
      action.type === 'distance' ||
      action.type === 'reset'
    ) {
      updateMeasurement();
      scanAnimation.update(state, 0);
      setText(
        scanHudElement?.querySelector<HTMLElement>('[data-lidar-target-distance]') ?? null,
        `${state.distanceMeters.toFixed(0)} m 模拟目标`,
      );
    }
    syncLearningScene();
  };
  bindLidarInteraction(
    host,
    {
      camera,
      getState: () => state,
      pickCandidates: (current) => (worldVisible ? [] : rig.pickCandidates(current)),
      onEcho: () => {
        setStatus('已选中一处模拟回波');
        updateMeasurement();
      },
    },
    dispatch,
    scope,
  );
  const learningRaycaster = new THREE.Raycaster();
  let learningPointerStart: { id: number; x: number; y: number } | null = null;
  scope.listen<PointerEvent>(canvas, 'pointerdown', (event) => {
    if (worldVisible) learningPointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  scope.listen<PointerEvent>(canvas, 'pointercancel', () => {
    learningPointerStart = null;
  });
  scope.listen<PointerEvent>(canvas, 'pointerup', (event) => {
    const start = learningPointerStart;
    learningPointerStart = null;
    if (
      !worldVisible ||
      !start ||
      start.id !== event.pointerId ||
      Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6
    )
      return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    learningRaycaster.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const hit = learningRaycaster.intersectObjects(learningWorld.pickCandidates(), false)[0];
    if (typeof hit?.object.userData.targetId === 'string') chooseTarget(hit.object.userData.targetId);
  });

  const resize = () => {
    const width = stage.clientWidth || 1;
    const height = stage.clientHeight || 1;
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 760 ? 1.35 : 1.8));
    renderer.setSize(width, height, false);
  };
  const resizeObserver = new ResizeObserver(resize);
  scope.add(() => resizeObserver.disconnect());
  resizeObserver.observe(stage);
  resize();

  const load = async () => {
    const thisLoad = ++loadVersion;
    setStatus('正在载入激光雷达模型');
    try {
      const licensedParts = await Promise.allSettled([
        loadDae('/assets/lidar/VLP16_base_1.dae', scope.signal),
        loadDae('/assets/lidar/VLP16_base_2.dae', scope.signal),
        loadDae('/assets/lidar/VLP16_scan.dae', scope.signal),
      ]);
      const successes = licensedParts.filter((part) => part.status === 'fulfilled');
      if (disposed || thisLoad !== loadVersion || successes.length !== licensedParts.length) {
        successes.forEach((part) => disposeObject(part.value));
        if (disposed || thisLoad !== loadVersion) return;
        throw new Error('LiDAR 部分模型资源加载失败');
      }
      savedCamera = installWithLearningCamera(camera, controls, worldVisible ? savedCamera : null, () => {
        rig.installLicensedParts(successes.map((part) => part.value));
        rig.apply(state);
      });
      assetStatus = 'ready';
    } catch {
      if (disposed || thisLoad !== loadVersion) return;
      assetStatus = 'degraded';
    }
    if (disposed || thisLoad !== loadVersion) return;
    host.dataset.assetStatus = assetStatus;
    if (assetStatus === 'degraded') rig.apply(state);
    showMode();
    syncLearningScene();
  };
  void load();

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    ++loadVersion;
    scope.dispose();
  };
  const controller = dispose as LidarExplorerController;
  controller.setMode = (mode) => dispatch({ type: 'mode', mode });
  controller.setScan = (active) => dispatch({ type: 'scan', active });
  controller.selectPart = (id) => dispatch({ type: 'select-part', id });
  const loop = createAnimationLoop(
    renderer,
    (delta) => {
      if (disposed) return;
      controls.update();
      if (worldVisible) {
        learningWorld.update(delta);
        scene.scene.updateMatrixWorld(true);
        learningLabels?.querySelectorAll<HTMLElement>('[data-lidar-scene-target]').forEach((label) => {
          const point = learningWorld.getTargetPosition(label.dataset.lidarSceneTarget ?? '');
          if (!point) return;
          point.y += 0.22;
          const projected = point.project(camera);
          label.style.left = `${(projected.x + 1) * 50}%`;
          label.style.top = `${(1 - projected.y) * 50}%`;
          label.hidden =
            projected.z > 1 || projected.z < -1 || Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1;
        });
      } else {
        dispatch({ type: 'tick', deltaSeconds: delta });
        scanAnimation.update(state, delta);
        rig.update(state, delta);
      }
      renderer.render(scene.scene, camera);
    },
    (error) => reportChapterError(host, error),
  );
  scope.add(() => loop.dispose());

  rig.apply(state);
  scanAnimation.update(state, 0);
  showMode();
  announcePart();
  updateMeasurement();
  syncLearning();
  controller.dispose = dispose;
  controller.setActive = (active) => {
    if (active) resize();
    loop.setActive(active);
  };
  return controller;
}
