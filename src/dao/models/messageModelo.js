import mongoose from "mongoose";

const messageCollection = "message";
const messageSchema = new mongoose.Schema(
    {
        user: String,
        message: String,
        avatar: {
            type: String,
            default: '/assets/img/profiles/defaultProfilePic.jpg'
        },
    },
    {
        timestamps: true
    }
)

export const messageModelo = mongoose.model(messageCollection, messageSchema)