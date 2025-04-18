import multer from "multer";
import { InvalidRequestError } from "../../exceptions/InvalidRequestError";

// Use memory storage since we'll process before saving
const storage = multer.memoryStorage();

// Filter for accepted file types
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Accept image files
  const acceptedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/webp",
    "image/avif",
  ];

  if (acceptedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new InvalidRequestError(
        `Unsupported file type: ${file.mimetype}. Supported formats: JPEG, PNG, GIF, BMP, WEBP, AVIF.`,
      ) as unknown as null,
    );
  }
};

// Create multer middleware
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
    files: 50, // Max 50 files per upload
  },
  fileFilter: fileFilter,
});
