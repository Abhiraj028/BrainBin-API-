const mongoose = require("mongoose"); 

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId; 

const Users = new Schema({
    username: String,
    email: { type: String, unique: true },
    password: String
}, { timestamps: true }); 

const Dumps = new Schema({
    msg: String,
    userLink: { type: ObjectId, ref: "Users" } 
}, { timestamps: true }); 

const UsersModel = mongoose.model("Users", Users);
const DumpsModel = mongoose.model("Dumps", Dumps);

module.exports = {
    UsersModel,
    DumpsModel
};
