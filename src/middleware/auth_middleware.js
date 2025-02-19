import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../model/user_model.js";


export const verifyJWT = asyncHandler(
    // async (req, res, next) => {
    async (req, _, next) => {

        try {
            //~ header will come from mobile applications
            const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    
            if(!token){
                throw new ApiError(401, "Unauthorized request !");
            }
    
            const decodedInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
            const user = await User.findById(decodedInfo?._id).select(
                "-password -refreshToken"
            );
    
            if(!user){
                throw new ApiError(401, "Invalid Access Token !");
            }
            
            //~ this will helpful in one device policy
            if(token !== user.accessToken){
                throw new ApiError(401, "Invalid Access Token !");
            }
    
            req.user = user;
            next();
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid Access Token !");
        }
    }
)