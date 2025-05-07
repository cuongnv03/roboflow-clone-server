import { AnnotationResponseDTO } from "../../domain/dtos/annotation.dto";
import { ImageResponseDTO } from "../../domain/dtos/image.dto";
import { ClassResponseDTO } from "../../domain/dtos/class.dto";
import * as fs from "fs";
import * as path from "path";

/**
 * Convert annotations to YOLO format
 * YOLO format: <class-id> <x-center> <y-center> <width> <height>
 * - All values are normalized to [0, 1]
 * - One file per image with the same name as the image
 * - Contains a classes.txt file with all class names
 */
export function convertToYolo(
  images: ImageResponseDTO[],
  annotations: AnnotationResponseDTO[],
  classes: ClassResponseDTO[],
  outputDir: string,
): void {
  // Create output directory if it doesn't exist
  fs.mkdirSync(outputDir, { recursive: true });

  // Create labels directory
  const labelsDir = path.join(outputDir, "labels");
  fs.mkdirSync(labelsDir, { recursive: true });

  // Create images directory
  const imagesDir = path.join(outputDir, "images");
  fs.mkdirSync(imagesDir, { recursive: true });

  // Create classes.txt
  const classesFile = path.join(outputDir, "classes.txt");
  const sortedClasses = [...classes].sort((a, b) => a.id - b.id);
  fs.writeFileSync(classesFile, sortedClasses.map((c) => c.name).join("\n"));

  // Write a dataset.yaml file for compatibility with YOLOv5/v8
  const yamlContent = `
path: ./
train: images/train
val: images/valid
test: images/test

nc: ${classes.length}
names: ${JSON.stringify(sortedClasses.map((c) => c.name))}
  `;
  fs.writeFileSync(path.join(outputDir, "dataset.yaml"), yamlContent);

  // Group annotations by image
  const annotationsByImage = annotations.reduce((acc, ann) => {
    if (!acc[ann.imageId]) {
      acc[ann.imageId] = [];
    }
    acc[ann.imageId].push(ann);
    return acc;
  }, {} as Record<number, AnnotationResponseDTO[]>);

  // Process each image
  for (const image of images) {
    const imageAnnotations = annotationsByImage[image.id] || [];

    // Skip images without annotations
    if (imageAnnotations.length === 0) {
      continue;
    }

    // Create label file for this image
    const labelFileName = path.join(
      labelsDir,
      path.basename(
        image.originalFilename,
        path.extname(image.originalFilename),
      ) + ".txt",
    );

    // Generate YOLO format annotations
    const yoloAnnotations: string[] = [];

    for (const annotation of imageAnnotations) {
      // Only process bounding box annotations
      if (annotation.data.type !== "bbox") {
        continue;
      }

      // Get class index (0-based in YOLO)
      const classIndex = sortedClasses.findIndex(
        (c) => c.id === annotation.classId,
      );
      if (classIndex === -1) continue;

      // Extract coordinates
      const { x, y, width, height } = annotation.data.coordinates;

      // Normalize coordinates to [0, 1]
      const xCenter = (x + width / 2) / image.width;
      const yCenter = (y + height / 2) / image.height;
      const normalizedWidth = width / image.width;
      const normalizedHeight = height / image.height;

      // Format: <class-id> <x-center> <y-center> <width> <height>
      yoloAnnotations.push(
        `${classIndex} ${xCenter.toFixed(6)} ${yCenter.toFixed(
          6,
        )} ${normalizedWidth.toFixed(6)} ${normalizedHeight.toFixed(6)}`,
      );
    }

    // Write to file
    fs.writeFileSync(labelFileName, yoloAnnotations.join("\n"));
  }
}

/**
 * Prepare directory structure for YOLO format with train/valid/test splits
 */
export function prepareYoloDirectoryStructure(
  outputDir: string,
  splits: string[] = ["train", "valid", "test"],
): void {
  // Create main directories
  fs.mkdirSync(outputDir, { recursive: true });

  // Create images directory with splits
  const imagesDir = path.join(outputDir, "images");
  fs.mkdirSync(imagesDir, { recursive: true });

  // Create labels directory with splits
  const labelsDir = path.join(outputDir, "labels");
  fs.mkdirSync(labelsDir, { recursive: true });

  // Create split directories
  for (const split of splits) {
    fs.mkdirSync(path.join(imagesDir, split), { recursive: true });
    fs.mkdirSync(path.join(labelsDir, split), { recursive: true });
  }
}

/**
 * Copy an image to the appropriate split directory
 */
export function copyImageToYoloSplit(
  imagePath: string,
  outputDir: string,
  split: string,
  annotations: AnnotationResponseDTO[],
  classes: ClassResponseDTO[],
  imageWidth: number,
  imageHeight: number,
): void {
  const imageFileName = path.basename(imagePath);
  const imageNameWithoutExt = path.basename(
    imageFileName,
    path.extname(imageFileName),
  );

  // Copy the image to the appropriate split directory
  const destImagePath = path.join(outputDir, "images", split, imageFileName);
  fs.copyFileSync(imagePath, destImagePath);

  // Create the label file if there are annotations
  if (annotations.length > 0) {
    const labelFilePath = path.join(
      outputDir,
      "labels",
      split,
      `${imageNameWithoutExt}.txt`,
    );
    const sortedClasses = [...classes].sort((a, b) => a.id - b.id);

    // Generate YOLO format annotations
    const yoloAnnotations: string[] = [];

    for (const annotation of annotations) {
      // Only process bounding box annotations
      if (annotation.data.type !== "bbox") {
        continue;
      }

      // Get class index (0-based in YOLO)
      const classIndex = sortedClasses.findIndex(
        (c) => c.id === annotation.classId,
      );
      if (classIndex === -1) continue;

      // Extract coordinates
      const { x, y, width, height } = annotation.data.coordinates;

      // Normalize coordinates to [0, 1]
      const xCenter = (x + width / 2) / imageWidth;
      const yCenter = (y + height / 2) / imageHeight;
      const normalizedWidth = width / imageWidth;
      const normalizedHeight = height / imageHeight;

      // Format: <class-id> <x-center> <y-center> <width> <height>
      yoloAnnotations.push(
        `${classIndex} ${xCenter.toFixed(6)} ${yCenter.toFixed(
          6,
        )} ${normalizedWidth.toFixed(6)} ${normalizedHeight.toFixed(6)}`,
      );
    }

    // Write to file
    fs.writeFileSync(labelFilePath, yoloAnnotations.join("\n"));
  }
}
