'use client'

import { useConnection } from 'wagmi';
import { FileText, Copy, CheckCircle2, AlertCircle, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

interface RegistrationPageProps {
  onComplete?: () => void;
}

export function RegistrationPage({ onComplete }: RegistrationPageProps) {
  const { address, isConnected } = useConnection();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
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
            Your wallet address is not registered yet. Please complete the registration process to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Address Display */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Connected Wallet Address
            </label>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border-2 border-border">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="font-mono text-sm truncate">{formatAddress(address)}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
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
              onClick={onComplete}
              className="flex-1 h-12 text-base font-semibold"
              size="lg"
            >
              Complete Registration
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // User will implement logout/back functionality
                console.log('Back to login');
              }}
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

