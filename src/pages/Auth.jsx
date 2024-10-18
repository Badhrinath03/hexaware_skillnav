import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider, signInWithProvider } from '../config/firebaseConfig';
import './Auth.css';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import HCaptcha from '@hcaptcha/react-hcaptcha';

const Auth = ({ classes, setUserRole, setIsAuthenticated }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState('user');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [captchaToken, setCaptchaToken] = useState(null);
    const navigate = useNavigate();

    const toggleAuthMode = () => {
        setIsLogin(!isLogin);
        setError(null);
    };

    const handleAuth = async () => {
        setError(null);
        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }
        if (!captchaToken) {
            setError('Please complete the captcha.');
            return;
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        try {
            if (isLogin) {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserRole(userData.role);
                    if (userData.role === role) {
                        setEmail('');
                        setPassword('');
                        navigate(role === 'admin' ? '/admin' : '/user');
                        setIsAuthenticated(true);
                    } else {
                        setError('Incorrect role selected for this account.');
                        setIsAuthenticated(false);
                    }
                } else {
                    setError('User data not found.');
                }
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const registrationDate = new Date().toISOString();
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    role,
                    registrationDate
                });
                setUserRole(role);
                setEmail('');
                setPassword('');
                navigate(role === 'admin' ? '/admin' : '/user');
                setIsAuthenticated(true);
            }
        } catch (error) {
            setError(error.message);
            console.error("Authentication error: ", error);
        }
    };

    return (
        <div className={`auth-container bg-violet-300 ${classes}`}>
            <div className={`auth-box ${isLogin ? 'login' : 'signup'}`}>
                <div className="form-container">
                    <h2 className="text-2xl font-bold text-center mb-6">{isLogin ? 'Login' : 'Sign Up'}</h2>

                    {/* Role Selection */}
                    <div className="mb-4">
                        <label className="block mb-2 text-gray-700">Select Role:</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {/* Email and Password Fields */}
                    <div className="mb-4">
                        <input onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full p-2 border border-gray-300 rounded mb-2" />
                        <input onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full p-2 border border-gray-300 rounded" />
                    </div>

                    {/* hCaptcha */}
                    <div className="mb-4 captcha-container">
                        <HCaptcha
                            sitekey="9be45fc4-65d6-4732-9060-d21af9f0e04a"
                            onVerify={(token) => setCaptchaToken(token)}
                        />
                    </div>

                    {/* Auth Buttons */}
                    <button
                        onClick={handleAuth}
                        className="w-full bg-blue-500 text-white py-2 rounded-lg transition-transform duration-300 hover:scale-105"
                    >
                        {isLogin ? 'Login' : 'Sign Up'}
                    </button>

                    <div className="flex justify-between items-center mt-4">
                        <button
                            onClick={toggleAuthMode}
                            className="flex-1 bg-blue-500 text-white py-2 rounded-lg transition-transform duration-300 hover:scale-105 mx-1"
                            style={{ maxWidth: '48%' }}
                        >
                            {isLogin ? 'Sign Up' : 'Login'}
                        </button>
                        <button
                            onClick={() => signInWithProvider(googleProvider, setUserRole, setIsAuthenticated, navigate)}
                            className="flex-1 bg-red-500 text-white py-2 rounded-lg flex items-center justify-center transition-transform duration-300 hover:scale-105 mx-1"
                            style={{ maxWidth: '48%' }}
                        >
                            <FaGoogle className="mr-2 sm:text-sm" />
                            <span className="hidden sm:inline">Login with Google</span>
                        </button>
                        <button
                            onClick={() => signInWithProvider(githubProvider, setUserRole, setIsAuthenticated, navigate)}
                            className="flex-1 bg-gray-800 text-white py-2 rounded-lg flex items-center justify-center transition-transform duration-300 hover:scale-105 mx-1"
                            style={{ maxWidth: '48%' }}
                        >
                            <FaGithub className="mr-2 sm:text-sm" />
                            <span className="hidden sm:inline">Login with GitHub</span>
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                </div>
                <div className="auth-bg">
                    <h2 className="text-2xl font-bold text-center text-white">{isLogin ? 'Welcome Back!' : 'Join Us!'}</h2>
                </div>
            </div>
        </div>
    );
};

export default Auth;