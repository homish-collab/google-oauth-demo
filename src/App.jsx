import React, { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './styles.css';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import confetti from 'canvas-confetti';
import axiosInstance from './utils/axios'; // axios with baseURL + credentials

function App() {
  const [isSignup, setIsSignup] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [meteors, setMeteors] = useState([]);

  const stars = Array.from({ length: 80 }, () => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: `${Math.random() * 2 + 1}px`,
    duration: `${Math.random() * 3 + 2}s`,
  }));

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
        colors: ['#ff3cac', '#784ba0', '#2b86c5'],
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
      alert(`Welcome ${user.name}!`);
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
      setMeteors((prev) => [
        ...prev,
        {
          id: Math.random(),
          left: Math.random() * window.innerWidth,
          top: Math.random() * window.innerHeight * 0.3,
          duration: Math.random() * 2 + 1,
        },
      ]);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-wrapper">
      {/* 🌌 Stars Background */}
      <div className="stars">
        {stars.map((star, index) => (
          <div
            key={index}
            className="star"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDuration: star.duration,
            }}
          />
        ))}
      </div>

      {/* 🌈 Aurora */}
      <div className="aurora" />

      {/* ☄️ Meteors */}
      {meteors.map((meteor) => (
        <div
          key={meteor.id}
          className="meteor"
          style={{
            left: `${meteor.left}px`,
            top: `${meteor.top}px`,
            animationDuration: `${meteor.duration}s`,
          }}
        />
      ))}

      {/* 🟣 Neon Orb */}
      <div className="neon-orb" />

      {/* 🔐 Auth Card */}
      <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.05}>
        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="glitch-text">{isSignup ? 'Sign Up' : 'Login'}</h1>

          {!emailSubmitted ? (
            <form className="form" onSubmit={handleEmailSubmit}>
              <input type="email" placeholder="Email Address" required />
              <button type="submit">Continue with Email</button>
            </form>
          ) : isSignup ? (
            <form className="form">
              <input type="text" placeholder="Full Name" required />
              <input type="password" placeholder="Password" required />
              <input type="password" placeholder="Confirm Password" required />
              <button type="submit">Sign Up</button>
            </form>
          ) : (
            <form className="form">
              <input type="password" placeholder="Password" required />
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
            onClick={() => {
              setIsSignup(!isSignup);
              setEmailSubmitted(false);
            }}
          >
            {isSignup
              ? 'Already have an account? '
              : 'Don’t have an account? '}
            <span>{isSignup ? 'Login' : 'Sign up'}</span>
          </p>
        </motion.div>
      </Tilt>
    </div>
  );
}

export default App;
