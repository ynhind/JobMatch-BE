import nodemailer from "nodemailer";

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send email function
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error: error.message };
  }
};

// Email templates
export const emailTemplates = {
  welcome: (name) => ({
    subject: "Welcome to JobMatch!",
    html: `
      <h1>Welcome to JobMatch, ${name}!</h1>
      <p>Thank you for registering. We're excited to have you on board.</p>
      <p>Start exploring job opportunities or post your first job today!</p>
    `,
  }),

  applicationReceived: (jobTitle, companyName) => ({
    subject: "Application Received",
    html: `
      <h1>Application Received</h1>
      <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been received.</p>
      <p>We'll notify you once the employer reviews your application.</p>
    `,
  }),

  applicationStatusUpdate: (jobTitle, status) => ({
    subject: "Application Status Update",
    html: `
      <h1>Application Status Updated</h1>
      <p>Your application for <strong>${jobTitle}</strong> has been updated to: <strong>${status}</strong></p>
    `,
  }),

  newApplicant: (jobTitle, applicantName) => ({
    subject: "New Application Received",
    html: `
      <h1>New Application</h1>
      <p><strong>${applicantName}</strong> has applied for your job posting: <strong>${jobTitle}</strong></p>
      <p>Login to review the application.</p>
    `,
  }),
};
