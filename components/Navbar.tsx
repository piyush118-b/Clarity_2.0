'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Home, User } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setUser(user);
      
      // Fetch user role if authenticated
      if (user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profileData && !error) {
          setUserRole(profileData.role);
        } else if (error) {
          // Only log actual errors, not when profile doesn't exist yet
          console.error('Error fetching user role:', error);
        }
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsAuthenticated(!!session?.user);
      setUser(session?.user || null);
      
      // Fetch user role on auth state change
      if (session?.user) {
        // Retry mechanism for newly created profiles
        const fetchUserRole = async (retries = 3) => {
          for (let i = 0; i < retries; i++) {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();
            
            if (profileData && !error) {
              setUserRole(profileData.role);
              return;
            }
            
            // If it's the last retry and still no profile, log the error
            if (i === retries - 1 && error) {
              console.error('Error fetching user role after retries:', error);
            }
            
            // Wait before retrying (only if not the last attempt)
            if (i < retries - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        };
        
        fetchUserRole();
      } else {
        setUserRole(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    window.location.href = '/';
  };
  
  // Get dashboard URL based on user role
  const getDashboardUrl = () => {
    // Log the current user role for debugging
    console.log('Current user role:', userRole);
    
    // Make sure we have a valid role before redirecting
    if (!userRole) {
      console.log('No user role found, using generic dashboard');
      return '/dashboard'; // Fallback to generic dashboard if role is not loaded yet
    }
    
    // Return the appropriate dashboard URL based on role
    switch (userRole) {
      case 'admin':
        console.log('Redirecting to admin dashboard');
        return '/admin/dashboard';
      case 'tenant':
        console.log('Redirecting to tenant dashboard');
        return '/tenant/dashboard';
      case 'service_provider':
        console.log('Redirecting to service provider dashboard');
        return '/service-provider/dashboard';
      default:
        console.log('Unknown role, using generic dashboard');
        return '/dashboard'; // Fallback to generic dashboard
    }
  };

  const navItems = [
    { name: 'HOME', href: '/' },
    { name: 'ABOUT US', href: '/about' },
    { name: 'SERVICES', href: '/services' },
    { name: 'TEAM', href: '/team' },
    { name: 'PORTFOLIO', href: '/portfolio' },
    { name: 'NEWS', href: '/news' },
    { name: 'CONTACTS', href: '/contacts' },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="text-2xl font-bold text-gray-900">
                <span className="text-[#a8895c]">RHS</span>
              </div>
              <div className="ml-3 hidden sm:block">
                <div className="text-xs text-gray-600 leading-tight">
                  <div>REALITY HOUSING</div>
                  <div>& SUPPORT</div>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium tracking-wide transition-colors duration-200 hover:text-[#a8895c] ${
                  isActive(item.href)
                    ? 'text-[#a8895c] border-b-2 border-[#a8895c] pb-1'
                    : 'text-gray-700'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Profile Dropdown - Only show when authenticated */}
          {isAuthenticated && user && (
            <div className="hidden lg:flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors duration-200">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-sm">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700">
                      {user.email?.split('@')[0] || 'User'}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{user.email?.split('@')[0] || 'User'}</p>
                      <p className="text-xs text-gray-500 font-normal">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <button 
                      onClick={() => {
                        const dashboardUrl = getDashboardUrl();
                        console.log('Navigating to dashboard URL:', dashboardUrl);
                        window.location.href = dashboardUrl;
                      }} 
                      className="flex w-full items-center cursor-pointer"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Dashboard
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Auth Buttons - Only show when not authenticated */}
          {!isAuthenticated && (
            <div className="hidden lg:flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-700 hover:text-[#a8895c] transition-colors duration-200"
              >
                LOGIN
              </Link>
              <Link
                href="/auth/sign-up"
                className="bg-[#a8895c] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#96794f] transition-colors duration-200"
              >
                SIGN UP
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-[#a8895c] focus:outline-none focus:text-[#a8895c]"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-100">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 text-sm font-medium transition-colors duration-200 hover:text-[#a8895c] hover:bg-gray-50 rounded-md ${
                    isActive(item.href) ? 'text-[#a8895c] bg-gray-50' : 'text-gray-700'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {isAuthenticated && user ? (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm">
                          {user.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.email?.split('@')[0] || 'User'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    className="w-full text-left block px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#a8895c] hover:bg-gray-50 rounded-md"
                    onClick={() => {
                      const dashboardUrl = getDashboardUrl();
                      console.log('Mobile menu: Navigating to dashboard URL:', dashboardUrl);
                      window.location.href = dashboardUrl;
                      setIsMenuOpen(false);
                    }}
                  >
                    <Home className="inline mr-2 h-4 w-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left block px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md mt-2"
                  >
                    <LogOut className="inline mr-2 h-4 w-4" />
                    Log out
                  </button>
                </div>
              ) : !isAuthenticated && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <Link
                    href="/auth/login"
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#a8895c] hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  > 
                    LOGIN
                  </Link>
                  <Link
                    href="/auth/sign-up"
                    className="block px-3 py-2 text-sm font-medium bg-[#a8895c] text-white hover:bg-[#96794f] rounded-md mt-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    SIGN UP
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
