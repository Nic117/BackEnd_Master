import { TIPOS_ERROR } from "../utils/EErrors.js";

const errorResponses = {
    [TIPOS_ERROR.AUTORIZACION]: (res) => res.status(401).json({ error: "Credenciales incorrectas" }),
    [TIPOS_ERROR.AUTENTICACION]: (res) => res.status(401).json({ error: "Credenciales incorrectas" }),
    [TIPOS_ERROR.ARGUMENTOS_INVALIDOS]: (res, error) => res.status(400).json({ error: error.message }),
    "default": (res) => res.status(500).json({ error: "Error del servidor" })
};

export const errorHandler = (error, req, res, next) => {
    console.error(`Error detectado: ${error.message}`);

    const responseFn = errorResponses[error.code] || errorResponses["default"];
    return responseFn(res, error);
};


