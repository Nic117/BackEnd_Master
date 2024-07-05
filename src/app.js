import cors from 'cors';
import path from "path";
import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import { Server } from "socket.io";
import __dirname from "./utils/utils.js";
import cookieParser from "cookie-parser";
import { config } from "./config/config.js";
import { engine } from "express-handlebars";
import { initPassport } from "./config/passport.config.js";
import { errorHandler } from './middleware/errorHandler.js';

import { messageModelo } from "./dao/models/messageModelo.js";
import { router as cartRouter } from './routes/cartRouter.js';
import { router as vistasRouter } from './routes/vistas.router.js';
import { router as productRouter } from './routes/productRouter.js';
import { router as sessionsRouter } from './routes/sessionRouter.js';



const PORT = config.PORT;
const app = express();
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '/views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));
app.use(cookieParser())
app.use(cors());

initPassport()
app.use(passport.initialize())

app.use('/', vistasRouter);
app.use('/api/product', productRouter);
app.use('/api/carts', cartRouter);
app.use('/api/sessions', sessionsRouter)

app.use(errorHandler);

let usuarios = [];

const server = app.listen(PORT, () => {
    console.log(`Server escuchando en puerto ${PORT}`);
});



export const io = new Server(server);

io.on("connection", (socket) => {
    console.log(`Se conecto el cliente ${socket.id}`)

    socket.on("id", async (userName) => {
        usuarios[socket.id] = userName;
        let messages = await messageModelo.find()
        socket.emit("previousMessages", messages)
        socket.broadcast.emit("newUser", userName)
    })

    socket.on("newMessage", async (userName, message) => {
        await messageModelo.create({ user: userName, message: message })
        io.emit("sendMessage", userName, message)
    })

    socket.on("disconnect", () => {
        const userName = usuarios[socket.id];
        delete usuarios[socket.id];
        if (userName) {
            io.emit("userDisconnected", userName);
        }
    })
})

const connDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URL, { dbName: config.DB_NAME })
        console.log("Mongoose activo")
    } catch (error) {
        console.log("Error al conectar a DB", error.message)
    }
}

connDB()