import mongoose from "mongoose";

const TweetsSchema = new mongoose.Schema({
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    content:{
        type: String,
        required: true,
    }
},{timestamps: true})

export const Tweet = mongoose.model(TweetsSchema,"Tweet")