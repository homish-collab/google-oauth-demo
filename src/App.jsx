import React, { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './styles.css';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import confetti from 'canvas-confetti';
import axiosInstance from './utils/axios';
import OTPVerification from './components/OTPVerification';

function App() {
  const [isSignup, setIsSignup] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [arrows, setArrows] = useState([]);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [otpData, setOtpData] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const fireworkBurst = () => {
    const duration = 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }
      confetti({
        ...defaults,
        particleCount: 50,
        origin: { x: Math.random(), y: Math.random() * 0.5 },
        colors: ['#ff8c00', '#ffa500', '#f44336'],
      });
    }, 200);
  };

  const handleLoginSuccess = (userData, message = 'Welcome back, warrior!') => {
    setUser(userData.user);
    setIsLoggedIn(true);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 } });
    fireworkBurst();
    alert(`${message} ${userData.user.name}!`);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axiosInstance.post('/auth/google-login', {
        credential: credentialResponse.credential,
      });

      // Check if OTP verification is required (new user)
      if (res.data.requiresOTP) {
        setOtpData({
          email: res.data.email,
          purpose: res.data.purpose,
          credential: credentialResponse.credential,
          isNewUser: res.data.isNewUser
        });
        setShowOTPVerification(true);
      } else {
        // Existing user - direct login
        const { token, user } = res.data;
        localStorage.setItem('token', token);
        handleLoginSuccess(res.data, 'Welcome back');
      }
    } catch (error) {
      console.error('❌ Google OAuth failed:', error);
      alert(error.response?.data?.message || 'Login failed');
    }
  };

  const handleOTPVerificationSuccess = (data) => {
    setShowOTPVerification(false);
    setOtpData(null);
    
    if (data.token) {
      // Google signup completed successfully
      handleLoginSuccess(data, 'Welcome to the legion');
    } else {
      // Regular OTP verification completed
      alert('Email verified successfully!');
      setEmailSubmitted(true);
    }
  };

  const handleOTPCancel = () => {
    setShowOTPVerification(false);
    setOtpData(null);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setEmailSubmitted(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    setEmailSubmitted(false);
    setIsSignup(false);
  };

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      axiosInstance.defaults.headers.Authorization = `Bearer ${token}`;
      axiosInstance.get('/protected')
        .then(response => {
          setUser(response.data.user);
          setIsLoggedIn(true);
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setArrows((prev) => [
        ...prev,
        {
          id: Math.random(),
          left: Math.random() * window.innerWidth,
          top: Math.random() * window.innerHeight * 0.4,
          duration: Math.random() * 2 + 1,
        },
      ]);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Clean up arrows periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      setArrows(prev => prev.slice(-10)); // Keep only last 10 arrows
    }, 5000);
    return () => clearInterval(cleanup);
  }, []);

  if (isLoggedIn && user) {
    return (
      <div className="page-wrapper">
        <div className="smoke" />
        {arrows.map((a) => (
          <div
            key={a.id}
            className="arrow"
            style={{
              left: `${a.left}px`,
              top: `${a.top}px`,
              animationDuration: `${a.duration}s`,
            }}
          />
        ))}

        <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.05}>
          <motion.div
            className="card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="glitch-text">🛡️ Welcome, Warrior!</h1>
            
            <div className="user-info">
              <h2>🎖️ {user.name}</h2>
              <p>📧 {user.email}</p>
              {user.lastLogin && (
                <p>🕐 Last battle: {new Date(user.lastLogin).toLocaleDateString()}</p>
              )}
              <p>⚔️ Member since: {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="dashboard-actions">
              <button className="action-btn primary">
                🏆 View Achievements
              </button>
              <button className="action-btn secondary">
                ⚔️ Start Battle
              </button>
              <button className="action-btn secondary">
                👥 Guild Hall
              </button>
            </div>

            <button onClick={handleLogout} className="logout-btn">
              🚪 Leave Arena
            </button>
          </motion.div>
        </Tilt>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Battlefield Background Elements */}
      <div className="smoke" />
      {arrows.map((a) => (
        <div
          key={a.id}
          className="arrow"
          style={{
            left: `${a.left}px`,
            top: `${a.top}px`,
            animationDuration: `${a.duration}s`,
          }}
        />
      ))}

      {/* Auth Card or OTP Verification */}
      <AnimatePresence mode="wait">
        {showOTPVerification ? (
          <OTPVerification
            key="otp-verification"
            email={otpData?.email}
            purpose={otpData?.purpose}
            googleCredential={otpData?.credential}
            onVerificationSuccess={handleOTPVerificationSuccess}
            onCancel={handleOTPCancel}
          />
        ) : (
          <Tilt key="auth-card" tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.05}>
            <motion.div
              className="card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="glitch-text">
                {isSignup ? '⚔️ Join the Legion' : '🛡️ Warrior Login'}
              </h1>

              {!emailSubmitted ? (
                <form className="form" onSubmit={handleEmailSubmit}>
                  <input 
                    type="email" 
                    placeholder="Battle ID (Email)" 
                    required 
                    autoComplete="email"
                  />
                  <button type="submit">🚀 Proceed</button>
                </form>
              ) : isSignup ? (
                <form className="form">
                  <input 
                    type="text" 
                    placeholder="Warrior Name" 
                    required 
                    autoComplete="name"
                  />
                  <input 
                    type="password" 
                    placeholder="Create Password" 
                    required 
                    autoComplete="new-password"
                  />
                  <input 
                    type="password" 
                    placeholder="Confirm Password" 
                    required 
                    autoComplete="new-password"
                  />
                  <button type="submit">⚔️ Enlist</button>
                </form>
              ) : (
                <form className="form">
                  <input 
                    type="password" 
                    placeholder="Enter Password" 
                    required 
                    autoComplete="current-password"
                  />
                  <button type="submit">🏰 Enter Arena</button>
                </form>
              )}

              <div className="divider">OR</div>

              <div className="google-login-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => alert('🔴 Google OAuth Failed!')}
                  size="large"
                  text={isSignup ? "signup_with" : "signin_with"}
                  shape="rectangular"
                  logo_alignment="left"
                />
              </div>

              <p
                className="switch-auth"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setEmailSubmitted(false);
                }}
              >
                {isSignup ? 'Already enlisted? ' : 'New to the battle? '}
                <span>{isSignup ? '🔑 Login' : '⚔️ Join'}</span>
              </p>
            </motion.div>
          </Tilt>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
