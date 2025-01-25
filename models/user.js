const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    name: {
        type: String,
        default: "",
        trim: true,
    },

    email: {
        type: String,
        default: "",
    },

    password: {
        type: String,
        default: "",
    },

    cupsSaved: {
        type: Number,
        default: 0,
    },

    co2Saved: {
        type: Number,
        default: 0,
    },

    isOrganization: {
        type: Boolean,
        default: false,
    },

    badge: {
        type: String
    },

    points: {
        type: Number,
        default: 0
    },

    competitions: [
        {
          competitionId: { type: mongoose.Schema.Types.ObjectId, ref: "Challenge" },
          status: { type: String, enum: ["joined", "completed"], default: "joined" },
          completedAt: { type: Date, default: null }
        },
      ],
});

const userModel = new mongoose.model("User", userSchema);

module.exports = userModel;