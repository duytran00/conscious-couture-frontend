import React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import "./login.css";
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from "jwt-decode"
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  BrowserRouter as Router, Routes, Route, Link
} from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { getLoginAutofill, isDevAutofillEnabled } from '../dev/autofill';

const login = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const loginAutofill = getLoginAutofill();
  const [email, setEmail] = useState(loginAutofill.email)
  const [password, setPassword] = useState(loginAutofill.password)
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login_user = async () => {
    try {
      setError("");
      const res = await fetch("http://localhost:8000/api/v1/users/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to login account");
      }

      // Tell AuthContext about the login (sets localStorage + React state + fetches cart)
      auth.login({
        name: data.user.name.split(" ")[0],
        email: email,
        id: data.user.id,
        token: data.token || data.access_token,
      });

      navigate("/dashboard")
    }
    catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const onSuccess = async (credentialResponse) => {
    try {
      const credential = credentialResponse.credential;
      const res = await fetch("http://localhost:8000/api/v1/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ idToken: credential })
      });

      const data = await res.json();
      if (!res.ok) throw new Error("Backend login failed");

      const info = jwtDecode(credentialResponse.credential);

      // Tell AuthContext about the login
      auth.login({
        name: info.given_name,
        email: info.email,
        id: data.user?.id || data.user?.user_id,
        token: data.token || data.access_token || data.idToken,
      });

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  const onError = () => {
    console.log("Login failed")
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    login_user();
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your account</p>
          </div>

          {isDevAutofillEnabled && (
            <div className="auth-dev-note">
              Dev mode prefilled a local test account.
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <div className="google-login-wrapper">
            <GoogleLogin
              onSuccess={onSuccess}
              onError={onError}
            />
          </div>

          <div className="auth-footer">
            <span>Don't have an account? </span>
            <Link to="/signup" className="auth-link">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};


export default login;