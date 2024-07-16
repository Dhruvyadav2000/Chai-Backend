import mongoose from "mongoose";
import { DB_NAME } from "./constant.js";
import connectDB from "./db/index.js";
// import express from "express"
// require('dotenv').config({path: './env'})
import dotenv from "dotenv";

import { app } from "./app.js";


dotenv.config({
    path: './env'
})
connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(` Server is listening on port ${process.env.PORT || 8000}`)
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!!",err)
})
















// const app = express();

// ;(async ()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log("ERROR: ",error);
//             throw error
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on Port ${process.env.PORT}`)
//         })
//     } catch(error) {
//         console.log(`MONGODB Connection Error!!` ,error)
//     }
// })();