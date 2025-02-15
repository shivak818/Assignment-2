require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { connectDB, User, Post } = require("./data/database");

const app = express();
app.use(express.json());

// Connect to Database
connectDB();

// Middleware for authentication
const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Access denied" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: "Invalid token" });
    }
};

// Register User
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ name, email, password: hashedPassword });

        await user.save();
        res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login User
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", { expiresIn: "1h" });

        res.json({ token });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get All Posts
app.get("/posts", async (req, res) => {
    try {
        const posts = await Post.find().populate("user", "name email");
        res.json({ posts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create Post
app.post("/posts", authMiddleware, async (req, res) => {
    const { title, body, image } = req.body;
    try {
        const post = new Post({ title, body, image, user: req.user.id });
        await post.save();
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Post
app.put("/posts/:postId", authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        if (post.user.toString() !== req.user.id)
            return res.status(403).json({ message: "Unauthorized" });

        Object.assign(post, req.body);
        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Post
app.delete("/posts/:postId", authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        if (post.user.toString() !== req.user.id)
            return res.status(403).json({ message: "Unauthorized" });

        await post.deleteOne();
        res.json({ message: "Post deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = app;
