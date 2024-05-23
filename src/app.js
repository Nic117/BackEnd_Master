import express from "express";
import path from "path";
import __dirname from "./utils.js";
import { engine } from "express-handlebars";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

import { router as vistasRouter } from './routes/vistas.router.js';
import { router as cartRouter } from './routes/cartRouter.js';
import { router as productRouter } from './routes/productRouter.js';
import {router as sessionsRouter} from './routes/sessionRouter.js'
import { messageModelo } from "./dao/models/messageModelo.js";
import sessions from "express-session";


const PORT = 8080;
const app = express();

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '/views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));
app.use(cookieParser("codercoder123"))
app.use(sessions({
    secret: "codercoder123",
    resave: true, saveUninitialized: true
}))

app.use('/', vistasRouter);
app.use('/api/product', productRouter);
app.use('/api/carts', cartRouter);
app.use('/api/sessions', sessionsRouter)

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

const conectar = async () => {
    try {
        await mongoose.connect(
            "mongodb+srv://nic117:codercoder123@cluster0.z9ewukb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
            {
                dbName: "eCommerce"
            }
        )
        console.log("Mongoose activado")
   
    } catch (error) {
        console.log("Error al conectar a DB", error.message)
    }
}

conectar()