import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import mongoose from "mongoose";
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudnary.js";
import {RecipePost} from "../model/recipe_post_model.js";
import {Like} from "../model/likes_model.js";
import {BookMark} from "../model/bookmark_model.js";
import {Rating} from "../model/recipe_post_rating.js";


const uploadRecipePost = asyncHandler(
    async (req, res) => {
              
        const {recipeName, caption, festivalSpecial, cookingTime, ingredients, cookingSteps, location} = req.body;
      
        // const festivalSpecial = [];
        // const ingredients = ["ing1","ing2"];
        // const cookingSteps = ["ste1","step2"];
        console.log(req.body);

        if(recipeName === undefined || recipeName.trim() === ""){
            throw ApiError(400, "recipe name is required !")
        }
        if(caption === undefined || caption.trim() === ""){
            throw ApiError(400, "caption is required !")
        }
        if(festivalSpecial === undefined || festivalSpecial.length === 0 ){
            // throw ApiError(400, "caption is required !")
        }
        if(cookingTime === undefined || cookingTime.trim() === "" ){
            throw ApiError(400, "cooking time is required !")
        }
        if(ingredients === undefined || ingredients.length === 0 ){
            throw ApiError(400, "ingredients are required !")
        }
        if(cookingSteps === undefined || cookingSteps.length === 0 ){
            throw ApiError(400, "cooking steps are required !")
        }
        if(cookingSteps === undefined || cookingSteps.length === 0 ){
            throw ApiError(400, "cooking steps are required !")
        }
        if(location === undefined || location.trim() === "" ){
            throw ApiError(400, "location is required !")
        }

        let uploadedCoverImage;
        let uploadedVedioFile;
        try {
            const coverImageLocalPath = req.files?.coverImage[0]?.path;
            if(!coverImageLocalPath){
                throw new ApiError(400, "Cover image is required !");
            }
            uploadedCoverImage = await uploadOnCloudinary(coverImageLocalPath);
            if(!uploadedCoverImage){
                throw new ApiError(500, "Something went wrong while uploading cover image !");
            }
           
            //~ convert minute to proper format
            let formattedTime;
            const minutes = parseInt(cookingTime);
            const hours = Math.floor(minutes/60);
            const remainingMinutes = minutes % 60;
            if(hours === 0){
                formattedTime = `${remainingMinutes} min`; 
            }
            else if(remainingMinutes === 0){
                formattedTime = `${hours} hr`;
            }
            else{
                formattedTime = `${hours} hr ${remainingMinutes} min`;
            }

            //~ check for vedio file ...user send or not
            let vedioFileLocalPath;
            if(req.files && Array.isArray(req.files.vedioFile) && req.files.vedioFile.length > 0){
                vedioFileLocalPath = req.files.vedioFile[0].path ;
            }
            // console.log(req.files.vedioFile);
            if(vedioFileLocalPath){
                uploadedVedioFile = await uploadOnCloudinary(vedioFileLocalPath);

                if(!uploadedVedioFile){
                    throw new ApiError(500, "Something went wrong while uploading vedio !");
                }
            }
            if(vedioFileLocalPath && !uploadedVedioFile){
                throw new ApiError(500, "Something went wrong while uploading vedio !");
            }

            //~ now upload post data
            const post = await RecipePost.create({
                recipeName,
                caption,
                recipeCoverImage : uploadedCoverImage.url,
                recipeVideo : uploadedVedioFile === undefined ? "" : uploadedVedioFile.url,
                festivalSpecial : festivalSpecial.length > 0 ? festivalSpecial : [],
                cookingTime : formattedTime,
                ingredients,
                cookingSteps,
                location,
                postedBy : req.user?._id
            });


            if(!post){
                throw new ApiError(500, "Something went wrong while uploading post !");
            }

            console.log(`post uploaded id->> ${post._id}}`);
            return res.status(201).json(
                new ApiResponse(201, post, "Post Uploaded Succefully")
            );
        } catch (error) {
            if(uploadedCoverImage){
                await deleteFromCloudinary(uploadedCoverImage.url);
            }
            if(uploadedVedioFile){
                await deleteFromCloudinary(uploadedVedioFile.url);
            }
            console.log(error);
            throw new ApiError(400, "Something went wrong !", error);
        }
    }
);


