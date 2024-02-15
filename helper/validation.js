const {check} = require('express-validator');

exports.signUpValidation = [
    check('email', 'Invalid email').isEmail().custom((value) => {
        // Check if the email contains '@' and ends with '.com'
        if (!value.includes('@') || !value.endsWith('.com')) {
          throw new Error('Invalid email format.');
        }
    
        return true;
      }),    check('password','minimum 8 letter required').isLength({min:8}),

]




exports.forgetValidation = [
    check('email', 'Invalid email').isEmail().custom((value) => {
        // Check if the email contains '@' and ends with '.com'
        if (!value.includes('@') || !value.endsWith('.com')) {
          throw new Error('Invalid email format.');
        }
    
        return true;
      }),   
]


