import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

interface User {
  id: string;
  username: string;
  role: string;
  character?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      setToken(session.access_token);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*, characters(*)')
        .eq('id', session.user.id)
        .single();

      if (userError || !userData) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      setUser({
        id: userData.id,
        username: userData.username,
        role: userData.role,
        character: userData.characters?.[0] || null
      });
    } catch (error) {
      console.error('fetchUser error:', error);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        setToken(session.access_token);
        await fetchUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setToken(null);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setToken(session.access_token);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  const login = async (username: string, password: string) => {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (userError || !userData) {
      throw new Error('Invalid credentials');
    }

    const email = userData.email || `${username}@temp.com`;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.session) {
      throw new Error('Invalid credentials');
    }

    const { data: characterData } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userData.id)
      .single();

    setUser({
      id: userData.id,
      username: userData.username,
      role: userData.role,
      character: characterData || null
    });
    setToken(authData.session.access_token);
  };

  const register = async (username: string, password: string, email?: string) => {
    const emailToUse = email || `${username}@temp.com`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailToUse,
      password,
      options: {
        data: {
          username
        }
      }
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Registration failed');
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        username,
        role: 'guest'
      })
      .select()
      .single();

    if (userError) {
      throw new Error('Failed to create user profile');
    }

    if (authData.session) {
      setUser({
        id: userData.id,
        username: userData.username,
        role: userData.role
      });
      setToken(authData.session.access_token);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