const likeRecipePost = asyncHandler(
    async (req, res) => {
        const {postId} = req.query;

        if(!mongoose.Types.ObjectId.isValid(postId)){
            throw new ApiError(400, "Invalid post id !");
        }
        
        const recipePostLike = await Like.create({
            likedBy : req.user?._id,
            recipePost : postId
        });

        if(!recipePostLike){
            throw new ApiError(500, `Something went wrong while updating like on recipe post(${postId}) !`);
        }

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},  
            "Recipe post like updated successfully!"
        ));
    }
);

const removeLikeRecipePost = asyncHandler(
    async (req, res) => {
        const {postId} = req.query;

        if(!mongoose.Types.ObjectId.isValid(postId)){
            throw new ApiError(400, "Invalid post id !");
        }
        
        const like = await Like.findOneAndDelete({
            recipePost: postId,
            likedBy: req.user?._id
        });

        //Todo : send error if not found...if needed later

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},  
            "Recipe post like updated successfully!"
        ));
    }
);

const bookmarkRecipePost = asyncHandler(
    async (req, res) => {
        const {postId} = req.query;

        if(!mongoose.Types.ObjectId.isValid(postId)){
            throw new ApiError(400, "Invalid post id !");
        }
        
        const recipePostBookmark = await BookMark.create({
            savedBy : req.user?._id,
            recipePost : postId
        });

        if(!recipePostBookmark){
            throw new ApiError(500, `Something went wrong while updating bookmark on recipe post(${postId}) !`);
        }

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},  
            "Bookmark updated successfully!"
        ));
    }
);

const removeBookmarkRecipePost = asyncHandler(
    async (req, res) => {
        const {postId} = req.query;

        if(!mongoose.Types.ObjectId.isValid(postId)){
            throw new ApiError(400, "Invalid post id !");
        }
        
        const bookmark = await BookMark.findOneAndDelete({
            recipePost: postId,
            savedBy: req.user?._id
        });

        //Todo : send error if not found...if needed later

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},  
            "Bookmark updated successfully!"
        ));
    }
);

const rateRecipePost = asyncHandler(
    async (req, res) => {
        const {postId, rating} = req.query;

        if(!mongoose.Types.ObjectId.isValid(postId)){
            throw new ApiError(400, "Invalid post id !");
        }

        if(!rating){
            throw new ApiError(400, "rating required !");
        }
        const ratingInInt = parseInt(rating);
        if(ratingInInt < 1 || ratingInInt > 5){
            throw new ApiError(400, "Invalid rating integer number, please rate from (1 to 5) !");
        }
        
        const recipePostRating = await Rating.create({
            ratedBy : req.user?._id,
            recipePost : postId,
            rating : ratingInInt
        });

        if(!recipePostRating){
            throw new ApiError(500, `Something went wrong while updating rating on recipe post(${postId}) !`);
        }

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},  
            "rating updated successfully!"
        ));
    }
);

//Todo : if already rated..then can update rating to be add

const getRecipePost = asyncHandler (
    async (req, res) => {
        const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc"} = req.query;
        
        //~ sortBy is expected to be a string representing the field name by which to sort (e.g., "createdAt", "recipeName", "festivalSpecial", location).
        //~ query can be as..paneer recipe,rava, chicken ..etc

        //Todo : send likes count, isLiked(true/false)-->for current user
        //Todo : send average rating, isRatedByCurrentUser(true/false), if rated ratingValue also
        //Todo : send isSaved(true/false)
        //Todo : ....instead of sending current user's like,saved ...can be calculate and send all list in intially while app opens 

        const sortOptions = { [sortBy]: sortType === "desc" ? -1 : 1 };
        const matchStage = {
            ...(query ? { recipeName: { $regex: query, $options: "i" } } : {})
        };
        const pipeline = [
            {
                $match: matchStage
            },
            {
                $lookup: {
                    from: "users",
                    localField: "postedBy",
                    foreignField: "_id",
                    as: "postedBy",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                bio : 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$postedBy"
            },
            //~ Adding lookup for likes
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "recipePost",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    likeCount: { $size: "$likes" },
                    isLikedByCurrentUser: {
                        $in: [req.user?._id, "$likes.likedBy"]
                    }
                }
            },
            //~ Adding lookup for bookmarks
            {
                $lookup: {
                    from: "bookmarks",
                    localField: "_id",
                    foreignField: "recipePost",
                    as: "bookmarks"
                }
            },
            {
                $addFields: {
                    bookMarkCount: { $size: "$bookmarks" },
                    isBookMarkedByCurrentUser: {
                        $in: [req.user?._id, "$bookmarks.savedBy"]
                    }
                }
            },
            //~ Adding lookup for ratings
            {
                $lookup: {
                    from: "ratings",
                    localField: "_id",
                    foreignField: "recipePost",
                    as: "ratings"
                }
            },
            {
                $addFields: {
                    averageRating: { $avg: "$ratings.rating" },
                    isRatedByCurrentUser: {
                        $in: [req.user?._id, "$ratings.ratedBy"]
                    },
                    ratingByCurrentUser: {
                        $let: {
                            vars: {
                                userRating: {
                                    $filter: {
                                        input: "$ratings",
                                        as: "rating",
                                        cond: { $eq: ["$$rating.ratedBy", req.user?._id] }
                                    }
                                }
                            },
                            in: { $arrayElemAt: ["$$userRating.rating", 0] }
                        }
                    }
                }
            },
            {
                $sort: sortOptions
            },
            //~ Project to remove likes, bookmarks, and ratings arrays
            {
                $project: {
                    likes: 0,
                    bookmarks: 0,
                    ratings: 0,
                    __v: 0
                }
            }
        ];

        const paginateOptions = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        };
    
        const result = await RecipePost.aggregatePaginate(
            RecipePost.aggregate(pipeline), 
            paginateOptions
        );
        
        if(!result){
            throw new ApiError(500, "Something went wrong fetching recipe post !");
        }

        return res
        .status(200)
        .json(new ApiResponse(
            200, 
            result, 
            "Recipe post fetched successfully!"
        ));
    }
);


