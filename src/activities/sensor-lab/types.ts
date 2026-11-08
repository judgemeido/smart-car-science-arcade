import type { DomainFact, Profile } from '../../shared/arcade';

export interface MeterPoint { readonly x: number; readonly y: number }
export interface SensorTarget {
  readonly id: string; readonly label: string; readonly reflectivePoint: MeterPoint;
  readonly distanceMeters: number; readonly bearingDegrees: number;
}
export interface SensorScenario {
  readonly seed: string; readonly profile: Profile; readonly contentVersion: string;
  readonly targets: readonly SensorTarget[];
  readonly objectives: readonly { id: string; weight: number }[];
  readonly angleStep: number; readonly halfAngleDegrees: number;
}
export type SensorStage = 'aim' | 'receive' | 'first-complete';
export type SensorAction = { type: 'aim'; degrees: number } | { type: 'fire' } |
  { type: 'select-cable' } | { type: 'connect'; socket: 'tx' | 'rx' } | { type: 'hint' };
export interface SensorRay {
  readonly degrees: number; readonly hit: boolean; readonly received: boolean;
  readonly reflectivePoint: MeterPoint | null;
}
export interface SensorState {
  readonly stage: SensorStage; readonly angleDegrees: number;
  readonly cableSelected: boolean; readonly connection: 'tx' | 'rx' | null;
  readonly pulseRevision: number; readonly echoRevision: number;
  readonly pulseHint: boolean; readonly echoHint: boolean;
  readonly ray: SensorRay | null; readonly shots: number;
  readonly feedback: string; readonly feedbackKind: 'neutral' | 'incorrect' | 'correct';
}
export interface SensorTransition { state: SensorState; facts: readonly DomainFact[] }
export interface SensorSnapshot extends SensorState {
  readonly target: SensorTarget;
  readonly measuredTargets: readonly {
    id: string; reflectivePoint: MeterPoint; distanceMeters: number;
    roundTripNanoseconds: number; uniqueSampleIds: readonly string[];
  }[];
}
