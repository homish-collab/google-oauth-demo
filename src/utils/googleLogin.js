// src/utils/googleLogin.js
import API from "./axios";

export const loginWithGoogle = async (idToken) => {
  const res = await API.post("/api/v1/auth/google-login", { idToken });
  console.log(res)
  // Save token
  localStorage.setItem("token", res.data.token);
  
  return res.data;
};
