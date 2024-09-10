export const loggerController = (req, res) => {
    req.logger.fatal("Testeando fatal");
    req.logger.error("Testeando error");
    req.logger.warning("Testeando warning");
    req.logger.info("Testeando info");
    req.logger.http("Testeando http");
    req.logger.debug("Testeando debug");

    res.send({ status: "success", message: "Probando logger" })
}