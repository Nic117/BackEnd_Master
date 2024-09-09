export const loggerController = (req, res) => {
    const logMessages = [
        { level: 'info', message: "Testeando info" },
        { level: 'http', message: "Testeando http" },
        { level: 'debug', message: "Testeando debug" },
        { level: 'fatal', message: "Testeando fatal" },
        { level: 'error', message: "Testeando error" },
        { level: 'warning', message: "Testeando warning" }
    ];

    logMessages.forEach(log => req.logger[log.level](log.message));

    res.json({ status: "success", message: "Logger test executed successfully" });
};
