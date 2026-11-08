import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  createAssemblyReturnState,
  reduceAssemblyReturn,
  stepAssemblyReturn,
  teachingAssemblyGroups,
} from '../../../src/chapters/explore/assembly-state';

it('returns four groups in order, ignores repeats, and takes exactly one second per group', () => {
  let state = createAssemblyReturnState();
  for (const group of teachingAssemblyGroups) {
    state = reduceAssemblyReturn(state, 'next');
    expect(state.currentGroup).toBe(group.id);
    expect(reduceAssemblyReturn(state, 'next')).toBe(state);
    state = stepAssemblyReturn(state, 0.5);
    expect(state.progress).toBe(0.5);
    state = stepAssemblyReturn(state, 0.5);
    expect(state.returnedGroups).toContain(group.id);
    expect(state.currentGroup).toBeNull();
  }
  expect(state.status).toBe('complete');
  expect(stepAssemblyReturn(state, 5)).toBe(state);
  expect(reduceAssemblyReturn(state, 'next')).toBe(state);
});
it('rejects invalid elapsed time, cancels without further advancement, and resets', () => {
  let state = reduceAssemblyReturn(createAssemblyReturnState(), 'next');
  for (const delta of [-1, NaN, Infinity]) expect(stepAssemblyReturn(state, delta)).toBe(state);
  state = reduceAssemblyReturn(stepAssemblyReturn(state, 0.5), 'cancel');
  expect(state.status).toBe('cancelled');
  expect(stepAssemblyReturn(state, 5)).toBe(state);
  expect(reduceAssemblyReturn(state, 'next')).toBe(state);
  expect(reduceAssemblyReturn(state, 'reset')).toEqual(createAssemblyReturnState());
});
it('assigns every authored top-level assembly to exactly one teaching group', () => {
  const buffer = readFileSync('public/assets/yaojing-s9-optimized.glb');
  const gltf = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
  const root = gltf.nodes.find((node: { name: string }) => node.name === 'EV_SUV');
  const names = teachingAssemblyGroups.flatMap((group) => [...group.names]);
  expect(new Set(names).size).toBe(names.length);
  expect([...names].sort()).toEqual(root.children.map((index: number) => gltf.nodes[index].name).sort());
});
