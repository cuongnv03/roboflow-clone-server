import { AnnotationResponseDTO } from "../../domain/dtos/annotation.dto";
import { ImageResponseDTO } from "../../domain/dtos/image.dto";
import { ClassResponseDTO } from "../../domain/dtos/class.dto";
import * as fs from "fs";
import * as path from "path";

/**
 * Convert annotations to TensorFlow TFRecord compatible format (first as JSON)
 * Will output a JSON file that can be converted to TFRecord
 */
export function convertToTensorflow(
  images: ImageResponseDTO[],
  annotations: AnnotationResponseDTO[],
  classes: ClassResponseDTO[],
  outputDir: string,
): void {
  // Create output directory if it doesn't exist
  fs.mkdirSync(outputDir, { recursive: true });

  // Create label map file
  const labelMapPath = path.join(outputDir, "label_map.pbtxt");
  let labelMapContent = "";

  classes.forEach((cls, index) => {
    labelMapContent += `item {\n  id: ${index + 1}\n  name: '${cls.name}'\n}\n`;
  });

  fs.writeFileSync(labelMapPath, labelMapContent);

  // Group annotations by image
  const annotationsByImage = annotations.reduce((acc, ann) => {
    if (!acc[ann.imageId]) {
      acc[ann.imageId] = [];
    }
    acc[ann.imageId].push(ann);
    return acc;
  }, {} as Record<number, AnnotationResponseDTO[]>);

  // Create a map from class ID to class index (1-based for TensorFlow)
  const classMap = classes.reduce((acc, cls, index) => {
    acc[cls.id] = index + 1;
    return acc;
  }, {} as Record<number, number>);

  // Create TensorFlow examples
  const tfExamples = [];

  for (const image of images) {
    const imageAnnotations = annotationsByImage[image.id] || [];

    // Skip images without annotations
    if (imageAnnotations.length === 0) {
      continue;
    }

    // Filter for bbox annotations
    const bboxAnnotations = imageAnnotations.filter(
      (ann) => ann.data.type === "bbox",
    );

    if (bboxAnnotations.length === 0) {
      continue;
    }

    // Create TF Example
    const tfExample = {
      filename: image.originalFilename,
      image_path: image.filePath,
      width: image.width,
      height: image.height,
      image_format: path.extname(image.originalFilename).substring(1), // Remove dot
      xmins: [],
      xmaxs: [],
      ymins: [],
      ymaxs: [],
      classes_text: [],
      classes: [],
    };

    // Add all annotations
    for (const ann of bboxAnnotations) {
      const { x, y, width, height } = ann.data.coordinates;

      // TensorFlow uses normalized coordinates [0, 1]
      tfExample.xmins.push(x / image.width);
      tfExample.ymins.push(y / image.height);
      tfExample.xmaxs.push((x + width) / image.width);
      tfExample.ymaxs.push((y + height) / image.height);

      const className =
        classes.find((c) => c.id === ann.classId)?.name || "unknown";
      tfExample.classes_text.push(className);
      tfExample.classes.push(classMap[ann.classId]);
    }

    tfExamples.push(tfExample);
  }

  // Write the TF Examples to a JSON file (this would be converted to TFRecord in a real implementation)
  fs.writeFileSync(
    path.join(outputDir, "tf_examples.json"),
    JSON.stringify(tfExamples, null, 2),
  );

  // Write a README explaining that this is an intermediate format
  fs.writeFileSync(
    path.join(outputDir, "README.txt"),
    `This directory contains the TensorFlow Object Detection API compatible format.
    
- label_map.pbtxt: Class definition file
- tf_examples.json: Intermediate format that can be converted to TFRecord

In a production environment, you would use this data to generate TFRecord files.
`,
  );
}

/**
 * Helper function to create TensorFlow directory structure for train/val/test splits
 */
export function prepareTensorflowSplits(
  outputDir: string,
  splits: string[] = ["train", "val", "test"],
): void {
  // Create base directory
  fs.mkdirSync(outputDir, { recursive: true });

  // Create directories for each split
  for (const split of splits) {
    fs.mkdirSync(path.join(outputDir, split), { recursive: true });
  }
}

/**
 * Add TensorFlow examples to a specific split
 */
export function addExamplesToTensorflowSplit(
  examples: any[],
  outputDir: string,
  split: string,
): void {
  const splitFile = path.join(outputDir, split, "examples.json");
  fs.writeFileSync(splitFile, JSON.stringify(examples, null, 2));
}
