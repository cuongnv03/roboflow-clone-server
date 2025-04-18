export interface FileUploadResult {
  url: string;
  width: number;
  height: number;
}

export interface FileUploadOptions {
  resize?: { width: number; height: number };
  autoOrient?: boolean;
  format?: "jpeg" | "png" | "webp";
}

export interface IStorageProvider {
  uploadFile(
    file: Express.Multer.File,
    directory: string,
    filename: string,
    options?: FileUploadOptions,
  ): Promise<FileUploadResult>;

  deleteFile(filePath: string): Promise<void>;
}
