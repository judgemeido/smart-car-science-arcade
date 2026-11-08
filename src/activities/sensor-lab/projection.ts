import type { MeterPoint } from './types';

/** Only the drawing scale changes. Beam angle and physics point stay identical. */
export function projectSensorScene(width: number, reflectivePoint: MeterPoint) {
  const mobile = width < 600; const height = mobile ? 320 : 370;
  const positive = reflectivePoint.x > 0;
  const origin = { x: mobile ? 75 : 130, y: positive ? (mobile ? 95 : 110) : reflectivePoint.x < 0 ? (mobile ? 205 : 260) : (mobile ? 190 : 205) };
  const maxY = mobile ? 178 : 267; const minY = 90;
  const widthScale = (width - origin.x - (mobile ? 65 : 190)) / reflectivePoint.y;
  const verticalScale = reflectivePoint.x < 0 ? (origin.y - minY) / -reflectivePoint.x : reflectivePoint.x > 0 ? (maxY - origin.y) / reflectivePoint.x : Infinity;
  const scale = Math.max(1, Math.min(widthScale, verticalScale));
  return { mobile, width, height, origin, scale,
    target: { x: origin.x + reflectivePoint.y * scale, y: origin.y + reflectivePoint.x * scale },
    receiver: { x: width - (mobile ? 60 : 80), y: mobile ? 270 : 283 },
    tx: { x: origin.x - 14, y: origin.y + 25 }, rx: { x: origin.x + 20, y: origin.y + 24 },
    loosePlug: { x: origin.x + 135, y: height - 26 },
  };
}
