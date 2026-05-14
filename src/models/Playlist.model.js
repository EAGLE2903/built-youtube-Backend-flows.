import mongoose , {Schema, SchemaTypes}  from "mongoose"
import { timeStamp } from "node:console"

const PlaylistSchema = new Schema({
    name:{
        type: String,
        req: true
    },
    
        description:{
            type: String,
            req: true
        },

        videos:[
            {
            type: Schema.Types.ObjectId,
            ref:"Video"
        
        }
    ],
    owner:
        {
            type: Schema.Types.ObjectId,
            ref: "User"

    }
,

        
    
}, {timeStamp:true})


export const playlist = mongoose.model("playlist", PlaylistSchema)
