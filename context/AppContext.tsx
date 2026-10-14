import React, { createContext, useContext } from 'react';
import { useAppLogic } from '../hooks/useAppLogic';

type AppContextType = ReturnType<typeof useAppLogic>;

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appLogic = useAppLogic();

  return (
    <AppContext.Provider value={appLogic}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
