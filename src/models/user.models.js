import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const UserSchema = new mongoose.Schema({
    watchHistory:{
        type: Schema.Types.ObjectId,
        ref:"Videos"
    },
    username:{
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
        index: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    fullName:{
        required: true,
        type: String,
        trim: true,
    },
    avatar:{
        type:String,
    },
    coverImage: {//cloudinary
        type: String,
    },
    password:{
        type:String,
        required: true,
    },
    refreshToken:{

    },
},{timestamps: true})


UserSchema.pre("save",async function(next){
    if(!this.isModified("password"))    return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

UserSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

UserSchema.methods.generateAccessToken = function(){
    jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

UserSchema.methods.generateFreshToken = function() {
    jwt.sign({
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)}

export const User = mongoose.model("User",UserSchema);