import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true  //this helps in easy serchable in database
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,  //url will use
            required: true   
        },
        password: {
            type: String,
            required : [true, 'Password is required']
        },
        phone:{
            type: String,
            required: [true, 'Phone number is required'],
            trim: true
        },
        bio: {
            type: String,
            trim: true
        },
        deviceId:{
            type: String,
        },
        refreshToken: {
            type: String
        },
        accessToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

//~ it will run just before the final save 
userSchema.pre("save", async function(next){
    if(!this.isModified("password")){
        return next();
    }

    this.password = await bcryptjs.hash(this.password, 10)
    next();
})

//~ creation of method
userSchema.methods.isPasswordCorrect = async function(password){
   return  await bcryptjs.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
            phone: this.phone
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);