import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ticketSchema = new Schema(
    {
        code: String,
        purchase_datetime: { type: Date, default: Date.now },
        amount: Number,
        purchaser: {
            type: Schema.Types.ObjectId,
            ref: "User" // Referencia al modelo de usuario, utilizando el nombre de la colección
        }
    },
    {
        timestamps: true // Habilita automáticamente los campos createdAt y updatedAt
    }
);

const ticketModel = model("Ticket", ticketSchema); // El nombre "Ticket" se utilizará como colección en la base de datos

export default ticketModel;
