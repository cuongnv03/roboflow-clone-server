import { IExportService } from "../IExportService";
import { IDatasetRepository } from "../../repositories/IDatasetRepository";
import { IProjectRepository } from "../../repositories/IProjectRepository";
import { IImageRepository } from "../../repositories/IImageRepository";
import { IAnnotationRepository } from "../../repositories/IAnnotationRepository";
import { IClassRepository } from "../../repositories/IClassRepository";
import { IStorageProvider } from "../../../infrastructure/storage/interfaces/IStorageProvider";
import {
  DatasetExportOptionsDTO,
  DatasetExportResultDTO,
} from "../../dtos/dataset.dto";
import { convertToCoco } from "../../../utils/exportFormats/cocoExporter";
import {
  convertToYolo,
  prepareYoloDirectoryStructure,
} from "../../../utils/exportFormats/yoloExporter";
import {
  convertToPascalVoc,
  preparePascalVocSplits,
} from "../../../utils/exportFormats/pascalVocExporter";
import { convertToCreateML } from "../../../utils/exportFormats/createmlExporter";
import {
  convertToTensorflow,
  prepareTensorflowSplits,
} from "../../../utils/exportFormats/tensorflowExporter";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import xml2js from "xml2js";
import { v4 as uuidv4 } from "uuid";
import { ProjectType } from "../../../database/models/Project";
import { NotFoundError } from "../../../exceptions/NotFoundError";
import { InvalidRequestError } from "../../../exceptions/InvalidRequestError";
import { DatasetSplit } from "../../../database/models/DatasetImage";

interface AnnotationMap {
  [key: number]: any[];
}

export class ExportService implements IExportService {
  constructor(
    private datasetRepository: IDatasetRepository,
    private projectRepository: IProjectRepository,
    private imageRepository: IImageRepository,
    private annotationRepository: IAnnotationRepository,
    private classRepository: IClassRepository,
    private storageProvider: IStorageProvider,
  ) {}

