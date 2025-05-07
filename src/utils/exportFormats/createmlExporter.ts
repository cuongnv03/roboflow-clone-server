import { AnnotationResponseDTO } from "../../domain/dtos/annotation.dto";
import { ImageResponseDTO } from "../../domain/dtos/image.dto";
import { ClassResponseDTO } from "../../domain/dtos/class.dto";
import * as fs from "fs";
import * as path from "path";

interface CreateMLAnnotation {
  image: string;
  annotations?: Array<{
    label: string;
    coordinates: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  label?: string; // For classification
}

/**
 * Convert annotations to CreateML JSON format
 * CreateML uses a single JSON file for all annotations
 */
export function convertToCreateML(
  images: ImageResponseDTO[],
  annotations: AnnotationResponseDTO[],
  classes: ClassResponseDTO[],
  outputDir: string,
  projectType: string = "object_detection",
): void {
  // Create output directory if it doesn't exist
  fs.mkdirSync(outputDir, { recursive: true });

  // Group annotations by image
  const annotationsByImage = annotations.reduce((acc, ann) => {
    if (!acc[ann.imageId]) {
      acc[ann.imageId] = [];
    }
    acc[ann.imageId].push(ann);
    return acc;
  }, {} as Record<number, AnnotationResponseDTO[]>);

  // Create a map from class ID to class name
  const classMap = classes.reduce((acc, cls) => {
    acc[cls.id] = cls.name;
    return acc;
  }, {} as Record<number, string>);

  // For each split, create a separate JSON file
  const createMLAnnotations: CreateMLAnnotation[] = [];

  // Process each image
  for (const image of images) {
    const imageAnnotations = annotationsByImage[image.id] || [];
    const imagePath = image.filePath;

    if (projectType === "object_detection") {
      // Object detection format
      const createMLAnnotation: CreateMLAnnotation = {
        image: imagePath,
        annotations: imageAnnotations
          .filter((ann) => ann.data.type === "bbox")
          .map((ann) => {
            const { x, y, width, height } = ann.data.coordinates;

            // CreateML expects center coordinates
            const centerX = x + width / 2;
            const centerY = y + height / 2;

            return {
              label: classMap[ann.classId],
              coordinates: {
                x: centerX,
                y: centerY,
                width,
                height,
              },
            };
          }),
      };

      if (
        createMLAnnotation.annotations &&
        createMLAnnotation.annotations.length > 0
      ) {
        createMLAnnotations.push(createMLAnnotation);
      }
    } else if (projectType === "classification") {
      // Classification format - use the first class associated with the image
      if (imageAnnotations.length > 0) {
        const firstAnnotation = imageAnnotations[0];
        createMLAnnotations.push({
          image: imagePath,
          label: classMap[firstAnnotation.classId],
        });
      }
    }
  }

  // Write the CreateML JSON file
  fs.writeFileSync(
    path.join(outputDir, "annotations.json"),
    JSON.stringify(createMLAnnotations, null, 2),
  );
}

/**
 * Split CreateML annotations by train/validation/test
 */
export function splitCreateMLAnnotations(
  annotations: CreateMLAnnotation[],
  outputDir: string,
  splits: Record<string, number[]>, // Map of split name to image IDs
): void {
  // Create output directory if it doesn't exist
  fs.mkdirSync(outputDir, { recursive: true });

  // Process each split
  for (const [splitName, imageIds] of Object.entries(splits)) {
    const splitAnnotations = annotations.filter((ann) =>
      imageIds.includes(parseInt(path.basename(ann.image).split("-")[0])),
    );

    // Write the split JSON file
    fs.writeFileSync(
      path.join(outputDir, `${splitName}.json`),
      JSON.stringify(splitAnnotations, null, 2),
    );
  }
}
