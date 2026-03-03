import { create } from 'zustand';

type RoadmapEntry = {
  roadmap: any;
  stages: any[];
  createdAt?: number;
};

type RoadmapState = {
  list: RoadmapEntry[];
  addRoadmap: (r: RoadmapEntry) => void;
  clearRoadmaps: () => void;
};

export const useRoadmapStore = create<RoadmapState>((set) => ({
  list: [],
  addRoadmap: (r) => set((s) => ({ list: [r, ...s.list] })),
  clearRoadmaps: () => set({ list: [] }),
}));

export type { RoadmapEntry };
