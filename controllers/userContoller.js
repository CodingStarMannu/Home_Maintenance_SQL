var db = require('../models/index')
var userModels = db.user_model
var userReferCode = db.userReferCode



const sendMail = require('../helper/orderSendMail')
const {JWT_SECRET} = process.env
const jwt = require('jsonwebtoken')

const randomstring = require('randomstring');
const bcrypt = require('bcrypt');


const generateToken = (user_id) => {
    try {
      const token = jwt.sign({ user_id }, process.env.JWT_SECRET);
      return token;
    } catch (err) {
      console.error(err);
      throw new Error('Failed to generate token');
    }
  };
  const saltRounds = 10;

  const {validationResult} = require('express-validator')

  const signupUsers = async (req, res) => {
    const email = req.body.email;
    // Generate a 6-digit OTP
    const otp = randomstring.generate({ length: 6, charset: 'numeric' });
  
    // Create the email content with the OTP
    const mailSubject = 'OTP for Mail Verification';
    const content = `<p>Your OTP for mail verification is: ${otp}</p>`;
  
    try {
      // Send the email with the OTP
      await sendMail(email, mailSubject, content);
  
      // Save the user data with the OTP in the database
      const newUserData = await userModels.create({
        email: email,
        OTP: otp // Save the OTP to the 'token' field
      });
  
      const id = newUserData.user_id;
      console.log('New user created:', newUserData.toJSON());
      res.status(201).json({ message: 'User created successfully.', id: id });
    } catch (error) {
      console.error('Error sending email or creating user:', error);
      res.status(500).json({ message: 'Error sending email or creating user.' });
    }
  };
  
  // Function to generate a unique refer code (you can implement your logic)
  function generateReferCode() { 
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let referCode = '';
  
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      referCode += characters.charAt(randomIndex);
    }
  
    return referCode;
  }

  const verifyOTP = (req, res) => {

    const  user_id = req.params.id
     const { otp } = req.body;
   
     userModels.findOne({ where: { user_id } })
       .then((existingUser) => {
         if (!existingUser) {
           return res.status(404).json({ message: 'User not found.' });
         }
   
         if (existingUser.OTP === otp) {
       
           existingUser.update({ is_verified: true })
             .then(() => {
               return res.status(200).json({ message: 'OTP is valid. User verified successfully.' });
             })
             .catch((error) => {
               console.error('Error updating user:', error);
               return res.status(500).json({ message: 'Error updating user.' });
             });
         } else {
           return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
         }
       })
       .catch((error) => {
         console.error('Error finding user:', error);
         return res.status(500).json({ message: 'Error finding user.' });
       });
   };




   async function savePassword(req, res) {
    try {
      const  user_id = req.params.id
      const { password } = req.body;
      console.log(password);
  
      if (!password ) {
        return res.status(400).json({ error: 'Passwords not found' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const user = await userModels.findByPk(user_id);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      user.password = hashedPassword;
      await user.save();
  
      res.json({ message: 'Password saved successfully' });
    } catch (error) {
      console.error('Error saving password:', error);
      res.status(500).json({ error: 'Failed to save password' });
    }
  }
  


  const loginUser = async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await userModels.findOne({ where: { email: email } });
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      // if (!user.is_verified) {
      //   return res.status(401).json({ message: 'Email is not verified. Please verify your email first.' });
      // }
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid password.' });
      }
      console.log(password);
      console.log(user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid password.' });
      }
  
      const token = generateToken(user.user_id); 
      console.log(user.user_id);
  
      user.token = token;
      await user.save(); 
  
      res.status(200).json({ message: 'User logged in successfully.', token });
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({ message: 'Error logging in user.' });
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
        return res.status(404).json({ message: 'User not found.' });
      }
  
      // Generate a new 6-digit OTP
      const newOtp = randomstring.generate({ length: 6, charset: 'numeric' });
  
      // Create the email content with the new OTP
      const mailSubject = 'New OTP for Mail Verification';
      const content = `<p>Your new OTP for mail verification is: ${newOtp}</p>`;
  
      // Send the email with the new OTP
      await sendMail(email, mailSubject, content);
  
      // Update the user's OTP in the database
      await user.update({ OTP: newOtp });
  
      res.status(200).json({ message: 'Email resent successfully with new OTP.' });
    } catch (error) {
      console.error('Error resending email or updating OTP:', error);
      res.status(500).json({ message: 'Error resending email or updating OTP.' });
    }
  };


  const addUserDetails = async (req, res) => {
    try {
      // Check for the JWT token in the request header
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Token missing' });
      }
  
      // Verify the token and get the user_id from the payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.user_id;
      console.log(userId);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
      }
  
      // Check if the user exists in the database
      const existingUser = await userModels.findOne({ where: { user_id: userId } });
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const { name, phone } = req.body;
  
  
      // Update the user details in the database
      await userModels.update(
        {
          name,
          phone
        },
        { where: { user_id: userId } }
      );
  
      // Respond with the updated user data
      const updatedUser = await userModels.findByPk(userId);
      res.status(200).json({
        message: 'User details updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Error adding user details:', error);
      res.status(500).json({ error: 'Failed to add user details' });
    }
  };



  const userLogout = (req, res) => {
    const token = req.headers.authorization.split(' ')[1]; 
    const decodedToken = jwt.decode(token);
    const userid = decodedToken.user_id;
  
    // Remove token from user table in the database
    userModels.update({ token: null }, { where: { user_id: userid } })
      .then(() => {
        res.status(200).json({ message: 'User logged out successfully.' });
      })
      .catch((error) => {
        console.error('Error logging out user:', error);
        res.status(500).json({ message: 'Error logging out user.' });
      });
  };

  const getAllUsers = async (req, res) => {
    try {
      // Fetch all users from the database
      const users = await userModels.findAll();
  
      return res.status(200).json({ message: 'Users retrieved successfully.', data: users });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ message: 'Error getting users.' });
    }
  };



  const getUserByToken = async (req, res) => {
    try {
        // Check for the JWT token in the request header
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Token missing' });
        }

        // Verify the token and get the user_id from the payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.user_id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // Check if the user exists in the database
        const existingUser = await userModels.findOne({ where: { user_id: userId } });
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Respond with the user data
        res.status(200).json({
            message: 'User data retrieved successfully',
            user: existingUser,
        });
    } catch (error) {
        console.error('Error retrieving user data:', error);
        res.status(500).json({ error: 'Failed to retrieve user data' });
    }
};

const updateUserDetails = async (req, res) => {
    try {
        // Check for the JWT token in the request header
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Token missing' });
        }

        // Verify the token and get the user_id from the payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.user_id;
        console.log(userId);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // Check if the user exists in the database
        const existingUser = await userModels.findOne({ where: { user_id: userId } });
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { name, phone } = req.body;

        // Update the user details in the database
        await userModels.update(
            {
                name,
                phone
            },
            { where: { user_id: userId } }
        );

        // Respond with the updated user data
        const updatedUser = await userModels.findByPk(userId);
        res.status(200).json({
            message: 'User details updated successfully',
            user: updatedUser,
        });
    } catch (error) {
        console.error('Error updating user details:', error);
        res.status(500).json({ error: 'Failed to update user details' });
    }
};




  module.exports = {signupUsers,loginUser,verifyOTP,savePassword,forgetPassResendEmail,addUserDetails,userLogout,getUserByToken,updateUserDetails,getAllUsers}