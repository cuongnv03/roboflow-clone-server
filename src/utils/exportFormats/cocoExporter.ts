import { AnnotationResponseDTO } from "../../domain/dtos/annotation.dto";
import { ImageResponseDTO } from "../../domain/dtos/image.dto";
import { ClassResponseDTO } from "../../domain/dtos/class.dto";
import * as fs from "fs";
import * as path from "path";

export interface CocoCategory {
  id: number;
  name: string;
  supercategory: string;
}

export interface CocoImage {
  id: number;
  width: number;
  height: number;
  file_name: string;
  license?: number;
  flickr_url?: string;
  coco_url?: string;
  date_captured?: string;
}

export interface CocoAnnotation {
  id: number;
  image_id: number;
  category_id: number;
  segmentation?: number[][];
  area: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
  iscrowd: number;
}

export interface CocoSegmentation {
  counts: string;
  size: [number, number];
}

export interface CocoOutput {
  info: {
    description: string;
    url: string;
    version: string;
    year: number;
    contributor: string;
    date_created: string;
  };
  licenses: Array<{
    id: number;
    name: string;
    url: string;
  }>;
  images: CocoImage[];
  annotations: CocoAnnotation[];
  categories: CocoCategory[];
}

/**
 * Convert annotations to COCO format
 *
 * @param images List of images
 * @param annotations List of annotations
 * @param classes List of classes
 * @returns COCO format data
 */
export function convertToCoco(
  images: ImageResponseDTO[],
  annotations: AnnotationResponseDTO[],
  classes: ClassResponseDTO[],
): CocoOutput {
  // Create COCO format output
  const cocoOutput: CocoOutput = {
    info: {
      description: "Exported from Roboflow Clone",
      url: "",
      version: "1.0",
      year: new Date().getFullYear(),
      contributor: "Roboflow Clone",
      date_created: new Date().toISOString(),
    },
    licenses: [
      {
        id: 1,
        name: "Unknown",
        url: "",
      },
    ],
    images: [],
    annotations: [],
    categories: [],
  };

  // Map classes to COCO categories
  cocoOutput.categories = classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
    supercategory: "object",
  }));

  // Map images to COCO images
  cocoOutput.images = images.map((img) => ({
    id: img.id,
    width: img.width,
    height: img.height,
    file_name: img.originalFilename,
    date_captured: img.uploadDate,
  }));

  // Map annotations to COCO annotations
  let annotationId = 1;
  cocoOutput.annotations = annotations
    .filter((ann) => {
      // Process based on annotation type
      const data = ann.data;
      return (
        data &&
        (data.type === "bbox" ||
          data.type === "polygon" ||
          data.type === "keypoints")
      );
    })
    .map((ann) => {
      if (ann.data.type === "bbox") {
        const bbox = ann.data.coordinates;
        // Calculate area
        const area = bbox.width * bbox.height;

        return {
          id: annotationId++,
          image_id: ann.imageId,
          category_id: ann.classId,
          area,
          bbox: [bbox.x, bbox.y, bbox.width, bbox.height] as [
            number,
            number,
            number,
            number,
          ],
          iscrowd: 0,
        };
      } else if (ann.data.type === "polygon") {
        // Process polygon annotations (for instance segmentation)
        const polygon = ann.data.coordinates;

        // Flatten polygon points for COCO format [x1,y1,x2,y2,...]
        const segmentation = [polygon.flatMap((point) => [point.x, point.y])];

        // Calculate approximate area using polygon points
        const area = calculatePolygonArea(polygon);

        // Calculate bounding box from polygon points
        const bbox = calculateBboxFromPolygon(polygon);

        return {
          id: annotationId++,
          image_id: ann.imageId,
          category_id: ann.classId,
          segmentation,
          area,
          bbox: [bbox.x, bbox.y, bbox.width, bbox.height] as [
            number,
            number,
            number,
            number,
          ],
          iscrowd: 0,
        };
      } else if (ann.data.type === "keypoints") {
        // Process keypoint annotations
        const keypoints = ann.data.coordinates;

        // Calculate bounding box from keypoints
        const bbox = calculateBboxFromKeypoints(keypoints);
        const area = bbox.width * bbox.height;

        // Format keypoints as [x1,y1,v1,x2,y2,v2,...] where v is visibility
        const keypointsArray = keypoints.flatMap((point) => [
          point.x,
          point.y,
          point.visible ? 2 : 1, // 2 = visible, 1 = not visible but labeled, 0 = not labeled
        ]);

        const result: any = {
          id: annotationId++,
          image_id: ann.imageId,
          category_id: ann.classId,
          area,
          bbox: [bbox.x, bbox.y, bbox.width, bbox.height] as [
            number,
            number,
            number,
            number,
          ],
          iscrowd: 0,
          num_keypoints: keypoints.length,
          keypoints: keypointsArray,
        };

        return result;
      }

      // This should never happen due to the filter above
      return null;
    })
    .filter(Boolean) as CocoAnnotation[];

  return cocoOutput;
}

