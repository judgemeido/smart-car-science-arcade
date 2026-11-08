import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createScope } from '../../../src/shared/lifecycle';
import { createTrafficPracticeScene } from '../../../src/chapters/traffic/practice-scene';
import { trafficPracticeScenarios } from '../../../src/chapters/traffic/learning-data';

describe('traffic isolated teaching scene', () => {
  it('shows cautious passage beyond the clear crosswalk and holds before a conflict', () => {
    const parent = new THREE.Group();
    const scope = createScope();
    const practice = createTrafficPracticeScene(parent, scope);
    const vehicle = parent
      .getObjectByName('traffic-practice')!
      .children.find((child) => child.userData.practiceVehicle)!;
    practice.show(trafficPracticeScenarios[0]);
    practice.showDecision('correct');
    practice.update(10);
    expect(vehicle.position.z + 1.9).toBeLessThan(-4.5);
    practice.show(trafficPracticeScenarios[1]);
    practice.showDecision('correct');
    practice.update(10);
    expect(vehicle.position.z - 1.9).toBeGreaterThan(-0.3);
    scope.dispose();
  });
  it('keeps a correct action moving forward when feedback changes to summary', () => {
    const parent = new THREE.Group();
    const scope = createScope();
    const practice = createTrafficPracticeScene(parent, scope);
    practice.show(trafficPracticeScenarios[0]);
    const vehicle = parent
      .getObjectByName('traffic-practice')!
      .children.find((child) => child.userData.practiceVehicle)!;
    practice.showDecision('correct');
    practice.update(1);
    const firstZ = vehicle.position.z;
    practice.showDecision('correct');
    practice.update(0.1);
    expect(vehicle.position.z).toBeLessThanOrEqual(firstZ);
    scope.dispose();
  });
  it('enters and holds the pedestrian conflict path without implying a clear adjacent route', () => {
    const parent = new THREE.Group();
    const scope = createScope();
    const practice = createTrafficPracticeScene(parent, scope);
    practice.show(trafficPracticeScenarios[1]);
    const person = parent.getObjectByName('sudden-person')!;
    practice.update(1.2);
    expect(person.position.x).toBeCloseTo(1.6);
    practice.update(30);
    expect(person.position.x).toBeCloseTo(1.6);
    practice.showDecision('incorrect');
    expect(parent.getObjectByName('decision-risk-region')!.visible).toBe(true);
    practice.hide();
    const before = person.position.clone();
    practice.update(1);
    expect(person.position.equals(before)).toBe(true);
    scope.dispose();
  });
  it('shows only one scenario and preserves existing object transforms and visibility', () => {
    const parent = new THREE.Group();
    const original = new THREE.Group();
    original.position.set(1, 2, 3);
    original.rotation.y = 1.2;
    original.visible = false;
    parent.add(original);
    const scope = createScope();
    const practice = createTrafficPracticeScene(parent, scope);
    const group = parent.getObjectByName('traffic-practice')!;
    for (const scenario of trafficPracticeScenarios) {
      practice.show(scenario);
      expect(group.visible).toBe(true);
      expect(group.userData.scenarioId).toBe(scenario.id);
      expect(
        group.children
          .filter((child) => child.userData.sceneKind && child.visible)
          .map((child) => child.userData.sceneKind),
      ).toEqual([scenario.sceneKind]);
      practice.update(0.5);
      practice.showDecision('correct');
    }
    practice.hide();
    expect(group.visible).toBe(false);
    expect(original.position.toArray()).toEqual([1, 2, 3]);
    expect(original.rotation.y).toBe(1.2);
    expect(original.visible).toBe(false);
    scope.dispose();
  });
  it('releases owned geometry and material exactly once and detaches on scope disposal', () => {
    const parent = new THREE.Group();
    const scope = createScope();
    createTrafficPracticeScene(parent, scope);
    const group = parent.getObjectByName('traffic-practice')!;
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    group.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) =>
        materials.add(material),
      );
    });
    const spies = [...geometries, ...materials].map((resource) => vi.spyOn(resource, 'dispose'));
    expect(spies.length).toBeGreaterThan(0);
    scope.dispose();
    scope.dispose();
    spies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
    expect(parent.getObjectByName('traffic-practice')).toBeUndefined();
  });
});
