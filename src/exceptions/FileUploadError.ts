import { BaseError } from "./BaseError";

export class FileUploadError extends BaseError {
  constructor(message: string) {
    super(message, 500);
  }
}