/**
 * Prepare directory structure for COCO format
 *
 * @param outputDir Base output directory
 * @param splits Array of splits to prepare (e.g. ["train", "val", "test"])
 */
export function prepareCocoDirectoryStructure(
  outputDir: string,
  splits: string[] = ["train", "valid", "test"],
): void {
  // Create base directory
  fs.mkdirSync(outputDir, { recursive: true });

  // Create annotations directory
  const annotationsDir = path.join(outputDir, "annotations");
  fs.mkdirSync(annotationsDir, { recursive: true });

  // Create directory for each split
  for (const split of splits) {
    fs.mkdirSync(path.join(outputDir, split), { recursive: true });
  }
}

/**
 * Write COCO format data to disk with split support
 *
 * @param cocoData COCO format data
 * @param outputDir Output directory
 * @param splitField Optional field name in the image data that contains split information
 */
export function writeCocoFiles(
  cocoData: CocoOutput,
  outputDir: string,
  splitField?: string,
): void {
  // Create annotations directory if it doesn't exist
  const annotationsDir = path.join(outputDir, "annotations");
  fs.mkdirSync(annotationsDir, { recursive: true });

  // Write complete annotation file
  fs.writeFileSync(
    path.join(annotationsDir, "instances.json"),
    JSON.stringify(cocoData, null, 2),
  );

  // Process splits if splitField is provided
  if (
    splitField &&
    cocoData.images.length > 0 &&
    splitField in cocoData.images[0]
  ) {
    // Group images by split
    const imagesBySplit: Record<string, CocoImage[]> = {};

    for (const image of cocoData.images) {
      const split = (image as any)[splitField];
      if (!split) continue;

      if (!imagesBySplit[split]) {
        imagesBySplit[split] = [];
      }
      imagesBySplit[split].push(image);
    }

    // For each split, create a separate annotation file
    for (const [split, splitImages] of Object.entries(imagesBySplit)) {
      if (splitImages.length === 0) continue;

      // Get image IDs for this split
      const imageIds = new Set(splitImages.map((img) => img.id));

      // Filter annotations for this split
      const splitAnnotations = cocoData.annotations.filter((ann) =>
        imageIds.has(ann.image_id),
      );

      // Create split-specific COCO data
      const splitCocoData = {
        ...cocoData,
        images: splitImages,
        annotations: splitAnnotations,
      };

      // Write split annotation file
      fs.writeFileSync(
        path.join(annotationsDir, `instances_${split}.json`),
        JSON.stringify(splitCocoData, null, 2),
      );
    }
  }
}

/**
 * Copy images to appropriate directories based on split
 *
 * @param images List of images with paths
 * @param outputDir Base output directory
 * @param splitField Field name in the image data that contains split information
 * @param baseImagesDir Base directory where original images are stored
 */
