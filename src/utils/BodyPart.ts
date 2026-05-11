export const BODY_PART_MAP: Record<string, string> = {
  head: "aec743dd-0b9a-4a47-ac77-c58bdf98ac0e",
  neck: "a7c55af1-5cef-4636-99d0-eafcdecbb85c",
  "cervical spine": "73721b69-5d40-44ee-9173-5f62e20c667f",
  "thoracic spine": "406dffc1-e263-42c5-933a-73d4692b06f2",
  "lumbar spine": "8ed5dd35-4942-48df-9be2-ce344e78fdfb",
  core: "daa06238-fb00-438e-ae61-567259cd851f",
  shoulders: "86643abf-05c2-41be-b7f2-8e2e0b2252cd",
  "upper back": "6989617a-7264-41f7-954d-ef001c8fe011",
  "lower back": "3e8d69a3-c148-44aa-a5c0-cb3a5d81fab5",
  chest: "0fc2798f-6f7b-4a85-92e6-a099bda3f482",
  "upper arms": "38cfcee2-6d96-42f0-a619-ddf2516f61ba",
  elbows: "7cc0c31d-b86f-43e6-9844-561920defc19",
  forearms: "b7d3b218-3545-4fe9-9876-498039c34359",
  wrists: "28e31893-d0a7-4b8a-ae42-697511eb8110",
  hands: "74a77b0a-e9db-48a8-9872-458ba4bfa859",
  hips: "15ae87f1-166f-4dc0-bdeb-c172de42d964",
  glutes: "b641c6b4-f026-41fc-b398-9cac12171b8d",
  thighs: "d0f56b07-5fe3-41f0-8af6-7cda73dd8b1c",
  knees: "5ad0fee3-b72d-42b7-9008-fdfc91a0afad",
  calves: "e74c1432-1307-47f4-8072-0ba8012f1219",
  ankles: "2dee7fbd-89e8-41f1-b4f9-d1b88d7652f6",
  feet: "a90a23fc-2be1-476f-bd51-2a26387f2bef",
};

export const getBodyPartId = (name: string): string | null => {
  return BODY_PART_MAP[name.toLowerCase()] || null;
};

export const BODY_PART_VI_MAP: Record<string, string> = {
  core: "Cơ trung tâm",
  chest: "Ngực",
  neck: "Cổ",
  feet: "Bàn chân",
  "lower back": "Lưng dưới",
  ankles: "Mắt cá chân",
  "upper back": "Lưng trên",
  elbows: "Khuỷu tay",
  "thoracic spine": "Cột sống ngực",
  "lumbar spine": "Cột sống thắt lưng",
  shoulders: "Vai",
  glutes: "Mông",
  arms: "Cánh tay",
  "cervical spine": "Cột sống cổ",
  wrists: "Cổ tay",
  hips: "Hông",
  hands: "Bàn tay",
  forearms: "Cẳng tay",
  knees: "Đầu gối",
  thighs: "Đùi",
  "upper arms": "Bắp tay",
  calves: "Bắp chân",
  head: "Đầu",
};

export const getBodyPartVi = (name: string): string => {
  return BODY_PART_VI_MAP[name.toLowerCase()] || name;
};