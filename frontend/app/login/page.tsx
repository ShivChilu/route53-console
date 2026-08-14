'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Cloud, HelpCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and Password are required.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f3f3] text-[#16191f] flex flex-col items-center justify-center p-4">
      {/* Header Logo */}
      <div className="flex items-center space-x-2.5 mb-8">
        <div className="bg-[#ec7211] p-1.5 rounded-sm flex items-center justify-center">
          <Cloud className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-lg tracking-wider text-gray-800 uppercase">AWS Console Sign-In</span>
      </div>

      <div className="w-full max-w-[420px] bg-white border border-gray-300 shadow-sm p-8 rounded-sm">
        <h2 className="text-xl font-medium text-gray-900 mb-6">Sign in</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-xs font-medium text-red-800 flex items-start space-x-2 rounded-r-sm">
            <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5 mt-2"
            loading={loading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 border-t border-gray-200 pt-4 flex items-center justify-between text-xs text-aws-graytext">
          <span className="flex items-center hover:underline cursor-pointer">
            <HelpCircle className="w-3.5 h-3.5 mr-1" />
            Forgot password?
          </span>
          <span className="hover:underline cursor-pointer">Create a new AWS account</span>
        </div>
      </div>

      {/* Demo Credentials Alert */}
      <div className="w-full max-w-[420px] bg-blue-50 border border-blue-200 rounded-sm p-4 mt-4 flex items-start space-x-3 text-xs select-none">
        <svg className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div>
          <h4 className="font-bold text-blue-900 mb-1">Demo Session Credentials</h4>
          <p className="text-blue-800 leading-relaxed">
            Email: <strong className="font-mono text-gray-900 select-all">admin@example.com</strong><br />
            Password: <strong className="font-mono text-gray-900 select-all">admin123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
