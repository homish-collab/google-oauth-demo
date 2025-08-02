import React, { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './styles.css';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import confetti from 'canvas-confetti';
import axiosInstance from './utils/axios';

function App() {
  const [isSignup, setIsSignup] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [arrows, setArrows] = useState([]);

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
      console.log('✅ Logged in user:', user);

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 } });
      fireworkBurst();
      alert(`Welcome, warrior ${user.name}!`);
      setEmailSubmitted(true);
    } catch (error) {
      console.error('❌ Google OAuth failed:', error);
      alert('Login failed');
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setEmailSubmitted(true);
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

      {/* 🔐 Auth Card */}
      <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.05}>
        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="glitch-text">{isSignup ? 'Join the Legion' : 'Warrior Login'}</h1>

          {!emailSubmitted ? (
            <form className="form" onSubmit={handleEmailSubmit}>
              <input type="email" placeholder="Battle ID (Email)" required />
              <button type="submit">Proceed</button>
            </form>
          ) : isSignup ? (
            <form className="form">
              <input type="text" placeholder="Warrior Name" required />
              <input type="password" placeholder="Create Password" required />
              <input type="password" placeholder="Confirm Password" required />
              <button type="submit">Enlist</button>
            </form>
          ) : (
            <form className="form">
              <input type="password" placeholder="Enter Password" required />
              <button type="submit">Enter Arena</button>
            </form>
          )}

          <div className="divider">OR</div>

          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => alert('Google OAuth Failed!')}
          />

          <p
            className="switch-auth"
            onClick={() => {
              setIsSignup(!isSignup);
              setEmailSubmitted(false);
            }}
          >
            {isSignup ? 'Already enlisted? ' : 'New to the battle? '}
            <span>{isSignup ? 'Login' : 'Join'}</span>
          </p>
        </motion.div>
      </Tilt>
    </div>
  );
}

export default App;
