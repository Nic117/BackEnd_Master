import { TIPOS_ERROR } from './EErrors.js';

export class CustomError extends Error {
    constructor(name = 'Error', cause, message, code = TIPOS_ERROR.INTERNAL_SERVER_ERROR) {
        super(message);
        this.name = name;
        this.code = code;
        if (cause) {
            this.cause = cause;
        }
    }

    static createError(name, cause, message, code = TIPOS_ERROR.INTERNAL_SERVER_ERROR) {
        const error = new CustomError(name, cause, message, code);
        throw error;
    }
}
