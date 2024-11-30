import nodemailer, { Transporter } from "nodemailer";
import "dotenv/config";

// Create a transporter configuration
const transporter: Transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER, // Replace with your email user
    pass: process.env.EMAIL_PASS, // Replace with your email password
  },
  tls: { rejectUnauthorized: true },
});

// Function to send an email
export const sendMail = async (
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER, // sender address
      to, // receiver address
      subject, // Subject line
      text, // Plain text body
      html, // HTML body (optional)
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
