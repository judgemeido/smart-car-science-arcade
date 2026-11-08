import * as THREE from 'three';
import type { FocusKey } from './data';

export const focusRoots: Record<Exclude<FocusKey, 'all'>, string[]> = {
  battery: ['BatteryPack'],
  cabin: ['Cabin'],
  adas: ['ADAS'],
};

export const isVehicleLightObject = (node: THREE.Object3D) => {
  let current: THREE.Object3D | null = node;
  while (current) {
    const nodeName = current.name.toLowerCase();
    if (
      /(tail|headlight|head_light|headlamp|lamp|light|brake|turnsignal|turn_signal|indicator|fog)/.test(
        nodeName,
      )
    )
      return true;
    current = current.parent;
  }
  return false;
};

export const isCabinBackgroundObject = (node: THREE.Object3D) => {
  let current: THREE.Object3D | null = node;
  while (current) {
    const nodeName = current.name.toLowerCase();
    if (
      /(^door(?:_|$)|glass|sill|pillar|luggage|wheelhouse|roofglazing|roof_glazing|bodystructure|exterior|paint|tailgate|hood|bumper|fender|quarter_panel)/.test(
        nodeName,
      )
    )
      return true;
    current = current.parent;
  }
  return false;
};

export const categoryForObject = (object: THREE.Object3D, key: Exclude<FocusKey, 'all'>) => {
  const rootNames = focusRoots[key];
  const name = object.name.toLowerCase();

  // Light assemblies are part of the vehicle shell, but they are not ADAS
  // hardware. Keep them out of the sensing layer so their emissive materials
  // cannot compete with the radar/ultrasonic overlays.
  if (key === 'adas' && isVehicleLightObject(object)) return false;
  if (key === 'cabin' && isCabinBackgroundObject(object)) return false;

  let current: THREE.Object3D | null = object;
  while (current) {
    if (rootNames.includes(current.name)) return true;
    current = current.parent;
  }
  if (key === 'battery') return /battery|hv_|coolant|module|pack/.test(name);
  if (key === 'cabin')
    return /cabin|seat_|console|display|screen|dashboard|steering|air_outlet|armrest|footwell|carpet|pedal|airbag|phone_charging|cupwell/.test(
      name,
    );
  return /adas|lidar|camera|radar|sensor|driver_display|center_display/.test(name);
};
