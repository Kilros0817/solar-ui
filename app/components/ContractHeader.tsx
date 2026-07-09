'use client'

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, Search, LogOut, UserCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';
import { useConnection, useConfig } from 'wagmi';
import { getUserRole } from '@/utils/interact';
import { getWeb3AuthInstance } from '@/utils/Web3AuthStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function ContractHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { userName, userRole, setUserInfo, logout } = useUser();
  const { address, isConnected } = useConnection();
  const config = useConfig();
  const web3Auth = getWeb3AuthInstance();

  // Fetch user role when connections are active
  useEffect(() => {
    const fetchUserRole = async () => {

      // Check if both Web3Auth and wagmi are connected
      if (web3Auth?.connected && isConnected && address && config) {


        // Only fetch if role is not already set to avoid unnecessary calls
        if (userRole === null) {
          try {
            const { role, firstName, lastName } = await getUserRole(config, address);
            const roleValue = Number(role ?? USER_ROLE.NO_ROLE);
            setUserInfo({ role: roleValue, firstName, lastName });
          } catch (error) {
            console.error('Error fetching user role:', error);
            // On error, don't set role (keep current state) to avoid redirect loops
          }
        }
      } else if (!web3Auth?.connected && !isConnected && pathname !== '/login' && pathname !== '/register') {
        // If both connections are not active and not on login/register pages, redirect to login
        setInterval(() => {
          window.location.href = "/login";
        }, 1000);
      }
    };

    fetchUserRole();
  }, [web3Auth?.connected, isConnected, address, config, setUserInfo, router, pathname, userRole]);

  const getRoleDisplay = () => {
    switch (userRole) {
      case USER_ROLE.LEGAL_TEAM:
        return 'Legal Division';
      case USER_ROLE.DIVISION_LEADER:
        return 'Division Lead';
      case USER_ROLE.DIVISION_MEMBER:
        return 'Division Member';
      case USER_ROLE.ADMIN:
        return 'Administrator';
      case USER_ROLE.CLIENT:
        return 'Client';
      default:
        return 'User';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contracts, clients, or documents..."
            className="pl-10 brand-focus border-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="relative brand-hover">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-brand-secondary text-white border-2 border-card shadow-sm">
            3
          </Badge>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 hover:bg-accent">
              <Avatar className="h-8 w-8 ring-1 ring-border">
                <AvatarFallback>
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm">{userName}</p>
                <p className="text-xs text-muted-foreground">{getRoleDisplay()}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}