'use client'

import { useEffect, useState } from 'react';
import { UserRole } from '../contexts/UserContext';
import { FileText, Mail, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { getWeb3AuthInstance } from "@/utils/Web3AuthStore";
import { useConnection } from 'wagmi';
import { WALLET_ADAPTERS } from '@web3auth/base';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

// Email validation function
const isValidEmail = (email: string): boolean => {
  if (!email || !email.trim()) {
    return false;
  }

  // RFC 5322 compliant email regex (simplified version)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Additional checks
  if (email.length > 254) { // Max email length
    return false;
  }

  // Check for valid domain structure
  const parts = email.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] = parts;

  // Local part validation (before @)
  if (localPart.length === 0 || localPart.length > 64) {
    return false;
  }

  // Domain validation (after @)
  if (domain.length === 0 || domain.length > 253) {
    return false;
  }

  // Check domain has at least one dot
  if (!domain.includes('.')) {
    return false;
  }

  // Check domain doesn't start or end with dot or hyphen
  if (domain.startsWith('.') || domain.endsWith('.') ||
    domain.startsWith('-') || domain.endsWith('-')) {
    return false;
  }

  return emailRegex.test(email);
};

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isTouched, setIsTouched] = useState(false);
  const { address, isConnected } = useConnection();

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError('Email is required');
      return false;
    }

    if (!isValidEmail(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }

    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    // Validate on change if field has been touched
    if (isTouched) {
      validateEmail(value);
    }
  };

  const handleBlur = () => {
    setIsTouched(true);
    validateEmail(email);
  };

  const web3Auth = getWeb3AuthInstance();

  const handleContinue = async () => {
    setIsTouched(true);

    console.log('web3Auth?.connected', web3Auth?.connected);
    if (web3Auth?.connected) return;

    if (validateEmail(email)) {
      try {
        await web3Auth.connectTo(WALLET_ADAPTERS.AUTH, {
          loginProvider: "email_passwordless",
          extraLoginOptions: {
            login_hint: email.trim(),
          },
        });

      } catch (e) {
        setEmailError("Failed to sign in. Please try again.");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleContinue();
    }
  };

  const isEmailValid = email.trim() && !emailError;

  useEffect(() => {
    if (web3Auth?.connected && isConnected) {
      onLogin("legal");
    }
  }, [web3Auth?.connected, isConnected])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="border-2 bg-white shadow-lg">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 bg-brand-secondary rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold">ContractFlow</h1>
            </div>
            <CardDescription className="text-lg">
              Enter your email to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleBlur}
                  onKeyPress={handleKeyPress}
                  className={`pl-10 h-12 text-base ${emailError ? 'border-destructive focus-visible:border-destructive' : ''}`}
                  autoComplete="email"
                  autoFocus
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
              </div>
              {emailError && (
                <div id="email-error" className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>
            <Button
              onClick={handleContinue}
              disabled={!isEmailValid}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              Continue
            </Button>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our terms of service and privacy policy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}