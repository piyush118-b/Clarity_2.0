'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DashboardRedirect() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const redirectToDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          throw authError;
        }
        
        if (!user) {
          // If not authenticated, redirect to login
          router.push('/auth/login');
          return;
        }
        
        // Get user role from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          throw profileError;
        }
        
        if (!profileData || !profileData.role) {
          setError('Your user profile is incomplete. Please contact support.');
          setIsLoading(false);
          return;
        }
        
        // Redirect based on role
        let dashboardUrl = '';
        
        switch (profileData.role) {
          case 'admin':
            dashboardUrl = '/admin/dashboard';
            break;
          case 'tenant':
            dashboardUrl = '/tenant/dashboard';
            break;
          case 'service_provider':
            dashboardUrl = '/service-provider/dashboard';
            break;
          default:
            // If role is not recognized, show error
            setError(`Unknown user role: ${profileData.role}. Please contact support.`);
            setIsLoading(false);
            return;
        }
        
        // Log the redirection for debugging
        console.log(`Redirecting user with role ${profileData.role} to ${dashboardUrl}`);
        
        // Use replace instead of push to avoid back button issues
        router.replace(dashboardUrl);
      } catch (err) {
        console.error('Error redirecting to dashboard:', err);
        setError('An error occurred while redirecting to your dashboard.');
        setIsLoading(false);
      }
    };
    
    redirectToDashboard();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium mb-6">Redirecting to your dashboard...</p>
        <button 
          onClick={async () => {
            try {
              await supabase.auth.signOut();
              router.push('/');
            } catch (err) {
              console.error('Error signing out:', err);
            }
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Sign Out
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Dashboard Error</h2>
          <p className="text-red-700">{error}</p>
          <div className="flex gap-3 mt-4">
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Return to Home
            </button>
            <button 
              onClick={async () => {
                try {
                  await supabase.auth.signOut();
                  router.push('/');
                } catch (err) {
                  console.error('Error signing out:', err);
                }
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
