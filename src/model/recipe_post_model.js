import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const recipePostSchema = new Schema(
    {
        recipeName:{
            type: String,
            trim: true,
            required: true
        },
        caption: {
            type: String,
            trim: true,
            required: true
        },
        recipeCoverImage: {
            type: String,
            trim: true,
            required: true
        },
        recipeVideo: {
            type: String,
            trim: true,
        },
        festivalSpecial :[
            {
                type: String,
                trim: true
            }
        ],
        cookingTime : {
            type: String,
            trim: true
        },
        ingredients :[
            {
                type: String,
                trim: true
            }
        ],
        cookingSteps :[
            {
                type: String,
                trim: true
            }
        ],
        location: {
            type: String,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        postedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)

recipePostSchema.plugin(mongooseAggregatePaginate);
export const RecipePost = mongoose.model("RecipePost", recipePostSchema);