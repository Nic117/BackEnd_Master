import { TIPOS_ERROR } from "../utils/EErrors.js"
import { logger } from "../utils/Logger.js"

export const errorHandler = (error, req, res, next) => {
    logger.error(error.description ? error.description : error.message)

    res.setHeader("Content-Type", "application/json")

    switch (error.code) {
        case TIPOS_ERROR.AUTORIZACION:
        case TIPOS_ERROR.AUTENTICACION:
            return res.status(401).json({ error: "Credenciales incorrectas" })

        case TIPOS_ERROR.ARGUMENTOS_INVALIDOS:
            return res.status(400).json({ error: error.message })

        case TIPOS_ERROR.NOT_FOUND:
            return res.status(404).json({ error: error.message })

        default:
            return res.status(500).json({ error: "Internal Server Error - Contacte al Administrador" })
    }
}

