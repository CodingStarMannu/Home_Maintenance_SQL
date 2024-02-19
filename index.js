require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    credentials: true,
  })
);

require("./models/index");

app.use(express.json());

app.use(express.static("public"));

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let destinationFolder = "";

    // Determine the destination folder based on file type

    if (file.mimetype.startsWith("image/")) {
      destinationFolder = path.join(__dirname, "./public/image");
    } else if (file.mimetype.startsWith("audio/")) {
      destinationFolder = path.join(__dirname, "./public/audio");
    } else {
      // Handle other file types or throw an error
      console.log("object");
      return cb(new Error("Unsupported file type"));
    }

    cb(null, destinationFolder);
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});

const upload = multer({ storage: storage });

const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/api", (req, res) => {
  res.send(" hello world");
});
const { signUpValidation, forgetValidation } = require("./helper/validation");

const { isAuthorize } = require("./middlewares/auth");

var userController = require("./controllers/userContoller");
var adminControllers = require("./controllers/adminController");
var vendorController = require("./controllers/vendorController");

//users
app.post("/sendOTP", signUpValidation, userController.sendOTP);
app.post("/signUpUser/:id", signUpValidation, userController.userSignUp);
app.patch("/loginUser", signUpValidation, userController.loginUser);

app.get("/forgetPassResendEmail", userController.forgetPassResendEmail);
app.post("/addUserDetails", isAuthorize, userController.addUserDetails);
app.patch("/userLogout", isAuthorize, userController.userLogout);
app.get("/getUserByToken", isAuthorize, userController.getUserByToken);
app.get("/getAllUsers", userController.getAllUsers);
app.put("/updateUserDetails", isAuthorize, userController.updateUserDetails);

//admin
app.get("/getAllUsers", adminControllers.getAllUsers);
app.post(
  "/add-categories",
  upload.single("image"),
  adminControllers.add_categories
);
app.get("/get_category/:category_id", adminControllers.get_category);
app.get("/get_all_categories", adminControllers.get_all_categories);
app.post(
  "/update-categories/",
  upload.single("image"),
  adminControllers.update_category
);
app.delete("/delete_category/", adminControllers.delete_category);
app.post(
  "/addSubcategory",
  upload.single("image"),
  adminControllers.addSubcategory
);
app.post(
  "/getSubcategory",
  upload.single("image"),
  adminControllers.getSubcategory
);
app.post(
  "/updateSubcategory",
  upload.single("image"),
  adminControllers.updateSubcategory
);
app.post(
  "/deleteSubcategory",
  upload.single("image"),
  adminControllers.deleteSubcategory
);

//vendor

app.post("/sendOTPVendor", signUpValidation, vendorController.sendOTPVendor);
app.post("/vendorSignUp/:id", signUpValidation, vendorController.vendorSignUp);
app.patch("/logInVendor", signUpValidation, vendorController.logInVendor);


app.get(
  "/forgetPassResendEmailvendor",
  vendorController.forgetPassResendEmailvendor
);
app.post("/addvendorDetails", isAuthorize, vendorController.addvendorDetails);
app.patch("/vendorLogout", isAuthorize, vendorController.vendorLogout);
app.get("/getvendorByToken", isAuthorize, vendorController.getvendorByToken);
app.get("/getAllvendor", vendorController.getAllvendor);
app.put(
  "/updatevendorDetails",
  isAuthorize,
  vendorController.updatevendorDetails
);


// new added 
app.post("/companyDetail",isAuthorize, vendorController.addCompanyDetails);
app.get('/userVisits', isAuthorize,vendorController.getUserVisits);




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} `);
});
