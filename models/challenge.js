const mongoose = require("mongoose");

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
        type: DateTime,
        default: new Date.now(),
    },

    endDate: {
        type: DateTime,
        default: new Date.now(),
    },

    status: {
        type: String,
        default: "active"
    },

    rewardPoints: {
        type: Number,
        default: 50
    },

    participants: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

const challengeModel = new mongoose.model("Challenge", challengeSchema);

module.exports = challengeModel;