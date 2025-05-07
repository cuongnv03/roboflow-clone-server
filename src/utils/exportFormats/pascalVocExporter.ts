import { AnnotationResponseDTO } from "../../domain/dtos/annotation.dto";
import { ImageResponseDTO } from "../../domain/dtos/image.dto";
import { ClassResponseDTO } from "../../domain/dtos/class.dto";
import * as fs from "fs";
import * as path from "path";
import * as xml2js from "xml2js";

/**
 * Convert annotations to Pascal VOC XML format
 * One XML file per image
 */
export function convertToPascalVoc(
  images: ImageResponseDTO[],
  annotations: AnnotationResponseDTO[],
  classes: ClassResponseDTO[],
  outputDir: string,
): void {
  // Create output directory if it doesn't exist
  fs.mkdirSync(outputDir, { recursive: true });

  // Create subdirectories
  const annotationsDir = path.join(outputDir, "Annotations");
  const imagesDir = path.join(outputDir, "JPEGImages");
  const imageSetDir = path.join(outputDir, "ImageSets", "Main");

  fs.mkdirSync(annotationsDir, { recursive: true });
  fs.mkdirSync(imagesDir, { recursive: true });
  fs.mkdirSync(imageSetDir, { recursive: true });

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

  // Lists for image sets
  const allImages: string[] = [];

  // Process each image
  for (const image of images) {
    const imageAnnotations = annotationsByImage[image.id] || [];
    const imageName = path.basename(
      image.originalFilename,
      path.extname(image.originalFilename),
    );

    // Add to image set lists
    allImages.push(imageName);

    // Generate XML annotation for this image
    const xmlObject = {
      annotation: {
        folder: "JPEGImages",
        filename: image.originalFilename,
        path: path.join("JPEGImages", image.originalFilename),
        source: {
          database: "Roboflow Clone Export",
        },
        size: {
          width: image.width,
          height: image.height,
          depth: 3, // Assuming 3-channel RGB images
        },
        segmented: 0,
        object: imageAnnotations
          .filter((ann) => ann.data.type === "bbox")
          .map((ann) => {
            const { x, y, width, height } = ann.data.coordinates;
            return {
              name: classMap[ann.classId],
              pose: "Unspecified",
              truncated: 0,
              difficult: 0,
              bndbox: {
                xmin: Math.round(x),
                ymin: Math.round(y),
                xmax: Math.round(x + width),
                ymax: Math.round(y + height),
              },
            };
          }),
      },
    };

    // Convert to XML
    const builder = new xml2js.Builder();
    const xml = builder.buildObject(xmlObject);

    // Write XML to file
    fs.writeFileSync(path.join(annotationsDir, `${imageName}.xml`), xml);
  }

  // Create image set files
  fs.writeFileSync(path.join(imageSetDir, "all.txt"), allImages.join("\n"));

  // For each class, create a list of positive and negative examples
  for (const cls of classes) {
    const className = cls.name;
    const positiveExamples: string[] = [];
    const negativeExamples: string[] = [];

    for (const image of images) {
      const imageAnnotations = annotationsByImage[image.id] || [];
      const imageName = path.basename(
        image.originalFilename,
        path.extname(image.originalFilename),
      );

      const hasClass = imageAnnotations.some((ann) => ann.classId === cls.id);
      if (hasClass) {
        positiveExamples.push(`${imageName} 1`);
        negativeExamples.push(`${imageName} -1`);
      } else {
        positiveExamples.push(`${imageName} -1`);
        negativeExamples.push(`${imageName} 1`);
      }
    }

    // Write class-specific image sets
    fs.writeFileSync(
      path.join(imageSetDir, `${className}_pos.txt`),
      positiveExamples.join("\n"),
    );
    fs.writeFileSync(
      path.join(imageSetDir, `${className}_neg.txt`),
      negativeExamples.join("\n"),
    );
  }
}

/**
 * Prepare Pascal VOC directory structure with train/val/test splits
 */
export function preparePascalVocSplits(
  outputDir: string,
  splits: string[] = ["train", "val", "test"],
): void {
  const imageSetDir = path.join(outputDir, "ImageSets", "Main");
  fs.mkdirSync(imageSetDir, { recursive: true });

  // Create empty files for each split
  for (const split of splits) {
    fs.writeFileSync(path.join(imageSetDir, `${split}.txt`), "");
  }
}

/**
 * Add an image to a specific split
 */
export function addImageToPascalVocSplit(
  imageName: string,
  outputDir: string,
  split: string,
): void {
  const splitFile = path.join(outputDir, "ImageSets", "Main", `${split}.txt`);
  fs.appendFileSync(splitFile, imageName + "\n");
}