export function copyImagesToCocoDirectories(
  images: any[],
  outputDir: string,
  splitField: string,
  baseImagesDir: string = "",
): void {
  for (const image of images) {
    const split = image[splitField];
    if (!split) continue;

    // Create split directory if it doesn't exist
    const splitDir = path.join(outputDir, split);
    fs.mkdirSync(splitDir, { recursive: true });

    // Determine source and destination paths
    let sourcePath: string;
    if (baseImagesDir) {
      sourcePath = path.join(baseImagesDir, image.file_path);
    } else {
      sourcePath = image.file_path.startsWith("/")
        ? path.join(process.cwd(), image.file_path.substring(1))
        : path.join(process.cwd(), image.file_path);
    }

    const destPath = path.join(splitDir, path.basename(image.file_name));

    // Copy the file if it exists
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
    } else {
      console.warn(`Image not found: ${sourcePath}`);
    }
  }
}

/**
 * Generate COCO dataset with splits
 *
 * @param images List of images
 * @param annotations List of annotations
 * @param classes List of classes
 * @param outputDir Output directory
 * @param splits Map of split name to array of image IDs
 * @param includeImages Whether to copy images to output directory
 * @param baseImagesDir Base directory where original images are stored
 */
export function generateCocoDataset(
  images: ImageResponseDTO[],
  annotations: AnnotationResponseDTO[],
  classes: ClassResponseDTO[],
  outputDir: string,
  splits: Record<string, number[]>,
  includeImages: boolean = true,
  baseImagesDir: string = "",
): void {
  // Add split information to images
  const imagesWithSplits = images.map((img) => {
    let split = "unknown";
    for (const [splitName, imageIds] of Object.entries(splits)) {
      if (imageIds.includes(img.id)) {
        split = splitName;
        break;
      }
    }
    return { ...img, split };
  });

  // Convert to COCO format
  const cocoData = convertToCoco(imagesWithSplits, annotations, classes);

  // Prepare directory structure
  prepareCocoDirectoryStructure(outputDir, Object.keys(splits));

  // Write COCO files
  writeCocoFiles(cocoData, outputDir, "split");

  // Copy images if requested
  if (includeImages) {
    copyImagesToCocoDirectories(
      cocoData.images.map((img) => ({
        ...img,
        file_path: imagesWithSplits.find((i) => i.id === img.id)?.filePath,
      })),
      outputDir,
      "split",
      baseImagesDir,
    );
  }
}

/**
 * Calculate area of a polygon
 *
 * @param polygon Array of points {x, y}
 * @returns Area of the polygon
 */
function calculatePolygonArea(
  polygon: Array<{ x: number; y: number }>,
): number {
  let area = 0;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    area += (polygon[j].x + polygon[i].x) * (polygon[j].y - polygon[i].y);
  }
  return Math.abs(area / 2);
}

/**
 * Calculate bounding box from polygon points
 *
 * @param polygon Array of points {x, y}
 * @returns Bounding box {x, y, width, height}
 */
function calculateBboxFromPolygon(polygon: Array<{ x: number; y: number }>): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const xs = polygon.map((point) => point.x);
  const ys = polygon.map((point) => point.y);

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculate bounding box from keypoints
 *
 * @param keypoints Array of keypoints {x, y, visible}
 * @returns Bounding box {x, y, width, height}
 */
function calculateBboxFromKeypoints(
  keypoints: Array<{ x: number; y: number; visible: boolean; name?: string }>,
): { x: number; y: number; width: number; height: number } {
  // Filter visible keypoints
  const visibleKeypoints = keypoints.filter((kp) => kp.visible);

  if (visibleKeypoints.length === 0) {
    // If no visible keypoints, use all keypoints
    const xs = keypoints.map((kp) => kp.x);
    const ys = keypoints.map((kp) => kp.y);

    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  } else {
    // If there are visible keypoints, use only those
    const xs = visibleKeypoints.map((kp) => kp.x);
    const ys = visibleKeypoints.map((kp) => kp.y);

    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
}
