const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_MAIL,
    pass: process.env.USER_PASS,
  },
});

async function sendVerificationEmail(userEmail, token) {
  const verifyURL = `http://localhost:3000/verify-email?token=${token}`;
  await transporter.sendMail({
    from: "your_email@gmail.com",
    to: userEmail,
    subject: "Verify your email",
    html: `
      <h2>Email Verification</h2>
      <p>Click below to verify your email:</p>
      <a href="${verifyURL}">Verify Email</a>
    `,
  });
}