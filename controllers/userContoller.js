var db = require("../models/index");
var userModels = db.user_model;
var userReferCode = db.userReferCode;

const sendMail = require("../helper/orderSendMail");
const { JWT_SECRET } = process.env;
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const randomstring = require("randomstring");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const generateToken = (user_id) => {
  try {
    const token = jwt.sign({ user_id }, process.env.JWT_SECRET);
    return token;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to generate token");
  }
};

// Function to generate a unique refer code (you can implement your logic)
function generateReferCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let referCode = "";

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referCode += characters.charAt(randomIndex);
  }

  return referCode;
}



const sendOTP = async (req, res) => {
  const email = req.body.email;
  // Generate a 6-digit OTP
  const otp = randomstring.generate({ length: 6, charset: "numeric" });

  try {
 
    let user = await userModels.findOne({ where: { email: email } });

    if (!user) {
      user = await userModels.create({
        email: email,
        OTP: otp,
        is_verified: false,
        otpGeneratedAt: new Date()
      });
    } else {
      await user.update({ OTP: otp, otpGeneratedAt: new Date() });
    }

    await user.save();


    const id = user.user_id;
    console.log("User updated with new OTP:", user.toJSON());

    // Send the OTP to the user's email (assuming this function works correctly)
    await sendMail(email, "OTP for Mail Verification", `<p>Your OTP for mail verification is: ${otp}</p>`);

    res.status(201).json({ message: "User created/updated successfully.", id: id });
  } catch (error) {
    console.error("Error sending email or updating user:", error);
    res.status(500).json({ message: "Error sending email or updating user." });
  }
};

// function for validating OTP for only 10 mins
const validateOTP = (user, otp) => {
  // Check if OTP is expired
  const otpGeneratedAt = user.otpGeneratedAt;
  const otpExpirationTime = new Date(otpGeneratedAt.getTime() + 10 * 60 * 1000); // 10 minutes expiration
  const currentTime = new Date();

  if (currentTime > otpExpirationTime) {
    return { isValid: false, message: "OTP has expired. Please request a new one." };
  }

  if (user.OTP !== otp) {
    return { isValid: false, message: "Invalid OTP. Please try again." };
  }

  return { isValid: true };
};


const userSignUp = async (req, res) => {
  const userId = req.params.id;
  const { otp, password } = req.body;

  try {
    const user = await userModels.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Validate OTP
    const otpValidationResult = validateOTP(user, otp);
    if (!otpValidationResult.isValid) {
      return res.status(400).json({ message: otpValidationResult.message });
    }

    // Mark user as verified
    await user.update({ is_verified: true });

    // Save password
    if (!password) {
      return res.status(400).json({ error: "Password not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

     // Adding profile_created_month and profile_created_date
     const currentDate = new Date();
     user.profile_created_month = currentDate.getMonth() + 1;
     user.profile_created_date = currentDate.getDate();

    const token = generateToken(user.user_id);
    user.token = token;
    await user.save();

    return res.status(200).json({
      message: "User verified and password saved successfully.",
      token,
    });
  } catch (error) {
    console.error("Error signing up user:", error);
    return res.status(500).json({ message: "Error signing up user." });
  }
};


const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModels.findOne({ where: { email: email } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (!user.is_verified) {
      return res.status(401).json({ message: 'Email is not verified. Please verify your email first.' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password." });
    }
    console.log(password);
    console.log(user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password." });
    }

    const token = generateToken(user.user_id);
    console.log(user.user_id);

    user.token = token;
    await user.save();

    res.status(200).json({ message: "User logged in successfully.", token });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Error logging in user." });
  }
};

const forgetPassResendEmail = async (req, res) => {
  const email = req.body.email;

  try {
    // Find the user by email
    const user = await userModels.findOne({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate a new 6-digit OTP
    const newOtp = randomstring.generate({ length: 6, charset: "numeric" });

    // Create the email content with the new OTP
    const mailSubject = "New OTP for Mail Verification";
    const content = `<p>Your new OTP for mail verification is: ${newOtp}</p>`;

    // Send the email with the new OTP
    await sendMail(email, mailSubject, content);

    // Update the user's OTP in the database
    await user.update({ OTP: newOtp });

    res
      .status(200)
      .json({ message: "Email resent successfully with new OTP." });
  } catch (error) {
    console.error("Error resending email or updating OTP:", error);
    res.status(500).json({ message: "Error resending email or updating OTP." });
  }
};

const addUserDetails = async (req, res) => {
  try {
    // Check for the JWT token in the request header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    // Verify the token and get the user_id from the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user_id;
    console.log(userId);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Check if the user exists in the database
    const existingUser = await userModels.findOne({
      where: { user_id: userId },
    });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name, phone } = req.body;

    // Update the user details in the database
    await userModels.update(
      {
        name,
        phone,
      },
      { where: { user_id: userId } }
    );

    // Respond with the updated user data
    const updatedUser = await userModels.findByPk(userId);
    res.status(200).json({
      message: "User details updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error adding user details:", error);
    res.status(500).json({ error: "Failed to add user details" });
  }
};

const userLogout = (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decodedToken = jwt.decode(token);
  const userId = decodedToken.user_id;

  // Remove token from user table in the database
  userModels
    .update({ token: null }, { where: { user_id: userId } })
    .then(() => {
      res.status(200).json({ message: "User logged out successfully." });
    })
    .catch((error) => {
      console.error("Error logging out user:", error);
      res.status(500).json({ message: "Error logging out user." });
    });
};

const getAllUsers = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await userModels.findAll();

    return res
      .status(200)
      .json({ message: "Users retrieved successfully.", data: users });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ message: "Error getting users." });
  }
};

const getUserByToken = async (req, res) => {
  try {
    // Check for the JWT token in the request header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    // Verify the token and get the user_id from the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user_id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Check if the user exists in the database
    const existingUser = await userModels.findOne({
      where: { user_id: userId },
    });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Respond with the user data
    res.status(200).json({
      message: "User data retrieved successfully",
      user: existingUser,
    });
  } catch (error) {
    console.error("Error retrieving user data:", error);
    res.status(500).json({ error: "Failed to retrieve user data" });
  }
};

const updateUserDetails = async (req, res) => {
  try {
    // Check for the JWT token in the request header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    // Verify the token and get the user_id from the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user_id;
    console.log(userId);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Check if the user exists in the database
    const existingUser = await userModels.findOne({
      where: { user_id: userId },
    });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name, phone } = req.body;

    // Update the user details in the database
    await userModels.update(
      {
        name,
        phone,
      },
      { where: { user_id: userId } }
    );

    // Respond with the updated user data
    const updatedUser = await userModels.findByPk(userId);
    res.status(200).json({
      message: "User details updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ error: "Failed to update user details" });
  }
};

module.exports = {
  sendOTP,
  loginUser,
  userSignUp,
  forgetPassResendEmail,
  addUserDetails,
  userLogout,
  getUserByToken,
  updateUserDetails,
  getAllUsers,
};
