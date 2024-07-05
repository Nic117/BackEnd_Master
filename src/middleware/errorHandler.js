import { TIPOS_ERROR } from "../utils/EErrors.js";

export const errorHandler = (error, req, res, next) => {
    console.error(`Error detectado: ${error.message}`);

    switch (error.code) {
        case TIPOS_ERROR.AUTORIZACION:
        case TIPOS_ERROR.AUTENTICACION:
            return res.status(401).json({ error: "Credenciales incorrectas" });

        case TIPOS_ERROR.ARGUMENTOS_INVALIDOS:
            return res.status(400).json({ error: error.message });

        default:
            return res.status(500).json({ error: "Error del servidor" });
    }
};

