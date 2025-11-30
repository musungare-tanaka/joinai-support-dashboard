'use client';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import BASE_URL from '@/app/config/api/api';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

// Dynamically import Lottie with SSR disabled
const Lottie = dynamic(() => import('lottie-react'), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 z-0 bg-gray-100" />
});

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [animationData, setAnimationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();


   function openOTP(){
        router.push("/components/otp/");

      }

  useEffect(() => {
    const fetchAnimation = async () => {
      try {
        const response = await fetch("/Animatons/support1.json");
        const data = await response.json();
        setAnimationData(data);
      } catch (error) {
        console.error('Failed to load animation:', error);
      }
    };
    fetchAnimation();
  }, []);

  useEffect(() => {
    const animateElements = () => {
      const elements = document.querySelectorAll('.slide-in');
      elements.forEach((el, index) => {
        if (el instanceof HTMLElement) {
          el.classList.remove('opacity-0', 'translate-x-full');
          el.classList.add('opacity-100', 'translate-x-0');
          el.style.transitionDelay = `${index * 0.1}s`;
        }
      });
    };

    if (typeof window !== 'undefined') {
      animateElements();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BASE_URL}/admin/authenticate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed. Please try again.';
        if (response.status === 401) {
          errorMessage = 'Invalid credentials. Please check your email and password.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        setLoading(false);
        setError(errorMessage);
        return;
      }

     

      const data = await response.json();
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('email', email);
        localStorage.setItem("id", data.id)
      }

      router.push(data.role === "ADMIN" 
        ? "/components/Admin/Layout" 
        : "/components/Agent/Layout");
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      setError('Network error. Please check your connection and try again.');
    }
  };


  const handleResetPassword = () => {
    router.push("/components/reset-password");

   
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-50 mt-3.5">
      {/* Animation background */}
      <div className="fixed inset-0 z-0">
        {animationData && (
          <Lottie 
            loop
            className="w-full h-full object-cover"
            animationData={animationData}
          />
        )}
      </div>

      {/* Main content */}
      <div className="w-full max-w-sm p-4 relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-xl">
          {/* Logo/Title */}
          <h1 className="flex justify-center items-center text-center text-black font-extrabold text-xl sm:text-2xl mb-6">
            <Image 
              src="/Images/j.png" 
              alt="Joinai Logo" 
              width={30} 
              height={30}
              className="mr-1"
            />
            oinai Support
          </h1>

          <h2 className="text-3xl font-extrabold text-center mb-8 slide-in opacity-0 translate-x-full transition-all duration-300">
            Login
          </h2>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 slide-in opacity-0 translate-x-full transition-all duration-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-12 border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  onMouseDown={(e) => e.preventDefault()} /* prevent input blur on click */
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="text-red-500 text-sm font-medium bg-red-50 border border-red-200 rounded-md p-3 mb-2">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full p-3 rounded-md transition-colors duration-200 ${loading 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

           {/* Reset Password Link */}
            <p className="mt-3 text-center">
              <a
                onClick={handleResetPassword}
                className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer transition-colors duration-200"
              >
                Forgot Password?
              </a>
            </p>
          </form>

          {/* Footer */}
          <footer className="mt-6 text-center">
            <button 
              onClick={openOTP}
              className="text-blue-600 hover:text-blue-800 text-sm transition-colors duration-200"
            >
              Request OTP
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;
