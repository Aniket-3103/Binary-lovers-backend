require('dotenv').config();

const express=require("express")
const mongoose=require("mongoose");
const cors=require("cors");
const userRoutes=require("./routes/user");
const bodyParser=require("body-parser");

mongoose.connect('mongodb://127.0.0.1:27017/wiserefill')
    .then(function () {
        console.log("connected to database");
    }).catch(err => {
        console.log("Something went wrong: " + err)
    });;

const app=express();


app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

//routes
app.use("/user", userRoutes);


app.listen(3000, ()=>{
    console.log("Server running on port: 3000");
})
