const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

async function sendMail(to, subject, text, html) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: `${process.env.NAME} <${process.env.EMAIL}>`,
      to,
      subject,
      text,
      html: `
      <html>
      <head>
        <style>
          .container {
            display: grid;
            
            text-align: center;
            width: 100%;
            height: max-content;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          .card {
            display: grid;
           
          }
          .card button{
            padding: 10px 25px;
            border: none;
            border-radius: 15px;
            background-color: rgb(12, 47, 145);
            color: aliceblue;
            box-shadow: 2px 2px 15px rgba(107, 95, 95, 0.334);
          }
        </style>
      </head>
      <body>
        <div class="container">
       ${html}
        </div>
      </body>
    </html>
    
      `,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}
// sendMail()
//   .then((result) => console.log('Email sent...', result))
//   .catch((error) => console.log(error.message));

async function sendBulkMail(recipients, subject, text, html) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailPromises = recipients.map((recipient) => {
      const mailOptions = {
        from: `${process.env.NAME} <${process.env.EMAIL}>}`,
        to: recipient,
        subject,
        text,
        html,
      };
      return transport.sendMail(mailOptions);
    });

    const results = await Promise.all(mailPromises);
    return results;
  } catch (error) {
    return error;
  }
}

function generateOTP(length) {
  const chars = "0123456789"; // Characters allowed in the OTP
  let otp = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    otp += chars[randomIndex];
  }

  return otp;
}

function generateRandomCode(minLength) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
  
    const codeLength = Math.max(minLength, 15); // Ensure the code length is at least 15 characters
  
    for (let i = 0; i < codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters.charAt(randomIndex);
    }
  
    return code;
  }
  

module.exports = { sendMail, generateOTP, generateRandomCode,sendBulkMail };
