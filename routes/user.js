const express=require("express");
const router=express.Router({ mergeParams: true});

const {registerUser, login, saveCups, getUserDetails} = require("../controllers/user");

router.post("/register", registerUser);

router.post("/login", login);

router.put("/saveCups", saveCups);

router.get("/:userId", getUserDetails);


module.exports=router;
