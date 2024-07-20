import mongoose, { Schema } from "mongoose";

const SubscriptionSchema = new mongoose.Schema({
    subscriber:{
        type: Schema.Types.ObjectId, // user who is subscribing
        ref:"User"
    },
    channel:{
        type: Schema.Types.ObjectId, //one to whom 'subscriber' is subscribed to
        ref: "User"
    }
},{timestamps: true})

export const Subscription = mongoose.model("Subscription",SubscriptionSchema)