export const errorDescription = (errorSite, errorName, cause) => {

    return `[ ${new Date().toUTCString()} ] [${errorName}] Error en ${errorSite}: ${cause}`
}