const getPersonalRecipePost = asyncHandler (
    async (req, res) => {
        const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc"} = req.query;
        

        const sortOptions = { [sortBy]: sortType === "desc" ? -1 : 1 };
        const matchStage = {
            ...{ postedBy: req.user?._id }
        };
        const pipeline = [
            {
                $match: matchStage
            },
            {
                $lookup: {
                    from: "users",
                    localField: "postedBy",
                    foreignField: "_id",
                    as: "postedBy",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                bio : 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$postedBy"
            },
            //~ Adding lookup for likes
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "recipePost",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    likeCount: { $size: "$likes" },
                    isLikedByCurrentUser: {
                        $in: [req.user?._id, "$likes.likedBy"]
                    }
                }
            },
            //~ Adding lookup for bookmarks
            {
                $lookup: {
                    from: "bookmarks",
                    localField: "_id",
                    foreignField: "recipePost",
                    as: "bookmarks"
                }
            },
            {
                $addFields: {
                    bookMarkCount: { $size: "$bookmarks" },
                    isBookMarkedByCurrentUser: {
                        $in: [req.user?._id, "$bookmarks.savedBy"]
                    }
                }
            },
            //~ Adding lookup for ratings
            {
                $lookup: {
                    from: "ratings",
                    localField: "_id",
                    foreignField: "recipePost",
                    as: "ratings"
                }
            },
            {
                $addFields: {
                    averageRating: { $avg: "$ratings.rating" },
                    isRatedByCurrentUser: {
                        $in: [req.user?._id, "$ratings.ratedBy"]
                    },
                    ratingByCurrentUser: {
                        $let: {
                            vars: {
                                userRating: {
                                    $filter: {
                                        input: "$ratings",
                                        as: "rating",
                                        cond: { $eq: ["$$rating.ratedBy", req.user?._id] }
                                    }
                                }
                            },
                            in: { $arrayElemAt: ["$$userRating.rating", 0] }
                        }
                    }
                }
            },
            {
                $sort: sortOptions
            },
            //~ Project to remove likes, bookmarks, and ratings arrays
            {
                $project: {
                    likes: 0,
                    bookmarks: 0,
                    ratings: 0,
                    __v: 0
                }
            }
        ];

        const paginateOptions = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        };
    
        const result = await RecipePost.aggregatePaginate(
            RecipePost.aggregate(pipeline), 
            paginateOptions
        );
        
        if(!result){
            throw new ApiError(500, "Something went wrong fetching recipe post !");
        }

        return res
        .status(200)
        .json(new ApiResponse(
            200, 
            result, 
            "Personal recipe post fetched successfully!"
        ));
    }
);

