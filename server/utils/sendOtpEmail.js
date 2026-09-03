import nodemailer from "nodemailer";

const sendOtpEmail = async (options) => {
   try {
     if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error("Email credentials are not set in environment variables");
     }

     const transporter = nodemailer.createTransport({
       service: "gmail",
       auth: {
         user: process.env.SMTP_USER, 
         pass: process.env.SMTP_PASS,
       },
     });

     const mailOptions = {
         from: process.env.SMTP_USER,
         
         to: options.to, 

         subject: options.subject,
         text: options.text,
         html: `<p>${options.text}</p>`,
     };

     await transporter.sendMail(mailOptions);
     console.log("OTP email sent successfully");

   } catch (error) {
     console.error("Error sending OTP email:", error);
     throw error;
   }
}  

export { sendOtpEmail };