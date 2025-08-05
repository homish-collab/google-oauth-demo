import React, { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './styles.css';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import confetti from 'canvas-confetti';
import axiosInstance from './utils/axios';

function App() {
  const [isSignup, setIsSignup] = useState(false);
  const [arrows, setArrows] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    fullName: '',
    collegeName: '',
    rollNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [loggedInUser, setLoggedInUser] = useState(null);

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

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axiosInstance.post('/auth/google-login', {
        credential: credentialResponse.credential,
      });

      const { token, user } = res.data;
      localStorage.setItem('token', token);
      setLoggedInUser(user);

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 } });
      fireworkBurst();
    } catch (error) {
      console.error('❌ Google OAuth failed:', error);
      alert('Login failed');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return alert('Passwords do not match!');
    }
    try {
      const res = await axiosInstance.post('/auth/signup', {
        email: formData.email,
        username: formData.username,
        fullName: formData.fullName,
        collegeName: formData.collegeName,
        rollNumber: formData.rollNumber,
        password: formData.password,
      });

      localStorage.setItem('token', res.data.token);
      setLoggedInUser(res.data.user);
      fireworkBurst();
    } catch (error) {
      console.error('❌ Registration failed:', error);
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem('token', res.data.token);
      setLoggedInUser(res.data.user);
      fireworkBurst();
    } catch (error) {
      console.error('❌ Login failed:', error);
      alert(error.response?.data?.message || 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLoggedInUser(null);
    setFormData({
      email: '',
      username: '',
      fullName: '',
      collegeName: '',
      rollNumber: '',
      password: '',
      confirmPassword: '',
    });
  };

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
          {/* If logged in, show details */}
          {loggedInUser ? (
            <div className="user-details">
              <h1 className="glitch-text">Welcome, {loggedInUser.fullName}</h1>
              <p><strong>Username:</strong> {loggedInUser.username}</p>
              <p><strong>Email:</strong> {loggedInUser.email}</p>
              <p><strong>College:</strong> {loggedInUser.collegeName}</p>
              {loggedInUser.rollNumber && (
                <p><strong>Roll No:</strong> {loggedInUser.rollNumber}</p>
              )}
              <button onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <>
              <h1 className="glitch-text">{isSignup ? 'Register' : 'Login'}</h1>

              {isSignup ? (
                <form className="form" onSubmit={handleRegister}>
                  <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                  <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
                  <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
                  <input type="text" name="collegeName" placeholder="College Name" value={formData.collegeName} onChange={handleChange} required />
                  <input type="text" name="rollNumber" placeholder="Roll Number (optional)" value={formData.rollNumber} onChange={handleChange} />
                  <input type="password" name="password" placeholder="Create Password" value={formData.password} onChange={handleChange} required />
                  <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
                  <button type="submit">Register</button>
                </form>
              ) : (
                <form className="form" onSubmit={handleLogin}>
                  <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                  <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                  <button type="submit">Login</button>
                </form>
              )}

              <div className="divider">OR</div>

              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => alert('Google OAuth Failed!')}
              />

              <p
                className="switch-auth"
                onClick={() => setIsSignup(!isSignup)}
              >
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
