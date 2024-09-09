import mongoose from "mongoose";

const messageCollection = "message";

const messageSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true  
    },
    message: {
        type: String,
        required: true,  
        trim: true,  
    }
}, {
    timestamps: true  
});

export const messageModelo = mongoose.model(messageCollection, messageSchema);
