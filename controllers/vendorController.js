

var db = require('../models/index')
var vendor_detail = db.vendor_detail
var userReferCode = db.userReferCode



const sendMail = require('../helper/orderSendMail')
const {JWT_SECRET} = process.env
const jwt = require('jsonwebtoken')

const randomstring = require('randomstring');
const bcrypt = require('bcrypt');


const generateToken = (vendor_id) => {
    try {
      const token = jwt.sign({ vendor_id }, process.env.JWT_SECRET);
      return token;
    } catch (err) {
      console.error(err);
      throw new Error('Failed to generate token');
    }
  };
  const saltRounds = 10;

  const {validationResult} = require('express-validator')

  const signupvendor = async (req, res) => {
    const email = req.body.email;
    // Generate a 6-digit OTP
    const otp = randomstring.generate({ length: 6, charset: 'numeric' });
  
    // Create the email content with the OTP
    const mailSubject = 'OTP for Mail Verification';
    const content = `<p>Your OTP for mail verification is: ${otp}</p>`;
  
    try {
      // Send the email with the OTP
      await sendMail(email, mailSubject, content);
  
      // Save the vendor data with the OTP in the database
      const newUserData = await vendor_detail.create({
        email: email,
        OTP: otp // Save the OTP to the 'token' field
      });
  
      const id = newUserData.vendor_id;
      console.log('New vendor created:', newUserData.toJSON());
      res.status(201).json({ message: 'User created successfully.', id: id });
    } catch (error) {
      console.error('Error sending email or creating vendor:', error);
      res.status(500).json({ message: 'Error sending email or creating vendor.' });
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

    const  vendor_id = req.params.id
     const { otp } = req.body;
   
     vendor_detail.findOne({ where: { vendor_id } })
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
               console.error('Error updating vendor:', error);
               return res.status(500).json({ message: 'Error updating vendor.' });
             });
         } else {
           return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
         }
       })
       .catch((error) => {
         console.error('Error finding vendor:', error);
         return res.status(500).json({ message: 'Error finding vendor.' });
       });
   };




   async function savePassword(req, res) {
    try {
      const  vendor_id = req.params.id
      const { password } = req.body;
      console.log(password);
  
      if (!password ) {
        return res.status(400).json({ error: 'Passwords not found' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const vendor = await vendor_detail.findByPk(vendor_id);
  
      if (!vendor) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      vendor.password = hashedPassword;
      await vendor.save();
  
      res.json({ message: 'Password saved successfully' });
    } catch (error) {
      console.error('Error saving password:', error);
      res.status(500).json({ error: 'Failed to save password' });
    }
  }
  


  const loginvendor = async (req, res) => {
    try {
      const { email, password } = req.body;
      const vendor = await vendor_detail.findOne({ where: { email: email } });
      if (!vendor) {
        return res.status(404).json({ message: 'User not found.' });
      }
      // if (!vendor.is_verified) {
      //   return res.status(401).json({ message: 'Email is not verified. Please verify your email first.' });
      // }
      const passwordMatch = await bcrypt.compare(password, vendor.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid password.' });
      }
      console.log(password);
      console.log(vendor.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid password.' });
      }
  
      const token = generateToken(vendor.vendor_id); 
      console.log(vendor.vendor_id);
  
      vendor.token = token;
      await vendor.save(); 
  
      res.status(200).json({ message: 'User logged in successfully.', token });
    } catch (error) {
      console.error('Error logging in vendor:', error);
      res.status(500).json({ message: 'Error logging in vendor.' });
    }
  };



  const forgetPassResendEmailvendor = async (req, res) => {
    const email = req.body.email;
  
    try {
      // Find the vendor by email
      const vendor = await vendor_detail.findOne({
        where: {
          email: email,
        },
      });
  
      if (!vendor) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      // Generate a new 6-digit OTP
      const newOtp = randomstring.generate({ length: 6, charset: 'numeric' });
  
      // Create the email content with the new OTP
      const mailSubject = 'New OTP for Mail Verification';
      const content = `<p>Your new OTP for mail verification is: ${newOtp}</p>`;
  
      // Send the email with the new OTP
      await sendMail(email, mailSubject, content);
  
      // Update the vendor's OTP in the database
      await vendor.update({ OTP: newOtp });
  
      res.status(200).json({ message: 'Email resent successfully with new OTP.' });
    } catch (error) {
      console.error('Error resending email or updating OTP:', error);
      res.status(500).json({ message: 'Error resending email or updating OTP.' });
    }
  };


  const addvendorDetails = async (req, res) => {
    try {
      // Check for the JWT token in the request header
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Token missing' });
      }
  
      // Verify the token and get the vendor_id from the payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.vendor_id;
      console.log(userId);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
      }
  
      // Check if the vendor exists in the database
      const existingUser = await vendor_detail.findOne({ where: { vendor_id: userId } });
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const { name, phone } = req.body;
  
  
      // Update the vendor details in the database
      await vendor_detail.update(
        {
          name,
          phone
        },
        { where: { vendor_id: userId } }
      );
  
      // Respond with the updated vendor data
      const updatedUser = await vendor_detail.findByPk(userId);
      res.status(200).json({
        message: 'User details updated successfully',
        vendor: updatedUser,
      });
    } catch (error) {
      console.error('Error adding vendor details:', error);
      res.status(500).json({ error: 'Failed to add vendor details' });
    }
  };



  const vendorLogout = (req, res) => {
    const token = req.headers.authorization.split(' ')[1]; 
    const decodedToken = jwt.decode(token);
    const userid = decodedToken.vendor_id;
  
    // Remove token from vendor table in the database
    vendor_detail.update({ token: null }, { where: { vendor_id: userid } })
      .then(() => {
        res.status(200).json({ message: 'User logged out successfully.' });
      })
      .catch((error) => {
        console.error('Error logging out vendor:', error);
        res.status(500).json({ message: 'Error logging out vendor.' });
      });
  };

  const getAllvendor = async (req, res) => {
    try {
      // Fetch all users from the database
      const users = await vendor_detail.findAll();
  
      return res.status(200).json({ message: 'Users retrieved successfully.', data: users });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ message: 'Error getting users.' });
    }
  };



  const getvendorByToken = async (req, res) => {
    try {
        // Check for the JWT token in the request header
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Token missing' });
        }

        // Verify the token and get the vendor_id from the payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.vendor_id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // Check if the vendor exists in the database
        const existingUser = await vendor_detail.findOne({ where: { vendor_id: userId } });
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Respond with the vendor data
        res.status(200).json({
            message: 'User data retrieved successfully',
            vendor: existingUser,
        });
    } catch (error) {
        console.error('Error retrieving vendor data:', error);
        res.status(500).json({ error: 'Failed to retrieve vendor data' });
    }
};

const updatevendorDetails = async (req, res) => {
    try {
        // Check for the JWT token in the request header
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Token missing' });
        }

        // Verify the token and get the vendor_id from the payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.vendor_id;
        console.log(userId);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // Check if the vendor exists in the database
        const existingUser = await vendor_detail.findOne({ where: { vendor_id: userId } });
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { name, phone } = req.body;

        // Update the vendor details in the database
        await vendor_detail.update(
            {
                name,
                phone
            },
            { where: { vendor_id: userId } }
        );

        // Respond with the updated vendor data
        const updatedUser = await vendor_detail.findByPk(userId);
        res.status(200).json({
            message: 'User details updated successfully',
            vendor: updatedUser,
        });
    } catch (error) {
        console.error('Error updating vendor details:', error);
        res.status(500).json({ error: 'Failed to update vendor details' });
    }
};






  module.exports = {signupvendor,loginvendor,verifyOTP,savePassword,forgetPassResendEmailvendor,addvendorDetails,vendorLogout,getvendorByToken,updatevendorDetails,getAllvendor}




