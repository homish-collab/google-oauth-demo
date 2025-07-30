import React, { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './styles.css';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import confetti from 'canvas-confetti';

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

  const handleLoginSuccess = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 } });
    fireworkBurst();
    alert('Google OAuth Success!');
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
      {/* ✨ Background effects */}
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
      <div className="aurora" />
      <div className="moon" />
      {meteors.map((meteor) => (
        <div
          key={meteor.id}
          className="meteor"
          style={{
            left: meteor.left,
            top: meteor.top,
            animationDuration: `${meteor.duration}s`,
          }}
        />
      ))}

      {/* 🔐 Auth card */}
      <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.05}>
        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="glitch-text">{isSignup ? 'Sign Up' : 'Login'}</h1>

          {/* Email Form */}
          {!emailSubmitted ? (
            <form className="form" onSubmit={handleEmailSubmit}>
              <input type="email" placeholder="Email Address" required />
              <button type="submit">Continue with Email</button>
            </form>
          ) : (
            isSignup && (
              <form className="form">
                <input type="text" placeholder="Full Name" required />
                <input type="password" placeholder="Password" required />
                <input type="password" placeholder="Confirm Password" required />
                <button type="submit">Sign Up</button>
              </form>
            )
          )}

          <div className="divider">OR</div>

          <GoogleLogin
            onSuccess={() => {
              handleLoginSuccess();
              setEmailSubmitted(true);
            }}
            onError={() => alert('Google OAuth Failed!')}
          />

          {/* 🔁 Toggle login/signup */}
          {!isSignup ? (
            <p className="switch-auth" onClick={() => {
              setIsSignup(true);
              setEmailSubmitted(false);
            }}>
              Don’t have an account? <span>Sign up</span>
            </p>
          ) : (
            <p className="switch-auth" onClick={() => {
              setIsSignup(false);
              setEmailSubmitted(false);
            }}>
              Already have an account? <span>Login</span>
            </p>
          )}
        </motion.div>
      </Tilt>
    </div>
  );
}

export default App;
