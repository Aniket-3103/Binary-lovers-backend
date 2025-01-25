const mongoose = require("mongoose");
const Challenge = require("../models/challenge");
const User = require("../models/user");

const createChallenge = async (req, res) => {
    try {
        const { title, description, startDate, endDate, rewardPoints, userId, imageUrl } = req.body;

        if (!title || !description || !startDate || !endDate || !rewardPoints || !userId || !imageUrl) {
            res.status(400).json({
                error: "Missing required fields",
            })
        }

        //only organization's can create challenges
        const user = await User.findById(userId);

        if (!user.isOrganization) {
            res.status(400).json({
                error: "You're not authorised to create challenges",
            })
        }

        const challenge = new Challenge({
            title,
            description,
            startDate,
            endDate,
            image: imageUrl,
            rewardPoints,
            createdBy: userId,
        });

        await challenge.save();
        res.status(201).json({ success: true, challengeId: challenge._id });

    }
    catch (error) {
        console.log("Error from challengeController's create challenge", error);
        return res.status(500).json({
            statusText: "failed"
        });
    }
}

const completeChallenge = async (req, res) => {
    try {
        const { challengeId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required." });
        }

        // Find the challenge
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ error: "Challenge not found." });
        }

        // Check if the user is a participant
        const participant = challenge.participants.find(
            (p) => p.user.toString() === userId
        );
        if (!participant) {
            return res.status(400).json({ error: "User has not joined this challenge." });
        }

        if (participant.status === "completed") {
            return res.status(400).json({ error: "Challenge already completed by the user." });
        }

        // Mark the challenge as completed for the user
        participant.status = "completed";

        // Update user's points and competitions array
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const competition = user.competitions.find(
            (comp) => comp.competitionId.toString() === challengeId
        );
        if (!competition) {
            return res.status(400).json({ error: "Challenge not found in user's competitions." });
        }

        competition.status = "completed";
        user.points += challenge.rewardPoints;

        await Promise.all([challenge.save(), user.save()]);

        res.status(200).json({
            message: "Challenge completed successfully.",
            challenge,
            user,
        });
    } catch (error) {
        console.error("Error completing challenge:", error);
        res.status(500).json({ error: "Internal server error." });
    }
}

const getAllChallenges = async (req, res) => {
    try {
        const activeChallenges = await Challenge.find({ status: "active" })
            .populate("createdBy", "name email")
            .sort({ startDate: 1 }); // Sort by start date

        res.status(200).json({
            message: "Active challenges retrieved successfully.",
            challenges: activeChallenges,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch challenges' });
    }
}

const joinChallenge = async (req, res) => {
    try {
        const { challengeId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required." });
        }

        // Find the challenge
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ error: "Challenge not found." });
        }

        if (challenge.status !== "active") {
            return res.status(400).json({ error: "Challenge is not active." });
        }

        // Check if the user is already a participant
        const existingParticipant = challenge.participants.find(
            (participant) => participant.user.toString() === userId
        );
        if (existingParticipant) {
            return res.status(400).json({ error: "User has already joined this challenge." });
        }

        // Add user to challenge participants
        challenge.participants.push({ user: userId, status: "joined" });

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Check if the user has already added this challenge to their competitions
        const existingCompetition = user.competitions.find(
            (comp) => comp.challenge.toString() === challengeId
        );
        if (existingCompetition) {
            return res.status(400).json({ error: "Challenge already added to user's competitions." });
        }

        // Add challenge details to user's competitions array
        user.competitions.push({
            competitionId: challengeId,
            status: "joined",
        });

        await Promise.all([challenge.save(), user.save()]);

        res.status(200).json({
            message: "Challenge joined successfully.",
            challenge,
            user,
        });
    } catch (error) {
        console.error("Error joining challenge:", error);
        res.status(500).json({ error: "Internal server error." });
    }
}



module.exports = {
    createChallenge,
    joinChallenge,
    completeChallenge,
    getAllChallenges
};
