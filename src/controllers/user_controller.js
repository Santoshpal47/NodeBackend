import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models//user_model.js";
import ApiResponse from '../utils/ApiResponse.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';


const registerUser = asyncHandler(async (req, res) => {

    const { fullname, email, username, password } = req.body
    console.log("fullname: ", fullname);
    console.log("email: ", email);
    console.log("username: ", username);
    console.log("password: ", password);



    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    console.log("avatarLocalPath",avatarLocalPath)

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    console.log("coverImageLocalPath",coverImageLocalPath)

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatarLocalPath file is required")
    }
    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImageLocalPath file is required")
    }
    console.log("check0")

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    console.log("check1")
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log("check2")

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }


    const user = await User.create({
        fullname,
        avatar: avatar?.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

export { registerUser };
