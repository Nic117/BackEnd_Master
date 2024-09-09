import { TIPOS_ERROR } from "./EErrors.js";
import { errorDescription } from "./ErrorDescription.js";

class CustomError extends Error {
  constructor(name, cause, message, code) {
    super(message);
    this.name = name || "Error";
    this.code = code || TIPOS_ERROR.INTERNAL_SERVER_ERROR;
    this.cause = cause;
    this.description = errorDescription(this.name, this.cause, message);
  }

  static create(name, cause, message, code) {
    const error = new CustomError(name, cause, message, code);
    throw error;
  }
}

export { CustomError };