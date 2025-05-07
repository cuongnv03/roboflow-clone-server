export interface AnnotationCreateDTO {
  imageId: number;
  classId: number;
  data: any; // JSON data describing annotations (bounding boxes, polygons, etc.)
}

export interface AnnotationResponseDTO {
  id: number;
  imageId: number;
  classId: number;
  className: string;
  classColor: string;
  data: any;
  createdAt: string;
  isValid: boolean;
}

export interface AnnotationUpdateDTO {
  classId?: number;
  data?: any;
  isValid?: boolean;
}

export interface BatchAnnotationDTO {
  imageId: number;
  annotations: Array<Omit<AnnotationCreateDTO, "imageId">>;
}
