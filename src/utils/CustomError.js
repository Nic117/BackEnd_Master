import { TIPOS_ERROR } from "./EErrors.js";
import { errorDescription } from "./ErrorDescription.js";

export class CustomError {
    static createError(name = "Error", cause, message, code = TIPOS_ERROR.INTERNAL_SERVER_ERROR) {
        const description = errorDescription(name, cause, message);

        const error = new Error(message);
        error.name = name;
        error.code = code;
        error.cause = cause;
        error.description = description;

        throw error;
    }
}
