import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase.ts';
import { UserRole, UserProfile } from '../types.ts';
import { can, AppPermissionModule, AppAction } from './auth-rbac.ts';
import { CURRENT_USER } from '../data/initialData.ts';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
  signIn: (email: string, password?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  canAccess: (module: AppPermissionModule, action?: AppAction) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(CURRENT_USER);
  const [currentRole, setCurrentRole] = useState<UserRole>(CURRENT_USER.role);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isConfigured = isSupabaseConfigured();

  const fetchUserProfile = useCallback(async (userId: string, userEmail?: string) => {
    if (!isConfigured) {
      // Offline / Local development fallback
      setProfile({
        ...CURRENT_USER,
        id: userId,
        email: userEmail || CURRENT_USER.email,
        role: currentRole,
      });
      return;
    }

    try {
      // Query profiles joined with roles & user_roles
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          title,
          avatar_url,
          company_id,
          division_id,
          user_roles (
            roles (
              slug,
              name
            )
          )
        `)
        .eq('id', userId)
        .single();

      if (profileErr) {
        console.warn('Profile fetch warning (using fallback profile):', profileErr.message);
        setProfile({
          ...CURRENT_USER,
          id: userId,
          email: userEmail || CURRENT_USER.email,
          role: currentRole,
        });
        return;
      }

      if (profileData) {
        let assignedRole: UserRole = UserRole.SOLUTIONS_ARCHITECT;
        const rolesList = profileData.user_roles as any[];
        if (rolesList && rolesList.length > 0 && rolesList[0]?.roles?.slug) {
          assignedRole = rolesList[0].roles.slug as UserRole;
        }

        const resolvedProfile: UserProfile = {
          id: profileData.id,
          name: profileData.full_name || 'Enterprise User',
          email: userEmail || 'user@enterprise.com',
          role: assignedRole,
          avatarUrl: profileData.avatar_url || CURRENT_USER.avatarUrl,
          department: profileData.title || 'Presales Engineering',
        };

        setProfile(resolvedProfile);
        setCurrentRole(assignedRole);
      }
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err);
    }
  }, [isConfigured, currentRole]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn('Session error:', sessionError.message);
        }

        if (mounted && initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchUserProfile(initialSession.user.id, initialSession.user.email);
        }
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setIsLoading(false);
      }

      // Listen to Supabase Auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchUserProfile(newSession.user.id, newSession.user.email);
        } else {
          setProfile(CURRENT_USER);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, [fetchUserProfile, isConfigured]);

  const signIn = async (email: string, password?: string): Promise<{ error: AuthError | null }> => {
    setError(null);
    if (!isConfigured) {
      // Mock sign-in when environment keys not yet active
      const mockUser = { id: 'usr_local_01', email } as User;
      setUser(mockUser);
      setProfile({
        ...CURRENT_USER,
        email,
      });
      return { error: null };
    }

    if (password) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      return { error: signInErr };
    } else {
      const { error: otpErr } = await supabase.auth.signInWithOtp({ email });
      return { error: otpErr };
    }
  };

  const signOut = async () => {
    if (isConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(CURRENT_USER);
    setCurrentRole(CURRENT_USER.role);
  };

  const canAccess = (moduleName: AppPermissionModule, action: AppAction = 'view'): boolean => {
    return can(currentRole, moduleName, action);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id, user.email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        currentRole,
        setCurrentRole,
        isLoading,
        isConfigured,
        error,
        signIn,
        signOut,
        canAccess,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
