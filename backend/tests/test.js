const nodemailer = require("nodemailer");

async function test() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "abhisrvcs@gmail.com",
      pass: "lcmc ykbh vitr jjfw",
    },
  });

  try {
    await transporter.verify();
    console.log("SMTP Connected");
  } catch (err) {
    console.log("Code:", err.code);
    console.log("Response:", err.response);
    console.log("Message:", err.message);
    console.log(err);
  }
}

test();