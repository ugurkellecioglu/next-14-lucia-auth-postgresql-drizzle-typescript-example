import nodemailer from "nodemailer"

// * Gmail SMTP server address: smtp.gmail.com
// * Gmail SMTP name: Your full name
// * Gmail SMTP username: Your full Gmail address (e.g. you@gmail.com)
// * Gmail SMTP password: The password that you use to log in to Gmail
// * Gmail SMTP port (TLS): 587
// * Gmail SMTP port (SSL): 465

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
})

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  await transporter.sendMail({
    from: `"ugur" <${process.env.GMAIL_USER}>`, // sender address
    to, // list of receivers
    subject, // Subject line
    html, // html body
  })
}
