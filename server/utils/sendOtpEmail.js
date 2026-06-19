// now to send otp we are using nodemailer package, so we will import that and write the logic
import nodemailer from "nodemailer";

const sendOtpEmail = async (options) => {
   try {
     if(!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Email credentials are not set in environment variables");
    }
  // Create a transporter object using SMTP transport
  const transporter = nodemailer.createTransport({
    service: "gmail", // You can use any email service you prefer
    auth: {
      user: process.env.EMAIL_USER, // Your email address
      pass: process.env.EMAIL_PASS, // Your email password or app password
    },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender address
        to: options.to, // List of recipients
        subject: options.subject, // Subject line
        text: options.text, // Plain text body
        html: `<p>${options.text}</p>`, // HTML body
    };
    await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully");

   } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
   }
}  

export { sendOtpEmail };