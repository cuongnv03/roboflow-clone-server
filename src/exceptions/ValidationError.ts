import { BaseError } from "./BaseError";

export class ValidationError extends BaseError {
  errors: any[];

  constructor(message: string, errors: any[] = []) {
    super(message, 400);
    this.errors = errors;
  }
}
