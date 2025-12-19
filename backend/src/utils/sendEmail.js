import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const sendEmail = async (options) => {
  // 1. Tạo transporter (Người vận chuyển)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true cho port 465, false cho các port khác
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // 2. Định nghĩa nội dung mail
  const message = {
    from: `${process.env.APP_NAME || "Aurews Team"} <${process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html, // Gửi dạng HTML cho đẹp
  };

  // 3. Gửi mail
  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);
};

export default sendEmail;
