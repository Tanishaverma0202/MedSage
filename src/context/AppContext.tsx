import { createContext, useContext, useState, ReactNode } from 'react';

type User = {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  goals: string[];
};

type AppContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        return {
          id: parsed._id || parsed.id || '1',
          name: parsed.fullName || parsed.name || '',
          gender: parsed.gender || 'female',
          age: parsed.age || 28,
          goals: parsed.goals || ['Better Sleep', 'Hormonal Balance', 'Fitness']
        };
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    }
    
    // Check for a persisting Guest ID to ensure data continuity
    let guestId = localStorage.getItem('medsage_guest_id');
    if (!guestId) {
      // Create a valid-length hex string for guest identification
      guestId = '000000000000000000000001'; 
      localStorage.setItem('medsage_guest_id', guestId);
    }

    return {
      id: guestId,
      name: '',
      gender: 'female',
      age: 28,
      goals: ['Better Sleep', 'Hormonal Balance', 'Fitness']
    };
  });

  return (
    <AppContext.Provider value={{ user, setUser }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
