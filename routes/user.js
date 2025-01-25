const express=require("express");
const router=express.Router({ mergeParams: true});

const {registerUser, login, saveCups, getUserDetails, getLeaderBoard} = require("../controllers/user");

router.post("/register", registerUser);

router.post("/login", login);

router.put("/saveCups", saveCups);

router.get("/leaderboard", getLeaderBoard);

router.get("/:userId", getUserDetails);


module.exports=router;
