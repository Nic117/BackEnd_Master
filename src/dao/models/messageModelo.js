import mongoose from "mongoose";

const { Schema, model } = mongoose;

const messageSchema = new Schema(
    {
        user: { type: String, required: true },
        message: { type: String, required: true }
    },
    {
        timestamps: true // Habilita automáticamente los campos createdAt y updatedAt
    }
);

const messageModel = model("Message", messageSchema); // El nombre "Message" se utilizará como colección en la base de datos

export default messageModel;
