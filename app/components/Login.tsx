'use client'

import { UserRole } from '../contexts/UserContext';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const userTypes = [
  {
    role: 'legal' as UserRole,
    title: 'Legal Division',
    description: 'Create contracts, manage templates, and oversee all contract workflows',
    color: 'hover:border-brand-primary/50 hover:bg-brand-primary/5',
  },
  {
    role: 'owner' as UserRole,
    title: 'Project Owner',
    description: 'Review and approve contracts for projects and initiatives you own',
    color: 'hover:border-brand-primary/50 hover:bg-brand-primary/5',
  },
  {
    role: 'division-lead' as UserRole,
    title: 'Division Lead',
    description: 'Receive sections from Legal and distribute work to team members',
    color: 'hover:border-brand-primary/50 hover:bg-brand-primary/5',
  },
  {
    role: 'division-member' as UserRole,
    title: 'Division Member',
    description: 'Complete assigned sections and clauses from Division Lead',
    color: 'hover:border-brand-primary/50 hover:bg-brand-primary/5',
  },
  {
    role: 'administrator' as UserRole,
    title: 'Administrator',
    description: 'System administration and user management',
    color: 'hover:border-brand-primary/50 hover:bg-brand-primary/5',
  },
];

export function Login({ onLogin }: LoginProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-brand-secondary rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl">ContractFlow</h1>
          </div>
          <p className="text-xl text-muted-foreground">Select your role to continue</p>
        </div>

        {/* User Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userTypes.map((userType) => {
            return (
              <Card
                key={userType.role}
                className={`cursor-pointer transition-all duration-200 ${userType.color} hover:shadow-lg hover:scale-105 border-2 bg-white`}
                onClick={() => onLogin(userType.role)}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl mb-2">{userType.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {userType.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Demo environment - Select any role to explore the platform
          </p>
        </div>
      </div>
    </div>
  );
}