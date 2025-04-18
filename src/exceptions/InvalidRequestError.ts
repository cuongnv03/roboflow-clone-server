import { BaseError } from "./BaseError";

export class InvalidRequestError extends BaseError {
  constructor(message: string) {
    super(message, 400);
  }
}
