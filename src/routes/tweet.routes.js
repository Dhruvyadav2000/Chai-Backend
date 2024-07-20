import mongoose from "mongoose";

import {Router} from "express"

import {verifyJWT} from "../middlewares/auth.middleware.js"
import { createTweet, getUserTweets } from "../controllers/tweets.controller.js";


const router = Router()

router.use(verifyJWT)

router.route("/").post(createTweet)

router.route("/user/:userId").get(getUserTweets)

router.route("/:tweetId").get(updateTweet).delete(deleteTweet)

export default router