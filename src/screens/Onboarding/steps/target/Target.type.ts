export type TargetKey = string;

export interface TargetItem {
  key: string; // server id
  title: string; // display (we'll use vietnameseName)
  description?: string;
  icon?: string;
}