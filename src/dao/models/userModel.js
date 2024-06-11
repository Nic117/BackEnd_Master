import mongoose from "mongoose";

const usersCollection = "users";
const userSchema = new mongoose.Schema(
    {
        first_name: { type: String, required: true },
        last_name: String,
        email: { type: String, required: true, unique: true },
        age: Number,
        password: String,
        rol: {
            type: String, default: "usuario"
        },
        cart: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "cart"
        }
    },
    {
        timestamps: true, strict: false
    }
)


export const userModel = mongoose.model(usersCollection, userSchema)