import mongoose from "mongoose";

const usersCollection = "users";
const userSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: { type: String },
    email: { type: String, required: true, unique: true },
    age: { type: Number },
    password: { type: String },
    rol: {
        type: String,
        enum: ["usuario", "admin", "premium"],
        default: "usuario"
    },
    cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "cart"
    },
    avatar: {
        name: { type: String },
        reference: { type: String }
    },
    documents: [{
        name: { type: String },
        reference: { type: String },
        docType: {
            type: String,
            enum: ["ID", "adress", "statement"]
        }
    }],
    last_connection: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    strict: false
});

export const userModel = mongoose.model(usersCollection, userSchema);
