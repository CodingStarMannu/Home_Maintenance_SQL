const nodemailer = require('nodemailer');
const {SMTP_MAIL,SMTP_PASSWORD} = process.env




const sendMail = async (email,mailSubject , content) => {
    try {

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            requireTLS: true,
            tls: {
                rejectUnauthorized: false
            },
            auth: {
                user: SMTP_MAIL,
                pass: SMTP_PASSWORD
            }

           

        })
        const mailoptions = {
            from: "shikharc879@gmail.com",
            to: email,
            subject: mailSubject,
            html: content
        }
        transporter.sendMail(mailoptions, function (error, info) {
            if (error) {
                console.log(error);

            } else {
                console.log("email has sent:- ", info.response);

            }
        })
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = sendMail