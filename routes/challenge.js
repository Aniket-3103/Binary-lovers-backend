const express=require("express");
const router=express.Router({ mergeParams: true});

const {createChallenge, joinChallenge, completeChallenge, getAllChallenges} = require("../controllers/challenge");

router.post("/:challengeId/join", joinChallenge);

router.post("/:challengeId/complete", completeChallenge);

router.post("/", createChallenge);

router.get("/", getAllChallenges);


module.exports=router;
