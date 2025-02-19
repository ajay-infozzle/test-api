import mongoose, {Schema} from "mongoose";

const likesSchema = new Schema(
    {
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        recipePost: {
            type: Schema.Types.ObjectId,
            ref: "RecipePost"
        }
    },
    {
        timestamps: true
    }
);

export const Like = mongoose.model("Like", likesSchema);