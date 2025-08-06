import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext({ user: null, loading: true, error: null });

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check onboarding status and user role
  const checkOnboardingStatus = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', userId)
        .single();
      if (error) return { completed: false, role: null };
      return { completed: profile?.onboarding_completed || false, role: null };
    } catch (e) {
      return { completed: false, role: null };
    }
  };

  const getUserRole = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (error) return null;
      return profile?.role || null;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setError(e.message);
          setLoading(false);
        }
      }
    };
    getInitialSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
      setError(null);
      // Remove automatic redirects on SIGNED_IN to prevent conflicts with middleware
      // The middleware will handle all role-based redirects and onboarding checks
      if (event === 'SIGNED_OUT') {
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
