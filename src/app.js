import cors from 'cors';
import path from "path";
import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import { Server } from "socket.io";
import __dirname from "./utils/utils.js";
import cookieParser from "cookie-parser";
import swaggerUi from 'swagger-ui-express';
import { config } from "./config/config.js";
import { engine } from "express-handlebars";
import { specs } from './utils/SwaggerConfig.js';
import { logger, middLogger } from './utils/Logger.js';
import { initPassport } from "./config/passport.config.js";
import { errorHandler } from './middleware/errorHandler.js';

import { messageModelo } from "./dao/models/messageModelo.js";
import { router as userRouter } from './routes/userRouter.js';
import { router as cartRouter } from './routes/cartRouter.js';
import { router as loggerRouter } from './routes/loggerRouter.js';
import { router as vistasRouter } from './routes/vistas.router.js';
import { router as productRouter } from './routes/productRouter.js';
import { router as sessionsRouter } from './routes/sessionRouter.js';
import { userService } from './services/userService.js';

const PORT = config.PORT;
const app = express();

// Configuración de Handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '/views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));
app.use(cookieParser());
app.use(cors());

// Inicialización de Passport
initPassport();
app.use(passport.initialize());
app.use(middLogger);

// Rutas
app.use('/', vistasRouter);
app.use('/api/product', productRouter);
app.use('/api/carts', cartRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/users', userRouter);
app.use('/loggerTest', loggerRouter);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));

// Manejo de errores
app.use(errorHandler);

// Inicialización del servidor
const server = app.listen(PORT, () => {
    logger.info(`Servidor escuchando en puerto ${PORT}`);
});

// Manejo de excepciones no controladas
process.on("uncaughtException", error => {
    logger.error(error.message, "Error no controlado");
});

// Configuración de Socket.IO
export const io = new Server(server);

io.on("connection", (socket) => {
    logger.info(`Cliente conectado: ${socket.id}`);

    const emitUsers = async () => {
        try {
            const users = await userService.getAllUser();
            socket.emit("users", users);
        } catch (error) {
            logger.error("Error al obtener usuarios:", error);
        }
    };

    socket.on("id", async (userName) => {
        usuarios[socket.id] = userName;
        const messages = await messageModelo.find();
        socket.emit("previousMessages", messages);
        socket.broadcast.emit("newUser", userName);
    });

    socket.on("newMessage", async (userName, message) => {
        await messageModelo.create({ user: userName, message });
        io.emit("sendMessage", userName, message);
    });

    socket.on("documentUploadSuccess", async ({ userId }) => {
        const documents = await userService.getDocumentsByUserId(userId);
        io.emit("documentsUpdated", { userId, documents });
    });

    socket.on("updateUserRole", async (userId) => {
        try {
            const user = await userService.getUserId({ _id: userId });
            if (user) {
                const newRol = user.rol === "premium" ? "user" : "premium";
                const result = await userService.updateUser(userId, { rol: newRol });
                if (result.nModified === 0) {
                    logger.info("No se realizaron cambios en el rol del usuario.");
                } else {
                    logger.info("Rol del usuario actualizado exitosamente.");
                    io.emit("userRoleUpdated", user);
                    await emitUsers();
                }
            }
        } catch (error) {
            logger.error("Error al actualizar rol de usuario:", error);
        }
    });

    socket.on("disconnect", () => {
        const userName = usuarios[socket.id];
        delete usuarios[socket.id];
        if (userName) {
            io.emit("userDisconnected", userName);
        }
    });
});

// Conexión a la base de datos
const connDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URL, { dbName: config.DB_NAME });
        logger.info("Conexión a MongoDB activa");
    } catch (error) {
        logger.error("Error al conectar a la base de datos", error.message);
    }
};

connDB();

export { app, server };