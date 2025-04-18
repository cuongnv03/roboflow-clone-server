export interface ClassCreateDTO {
  name: string;
  color?: string;
}

export interface ClassResponseDTO {
  id: number;
  projectId: number;
  name: string;
  color: string;
  createdAt: string;
}

export interface ClassUpdateDTO {
  name?: string;
  color?: string;
}
