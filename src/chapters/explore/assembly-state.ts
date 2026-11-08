export type AssemblyGroupId = 'chassis' | 'power' | 'body' | 'sensors';
export const teachingAssemblyGroups: readonly {
  readonly id: AssemblyGroupId;
  readonly label: string;
  readonly names: readonly string[];
}[] = [
  {
    id: 'chassis',
    label: '底盘系统',
    names: [
      'Brakes',
      'FrontSuspension',
      'RearSuspension',
      'Steering',
      'Wheel_FL',
      'Wheel_FR',
      'Wheel_RL',
      'Wheel_RR',
    ],
  },
  {
    id: 'power',
    label: '动力系统',
    names: ['BatteryPack', 'ChargeHV', 'FrontEaxle', 'RearEaxle', 'ThermalHVAC'],
  },
  {
    id: 'body',
    label: '车身与座舱',
    names: [
      'BodyStructure',
      'Cabin',
      'Door_FL',
      'Door_FR',
      'Door_RL',
      'Door_RR',
      'Exterior',
      'Hood',
      'RoofGlazing',
      'Tailgate',
    ],
  },
  { id: 'sensors', label: '智能设备', names: ['ADAS'] },
];
export interface AssemblyReturnState {
  readonly status: 'ready' | 'complete' | 'cancelled';
  readonly returnedGroups: readonly AssemblyGroupId[];
  readonly currentGroup: AssemblyGroupId | null;
  readonly progress: number;
}
export function createAssemblyReturnState(): AssemblyReturnState {
  return { status: 'ready', returnedGroups: [], currentGroup: null, progress: 0 };
}
export function reduceAssemblyReturn(
  state: AssemblyReturnState,
  action: 'next' | 'cancel' | 'reset',
): AssemblyReturnState {
  if (action === 'reset') return createAssemblyReturnState();
  if (state.status !== 'ready') return state;
  if (action === 'cancel') return { ...state, status: 'cancelled', currentGroup: null };
  if (state.currentGroup) return state;
  const group = teachingAssemblyGroups[state.returnedGroups.length];
  return group ? { ...state, currentGroup: group.id, progress: 0 } : state;
}
export function stepAssemblyReturn(state: AssemblyReturnState, deltaSeconds: number): AssemblyReturnState {
  if (state.status !== 'ready' || !state.currentGroup || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0)
    return state;
  const progress = Math.min(1, state.progress + deltaSeconds);
  if (progress < 1) return { ...state, progress };
  const returnedGroups = [...state.returnedGroups, state.currentGroup];
  return {
    ...state,
    returnedGroups,
    currentGroup: null,
    progress: 1,
    status: returnedGroups.length === teachingAssemblyGroups.length ? 'complete' : 'ready',
  };
}
