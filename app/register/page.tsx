'use client'

import { useConnection, useConfig, usePublicClient } from 'wagmi';
import { useRouter } from 'next/navigation';
import { FileText, AlertCircle, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { delegate, requestRegister } from '@/utils/interact';
import { useUser } from '../contexts/UserContext';
import { getWeb3AuthInstance } from '@/utils/Web3AuthStore';
import { getUserInfo } from '@/utils/subgraph';
import { checkEIP7702Delegation, copyAddressToClipboard, isValidEmail } from '@/utils/utility';



export default function RegistrationPage() {
  const router = useRouter();
  const { address, isConnected } = useConnection();
  const publicClient = usePublicClient();

  const hasSignedIn = useRef(false);

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
  const [copied, setCopied] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const setEmailWithValidation = (emailValue: string) => {
    setEmail(emailValue);
    if (!emailValue.trim()) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
    } else if (!isValidEmail(emailValue)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const validateField = (field: 'firstName' | 'lastName' | 'email', value: string) => {
    const newErrors = { ...errors };

    if (field === 'firstName') {
      newErrors.firstName = !value.trim() ? 'First name is required' : '';
    } else if (field === 'lastName') {
      newErrors.lastName = !value.trim() ? 'Last name is required' : '';
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
    // Clear error when user starts typing
    if (errors.firstName) {
      setErrors(prev => ({ ...prev, firstName: '' }));
    }
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLastName(value);
    // Clear error when user starts typing
    if (errors.lastName) {
      setErrors(prev => ({ ...prev, lastName: '' }));
    }
  };

  const fetchWeb3AuthEmail = async () => {
    try {
      const web3Auth = getWeb3AuthInstance();
      if (web3Auth?.connected) {
        const web3AuthUserInfo = await web3Auth.getUserInfo();
        if (web3AuthUserInfo?.email) {
          setEmailWithValidation(web3AuthUserInfo.email);
        }
      }
    } catch (error) {
      console.error('Error fetching user email:', error);
    }
  };

  const fetchUserData = async () => {
    if (!address) return;

    try {
      const userInfo = await getUserInfo(address);

      if (userInfo?.onPending === true) {
        // User is pending - fill in data and disable fields
        setIsPending(true);
        if (userInfo.firstName) {
          setFirstName(userInfo.firstName);
        }
        if (userInfo.lastName) {
          setLastName(userInfo.lastName);
        }
        if (userInfo.email) {
          setEmailWithValidation(userInfo.email);
        }
      } else {
        // User is not pending or userInfo is null - fetch email from Web3Auth
        setIsPending(false);
        await fetchWeb3AuthEmail();
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      // On error, fall back to Web3Auth email fetching
      setIsPending(false);
      await fetchWeb3AuthEmail();
    }
  };

  const handleBlur = (field: 'firstName' | 'lastName' | 'email') => {
    const value = field === 'firstName' ? firstName : field === 'lastName' ? lastName : email;
    validateField(field, value);
  };

  const handleRequestRegistration = async () => {
    if (!isConnected || !address || !publicClient || !config) {
      toast.error('Wallet not connected');
      return;
    }

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
      const isDelegated = await checkEIP7702Delegation(address, publicClient);

      let res = true;
      if (!isDelegated) {
        res = await delegate(config);
        // Wait a few seconds after delegation before proceeding
        if (res) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (res) {
        const result = await requestRegister(config, address, firstName, lastName, email);
        if (result) {
          toast.success('Registration request sent successfully');
          // Wait 3 seconds and fetch user data again to update fields
          setTimeout(async () => {
            await fetchUserData();
          }, 3000);
        } else {
          toast.error('Failed to request registration. Please try again.');
        }
      }
    } catch (error) {
      toast.error('Failed to request registration. Please try again.');
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

  const formatAddress = (addr: string | undefined): string => {
    if (!addr) return '';
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopyAddress = async () => {
    if (!address) return;
    const success = await copyAddressToClipboard(address);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Redirect to login if Web3Auth is not connected
  useEffect(() => {
    const web3Auth = getWeb3AuthInstance();
    if (!web3Auth?.connected) {
      router.push('/login');
    }
  }, [router]);

  // Fetch user info from subgraph and email from Web3Auth when component mounts
  useEffect(() => {
    if (isConnected && !hasSignedIn.current) {
      hasSignedIn.current = true;
      fetchUserData();
    }
  }, [isConnected]);

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
              disabled={isPending}
              aria-invalid={!!errors.firstName}
              className={errors.firstName ? 'border-destructive' : isPending ? 'bg-muted/50 cursor-not-allowed' : ''}
            />
            {errors.firstName && (
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
              disabled={isPending}
              aria-invalid={!!errors.lastName}
              className={errors.lastName ? 'border-destructive' : isPending ? 'bg-muted/50 cursor-not-allowed' : ''}
            />
            {errors.lastName && (
              <p className="text-sm text-destructive">{errors.lastName}</p>
            )}
          </div>

          {/* Wallet Address Field */}
          <div className="space-y-2">
            <Label htmlFor="walletAddress" className="text-sm font-medium">
              Wallet Address
            </Label>
            <div className="relative">
              <Input
                id="walletAddress"
                type="text"
                placeholder="0x..."
                value={formatAddress(address)}
                disabled
                readOnly
                className="bg-muted/50 cursor-not-allowed pr-12"
              />
              <button
                type="button"
                onClick={handleCopyAddress}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 text-muted-foreground hover:text-foreground transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
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
              aria-invalid={!!errors.email}
              className={errors.email ? 'border-destructive' : 'bg-muted/50 cursor-not-allowed'}
            />
            {errors.email && (
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
              onClick={handleRequestRegistration}
              disabled={isChecking || isPending}
              className="flex-1 text-base font-semibold py-2 cursor-pointer"
              size="lg"
            >
              {isChecking ? 'Checking...' : isPending ? 'Pending Approval...' : 'Request Registration'}
            </Button>
            <Button
              variant="outline"
              onClick={handleBackToLogin}
              className="flex-1 text-base py-2 cursor-pointer"
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

