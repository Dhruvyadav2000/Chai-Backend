import mongoose, { mongo } from "mongoose";


const CommentSchema = new mongoose.Schema({
    content:{
        type: String,
        required: true
    },
    video:{
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps: true})

const Comment = mongoose.model("Comment",CommentSchema)