  async exportDataset(
    datasetId: number,
    userId: number,
    options: DatasetExportOptionsDTO,
  ): Promise<DatasetExportResultDTO> {
    // Get the dataset
    const dataset = await this.datasetRepository.findById(datasetId);

    // Verify project ownership
    const project = await this.projectRepository.findById(dataset.project_id);
    await this.projectRepository.verifyOwnership(dataset.project_id, userId);

    // Get dataset images for the specified splits
    const imageAssignments: Array<{ id: number; split: string }> = [];
    for (const split of options.exportSplits) {
      const splitImages = await this.datasetRepository.getDatasetImages(
        datasetId,
        split as DatasetSplit,
      );
      imageAssignments.push(...splitImages.map((img) => ({ ...img, split })));
    }

    if (imageAssignments.length === 0) {
      throw new InvalidRequestError("No images found for the specified splits");
    }

    // Get the actual images, annotations, and classes
    const imageIds = imageAssignments.map((img) => img.id);

    const images = await Promise.all(
      imageIds.map((id) => this.imageRepository.findById(id)),
    );

    const classes = await this.classRepository.findByProjectId(
      dataset.project_id,
    );

    // Get annotations for all images
    const annotationsByImage = {};
    for (const imageId of imageIds) {
      const imageAnnotations = await this.annotationRepository.findByImageId(
        imageId,
      );
      const annotationsByImage: AnnotationMap = {};
    }

    // Create a temporary directory for the export
    const exportId = uuidv4();
    const exportDir = path.join(process.cwd(), "temp", "exports", exportId);
    fs.mkdirSync(exportDir, { recursive: true });

    // Determine which export format to use
    let formatDir: string;

    try {
      switch (options.format) {
        case "coco":
          formatDir = path.join(exportDir, "coco");
          fs.mkdirSync(formatDir, { recursive: true });

          // Create COCO dataset structure
          const cocoData = {
            images: [],
            annotations: [],
            categories: [],
          };

          // Map images to COCO format
          const imageMap = {};
          images.forEach((img, index) => {
            // Get dataset split for this image
            const assignment = imageAssignments.find(
              (a) => a.id === img.image_id,
            );
            const split = assignment ? assignment.split : "train";

            // Map to COCO image format
            const cocoImage = {
              id: img.image_id,
              width: img.width,
              height: img.height,
              file_name: img.original_filename,
              license: 1,
              flickr_url: "",
              coco_url: "",
              date_captured: img.upload_date.toISOString().split("T")[0],
              split, // Custom field for split information
            };

            cocoData.images.push(cocoImage);
            interface ImageMap {
              [key: number]: number;
            }
            const imageMap: ImageMap = {};

            // Copy image to appropriate directory if requested
            if (options.includeImages) {
              const imagesDir = path.join(formatDir, "images", split);
              fs.mkdirSync(imagesDir, { recursive: true });

              // Copy image from storage to export directory
              if (fs.existsSync(path.join(process.cwd(), img.file_path))) {
                const destPath = path.join(imagesDir, img.original_filename);
                fs.copyFileSync(
                  path.join(process.cwd(), img.file_path),
                  destPath,
                );
              }
            }
          });

          // Map classes to COCO categories
          classes.forEach((cls) => {
            cocoData.categories.push({
              id: cls.class_id,
              name: cls.name,
              supercategory: "object",
            });
          });

          // Map annotations to COCO format
          let annotationId = 1;
          for (const imageId of imageIds) {
            const imageAnns = annotationsByImage[imageId] || [];
            const img = images.find((i) => i.image_id === imageId);

            if (!img) continue;

            for (const ann of imageAnns) {
              // Only process bbox annotations for now
              if (ann.annotation_data.type !== "bbox") continue;

              const bbox = ann.annotation_data.coordinates;
              const area = bbox.width * bbox.height;

              const cocoAnn = {
                id: annotationId++,
                image_id: imageId,
                category_id: ann.class_id,
                bbox: [bbox.x, bbox.y, bbox.width, bbox.height],
                area: area,
                segmentation: [],
                iscrowd: 0,
              };

              cocoData.annotations.push(cocoAnn);
            }
          }

          // Write COCO JSON files
          // 1. Write a complete annotations file
          fs.writeFileSync(
            path.join(formatDir, "annotations.json"),
            JSON.stringify(
              {
                info: {
                  year: new Date().getFullYear(),
                  version: "1.0",
                  description: "Exported from Roboflow Clone",
                  contributor: "Roboflow Clone",
                  url: "",
                  date_created: new Date().toISOString(),
                },
                licenses: [
                  {
                    id: 1,
                    name: "Unknown License",
                    url: "",
                  },
                ],
                ...cocoData,
              },
              null,
              2,
            ),
          );

          // 2. Write split-specific annotation files
          const splits = ["train", "valid", "test"];
          for (const split of splits) {
            const splitImages = cocoData.images.filter(
              (img) => img.split === split,
            );
            const splitImageIds = new Set(splitImages.map((img) => img.id));
            const splitAnnotations = cocoData.annotations.filter((ann) =>
              splitImageIds.has(ann.image_id),
            );

            if (splitImages.length > 0) {
              fs.writeFileSync(
                path.join(formatDir, `annotations_${split}.json`),
                JSON.stringify(
                  {
                    images: splitImages,
                    annotations: splitAnnotations,
                    categories: cocoData.categories,
                  },
                  null,
                  2,
                ),
              );
            }
          }
          break;

        case "yolo":
          formatDir = path.join(exportDir, "yolo");

          // Prepare YOLO directory structure
          prepareYoloDirectoryStructure(
            formatDir,
            options.exportSplits as string[],
          );

          // Map classes to YOLO class list
          const sortedClasses = [...classes].sort(
            (a, b) => a.class_id - b.class_id,
          );
          fs.writeFileSync(
            path.join(formatDir, "classes.txt"),
            sortedClasses.map((c) => c.name).join("\n"),
          );

          // Write a dataset.yaml file for compatibility with YOLOv5/v8
          const yamlContent = `
path: ./
train: ${options.exportSplits.includes("train") ? "images/train" : ""}
val: ${options.exportSplits.includes("valid") ? "images/valid" : ""}
test: ${options.exportSplits.includes("test") ? "images/test" : ""}

nc: ${classes.length}
names: ${JSON.stringify(sortedClasses.map((c) => c.name))}
          `;
          fs.writeFileSync(path.join(formatDir, "dataset.yaml"), yamlContent);

          // Process each image
          for (const img of images) {
            // Get dataset split for this image
            const assignment = imageAssignments.find(
              (a) => a.id === img.image_id,
            );
            if (!assignment) continue;

            // Get annotations for this image
            const imageAnns = annotationsByImage[img.image_id] || [];
            if (imageAnns.length === 0) continue;

            // Create a base filename without extension
            const baseFileName = path.basename(
              img.original_filename,
              path.extname(img.original_filename),
            );

            // Generate YOLO annotation file
            const yoloAnnotations = [];

            for (const ann of imageAnns) {
              // Only process bbox annotations
              if (ann.annotation_data.type !== "bbox") continue;

              // Get class index (0-based in YOLO)
              const classIndex = sortedClasses.findIndex(
                (c) => c.class_id === ann.class_id,
              );
              if (classIndex === -1) continue;

              // Extract coordinates
              const { x, y, width, height } = ann.annotation_data.coordinates;

              // Normalize coordinates to [0, 1]
              const xCenter = (x + width / 2) / img.width;
              const yCenter = (y + height / 2) / img.height;
              const normalizedWidth = width / img.width;
              const normalizedHeight = height / img.height;

              // Format: <class-id> <x-center> <y-center> <width> <height>
              yoloAnnotations.push(
                `${classIndex} ${xCenter.toFixed(6)} ${yCenter.toFixed(
                  6,
                )} ${normalizedWidth.toFixed(6)} ${normalizedHeight.toFixed(
                  6,
                )}`,
              );
            }

            // Write label file
            fs.writeFileSync(
              path.join(
                formatDir,
                "labels",
                assignment.split,
                `${baseFileName}.txt`,
              ),
              yoloAnnotations.join("\n"),
            );

            // Copy image if requested
            if (options.includeImages) {
              if (fs.existsSync(path.join(process.cwd(), img.file_path))) {
                const destPath = path.join(
                  formatDir,
                  "images",
                  assignment.split,
                  path.basename(img.file_path),
                );
                fs.copyFileSync(
                  path.join(process.cwd(), img.file_path),
                  destPath,
                );
              }
            }
          }
          break;

        case "pascal_voc":
          formatDir = path.join(exportDir, "pascal_voc");

          // Prepare Pascal VOC directory structure
          preparePascalVocSplits(formatDir, options.exportSplits as string[]);

          // Create base directories
          const annotationsDir = path.join(formatDir, "Annotations");
          const imagesDir = path.join(formatDir, "JPEGImages");
          const imageSetDir = path.join(formatDir, "ImageSets", "Main");

          fs.mkdirSync(annotationsDir, { recursive: true });
          fs.mkdirSync(imagesDir, { recursive: true });
          fs.mkdirSync(imageSetDir, { recursive: true });

          // Process each image
          for (const img of images) {
            // Get dataset split for this image
            const assignment = imageAssignments.find(
              (a) => a.id === img.image_id,
            );
            if (!assignment) continue;

            // Get annotations for this image
            const imageAnns = annotationsByImage[img.image_id] || [];

            // Create a base filename without extension
            const baseFileName = path.basename(
              img.original_filename,
              path.extname(img.original_filename),
            );

            // Generate VOC XML annotation
            const objects = [];

            for (const ann of imageAnns) {
              // Only process bbox annotations
              if (ann.annotation_data.type !== "bbox") continue;

              // Get class name
              const className =
                classes.find((c) => c.class_id === ann.class_id)?.name ||
                "unknown";

              // Extract coordinates
              const { x, y, width, height } = ann.annotation_data.coordinates;

              objects.push({
                name: className,
                pose: "Unspecified",
                truncated: 0,
                difficult: 0,
                bndbox: {
                  xmin: Math.round(x),
                  ymin: Math.round(y),
                  xmax: Math.round(x + width),
                  ymax: Math.round(y + height),
                },
              });
            }

            // Create XML content
            const xmlObject = {
              annotation: {
                folder: "JPEGImages",
                filename: img.original_filename,
                path: path.join("JPEGImages", img.original_filename),
                source: {
                  database: "Roboflow Clone Export",
                },
                size: {
                  width: img.width,
                  height: img.height,
                  depth: 3, // Assuming 3-channel RGB images
                },
                segmented: 0,
                object: objects,
              },
            };

            // Convert to XML
            const builder = new xml2js.Builder();
            const xml = builder.buildObject(xmlObject);

            // Write XML to file
            fs.writeFileSync(
              path.join(annotationsDir, `${baseFileName}.xml`),
              xml,
            );

            // Add to image set file for the appropriate split
            fs.appendFileSync(
              path.join(imageSetDir, `${assignment.split}.txt`),
              baseFileName + "\n",
            );

            // Copy image if requested
            if (options.includeImages) {
              if (fs.existsSync(path.join(process.cwd(), img.file_path))) {
                const destPath = path.join(
                  imagesDir,
                  path.basename(img.file_path),
                );
                fs.copyFileSync(
                  path.join(process.cwd(), img.file_path),
                  destPath,
                );
              }
            }
          }
          break;

        case "createml":
          formatDir = path.join(exportDir, "createml");
          fs.mkdirSync(formatDir, { recursive: true });

          // Create CreateML format annotations
          const createMLAnnotations = [];

          for (const img of images) {
            // Get dataset split for this image
            const assignment = imageAssignments.find(
              (a) => a.id === img.image_id,
            );
            if (!assignment) continue;

            // Get annotations for this image
            const imageAnns = annotationsByImage[img.image_id] || [];

            // Create annotation entry based on project type
            if (
              project.type === "object_detection" ||
              project.type === "instance_segmentation"
            ) {
              // Object detection format
              const annotations = [];

              for (const ann of imageAnns) {
                // Only process bbox annotations
                if (ann.annotation_data.type !== "bbox") continue;

                // Get class name
                const className =
                  classes.find((c) => c.class_id === ann.class_id)?.name ||
                  "unknown";

                // Extract coordinates
                const { x, y, width, height } = ann.annotation_data.coordinates;

                // CreateML expects center coordinates
                const centerX = x + width / 2;
                const centerY = y + height / 2;

                annotations.push({
                  label: className,
                  coordinates: {
                    x: centerX,
                    y: centerY,
                    width,
                    height,
                  },
                });
              }

              if (annotations.length > 0) {
                const imagePath = options.includeImages
                  ? path.basename(img.file_path)
                  : img.file_path;

                createMLAnnotations.push({
                  image: imagePath,
                  annotations,
                  split: assignment.split,
                });
              }
            } else if (project.type === "classification") {
              // Classification format
              if (imageAnns.length > 0) {
                const firstAnn = imageAnns[0];
                const className =
                  classes.find((c) => c.class_id === firstAnn.class_id)?.name ||
                  "unknown";

                const imagePath = options.includeImages
                  ? path.basename(img.file_path)
                  : img.file_path;

                createMLAnnotations.push({
                  image: imagePath,
                  label: className,
                  split: assignment.split,
                });
              }
            }

            // Copy image if requested
            if (options.includeImages) {
              if (fs.existsSync(path.join(process.cwd(), img.file_path))) {
                const imagesDir = path.join(formatDir, "images");
                fs.mkdirSync(imagesDir, { recursive: true });
                const destPath = path.join(
                  imagesDir,
                  path.basename(img.file_path),
                );
                fs.copyFileSync(
                  path.join(process.cwd(), img.file_path),
                  destPath,
                );
              }
            }
          }

          // Write CreateML annotations to file
          fs.writeFileSync(
            path.join(formatDir, "annotations.json"),
            JSON.stringify(createMLAnnotations, null, 2),
          );

          // Split by train/validation/test if needed
          if (options.exportSplits.length > 1) {
            for (const split of options.exportSplits) {
              const splitAnnotations = createMLAnnotations.filter(
                (ann) => ann.split === split,
              );

              if (splitAnnotations.length > 0) {
                fs.writeFileSync(
                  path.join(formatDir, `${split}.json`),
                  JSON.stringify(splitAnnotations, null, 2),
                );
              }
            }
          }
          break;

        case "tensorflow":
          formatDir = path.join(exportDir, "tensorflow");
          prepareTensorflowSplits(formatDir, options.exportSplits as string[]);

          // Create label map
          const labelMapPath = path.join(formatDir, "label_map.pbtxt");
          let labelMapContent = "";

          classes.forEach((cls, index) => {
            labelMapContent += `item {\n  id: ${index + 1}\n  name: '${
              cls.name
            }'\n}\n`;
          });

          fs.writeFileSync(labelMapPath, labelMapContent);

          // Create a map from class ID to class index (1-based for TensorFlow)
          const classMap = classes.reduce((acc, cls, index) => {
            acc[cls.class_id] = index + 1;
            return acc;
          }, {});

          // Group examples by split
          const tfExamplesBySplit = {};
          for (const split of options.exportSplits) {
            tfExamplesBySplit[split] = [];
          }

          // Process each image
          for (const img of images) {
            // Get dataset split for this image
            const assignment = imageAssignments.find(
              (a) => a.id === img.image_id,
            );
            if (
              !assignment ||
              !options.exportSplits.includes(assignment.split as any)
            )
              continue;

            // Get annotations for this image
            const imageAnns = annotationsByImage[img.image_id] || [];

            // Filter for bbox annotations
            const bboxAnnotations = imageAnns.filter(
              (ann) =>
                ann.annotation_data && ann.annotation_data.type === "bbox",
            );

            if (bboxAnnotations.length === 0) continue;

            // Create TF Example
            const tfExample = {
              filename: img.original_filename,
              image_path: options.includeImages
                ? path.basename(img.file_path)
                : img.file_path,
              width: img.width,
              height: img.height,
              image_format: path.extname(img.original_filename).substring(1), // Remove dot
              xmins: [],
              xmaxs: [],
              ymins: [],
              ymaxs: [],
              classes_text: [],
              classes: [],
            };

            // Add all annotations
            for (const ann of bboxAnnotations) {
              const { x, y, width, height } = ann.annotation_data.coordinates;

              // TensorFlow uses normalized coordinates [0, 1]
              tfExample.xmins.push(x / img.width);
              tfExample.ymins.push(y / img.height);
              tfExample.xmaxs.push((x + width) / img.width);
              tfExample.ymaxs.push((y + height) / img.height);

              const className =
                classes.find((c) => c.class_id === ann.class_id)?.name ||
                "unknown";
              tfExample.classes_text.push(className);
              tfExample.classes.push(classMap[ann.class_id]);
            }

            // Add to appropriate split
            tfExamplesBySplit[assignment.split].push(tfExample);

            // Copy image if requested
            if (options.includeImages) {
              if (fs.existsSync(path.join(process.cwd(), img.file_path))) {
                const imagesDir = path.join(
                  formatDir,
                  assignment.split,
                  "images",
                );
                fs.mkdirSync(imagesDir, { recursive: true });
                const destPath = path.join(
                  imagesDir,
                  path.basename(img.file_path),
                );
                fs.copyFileSync(
                  path.join(process.cwd(), img.file_path),
                  destPath,
                );
              }
            }
          }

          // Write TF Examples to files by split
          for (const [split, examples] of Object.entries(tfExamplesBySplit)) {
            if (examples && Array.isArray(examples) && examples.length > 0) {
              fs.writeFileSync(
                path.join(formatDir, split, "examples.json"),
                JSON.stringify(examples, null, 2),
              );
            }
          }
          break;

        default:
          throw new InvalidRequestError(
            `Unsupported export format: ${options.format}`,
          );
      }

      // Create a zip file with the export
      const zipFileName = `${project.name}-${dataset.name}-${options.format}-export.zip`;
      const zipFilePath = path.join(exportDir, zipFileName);

      await this.createZipFile(formatDir, zipFilePath);

      // Upload to storage provider
      const fileBuffer = fs.readFileSync(zipFilePath);
      const uploadResult = await this.storageProvider.uploadFile(
        {
          buffer: fileBuffer,
          originalname: zipFileName,
          mimetype: "application/zip",
          size: fs.statSync(zipFilePath).size,
        } as Express.Multer.File,
        "exports",
        exportId,
        {},
      );

      // Clean up temporary files
      setTimeout(() => {
        try {
          fs.rmSync(exportDir, { recursive: true, force: true });
        } catch (error) {
          console.error("Error cleaning up temporary files:", error);
        }
      }, 1000);

      // Return download URL and metadata
      return {
        downloadUrl: uploadResult.url,
        format: options.format,
        imageCount: images.length,
        annotationCount: Object.values(annotationsByImage).flat().length,
        exportedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };
    } catch (error) {
      // Clean up on error
      try {
        fs.rmSync(exportDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error("Error cleaning up on failure:", cleanupError);
      }

      throw error;
    }
  }

  async getExportFormats(projectType: string): Promise<string[]> {
    // Return supported export formats based on project type
    switch (projectType) {
      case "object_detection":
        return ["coco", "yolo", "pascal_voc", "createml", "tensorflow"];
      case "classification":
        return ["createml", "tensorflow"];
      case "instance_segmentation":
        return ["coco"];
      case "keypoint_detection":
        return ["coco"];
      default:
        return [];
    }
  }

  async generateExportPreview(
    datasetId: number,
    userId: number,
    format: string,
  ): Promise<{ sample: string }> {
    // Get the dataset
    const dataset = await this.datasetRepository.findById(datasetId);

    // Verify project ownership
    const project = await this.projectRepository.findById(dataset.project_id);
    await this.projectRepository.verifyOwnership(dataset.project_id, userId);

    // Get a sample image from the dataset
    const images = await this.datasetRepository.getDatasetImages(datasetId);
    if (images.length === 0) {
      throw new InvalidRequestError("Dataset has no images");
    }

    // Get the image and its annotations
    const image = await this.imageRepository.findById(images[0].id);
    const annotations = await this.annotationRepository.findByImageId(
      image.image_id,
    );
    const classes = await this.classRepository.findByProjectId(
      dataset.project_id,
    );

    // Generate a preview based on format
    let sample = "";

    switch (format) {
      case "coco":
        const cocoSample = {
          image: {
            id: image.image_id,
            width: image.width,
            height: image.height,
            file_name: image.original_filename,
            license: 1,
            date_captured: image.upload_date.toISOString().split("T")[0],
          },
          annotations: annotations
            .map((ann, idx) => {
              if (ann.annotation_data.type !== "bbox") return null;

              const bbox = ann.annotation_data.coordinates;
              const area = bbox.width * bbox.height;

              return {
                id: idx + 1,
                image_id: image.image_id,
                category_id: ann.class_id,
                bbox: [bbox.x, bbox.y, bbox.width, bbox.height],
                area: area,
                iscrowd: 0,
              };
            })
            .filter(Boolean),
          categories: classes.map((cls) => ({
            id: cls.class_id,
            name: cls.name,
            supercategory: "object",
          })),
        };

        sample = JSON.stringify(cocoSample, null, 2);
        break;

      case "yolo":
        // Get a sample annotation in YOLO format
        const yoloSample = [];

        for (const ann of annotations) {
          if (ann.annotation_data.type !== "bbox") continue;

          // Get class index (0-based in YOLO)
          const classIndex = classes.findIndex(
            (c) => c.class_id === ann.class_id,
          );
          if (classIndex === -1) continue;

          const { x, y, width, height } = ann.annotation_data.coordinates;

          // Normalize coordinates to [0, 1]
          const xCenter = (x + width / 2) / image.width;
          const yCenter = (y + height / 2) / image.height;
          const normalizedWidth = width / image.width;
          const normalizedHeight = height / image.height;

          // Format: <class-id> <x-center> <y-center> <width> <height>
          yoloSample.push(
            `${classIndex} ${xCenter.toFixed(6)} ${yCenter.toFixed(
              6,
            )} ${normalizedWidth.toFixed(6)} ${normalizedHeight.toFixed(6)}`,
          );
        }

        sample = `# Object detection in YOLO format\n# Image: ${
          image.original_filename
        }\n# Format: <class-id> <x-center> <y-center> <width> <height>\n\n${yoloSample.join(
          "\n",
        )}`;
        break;

      case "pascal_voc":
        // Generate a sample Pascal VOC annotation
        const xmlObject = {
          annotation: {
            folder: "JPEGImages",
            filename: image.original_filename,
            path: `JPEGImages/${image.original_filename}`,
            source: {
              database: "Roboflow Clone Export",
            },
            size: {
              width: image.width,
              height: image.height,
              depth: 3,
            },
            segmented: 0,
            object: annotations
              .filter((ann) => ann.annotation_data.type === "bbox")
              .map((ann) => {
                const { x, y, width, height } = ann.annotation_data.coordinates;
                const className =
                  classes.find((c) => c.class_id === ann.class_id)?.name ||
                  "unknown";

                return {
                  name: className,
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

        const builder = new xml2js.Builder();
        sample = builder.buildObject(xmlObject);
        break;

      case "createml":
        // Generate a sample CreateML annotation
        const createMLAnnotation = {
          image: image.file_path,
          annotations: annotations
            .filter((ann) => ann.annotation_data.type === "bbox")
            .map((ann) => {
              const { x, y, width, height } = ann.annotation_data.coordinates;
              const className =
                classes.find((c) => c.class_id === ann.class_id)?.name ||
                "unknown";

              // CreateML expects center coordinates
              const centerX = x + width / 2;
              const centerY = y + height / 2;

              return {
                label: className,
                coordinates: {
                  x: centerX,
                  y: centerY,
                  width,
                  height,
                },
              };
            }),
        };

        sample = JSON.stringify(createMLAnnotation, null, 2);
        break;

      case "tensorflow":
        // Generate a sample TensorFlow annotation
        const tfExample = {
          filename: image.original_filename,
          image_path: image.file_path,
          width: image.width,
          height: image.height,
          image_format: path.extname(image.original_filename).substring(1),
          xmins: [],
          xmaxs: [],
          ymins: [],
          ymaxs: [],
          classes_text: [],
          classes: [],
        };

        // Create class map (1-based for TensorFlow)
        const classMap = classes.reduce((acc, cls, index) => {
          acc[cls.class_id] = index + 1;
          return acc;
        }, {});

        for (const ann of annotations) {
          if (ann.annotation_data.type !== "bbox") continue;

          const { x, y, width, height } = ann.annotation_data.coordinates;

          // TensorFlow uses normalized coordinates [0, 1]
          tfExample.xmins.push(x / image.width);
          tfExample.ymins.push(y / image.height);
          tfExample.xmaxs.push((x + width) / image.width);
          tfExample.ymaxs.push((y + height) / image.height);

          const className =
            classes.find((c) => c.class_id === ann.class_id)?.name || "unknown";
          tfExample.classes_text.push(className);
          tfExample.classes.push(classMap[ann.class_id]);
        }

        sample = JSON.stringify(tfExample, null, 2);
        break;

      default:
        throw new InvalidRequestError(`Unsupported export format: ${format}`);
    }

    return { sample };
  }

  // Helper methods for file operations
  private async createZipFile(
    sourceDir: string,
    targetZip: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create a file to stream archive data to
      const output = fs.createWriteStream(targetZip);
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Set compression level
      });

      // Listen for errors
      archive.on("error", (err) => {
        reject(err);
      });

      // Finalize the archive (all entries have been added)
      output.on("close", () => {
        resolve();
      });

      // Pipe archive data to the file
      archive.pipe(output);

      // Add the entire directory to the archive
      archive.directory(sourceDir, false);

      // Finalize the archive
      archive.finalize();
    });
  }

  // Mapper helper methods
  private mapToImageResponseDTO(image: any): any {
    return {
      id: image.image_id,
      projectId: image.project_id,
      filePath: image.file_path,
      originalFilename: image.original_filename,
      width: image.width,
      height: image.height,
      uploadDate: image.upload_date.toISOString(),
      status: image.status,
      batchName: image.batch_name || undefined,
    };
  }

  private mapToAnnotationResponseDTO(annotation: any, classes: any[]): any {
    const classInfo = classes.find((c) => c.class_id === annotation.class_id);

    return {
      id: annotation.annotation_id,
      imageId: annotation.image_id,
      classId: annotation.class_id,
      className: classInfo?.name || "",
      classColor: classInfo?.color || "#000000",
      data: annotation.annotation_data,
      createdAt: annotation.created_at.toISOString(),
      isValid: annotation.is_valid,
    };
  }

  private mapToClassResponseDTO(classItem: any): any {
    return {
      id: classItem.class_id,
      projectId: classItem.project_id,
      name: classItem.name,
      color: classItem.color,
      createdAt: classItem.created_at.toISOString(),
    };
  }
}
