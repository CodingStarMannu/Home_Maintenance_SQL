var db = require("../models/index");
var vendor_detail = db.vendor_detail;
var userReferCode = db.userReferCode;
var company_detail = db.company_detail;
var user_visit = db.user_visit;
var user_model = db.user_model;
var category = db.category;

const sendMail = require("../helper/orderSendMail");
const { JWT_SECRET } = process.env;
const jwt = require("jsonwebtoken");

const randomstring = require("randomstring");
const bcrypt = require("bcrypt");

const generateToken = (vendor_id) => {
  try {
    const token = jwt.sign({ vendor_id }, process.env.JWT_SECRET);
    return token;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to generate token");
  }
};
const saltRounds = 10;

const { validationResult } = require("express-validator");




const sendOTPVendor = async (req, res) => {
  const email = req.body.email;
  // Generate a 6-digit OTP
  const otp = randomstring.generate({ length: 6, charset: "numeric" });

  try {
 
    let vendor = await vendor_detail.findOne({ where: { email: email } });

    if (!vendor) {
      vendor = await vendor_detail.create({
        email: email,
        OTP: otp,
        is_verified: false,
        otpGeneratedAt: new Date()
      });
    } else {
      await vendor.update({ OTP: otp, otpGeneratedAt: new Date() });
    }

    await vendor.save();


    const id = vendor.vendor_id;
    console.log("Vendor updated with new OTP:", vendor.toJSON());

    // Send the OTP to the user's email (assuming this function works correctly)
    await sendMail(email, "OTP for Mail Verification", `<p>Your OTP for mail verification is: ${otp}</p>`);

    res.status(201).json({ message: "Vendor created/updated successfully.", id: id });
  } catch (error) {
    console.error("Error sending email or updating vendor:", error);
    res.status(500).json({ message: "Error sending email or updating user." });
  }
};

// function for validating OTP for only 10 mins
const validateOTP = (vendor, otp) => {
  // Check if OTP is expired
  const otpGeneratedAt = vendor.otpGeneratedAt;
  const otpExpirationTime = new Date(otpGeneratedAt.getTime() + 10 * 60 * 1000); // 10 minutes expiration
  const currentTime = new Date();

  if (currentTime > otpExpirationTime) {
    return { isValid: false, message: "OTP has expired. Please request a new one." };
  }

  if (vendor.OTP !== otp) {
    return { isValid: false, message: "Invalid OTP. Please try again." };
  }

  return { isValid: true };
};


const vendorSignUp = async (req, res) => {
  const vendorId = req.params.id;
  const { otp, password } = req.body;

  try {
    const vendor = await vendor_detail.findByPk(vendorId);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found." });
    }

    // Validate OTP
    const otpValidationResult = validateOTP(vendor, otp);
    if (!otpValidationResult.isValid) {
      return res.status(400).json({ message: otpValidationResult.message });
    }

    // Mark user as verified
    await vendor.update({ is_verified: true });

    // Save password
    if (!password) {
      return res.status(400).json({ error: "Password not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    vendor.password = hashedPassword;

     // Adding profile_created_month and profile_created_date
     const currentDate = new Date();
     vendor.profile_created_month = currentDate.getMonth() + 1;
     vendor.profile_created_date = currentDate.getDate();

    const token = generateToken(vendor.user_id);
    vendor.token = token;
    await vendor.save();

    return res.status(200).json({
      message: "Vendor verified and password saved successfully.",
      token,
    });
  } catch (error) {
    console.error("Error signing up vendor:", error);
    return res.status(500).json({ message: "Error signing up vendor." });
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


const logInVendor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const vendor = await vendor_detail.findOne({ where: { email: email } });
    if (!vendor) {
      return res.status(404).json({ message: "User not found." });
    }
    // if (!vendor.is_verified) {
    //   return res.status(401).json({ message: 'Email is not verified. Please verify your email first.' });
    // }
    const passwordMatch = await bcrypt.compare(password, vendor.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password." });
    }
    console.log(password);
    console.log(vendor.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password." });
    }

    const token = generateToken(vendor.vendor_id);
    console.log(vendor.vendor_id);

    vendor.token = token;
    await vendor.save();

    res.status(200).json({ message: "User logged in successfully.", token });
  } catch (error) {
    console.error("Error logging in vendor:", error);
    res.status(500).json({ message: "Error logging in vendor." });
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
      return res.status(404).json({ message: "User not found." });
    }

    // Generate a new 6-digit OTP
    const newOtp = randomstring.generate({ length: 6, charset: "numeric" });

    // Create the email content with the new OTP
    const mailSubject = "New OTP for Mail Verification";
    const content = `<p>Your new OTP for mail verification is: ${newOtp}</p>`;

    // Send the email with the new OTP
    await sendMail(email, mailSubject, content);

    // Update the vendor's OTP in the database
    await vendor.update({ OTP: newOtp });

    res
      .status(200)
      .json({ message: "Email resent successfully with new OTP." });
  } catch (error) {
    console.error("Error resending email or updating OTP:", error);
    res.status(500).json({ message: "Error resending email or updating OTP." });
  }
};

const addvendorDetails = async (req, res) => {
  try {
    // Check for the JWT token in the request header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    // Verify the token and get the vendor_id from the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.vendor_id;
    console.log(userId);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Check if the vendor exists in the database
    const existingUser = await vendor_detail.findOne({
      where: { vendor_id: userId },
    });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name, phone } = req.body;

    // Update the vendor details in the database
    await vendor_detail.update(
      {
        name,
        phone,
      },
      { where: { vendor_id: userId } }
    );

    // Respond with the updated vendor data
    const updatedUser = await vendor_detail.findByPk(userId);
    res.status(200).json({
      message: "User details updated successfully",
      vendor: updatedUser,
    });
  } catch (error) {
    console.error("Error adding vendor details:", error);
    res.status(500).json({ error: "Failed to add vendor details" });
  }
};

