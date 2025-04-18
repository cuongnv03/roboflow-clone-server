import { IStorageProvider } from "./interfaces/IStorageProvider";
import { LocalStorageProvider } from "./providers/LocalStorageProvider";

export type StorageProviderType = "local" | "s3";

export class StorageFactory {
  static createProvider(type: StorageProviderType = "local"): IStorageProvider {
    switch (type) {
      case "local":
        return new LocalStorageProvider(
          process.env.UPLOAD_DIR || "uploads",
          process.env.UPLOAD_BASE_URL || "/uploads",
        );
      case "s3":
        // implement s3 here when needed
        throw new Error("S3 storage provider not implemented yet");
      default:
        throw new Error(`Unknown storage provider type: ${type}`);
    }
  }
}
