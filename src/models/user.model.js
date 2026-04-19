import mongoose, { Schema } from 'mongoose';
//explain bcrypt and jwt and cyptography in simple terms
// public private cryptography is a way to secure data by using two keys, one public and one private. The public key is used to encrypt the data, and the private key is used to decrypt the data. This way, even if someone intercepts the encrypted data, they won't be able to read it without the private key.
// jwt is a stateless authentication mechanism that allows you to authenticate users without storing any information about the user on the server. The client sends a token in each request, and the server verifies the token and grants access to the protected resources if the token is valid.
// jwt token structure :>   (header).(information or payload).(signature)
// usecase of jwt :> 1. user authentication 2. information exchange 3. stateless authentication
// stateless and stateful authentication is a way to authenticate users. In stateless authentication, the server does not store any information about the user, and the client sends all the necessary information in each request. In stateful authentication, the server stores information about the user, and the client only sends a token or session ID in each request.
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    fullName: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    avatar: {
        type: String,                   //cloudinary url
        required: true
    },
    coverImage: {
        type: String,                    //cloudinary url
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Video',
        }
    ],
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    refreshToken: {
        type: String,
    },
}, { timestamps: true }
);



// NOTE: we have not used ()=>{} because in arrow function we don't have this keywords context
// if passward changed then update it, otherwise move next.
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 10);
});




// custom method to compare password 

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}



userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
}

export const User = mongoose.model('User', userSchema);













// NOTE : 
// Hashing is one‑way: you can’t get the original password back. For passwords, you store the hash and later compare hashes. Use slow, salted password hash algorithms like bcrypt, scrypt, or argon2.
// Encryption is two‑way: you can decrypt if you have the key. It’s for data you need to read later (e.g., files, tokens, secrets), not for passwords.
// So: passwords should be hashed, not encrypted.