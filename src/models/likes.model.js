import mongoose , {Schema} from " mongoose"
import { timeStamp } from "node:console"

const likesSchema = new Schema({
    comment:{
        type: Schema.Types.ObjectId,
        ref: "Comments"
    },

    video:{
        type: Schema.Types.ObjectId,
        ref: "Video"
    },

    likedby:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    tweet:{
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },
},{timeStamps: true})



export const Likes = mongoose.model("Likes",  likesSchema)