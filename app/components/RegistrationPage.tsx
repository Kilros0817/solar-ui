'use client'

import { useConnection, useConfig } from 'wagmi';
import { useRouter } from 'next/navigation';
import { FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getUserRole } from '@/utils/interact';
import { USER_ROLE } from '@/utils/constants';
import { UserRole } from '../contexts/UserContext';
import { useUser } from '../contexts/UserContext';
import { getWeb3AuthInstance } from '@/utils/Web3AuthStore';

interface RegistrationPageProps {
  onComplete?: (role: UserRole) => void;
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function RegistrationPage({ onComplete }: RegistrationPageProps) {
  const router = useRouter();
  const { address, isConnected } = useConnection();
  const config = useConfig();
  const { logout } = useUser();
  const [isChecking, setIsChecking] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false
  });

  const validateField = (field: 'firstName' | 'lastName' | 'email', value: string) => {
    const newErrors = { ...errors };
    
    if (field === 'firstName') {
      if (!value.trim()) {
        newErrors.firstName = 'First name is required';
      } else {
        newErrors.firstName = '';
      }
    } else if (field === 'lastName') {
      if (!value.trim()) {
        newErrors.lastName = 'Last name is required';
      } else {
        newErrors.lastName = '';
      }
    } else if (field === 'email') {
      if (!value.trim()) {
        newErrors.email = 'Email is required';
      } else if (!isValidEmail(value)) {
        newErrors.email = 'Please enter a valid email address';
      } else {
        newErrors.email = '';
      }
    }
    
    setErrors(newErrors);
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFirstName(value);
    if (touched.firstName) {
      validateField('firstName', value);
    }
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLastName(value);
    if (touched.lastName) {
      validateField('lastName', value);
    }
  };

  // Fetch email from Web3Auth when component mounts
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const web3Auth = getWeb3AuthInstance();
        if (web3Auth?.connected) {
          const userInfo = await web3Auth.getUserInfo();
          if (userInfo?.email) {
            const userEmail = userInfo.email;
            setEmail(userEmail);
            // Validate email immediately since it's pre-filled
            setTouched(prev => ({ ...prev, email: true }));
            if (!userEmail.trim()) {
              setErrors(prev => ({ ...prev, email: 'Email is required' }));
            } else if (!isValidEmail(userEmail)) {
              setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
            } else {
              setErrors(prev => ({ ...prev, email: '' }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user email:', error);
      }
    };

    if (isConnected && address) {
      fetchEmail();
    }
  }, [isConnected, address]);

  const handleBlur = (field: 'firstName' | 'lastName' | 'email') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'firstName') {
      validateField('firstName', firstName);
    } else if (field === 'lastName') {
      validateField('lastName', lastName);
    } else if (field === 'email') {
      validateField('email', email);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!address || !config) return;
    
    // Mark all fields as touched
    setTouched({ firstName: true, lastName: true, email: true });
    
    // Validate all fields
    validateField('firstName', firstName);
    validateField('lastName', lastName);
    validateField('email', email);
    
    // Check if form is valid
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !isValidEmail(email)) {
      toast.error('Please fill in all fields correctly');
      return;
    }
    
    setIsChecking(true);
    try {
      const memberInfo = await getUserRole(config, address);
      // memberInfo returns [role, dCategory, ...] - role is the first element
      const memberInfoArray = memberInfo as any;
      const role = Number(memberInfoArray?.[0] ?? USER_ROLE.NO_ROLE);
      
      if (role === USER_ROLE.NO_ROLE) {
        toast.info('Still waiting...', {
          description: 'Please contact support to complete your registration.',
        });
      } else {
        // Role exists, proceed to next page
        if (onComplete) {
          onComplete(role);
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      toast.error('Failed to check registration status. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleBackToLogin = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <Card className="border-2 bg-white shadow-lg max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-2xl">No Wallet Connected</CardTitle>
            <CardDescription>
              Please connect your wallet to continue
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <Card className="border-2 bg-white shadow-lg max-w-md w-full">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-brand-secondary rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold">ContractFlow</h1>
          </div>
          <CardTitle className="text-2xl font-bold">Complete Your Registration</CardTitle>
          <CardDescription className="text-base">
            Please provide your information to complete the registration process.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* First Name Field */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={handleFirstNameChange}
              onBlur={() => handleBlur('firstName')}
              aria-invalid={touched.firstName && !!errors.firstName}
              className={touched.firstName && errors.firstName ? 'border-destructive' : ''}
            />
            {touched.firstName && errors.firstName && (
              <p className="text-sm text-destructive">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name Field */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={handleLastNameChange}
              onBlur={() => handleBlur('lastName')}
              aria-invalid={touched.lastName && !!errors.lastName}
              className={touched.lastName && errors.lastName ? 'border-destructive' : ''}
            />
            {touched.lastName && errors.lastName && (
              <p className="text-sm text-destructive">{errors.lastName}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              disabled
              aria-invalid={touched.email && !!errors.email}
              className={touched.email && errors.email ? 'border-destructive' : 'bg-muted/50 cursor-not-allowed'}
            />
            {touched.email && errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Info Section */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Registration Required</p>
                <p>
                  This wallet address needs to be registered before you can access the platform. 
                  Please complete the registration process to continue.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleCompleteRegistration}
              disabled={isChecking}
              className="flex-1 h-12 text-base font-semibold"
              size="lg"
            >
              {isChecking ? 'Checking...' : 'Complete Registration'}
            </Button>
            <Button
              variant="outline"
              onClick={handleBackToLogin}
              className="flex-1 h-12 text-base"
              size="lg"
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

