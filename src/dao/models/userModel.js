import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema(
    {
        first_name: { type: String, required: true },
        last_name: String,
        email: { type: String, required: true, unique: true },
        age: Number,
        password: String,
        rol: { type: String, default: "usuario" },
        cart: {
            type: Schema.Types.ObjectId,
            ref: "cart"
        }
    },
    {
        timestamps: true // Agregando timestamps para createdAt y updatedAt automáticamente
    }
);

const userModel = model("User", userSchema); // El nombre "User" se utilizará como colección en la base de datos

export default userModel;
