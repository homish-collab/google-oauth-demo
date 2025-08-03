# 🛡️ Google OAuth Demo with Email OTP Verification

A modern, secure authentication system built with React, Node.js, and MongoDB featuring Google OAuth integration and email OTP verification for enhanced security.

## ✨ Features

### 🔐 Authentication
- **Google OAuth 2.0** integration with automatic account linking
- **Email OTP verification** for new Google signups
- **Traditional email/password** authentication with secure password policies
- **JWT-based sessions** with configurable expiration
- **Password strength validation** and secure hashing (bcrypt with 12 salt rounds)

### 🛡️ Security
- **Rate limiting** on authentication endpoints
- **Input validation** with Joi schemas
- **Helmet.js** for security headers
- **CORS** properly configured
- **SQL injection** and XSS protection
- **Email verification** for all new accounts

### 🎨 UI/UX
- **Warrior-themed** dark interface with animations
- **Responsive design** for all devices
- **Smooth animations** with Framer Motion
- **Real-time form validation** and error handling
- **Accessibility features** including keyboard navigation
- **Loading states** and user feedback

### 📧 Email System
- **Professional email templates** with HTML/CSS styling
- **OTP delivery** with 10-minute expiration
- **Resend functionality** with cooldown protection
- **Multiple email providers** support (Gmail, SMTP)
- **Email verification** tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MongoDB (local or Atlas)
- Google OAuth 2.0 credentials
- Email service (Gmail with App Password recommended)

### 1. Clone and Install

```bash
git clone https://github.com/your-username/google-oauth-demo.git
cd google-oauth-demo

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### 2. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google Identity API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173`
5. Copy the Client ID

### 3. Set Up Email Service (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Copy the 16-character password

### 4. Configure Environment Variables

Create `backend/.env` file:

```env
# Database
MONGO_URI=mongodb://localhost:27017/google-oauth-demo

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password

# Server
PORT=9000
NODE_ENV=development
```

### 5. Configure Frontend

Create/update `src/main.jsx` to include your Google Client ID:

```jsx
import { GoogleOAuthProvider } from '@react-oauth/google';

// Your Google Client ID
const GOOGLE_CLIENT_ID = "your-google-client-id.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
```

### 6. Run the Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend  
cd ..
npm run dev
```

Visit `http://localhost:5173` to see the application.

## 🏗️ Architecture

### Backend Structure
```
backend/
├── controllers/        # Request handlers
│   └── authController.js
├── middleware/         # Express middleware
│   └── verifyToken.js
├── models/            # MongoDB schemas
│   ├── userModel.js
│   └── otpModel.js
├── routes/            # API routes
│   └── authRoutes.js
├── services/          # Business logic
│   └── emailService.js
└── index.js          # Server entry point
```

### Frontend Structure
```
src/
├── components/        # React components
│   ├── OTPVerification.jsx
│   └── OTPVerification.css
├── utils/            # Utilities
│   └── axios.js
├── App.jsx           # Main component
├── styles.css        # Global styles
└── main.jsx         # Entry point
```

## 📡 API Documentation

### Authentication Endpoints

#### POST `/auth/google-login`
Google OAuth authentication
```json
{
  "credential": "google-jwt-token"
}
```

#### POST `/auth/complete-google-signup`  
Complete Google signup after OTP verification
```json
{
  "credential": "google-jwt-token",
  "otp": "123456"
}
```

#### POST `/auth/send-otp`
Send OTP to email
```json
{
  "email": "user@example.com",
  "purpose": "signup"
}
```

#### POST `/auth/verify-otp`
Verify OTP code
```json
{
  "email": "user@example.com", 
  "otp": "123456",
  "purpose": "signup"
}
```

#### POST `/auth/signup`
Traditional signup
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

#### POST `/auth/login`
Traditional login
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

### Protected Endpoints

#### GET `/protected`
Requires: `Authorization: Bearer <jwt-token>`

#### GET `/health`
Health check endpoint

## 🔧 Configuration Options

### Email Providers

#### Gmail (Recommended)
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
```

#### Custom SMTP
```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
```

### Security Settings
```env
# Rate limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # Max requests per window
AUTH_RATE_LIMIT_MAX=10         # Max auth attempts per window

# JWT
JWT_SECRET=minimum-32-characters-for-security
```

## 🛡️ Security Features

- **Password Requirements**: 8+ characters, uppercase, lowercase, number, special character
- **Rate Limiting**: 100 requests/15min general, 10 auth requests/15min
- **JWT Security**: 24h expiration, signed with strong secret
- **OTP Security**: 6-digit codes, 10min expiration, 3 attempt limit
- **Input Validation**: Joi schemas for all inputs
- **Error Handling**: Secure error messages without data leakage

## 🎨 Customization

### Themes
The warrior theme can be customized in `src/styles.css`:
- Primary color: `#ff8c00` (orange)
- Background: Dark with battlefield image
- Typography: Cinzel serif font

### Email Templates
Customize email templates in `backend/services/emailService.js`:
- HTML styling
- Brand colors
- Email content

## 🚨 Troubleshooting

### Common Issues

#### 1. Google OAuth "unauthorized_client"
- Check authorized origins in Google Console
- Ensure HTTPS in production
- Verify Client ID matches

#### 2. Email not sending
- Verify Gmail App Password (not account password)
- Check spam folder
- Enable "Less secure app access" if using regular password

#### 3. MongoDB connection failed
- Ensure MongoDB is running locally
- Check MongoDB Atlas connection string
- Verify network access in Atlas

#### 4. CORS errors
- Check backend CORS configuration
- Ensure frontend URL is in allowed origins
- Verify port numbers match

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and stack traces.

## 📱 Production Deployment

### Environment Variables
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=production-secret-64-characters-minimum
GOOGLE_CLIENT_ID=production-client-id
EMAIL_SERVICE=gmail
EMAIL_USER=production-email@domain.com
EMAIL_APP_PASSWORD=production-app-password
```

### Security Checklist
- [ ] Strong JWT secret (64+ characters)
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Rate limiting configured
- [ ] Error logging enabled
- [ ] Health monitoring setup

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React OAuth Google](https://github.com/MomenSherif/react-oauth) for Google OAuth integration
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Nodemailer](https://nodemailer.com/) for email functionality
- [Joi](https://joi.dev/) for input validation

---

⚔️ **Built with passion by warriors, for warriors!** 🛡️