const vendorLogout = (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decodedToken = jwt.decode(token);
  const userid = decodedToken.vendor_id;

  // Remove token from vendor table in the database
  vendor_detail
    .update({ token: null }, { where: { vendor_id: userid } })
    .then(() => {
      res.status(200).json({ message: "User logged out successfully." });
    })
    .catch((error) => {
      console.error("Error logging out vendor:", error);
      res.status(500).json({ message: "Error logging out vendor." });
    });
};

const getAllvendor = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await vendor_detail.findAll();

    return res
      .status(200)
      .json({ message: "Users retrieved successfully.", data: users });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ message: "Error getting users." });
  }
};

const getvendorByToken = async (req, res) => {
  try {
    // Check for the JWT token in the request header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    // Verify the token and get the vendor_id from the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.vendor_id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Check if the vendor exists in the database
    const existingUser = await vendor_detail.findOne({
      where: { vendor_id: userId },
    });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Respond with the vendor data
    res.status(200).json({
      message: "User data retrieved successfully",
      vendor: existingUser,
    });
  } catch (error) {
    console.error("Error retrieving vendor data:", error);
    res.status(500).json({ error: "Failed to retrieve vendor data" });
  }
};

const updatevendorDetails = async (req, res) => {
  try {
    // Check for the JWT token in the request header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    // Verify the token and get the vendor_id from the payload userId is used vendorId
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.vendor_id;
    console.log(userId);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Check if the vendor exists in the database
    const existingUser = await vendor_detail.findOne({
      where: { vendor_id: userId },
    });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name, phone } = req.body;

    // Update the vendor details in the database
    await vendor_detail.update(
      {
        name,
        phone,
      },
      { where: { vendor_id: userId } }
    );

    // Respond with the updated vendor data
    const updatedUser = await vendor_detail.findByPk(userId);
    res.status(200).json({
      message: "User details updated successfully",
      vendor: updatedUser,
    });
  } catch (error) {
    console.error("Error updating vendor details:", error);
    res.status(500).json({ error: "Failed to update vendor details" });
  }
};

const addCompanyDetails = async (req, res) => {
  try {
    // Check for the JWT token in the request header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    // Verify the token and get the vendor_id from the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const vendorId = decoded.vendor_id;
    if (!vendorId) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Check if the vendor exists in the database
    const existingVendor = await vendor_detail.findOne({
      where: { vendor_id: vendorId },
    });
    if (!existingVendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const { companyName, firmType, aboutCompany } = req.body;

    // Create company details for the vendor
    const companyDetails = await company_detail.create({
      companyName,
      firmType,
      aboutCompany,
      vendor_id: vendorId, 
    });

    res
      .status(201)
      .json({ message: "Company details added successfully", companyDetails });
  } catch (error) {
    console.error("Error adding company details:", error);
    res.status(500).json({ error: "Failed to add company details" });
  }
};



const getUserVisits = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }
    // Verify the token and get the vendor_id from the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const vendorId = decoded.vendor_id;
    if (!vendorId) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
    // Fetch user visits for the logged-in vendor including associated User data and Category
    const userVisits = await user_visit.findAll({
      include: [
        {
          model: user_model,
          attributes: ['name', 'phone'] 
        },
        {
          model: category,
          where: { vendor_id: vendorId }, // Assuming your category table has a column 'vendor_id'
          attributes: ['category_name'] // Fetch only 'name' from the Category model
        }
      ]
    });

    res.status(200).json({ message: "User Visits data fetched Successfully", userVisits });
  } catch (error) {
    console.error('Error fetching user visits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



module.exports = {
  sendOTPVendor,
  vendorSignUp,
  logInVendor,
  forgetPassResendEmailvendor,
  addvendorDetails,
  vendorLogout,
  getvendorByToken,
  updatevendorDetails,
  getAllvendor,
  addCompanyDetails,
  getUserVisits
};
