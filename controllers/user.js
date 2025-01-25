const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const cloudinary = require('cloudinary').v2;
const { createCanvas, loadImage } = require('canvas');
const streamifier = require('streamifier');

const JWT_SECRET = "myjwtsecret";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

// Constants
const CO2_PER_CUP = 0.24;
const POINTS_PER_CUP = 5;
const badgeThresholds = { bronze: 100, silver: 250, gold: 500 };
const badgeTemplates = {
    bronze: 'v1737726047/templates/bronze-badge-template.png',
    silver: 'v1737726047/templates/silver-badge-template.png',
    gold: 'v1737726047/templates/golden-badge-template.png',
};

const generateToken = (data) => {
    return jwt.sign({ data }, JWT_SECRET, { expiresIn: "4h" });
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password, isOrganization } = req.body;

        console.log(req.body);

        if (!name || !email || !password) {
            return res.status(200).json({
                statusText: "incorrect-data-sent",
            });
        }

        const existingUser = await User.findOne({
            email: email,
        });

        if (existingUser) {
            return res.status(200).json({
                statusText: "user-already-exists",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            password: hash,
            email,
            isOrganization,
        });

        if (!user) {
            return res.status(200).json({
                statusText: "failed",
                user: null,
            });
        }

        return res.status(200).json({
            statusText: "success",
            user: user,
        });
    } catch (error) {
        console.log("Error from authController's register", error);
        return res.status(500).json({
            statusText: "failed",
            user: null,
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                statusText: "invalid-data",
                user: null,
                token: null,
            });
        }

        const existingUser = await User.findOne({ email: email });

        if (!existingUser) {
            return res.status(404).json({
                statusText: "invalid-credentials",
                user: null,
                token: null,
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            existingUser.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                statusText: "invalid-credentials",
                user: null,
                token: null,
            });
        }

        existingUser.password = "";

        return res.status(200).json({
            statusText: "success",
            user: existingUser,
            token: generateToken(existingUser._id),
        });
    } catch (error) {
        console.error("Error in login:", error);
        return res.status(500).json({
            statusText: "internal-server-error",
            user: null,
            token: null,
        });
    }
};


//caluclate co2, points, cupsSaved
const saveCups = async (req, res) => {
    try {
        const { cups, uId } = req.body;

        if (!cups || !uId || cups <= 0) {
            return res.status(400).json({
                statusText: "invalid-data",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(uId)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const user = await User.findById(uId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const co2SavedForThisEntry = cups * CO2_PER_CUP;
        const pointsForThisEntry = cups * POINTS_PER_CUP;

        // Update user data
        user.cupsSaved += cups;
        user.co2Saved += co2SavedForThisEntry;
        user.points = (user.points || 0) + pointsForThisEntry;

        let newBadgeType = null;
        if (user.cupsSaved >= badgeThresholds.gold && user.badge !== 'gold') {
            newBadgeType = 'gold';
        } else if (user.cupsSaved >= badgeThresholds.silver && user.badge !== 'silver' && user.badge !== 'gold') {
            newBadgeType = 'silver';
        } else if (user.cupsSaved >= badgeThresholds.bronze && !user.badge) {
            newBadgeType = 'bronze';
        }



        // Generate badge if applicable
        let badgeUrl = null;
        if (newBadgeType) {
            const templateUrl = cloudinary.url(badgeTemplates[newBadgeType]);

            // Draw badge with user data
            const canvas = createCanvas(600, 600);
            const ctx = canvas.getContext('2d');

            const templateImage = await loadImage(templateUrl);
            ctx.drawImage(templateImage, 0, 0, 600, 600);

            ctx.font = 'bold 30px Arial';
            ctx.fillStyle = '#009245';

            ctx.fillText(`Name: ${user.name}`, 50, 500);
            ctx.fillText(`Cups Saved: ${user.cupsSaved}`, 50, 550);

            // Upload badge to Cloudinary
            const buffer = canvas.toBuffer('image/png');
            const stream = streamifier.createReadStream(buffer);
            await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({ folder: 'badges' }, (error, result) => {
                    if (error) reject(error);
                    badgeUrl = result.secure_url;
                    resolve();
                }).end(buffer);
            });

            user.badge = badgeUrl;
        }


        // Save user
        await user.save();

        res.status(200).json({
            message: 'Cups saved successfully',
            data: {
                cupsSaved: user.cupsSaved,
                co2Saved: user.co2Saved,
                points: user.points,
                badgeUrl: user.badge || null,
            },
        });
    }
    catch (error) {
        console.error('Error in saveCups route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

}

//get user details
const getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.log(userId);
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const user = await User.findById(userId);

        if (!user) {
            res.status(400).json({ error: "No such user exists" });
        }

        console.log(user);

        res.status(200).json({
            message: 'OK',
            data: {
                name: user.name,
                email: user.email,
                cupsSaved: user.cupsSaved,
                co2Saved: user.co2Saved,
                isOrg: user.isOrganization,
                points: user.points,
                badgeUrl: user.badge || null,
            },
        });


    }
    catch (error) {
        console.error('Error in getUserDetails route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

}

const getLeaderBoard = async (req, res) => {
    // name, rank, cups saved, points, badges
    try {
        const users = await User.find().sort({ points: -1 });

        if (!users) {
            res.status(200).json({
                status: "No users",
                users: null
            })
        }

        res.status(200).json({
            status: "OK",
            users: users
        })

    }
    catch (err) {
        res.status(500).json({
            error: "Internal Server error: " + err
        })
    }
}

module.exports = {
    login,
    registerUser,
    saveCups,
    getUserDetails,
    getLeaderBoard
}
