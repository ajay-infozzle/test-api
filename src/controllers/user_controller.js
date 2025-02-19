import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudnary.js";
import jwt from "jsonwebtoken";
import { User } from "../model/user_model.js";



const generateAccessAndRefreshTokens =  async(userId, deviceId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        user.accessToken = accessToken;
        user.deviceId = deviceId ;
        await user.save({ validateBeforeSave: false }); //~ this will not validate required fields

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token !");
    }
}

const registerUser = asyncHandler(
    //* get user details
    //* validation not empty
    //* check if user is exist or not
    //* check for avatar and upload to cloudarinary
    //* create user object - create entry in db
    //* remove password and token field from response
    //* check for user creation
    //* return response

    async (req, res) =>{
        const {username, email, fullname, password, phone} = req.body;
        console.log(req.body);
        if(
            [fullname, email, username, password, phone].some((field) => field?.trim() === "") || [fullname, email, username, password, phone].some((field) => field === undefined)
        ){
            throw new ApiError(400, "All fields are required")
        }

        if(username.length > 14){
            throw new ApiError(400, "username should not more than 14 characters !")
        }

        const existedUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if(existedUser){
            throw new ApiError(409, "user with email or username already exists !");
        }

        
        const avatarLocalPath = req.file?.path
        if(!avatarLocalPath){
           throw new ApiError(400, "Avatar file is missing !");
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if(!avatar){
            throw new ApiError(400, "Error while uploading an avatar !");
        }

        try {
            const user = await User.create({
                fullname,
                avatar: avatar.url,
                email,
                password,
                username: username.toLowerCase(),
                phone
            });
    
            const createdUser = await User.findById(user._id).select(
                "-password -refreshToken"
            );
    
            if(!createdUser){
                throw new ApiError(500, "Something went wrong while registering user !");
            }
            
            console.log("user registered");
            return res.status(201).json(
                new ApiResponse(201, createdUser, "User Registered Succefully")
            );
        } catch (error) {
            if(avatar){
                await deleteFromCloudinary(avatar.url);
            }
            throw new ApiError(400, "Something went wrong !", error);
        }
    }
);

const loginUser = asyncHandler(
    //* get details
    //* validate details
    //* check if user exist or not
    //* validate password
    //* generate tokens
    //* send cookie(eventually its works on web)

    async (req, res) => {
        const {email, username, password, deviceId} = req.body;
        
        if( !(username || email) ){
            throw new ApiError(400, "username or email is required !");
        }

        if(!deviceId){
            throw new ApiError(400, "Device ID required !");
        }

        const userExist = await User.findOne({
            $or: [ {username}, {email} ]
        })

        if(!userExist){
            throw new ApiError(404, "User does not exist !");
        }

        //* note-> we can't access method created by own directly using model(User)
        const isPasswordValid = await userExist.isPasswordCorrect(password);
        if(!isPasswordValid){
            throw new ApiError(401, "Invalid user credentials !");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(userExist._id, deviceId); 

        const loggedInUser = await User.findById(userExist._id).select(
            "-password -refreshToken -accessToken"
        );

        //~ due to httpOnly:true ..cookie will modify via server ..can only read from frontend
        const options = {
            httpOnly: true,
            secure: true
        }

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in succesfully"
            )
        );
    }
);


const logoutUser = asyncHandler(
    async (req, res) => {
        //~ clear cookie
        //~ remove refresh token
        try {
            await User.findByIdAndUpdate(
                req.user._id,
                {
                    $unset: {
                        refreshToken: 1 //~ this remove the field from document
                    }
                },
                {
                    new: true
                }
            );
    
            const options = {
                httpOnly: true,
                secure: true
            }
    
            return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User Logged Out !"));
        } catch (error) {
            throw new ApiError(500, "Something went wrong !", error);
        }
    }
)


const deleteUser = asyncHandler(
    async (req, res) => {
        //~ clear cookie
        //~ remove refresh token
       try {
            await User.deleteOne(
                req.user._id,
                {
                    new: true
                }
            );

            const options = {
                httpOnly: true,
                secure: true
            }

            return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User Deleted Successfuly !"));
       } catch (error) {
            throw new ApiError(500, "Something went wrong !", error);
       }
    }
)


const refreshAccessToken = asyncHandler(
    async (req, res) => {
        const incomingRefreshToken = req.body.refreshToken
        if(incomingRefreshToken === undefined || !incomingRefreshToken){
            throw new ApiError(401, "Unauthorized request !")
        }

        try {
            const decodedToken = jwt.verify(
                incomingRefreshToken,
                process.env.REFRESH_TOKEN_SECRET
            );
            const user = await User.findById(decodedToken?._id);
            
            if(!user){
                throw new ApiError(401, "Invalid refresh token !")
            }
    
            //~ now matching incomingtoken with databse stored refreshtoken
            if(incomingRefreshToken !== user?.refreshToken){
                throw new ApiError(401, "Refresh token is expired or used !")
            }
    
            const options = {
                httpOnly: true,
                secure: true
            }
    
            const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user?._id);

            // console.log(`${user._id}\n\n${newAccessToken}\n\n${newRefreshToken}`)
    
            return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {   user,
                        newAccessToken,
                        newRefreshToken
                    },
                    "Access token refreshed !"
                )
            );
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid refresh token !")
        }
    }
);


