import React, { useMemo } from 'react';
import { ScreenId } from '../types/collegeConnect';
import { AuthProvider, loadInitialAuthState } from './AuthContext';
import { CampusDataProvider, loadInitialCampusData } from './CampusDataContext';
import { NavigationProvider } from './NavigationContext';
import { ThemeProvider } from './ThemeContext';
import { UIProvider } from './UIContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialAuth = useMemo(() => loadInitialAuthState(), []);
  const initialData = useMemo(() => loadInitialCampusData(), []);

  const initialScreen: ScreenId = !initialAuth.onboardingComplete
    ? 'welcome'
    : initialAuth.isAuthenticated
      ? 'home'
      : 'login';

  const initialEventId = initialData.events[0]?.id ?? 'evt-music-fest';

  return (
    <ThemeProvider>
      <UIProvider>
        <NavigationProvider initialScreen={initialScreen} initialEventId={initialEventId}>
          <AuthProvider initialAuth={initialAuth}>
            <CampusDataProvider initialData={initialData}>{children}</CampusDataProvider>
          </AuthProvider>
        </NavigationProvider>
      </UIProvider>
    </ThemeProvider>
  );
};
