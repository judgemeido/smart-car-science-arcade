export const sensorObjectives = [
  { id: 'pulse-hit', weight: 150 }, { id: 'echo-received', weight: 100 },
  { id: 'outline-evidence', weight: 150 }, { id: 'nearest-mark', weight: 200 },
  { id: 'sensor-evidence', weight: 200 }, { id: 'risk-response', weight: 200 },
] as const;
export const sensorObjectiveLabels = {
  'pulse-hit': '光碰到目标', 'echo-received': '接住回波',
  'outline-evidence': '拼出轮廓', 'nearest-mark': '标记最近目标',
  'sensor-evidence': '配合观察证据', 'risk-response': '应用观察方案',
};
