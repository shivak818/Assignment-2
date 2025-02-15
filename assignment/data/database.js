const mongoose = require("mongoose");

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/assignment", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB Connected");
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
};

// User Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);

// Post Schema
const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    image: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const Post = mongoose.model("Post", PostSchema);

module.exports = { connectDB, User, Post };
