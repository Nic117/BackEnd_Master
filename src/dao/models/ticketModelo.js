import mongoose from "mongoose";

const ticketsCollection = "tickets";

// Definición del esquema del ticket
const ticketSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true, // Asegura que el código del ticket sea único
        },
        purchase_datetime: {
            type: Date,
            default: Date.now,
        },
        amount: {
            type: Number,
            required: true,
        },
        purchaser: {
            type: String,
            required: true,
        },
        products: [
            {
                _id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "products", // Referencia al modelo de productos
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
                title: {
                    type: String,
                    required: true,
                },
                price: {
                    type: Number,
                    required: true,
                },
                subtotal: {
                    type: Number,
                    required: true,
                },
            },
        ],
    },
    {
        timestamps: true, // Agrega createdAt y updatedAt automáticamente
    }
);

// Modelo de Mongoose para tickets
export const ticketModelo = mongoose.model(ticketsCollection, ticketSchema);