const changeCurrentPassword = asyncHandler(
    //* if user is already logged in

    async (req, res) => {
        const {oldPassword, newPassword} = req.body

        if(!oldPassword){
            throw new ApiError(400, "old password required !")
        }

        if(!newPassword){
            throw new ApiError(400, "new password required !")
        }

        if(newPassword === oldPassword){
            throw new ApiError(400, "new password and old password cannot be same !")
        }

        const user = await User.findById(req.user?._id);

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
        if(!isPasswordCorrect){
            throw new ApiError(400, "Invalid password !")
        }

        user.password = newPassword
        await user.save({validateBeforeSave: false});

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password change successfully !")
        )
    }
);

const forgotPassword = asyncHandler(
    //* if user is not logged in

    async (req, res) => {
        const {email, username, newPassword} = req.body

        if((email === undefined && username === undefined) || newPassword === undefined){
            throw new ApiError(400, "All fields required !");
        }

        if(email === "" || username === ""){
            throw new ApiError(400, "username or email required !");
        }

        if(newPassword.trim() === ""){
            throw new ApiError(400, "new password required !");
        }

        const user = await User.findOne({
            $or: [ {username}, {email} ]
        })

        if(!user){
            throw new ApiError(400, "user does not exist !")
        }

        user.password = newPassword
        await user.save({validateBeforeSave: false});

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password change successfully !")
        )
    }
);


const getCurrentUser = asyncHandler(
    async (req, res) => {
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "current user fetched succesfully !"
            )
        );
    }
);

const updateProfileDetails = asyncHandler(
    async (req, res) => {
        const {email, bio, phone, username } = req.body;

        if([email, bio, phone, username].some((field) => field === undefined)){
            throw ApiError(400, "email, bio, phone and username are required fields !")
        }

        if([email, bio, phone, username].some((field) => field?.trim() === "")){
            throw ApiError(400, "email, bio, phone and username are required fields !")
        }

        if(username.trim().length > 14){
            throw ApiError(400, "username should not more than 14 characters !")
        }

        try {

            const user = await User.findById(req.user?._id).select("-password");
            if (!user) {
                throw ApiError(404, "User not found!");
            }

            //~ Check if the new values are the same as the current ones
            const updateFields = {};
            if (email !== user.email) updateFields.email = email;
            if (username !== user.username) updateFields.username = username;
            if (phone !== user.phone) updateFields.phone = phone;
            if (bio !== user.bio) updateFields.bio = bio;

            if (Object.keys(updateFields).length === 0) {
                return res.status(200).json(new ApiResponse(200, user, "No changes detected!"));
            }

            //~ Update the user with only the fields that have changed
            const updatedUser = await User.findByIdAndUpdate(
                req.user?._id,
                { $set: updateFields },
                { new: true }
            ).select("-password");

            if (!updatedUser) {
                throw ApiError(500, "Something went wrong while updating the account!");
            }
        
            // //~ by using new:true ...updated data will return
            // const user = await User.findByIdAndUpdate(
            //     req.user?._id,
            //     {
            //         $set: {
            //             email,
            //             username,
            //             phone,
            //             bio
            //         }
            //     },
            //     {new: true}
            // ).select("-password");
    
            // if(!user){
            //     throw ApiError(500, "Something went wrong while updating account !")
            // }
    
            return res
            .status(200)
            .json(new ApiResponse(200, updatedUser, "Profile updated successfully !")) ;
        } catch (error) {
            throw ApiError(400, "Something went wrong !", error);
        }
    }
);

const checkUsernameAndEmail = asyncHandler(
    async (req, res) => {
        var {email, username} = req.query ;

        if(email === undefined){
            email = "";
        }
        if(username === undefined){
            username = "";
        }

        if(username.trim() === "" && email.trim() === ""){
            throw new ApiError(400, "Invalid request, empty field !")
        }

        const isExist = await User.findOne(
            {
                $or: [{username}, {email}]
            }
        );

        if(isExist){
            return res
            .status(403)
            .json(
                new ApiResponse(403, {}, "Already Exist !")
            )
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Available !")
        )
    }
);

const updateUserAvatar = asyncHandler(
    async (req, res) => {
        const avatarLocalPath = req.file?.path
        if(!avatarLocalPath){
           throw new ApiError(400, "Avatar file is missing !");
        }

        const previousAvatarUrl = req.user.avatar ;
        
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if(!avatar){
            throw new ApiError(400, "Error while uploading avatar !");
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    avatar: avatar.url
                }
            },
            {new: true}
        ).select("-password");

         
        if(!user){
            throw ApiError(500, "Something went wrong while updating avatar !")
        }else{
            const isPreviousUrlDeleted = await deleteFromCloudinary(previousAvatarUrl);
        }

        return res
        .status(200)
        .json(new ApiResponse(200, {"url": avatar.url}, "Avatar updated successfully !")) ;
    }
);

export {
    registerUser,
    loginUser,
    logoutUser,
    deleteUser,
    refreshAccessToken,
    changeCurrentPassword,
    forgotPassword,
    getCurrentUser,
    updateProfileDetails,
    checkUsernameAndEmail,
    updateUserAvatar
};