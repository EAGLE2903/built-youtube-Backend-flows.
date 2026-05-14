import mongoose , {Schema} from "mongoose"

const CommentsSchema = new Schema({
    content:{
        type: String,
        req: true
    },

    video:[
        {
            type: Schema.Types.ObjectId,
            ref: "Video"

        }
    ],
    owner:
        {
            type: Schema.Types.ObjectId,
            ref: "User"

    },
 
},{timestamps: true})

export const Comments = mongoose.model("Comments" , CommentsSchema)