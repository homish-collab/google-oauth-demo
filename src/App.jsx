// 

import React, { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './styles.css';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import confetti from 'canvas-confetti';
import axiosInstance from './utils/axios';

function App() {


  const [isSignup, setIsSignup] = useState(false);
  const [signupStep, setSignupStep] = useState(1); // 1=email, 2=otp, 3=register
  const [arrows, setArrows] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    username: '',
    fullname: '', // Changed from fullName to match backend
    collegeName: '',
    rollNo: '', // Changed from rollNumber to match backend
    password: '',
    confirmPassword: '',
  });
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const fireworkBurst = () => {
    const duration = 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
    const interval = setInterval(() => {
      if (Date.now() > animationEnd) return clearInterval(interval);
      confetti({
        ...defaults,
        particleCount: 50,
        origin: { x: Math.random(), y: Math.random() * 0.5 },
        colors: ['#ff8c00', '#ffa500', '#f44336'],
      });
    }, 200);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log("gefe")
      setLoading(true);
      // Fix: Use the correct API endpoint
      const res = await axiosInstance.post('/api/v1/auth/google-login', {
        credential: credentialResponse.credential,
        withCredentials: true
      });
      console.log(res)
      const { accessToken, user } = res.data;
      localStorage.setItem('token', accessToken);
      setLoggedInUser(user);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 } });
      fireworkBurst();
    } catch (error) {
      console.error('Google login error:', error);
      alert(error.response?.data?.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/v1/auth/signup/send-otp', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullname: formData.fullname,
        collegeName: formData.collegeName,
        rollNo: formData.rollNo,
      });

      alert(response.data.message || 'OTP sent to your email');
      setSignupStep(2);
    } catch (error) {
      console.error('Send OTP error:', error);
      alert(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/v1/auth/signup/verify-otp', {
        email: formData.email,
        otp: formData.otp,
      });

      // If verification successful, user is created and logged in
      const { accessToken, user } = response.data;
      localStorage.setItem('token', accessToken);
      setLoggedInUser(user);
      alert(response.data.message || 'Registration successful');
      fireworkBurst();
    } catch (error) {
      console.error('Verify OTP error:', error);
      alert(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axiosInstance.post('/api/v1/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      const { accessToken, user } = res.data;
      localStorage.setItem('token', accessToken);
      setLoggedInUser(user);
      alert(res.data.message || 'Login successful');
      fireworkBurst();
    } catch (error) {
      console.error('Login error:', error);
      alert(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/api/v1/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setLoggedInUser(null);
      setFormData({
        email: '',
        otp: '',
        username: '',
        fullname: '',
        collegeName: '',
        rollNo: '',
        password: '',
        confirmPassword: '',
      });
      setSignupStep(1);
    }
  };

  // Check if user is already logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // You might want to verify the token with backend
      // For now, we'll assume it's valid
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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

  return (
    <div className="page-wrapper">
      <div className="smoke" />
      {arrows.map((a) => (
        <div key={a.id} className="arrow" style={{
          left: `${a.left}px`,
          top: `${a.top}px`,
          animationDuration: `${a.duration}s`,
        }} />
      ))}

      <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.05}>
        <motion.div className="card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
          {loggedInUser ? (
            <div className="user-details">
              <h1 className="glitch-text">Welcome, {loggedInUser.fullname}</h1>
              <p><strong>Username:</strong> {loggedInUser.username}</p>
              <p><strong>Email:</strong> {loggedInUser.email}</p>
              <p><strong>College:</strong> {loggedInUser.collegeName}</p>
              {loggedInUser.rollNo && <p><strong>Roll No:</strong> {loggedInUser.rollNo}</p>}
              {loggedInUser.isIITPStud && <p><strong>IITP Student:</strong> Yes</p>}
              {loggedInUser.score !== undefined && <p><strong>Score:</strong> {loggedInUser.score}</p>}
              <button onClick={handleLogout} disabled={loading}>
                {loading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          ) : (
            <>
              <h1 className="glitch-text">{isSignup ? 'Register' : 'Login'}</h1>

              {isSignup ? (
                <>
                  {signupStep === 1 && (
                    <form className="form" onSubmit={sendOtp}>
                      <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                      />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                      <input
                        type="text"
                        name="fullname"
                        placeholder="Full Name"
                        value={formData.fullname}
                        onChange={handleChange}
                        required
                      />
                      <input
                        type="text"
                        name="collegeName"
                        placeholder="College Name"
                        value={formData.collegeName}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        name="rollNo"
                        placeholder="Roll Number (required for IITP students)"
                        value={formData.rollNo}
                        onChange={handleChange}
                      />
                      <button type="submit" disabled={loading || formData.password !== formData.confirmPassword}>
                        {loading ? 'Sending...' : 'Send OTP'}
                      </button>
                      {formData.password !== formData.confirmPassword && formData.confirmPassword && (
                        <p style={{ color: 'red', fontSize: '14px' }}>Passwords do not match</p>
                      )}
                      <div className="divider">OR</div>
                      <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert('Google OAuth Failed!')} />
                    </form>
                  )}
                  {signupStep === 2 && (
                    <form className="form" onSubmit={verifyOtp}>
                      <p>Enter the OTP sent to {formData.email}</p>
                      <input
                        type="text"
                        name="otp"
                        placeholder="Enter 6-digit OTP"
                        value={formData.otp}
                        onChange={handleChange}
                        maxLength={6}
                        required
                      />
                      <button type="submit" disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify OTP & Register'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignupStep(1)}
                        style={{ marginTop: '10px', background: 'transparent', border: '1px solid #ccc' }}
                      >
                        Back to Form
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <form className="form" onSubmit={handleLogin}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                  <div className="divider">OR</div>
                  <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert('Google OAuth Failed!')} />
                </form>
              )}

              <p className="switch-auth" onClick={() => {
                setIsSignup(!isSignup);
                setSignupStep(1);
                setFormData({
                  email: '',
                  otp: '',
                  username: '',
                  fullname: '',
                  collegeName: '',
                  rollNo: '',
                  password: '',
                  confirmPassword: '',
                });
              }}>
                {isSignup ? 'Already have an account?' : 'New here? '}
                <span>{isSignup ? 'Login' : 'Join'}</span>
              </p>
            </>
          )}
        </motion.div>
      </Tilt>
    </div>
  );
}

export default App;