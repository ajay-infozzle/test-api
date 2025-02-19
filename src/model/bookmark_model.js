import mongoose, {Schema} from "mongoose";

const bookMarkSchema = new Schema(
    {
        savedBy: {
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

export const BookMark = mongoose.model("BookMark", bookMarkSchema);