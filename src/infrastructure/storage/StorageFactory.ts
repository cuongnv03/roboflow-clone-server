import { IStorageProvider } from "./interfaces/IStorageProvider";
import { LocalStorageProvider } from "./providers/LocalStorageProvider";
import { S3StorageProvider } from "./providers/S3StorageProvider";

export type StorageProviderType = "local" | "s3";

export class StorageFactory {
  static createProvider(type: StorageProviderType = "s3"): IStorageProvider {
    switch (type) {
      case "local":
        return new LocalStorageProvider(
          process.env.UPLOAD_DIR || "uploads",
          process.env.UPLOAD_BASE_URL || "/uploads",
        );
      case "s3":
        return new S3StorageProvider();
      default:
        throw new Error(`Unknown storage provider type: ${type}`);
    }
  }
}