const getPersonalBookmarkedRecipePost = asyncHandler (
    async (req, res) => {
        const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc"} = req.query;

        const sortOptions = { [sortBy]: sortType === "desc" ? -1 : 1 };

        const matchStage = {
            "bookmarks.savedBy": req.user?._id
        };

        const pipeline = [
            {
                $lookup: {
                    from: "bookmarks",
                    localField: "_id",
                    foreignField: "recipePost",
                    as: "bookmarks"
                }
            },
            {
                $match: matchStage
            },
            {
                $addFields: {
                    bookMarkCount: { $size: "$bookmarks" },
                    isBookMarkedByCurrentUser: {
                        $in: [req.user?._id, "$bookmarks.savedBy"]
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "postedBy",
                    foreignField: "_id",
                    as: "postedBy",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                bio: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$postedBy"
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "recipePost",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    likeCount: { $size: "$likes" },
                    isLikedByCurrentUser: {
                        $in: [req.user?._id, "$likes.likedBy"]
                    }
                }
            },
            {
                $lookup: {
                    from: "ratings",
                    localField: "_id",
                    foreignField: "recipePost",
                    as: "ratings"
                }
            },
            {
                $addFields: {
                    averageRating: { $avg: "$ratings.rating" },
                    isRatedByCurrentUser: {
                        $in: [req.user?._id, "$ratings.ratedBy"]
                    },
                    ratingByCurrentUser: {
                        $let: {
                            vars: {
                                userRating: {
                                    $filter: {
                                        input: "$ratings",
                                        as: "rating",
                                        cond: { $eq: ["$$rating.ratedBy", req.user?._id] }
                                    }
                                }
                            },
                            in: { $arrayElemAt: ["$$userRating.rating", 0] }
                        }
                    }
                }
            },
            {
                $sort: sortOptions
            },
            {
                $project: {
                    likes: 0,
                    bookmarks: 0,
                    ratings: 0,
                    __v: 0
                }
            }
        ];

        const paginateOptions = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        };
    
        const result = await RecipePost.aggregatePaginate(
            RecipePost.aggregate(pipeline), 
            paginateOptions
        );

        if (!result) {
            throw new ApiError(500, "Something went wrong fetching bookmarked recipe posts!");
        }

        return res
        .status(200)
        .json(new ApiResponse(
            200, 
            result, 
            "Bookmarked recipe posts fetched successfully!"
        ));
    }
);


const getPersonalLikedRecipePost = asyncHandler (
    async (req, res) => {
        const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query;

        const sortOptions = { [sortBy]: sortType === "desc" ? -1 : 1 };

        const matchStage = {
            "likes.likedBy": req.user?._id
        };

        const pipeline = [
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "recipePost",
                    as: "likes"
                }
            },
            {
                $match: matchStage
            },
            {
                $addFields: {
                    likeCount: { $size: "$likes" }, 
                    isLikedByCurrentUser: {           
                        $in: [req.user?._id, "$likes.likedBy"]
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "postedBy",
                    foreignField: "_id",
                    as: "postedBy",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                bio: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$postedBy"
            },
            {
                $lookup: {
                    from: "bookmarks",
                    localField: "_id",
                    foreignField: "recipePost",
                    as: "bookmarks"
                }
            },
            {
                $addFields: {
                    bookMarkCount: { $size: "$bookmarks" },
                    isBookMarkedByCurrentUser: {
                        $in: [req.user?._id, "$bookmarks.savedBy"]
                    }
                }
            },
            {
                $lookup: {
                    from: "ratings",
                    localField: "_id",
                    foreignField: "recipePost",
                    as: "ratings"
                }
            },
            {
                $addFields: {
                    averageRating: { $avg: "$ratings.rating" },
                    isRatedByCurrentUser: {
                        $in: [req.user?._id, "$ratings.ratedBy"]
                    },
                    ratingByCurrentUser: {
                        $let: {
                            vars: {
                                userRating: {
                                    $filter: {
                                        input: "$ratings",
                                        as: "rating",
                                        cond: { $eq: ["$$rating.ratedBy", req.user?._id] }
                                    }
                                }
                            },
                            in: { $arrayElemAt: ["$$userRating.rating", 0] }
                        }
                    }
                }
            },
            {
                $sort: sortOptions
            },
            {
                $project: {
                    likes: 0,
                    bookmarks: 0,
                    ratings: 0,
                    __v: 0
                }
            }
        ];

        const paginateOptions = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        };

        const result = await RecipePost.aggregatePaginate(
            RecipePost.aggregate(pipeline),
            paginateOptions
        );

        if (!result) {
            throw new ApiError(500, "Something went wrong fetching liked recipe posts!");
        }

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                result,
                "Liked recipe posts fetched successfully!"
            ));
    }
);




export {
    uploadRecipePost,
    getRecipePost,
    likeRecipePost,
    bookmarkRecipePost,
    rateRecipePost,
    removeLikeRecipePost,
    removeBookmarkRecipePost,
    getPersonalRecipePost,
    getPersonalBookmarkedRecipePost,
    getPersonalLikedRecipePost
};