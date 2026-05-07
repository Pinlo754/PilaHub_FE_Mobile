export const BODY_PART_MAP: Record<string, string> = {
  core: "03947e6c-1dab-4de8-813b-95e5399727d8",
  chest: "1adf69ad-b700-413a-8872-80d55037703d",
  neck: "1deda87f-a098-4233-91f6-2b7f3a5f6237",
  feet: "1f995919-3fb8-4bc2-81ba-03ee3a2ab799",
  "lower back": "21c2d3b2-144a-44b6-990b-1380c3833546",
  ankles: "30e668ca-ae17-4289-8ff7-8d074a9efb15",
  "upper back": "35c83571-add2-4710-b7ef-f1b64bfc0a06",
  elbows: "41fb3948-c38b-439f-9c2b-9dd2564385e6",
  "thoracic spine": "4383309a-ee69-4726-8877-3f7d9929c785",
  "lumbar spine": "66da9c6f-bcfa-4e40-a0d9-2a49bb71d0de",
  shoulders: "6d54327d-f2f4-418d-a522-93fc1ac8b2f5",
  glutes: "7bc55727-903e-4bf3-8e47-c782bf851f21",
  arms: "8aee63c3-e88e-44dc-b66f-55b63cea68d0",
  "cervical spine": "8f9d6f09-4d96-4577-9ea6-fd07bedf647b",
  wrists: "95945cbd-9c7d-4ae2-9830-dd0c447094af",
  hips: "95998e0c-9b51-42ad-b78b-976132dfad9c",
  hands: "9b4a2a27-8f10-46a9-ab26-d99547b0ca45",
  forearms: "a942d98b-a75e-44aa-b030-17ccdb89c32d",
  knees: "a9fab00c-1131-4c72-b5a4-7302cd296545",
  thighs: "b994bbee-4072-4279-aa03-26cdff9733a2",
  "upper arms": "bf6c0f47-0dd7-4d88-85fc-cbca38eadb7b",
  calves: "d5998e97-98ef-4039-a4f5-a120a20d1388",
  head: "d981b262-2418-4c94-8906-2bbea7b50a97",
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