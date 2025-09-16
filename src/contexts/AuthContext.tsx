import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Admin {
  id: string;
  username: string;
}

interface Team {
  id: string;
  username: string;
  team_name: string;
}

interface AuthContextType {
  admin: Admin | null;
  team: Team | null;
  isLoading: boolean;
  loginAdmin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginTeam: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedAdmin = localStorage.getItem('admin_session');
    const storedTeam = localStorage.getItem('team_session');

    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    }
    if (storedTeam) {
      setTeam(JSON.parse(storedTeam));
    }
    setIsLoading(false);
  }, []);

  const loginAdmin = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('verify_admin_login', {
        input_username: username,
        input_password: password
      });

      if (error || !data || data.length === 0) {
        return { success: false, error: 'Invalid credentials' };
      }

      const adminData = { id: data[0].admin_id, username: data[0].username };
      setAdmin(adminData);
      setTeam(null);
      localStorage.setItem('admin_session', JSON.stringify(adminData));
      localStorage.removeItem('team_session');

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const loginTeam = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('verify_team_login', {
        input_username: username,
        input_password: password
      });

      if (error || !data || data.length === 0) {
        return { success: false, error: 'Invalid credentials' };
      }

      const teamData = { 
        id: data[0].team_id, 
        username: data[0].username,
        team_name: data[0].team_name
      };
      setTeam(teamData);
      setAdmin(null);
      localStorage.setItem('team_session', JSON.stringify(teamData));
      localStorage.removeItem('admin_session');

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = () => {
    setAdmin(null);
    setTeam(null);
    localStorage.removeItem('admin_session');
    localStorage.removeItem('team_session');
  };

  return (
    <AuthContext.Provider value={{
      admin,
      team,
      isLoading,
      loginAdmin,
      loginTeam,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};