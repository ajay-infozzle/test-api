import mongoose, {Schema} from "mongoose";

const ratingSchema = new Schema(
    {
        ratedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        recipePost: {
            type: Schema.Types.ObjectId,
            ref: "RecipePost"
        },
        rating : {
            type : Number,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

export const Rating = mongoose.model("Rating", ratingSchema);