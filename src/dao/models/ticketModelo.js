import mongoose from "mongoose";

const ticketsCollection = "tickets";
const ticketSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true
        },
        purchase_datetime: {
            type: Date,
            default: Date.now
        },
        amount: {
            type: Number,
            required: true
        },
        purchaser: {
            type: String,
            required: true
        },
        products: [
            {
                _id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "products"
                },
                quantity: {
                    type: Number,
                    required: true
                },
                title: {
                    type: String,
                    required: true
                },
                price: {
                    type: Number,
                    required: true
                },
                subtotal: {
                    type: Number,
                    required: true
                }
            }
        ]
    },
    {
        timestamps: true
    }
)

export const ticketModelo = mongoose.model(ticketsCollection, ticketSchema);