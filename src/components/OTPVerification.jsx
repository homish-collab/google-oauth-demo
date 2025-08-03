import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios';
import './OTPVerification.css';

const OTPVerification = ({ 
  email, 
  purpose = 'signup', 
  onVerificationSuccess, 
  onCancel,
  googleCredential = null 
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const inputRefs = useRef([]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters
    if (isNaN(value) && value !== '') return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (value && index === 5 && newOtp.every(digit => digit !== '')) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleVerifyOtp(otp.join(''));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
      setOtp(newOtp);
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleVerifyOtp = async (otpValue = otp.join('')) => {
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (purpose === 'signup' && googleCredential) {
        // Complete Google signup with OTP
        const response = await axiosInstance.post('/auth/complete-google-signup', {
          credential: googleCredential,
          otp: otpValue
        });
        
        localStorage.setItem('token', response.data.token);
        onVerificationSuccess(response.data);
      } else {
        // Regular OTP verification
        const response = await axiosInstance.post('/auth/verify-otp', {
          email,
          otp: otpValue,
          purpose
        });
        
        onVerificationSuccess(response.data);
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      setAttempts(prev => prev + 1);
      setError(error.response?.data?.message || 'Verification failed. Please try again.');
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    setError('');

    try {
      await axiosInstance.post('/auth/send-otp', {
        email,
        purpose
      });
      
      setResendCooldown(60); // 1 minute cooldown
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error('Resend OTP failed:', error);
      setError(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <motion.div 
      className="otp-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="otp-header">
        <h2>📧 Verify Your Email</h2>
        <p>We've sent a 6-digit code to</p>
        <strong>{email}</strong>
      </div>

      <div className="otp-inputs">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            value={digit}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            className={`otp-input ${error ? 'error' : ''}`}
            maxLength={1}
            autoComplete="off"
          />
        ))}
      </div>

      {error && (
        <motion.div 
          className="error-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.div>
      )}

      <div className="otp-actions">
        <button
          onClick={() => handleVerifyOtp()}
          disabled={loading || otp.some(digit => digit === '')}
          className="verify-btn"
        >
          {loading ? '🔄 Verifying...' : '✅ Verify'}
        </button>

        <div className="resend-section">
          <p>Didn't receive the code?</p>
          <button
            onClick={handleResendOtp}
            disabled={resendLoading || resendCooldown > 0}
            className="resend-btn"
          >
            {resendLoading ? '📤 Sending...' : 
             resendCooldown > 0 ? `⏰ Resend in ${resendCooldown}s` : 
             '📤 Resend Code'}
          </button>
        </div>

        <button onClick={onCancel} className="cancel-btn">
          ← Back
        </button>
      </div>

      <div className="otp-info">
        <p>⏰ Code expires in 10 minutes</p>
        <p>🔒 For security, never share this code with anyone</p>
        {attempts > 0 && attempts < 3 && (
          <p className="attempts-warning">
            ⚠️ {3 - attempts} attempts remaining
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default OTPVerification;