export type EquipmentType = {
  equipmentId: string;
  name: string;
  description: string;
  imageUrl: string;
};

export type ExerciseEquipment = {
  exerciseEquipmentId: string;
  exerciseId: string;
  equipmentId: string;
  equipmentName: string;
  required: boolean;
  alternative: boolean;
  quantity: number;
  usageNotes: string;
};
