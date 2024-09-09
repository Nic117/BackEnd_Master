export const errorDescription = (errorSite, errorName, cause) => {
    const timestamp = new Date().toUTCString();
    return `[ ${timestamp} ] [${errorName}] Error en ${errorSite}: ${cause}`;
};