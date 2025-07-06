const USER = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

exports.login = async (req,res)=>{
const {email,password} = req.body;

try {
    const user = await USER.findUserByEmail(email);
    if(!user){
        return res.status(400).json({message: 'Invalid Email ID'});
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
        return res.status(400).json({message: 'Invalid Password'});
    }
    // const payload = {userId : user.id};
    // const token = jwt.sign(payload,process.env.JWT_SECRET);
    return res.status(200).json({message: 'Login Successfull'});
} catch (error) {
    
}
};


exports.register = async (req, res) => {
  console.log("✅ [REGISTER] Incoming request:", req.body);
  const { email, password } = req.body;

  try {
    const existingUser = await USER.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User Already exists" });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await USER.createUser(email, hashedPassword);

    return res.status(201).json({ message: "User Created Successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
