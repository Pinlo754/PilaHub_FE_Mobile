export type TargetKey =
  | 'lose_weight'
  | 'gain_muscle'
  | 'maintain'
  | 'healthy';

export interface TargetItem {
  key: TargetKey;
  title: string;
  description: string;
  icon: string;
}