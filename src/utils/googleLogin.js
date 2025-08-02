// src/utils/googleLogin.js
import API from "./axios";

export const loginWithGoogle = async (idToken) => {
  const res = await API.post("/auth/google", { idToken });
  
  // Save token
  localStorage.setItem("token", res.data.token);
  
  return res.data;
};
