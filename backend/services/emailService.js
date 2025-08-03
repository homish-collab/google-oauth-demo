const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // For Gmail
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // Use App Password, not regular password
      }
    });
  }
  
  // For other SMTP services
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

const sendOTPEmail = async (email, otp, purpose = 'signup') => {
  try {
    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    
    const subject = getEmailSubject(purpose);
    const htmlContent = getEmailTemplate(otp, purpose);
    
    const mailOptions = {
      from: {
        name: 'Google OAuth Demo',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: subject,
      html: htmlContent,
      text: `Your OTP for ${purpose} is: ${otp}. This code will expire in 10 minutes.`
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}:`, result.messageId);
    
    return {
      success: true,
      message: 'OTP sent successfully',
      messageId: result.messageId
    };
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return {
      success: false,
      message: 'Failed to send OTP email',
      error: error.message
    };
  }
};

const getEmailSubject = (purpose) => {
  switch (purpose) {
    case 'signup':
      return '🔐 Verify Your Email - Google OAuth Demo';
    case 'login':
      return '🔑 Login Verification - Google OAuth Demo';
    case 'password_reset':
      return '🔄 Password Reset - Google OAuth Demo';
    default:
      return '🔐 Verification Code - Google OAuth Demo';
  }
};

const getEmailTemplate = (otp, purpose) => {
  const purposeText = {
    'signup': 'complete your registration',
    'login': 'verify your login',
    'password_reset': 'reset your password'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verification Code</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container { 
          background: white; 
          padding: 30px; 
          border-radius: 10px; 
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          border: 1px solid #e9ecef;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          padding-bottom: 20px;
          border-bottom: 2px solid #ff8c00;
        }
        .header h1 { 
          color: #ff8c00; 
          margin: 0; 
          font-size: 28px;
          font-weight: 600;
        }
        .otp-container { 
          text-align: center; 
          margin: 30px 0; 
          padding: 25px;
          background: linear-gradient(135deg, #ff8c00, #ffa500);
          border-radius: 8px;
          color: white;
        }
        .otp-code { 
          font-size: 36px; 
          font-weight: bold; 
          letter-spacing: 8px; 
          margin: 15px 0;
          font-family: 'Courier New', monospace;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .warning { 
          background: #fff3cd; 
          border: 1px solid #ffeaa7; 
          color: #856404; 
          padding: 15px; 
          border-radius: 5px; 
          margin: 20px 0;
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          color: #666; 
          font-size: 14px;
        }
        .btn {
          display: inline-block;
          padding: 12px 25px;
          background: #ff8c00;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 15px 0;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛡️ Google OAuth Demo</h1>
          <p>Secure Email Verification</p>
        </div>
        
        <h2>Hello Warrior! 👋</h2>
        <p>You requested to ${purposeText[purpose] || 'verify your email'}. Please use the verification code below:</p>
        
        <div class="otp-container">
          <p style="margin: 0; font-size: 18px;">Your Verification Code</p>
          <div class="otp-code">${otp}</div>
          <p style="margin: 0; font-size: 14px;">Valid for 10 minutes</p>
        </div>
        
        <div class="warning">
          <strong>⚠️ Security Notice:</strong>
          <ul style="margin: 10px 0 0 20px;">
            <li>This code will expire in <strong>10 minutes</strong></li>
            <li>Never share this code with anyone</li>
            <li>Our team will never ask for this code</li>
            <li>If you didn't request this, please ignore this email</li>
          </ul>
        </div>
        
        <p>Having trouble? Contact our support team or try generating a new code.</p>
        
        <div class="footer">
          <p>This is an automated message from Google OAuth Demo</p>
          <p>© 2024 Google OAuth Demo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  testEmailConfig
};