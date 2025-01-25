const mongoose = require("mongoose");
const Schema=mongoose.Schema;

const challengeSchema = mongoose.Schema({
    title: {
        type: String,
        default: "Title",
        trim: true,
    },

    description: {
        type: String,
        default: "lorem ipsum dolor",
    },

    image: {
        type: String,
        default: "https://tiny.cc/ihc7001",
    },

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    startDate: {
        type: Date,
        default: new Date(),
    },

    endDate: {
        type: Date,
        default: new Date(),
    },

    status: {
        type: String,
        default: "active",
        enum: ["active", "completed"]
    },

    rewardPoints: {
        type: Number,
        default: 50
    },

    participants: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          status: { type: String, enum: ["joined", "completed"], default: "joined" }, // Participation status
          completedAt: { type: Date, default: null }, // Timestamp for completion
        },
    ]
});

const challengeModel = new mongoose.model("Challenge", challengeSchema);

module.exports = challengeModel;