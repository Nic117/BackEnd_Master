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
            type: String, enum: ["usuario", "admin", "premium"], default: "usuario"
        },
        cart: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "cart"
        },
        avatar: String,
        documents: {
            type:
                [
                    {
                        name: String,
                        reference: String,
                        docType: {
                            type: String,
                            enum: ["ID", "adress", "statement"]
                        }
                    }
                ]
        },
        last_connection: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true, strict: false
    }
)


export const userModel = mongoose.model(usersCollection, userSchema)