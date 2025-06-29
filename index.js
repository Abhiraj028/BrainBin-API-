const express = require("express");
const app = express();
const {z} = require("zod");
const {UsersModel,DumpsModel} = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
const JWT_SECRET = "wauw";
let hits = 0;

mongoose.connect();
//////////////////////////////IMPORTS AND DECLARATIONS
app.use(express.json());

function logger(req,res,next){
    if(hits == 5){
        res.json({msg:"Bandwidth exceeded,kindly try again after some time"});
        return;
    }
    console.log(req.method);
    hits++;
    next();
}

setInterval(() => hits = 0,1000);

app.use(logger);

/////////////////////////////// LOGGER SECTION

function auth(req,res,next){
    try{
        const token = req.headers.authorization;
        const verify = jwt.verify(token,JWT_SECRET);
        if(!verify){
            res.json({msg:"invalid login"});
            return;
        }
        req.username = verify.username;
        next();
    }catch(e){
        res.json({msg:"Auth Error, kindly recheck fields"});
    }

}

///////////////////////////////////AUTH MIDDLEWARE

const userSignUp = z.object({
    username: z.string(),
    email: z.string().email(),
    password: z.string().refine(val => val != val.toLowerCase()) 
});

const userLogin = z.object({
    username: z.string(),
    password: z.string().min(1) 
})

const BinCheck = z.object({
    dump: z.string().min(1)
})

//////////////////////////////////////ZOD OBJECTS DECLARATIONS
    
app.post("/signup",async (req,res) =>{

    const ans = userSignUp.safeParse(req.body);
    if(ans.success){
        try{
            const validatedUser = ans.data;
            const hashedPass = await bcrypt.hash(validatedUser.password,5);
            await UsersModel.create({
                username:validatedUser.username,
                email:validatedUser.email,
                password: hashedPass
            })
            res.json({msg:"You have signed up successfully!"});           
        }catch(e){
            res.status(400).json({msg:"Error occured post validation"});
            return;
        }

    }else{
        res.status(400).json({msg:"Invalid Credentials Added", err:ans.error});
    }

})

//////////////////////////////////////////SIGNUP ENDPOINT

app.post("/login",async (req,res) =>{
    const ans = userLogin.safeParse(req.body);
    if(ans.success){
        const data = ans.data;
        const username = data.username;
        const foundUser = await UsersModel.findOne({username});
        if(!foundUser){
            res.status(400).json({msg:"User not found"});
            return;
        }
        const passwordCheck = await bcrypt.compare(data.password,foundUser.password);

        if(passwordCheck){
            const token = jwt.sign({username},JWT_SECRET,{expiresIn:"1h"});
            res.json({msg:"You have successfully loggen in!",token});
        }else{
            res.status(400).json({msg:"nein mann"});
        }
    }else{
        res.json({msg:"Error, login failed"});
        return;
    }
})

//////////////////////////////////////////LOGIN ENDPOINT

app.post("/bin",async(req,res) =>{
    const ans = BinCheck.safeParse(req.body);
    if(ans.success){
        const token = req.headers.authorization;
        const validToken = jwt.verify(token,JWT_SECRET);
        if(validToken){
            const username = validToken.username;
            const foundUser = await UsersModel.findOne({username});
            if(!foundUser){
                res.json({msg:"No user found, kindly signup"})
                return;
            }
            const id = foundUser._id;

            await DumpsModel.create({
                msg: ans.data.dump,
                userLink: id
            })

            res.json({ msg: "Bin saved successfully" });
        }else{
            res.status(400).json({msg:"Invalid credentials"});
        }
    }else{
        res.status(400).json({msg:"Invalid inputs"});
    }
})

//////////////////////////////////////////BIN POST ENDPOINT

app.get("/bins",auth, async (req,res) =>{
    const username = req.username;
    const userFound = await UsersModel.findOne({username});
    if(!userFound){
        res.json({msg:"User not found"});
        return;
    }
    
    const dumps = await DumpsModel.find({userLink: userFound._id});
    if(dumps.length == 0){
        res.json({msg:"no bins found for the user"});
        return;
    }
    res.json(dumps);
})

//////////////////////////////////////////GET ALL BINS FOR THE USER ENDPOINT

app.get("/bin/:id",auth, async (req,res) =>{
    const username = req.username;
    const dumpId = req.params.id;
    const userFound = await UsersModel.findOne({username});
    if(!userFound){
        res.status(400).json({msg:"account not found"});
        return;
    }
    const userId = userFound._id;

    const bin = await DumpsModel.findOne({_id: dumpId});
    if(bin.userLink.toString() !== userId.toString()){
        res.status(500).json({msg:"Server error"});
        return;
    }else{
        res.json(bin.msg);
    }
})

//////////////////////////////////////////GET SPECIFIC BINS ENDPOINT

app.delete("/delete/:id",auth, async (req,res) =>{
    const username = req.username;
    const dumpId = req.params.id;
    const userFound = await UsersModel.findOne({username});
    if(!userFound){
        res.status(400).json({msg:"account not found"});
        return;
    }
    const userId = userFound._id;

    const bin = await DumpsModel.findOne({_id: dumpId});
    if(bin.userLink.toString() !== userId.toString()){
        res.status(500).json({msg:"Server error"});
        return;
    }else{
        const del = await DumpsModel.deleteOne({_id: dumpId});
        res.json({msg:"Successfully deleted!",del})
    }
})

//////////////////////////////////////////DELETE SPECIFIC BINS ENDPOINT

app.put("/update/:id",auth, async(req,res) =>{
    const ans = BinCheck.safeParse(req.body);
    if(!ans.success){
        res.json({msg:"invalid data entered"});
        return;
    }
    const username = req.username;
    const dumpId = req.params.id;
    const userFound = await UsersModel.findOne({username});
    if(!userFound){
        res.status(400).json({msg:"account not found"});
        return;
    }
    const userId = userFound._id;

    const bin = await DumpsModel.findOne({_id: dumpId});
    if(bin.userLink.toString() !== userId.toString()){
        res.status(500).json({msg:"Server error"});
        return;
    }else{
        bin.msg = ans.data.dump;
        try{
        await bin.save();
        res.json({msg:"Updated the bin successfully!"});
        }catch{
            res.json({msg:"database error"});
            return;
        }
    }
});

//////////////////////////////////////////UPDATE SPECIFIC BINS ENDPOINT
app.listen(3000);