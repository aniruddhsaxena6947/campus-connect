import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ScreenId } from '../types/collegeConnect';

const TAB_ROOTS = new Set<ScreenId>(['home', 'explore', 'saved', 'profile']);

interface NavigationContextValue {
  activeScreen: ScreenId;
  navDirection: 'forward' | 'back' | 'tab';
  selectedEventId: string;
  exploreSearchQuery: string;
  setExploreSearchQuery: (q: string) => void;
  navigate: (screen: ScreenId, options?: { eventId?: string; searchQuery?: string }) => void;
  goBack: () => void;
  resetNavigation: (screen: ScreenId, direction?: 'forward' | 'back' | 'tab') => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export const NavigationProvider: React.FC<{
  initialScreen: ScreenId;
  initialEventId: string;
  children: React.ReactNode;
}> = ({ initialScreen, initialEventId, children }) => {
  const [activeScreen, setActiveScreen] = useState<ScreenId>(initialScreen);
  const [navDirection, setNavDirection] = useState<'forward' | 'back' | 'tab'>('tab');
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);
  const [exploreSearchQuery, setExploreSearchQueryState] = useState<string>('');

  const activeScreenRef = useRef<ScreenId>(initialScreen);
  const historyRef = useRef<ScreenId[]>([]);

  useEffect(() => {
    activeScreenRef.current = activeScreen;
  }, [activeScreen]);

  const setExploreSearchQuery = useCallback((q: string) => {
    setExploreSearchQueryState(q);
  }, []);

  const navigate = useCallback(
    (screen: ScreenId, options?: { eventId?: string; searchQuery?: string }) => {
      if (options?.eventId) {
        setSelectedEventId(options.eventId);
      }
      if (options?.searchQuery !== undefined) {
        setExploreSearchQueryState(options.searchQuery);
      }
      const current = activeScreenRef.current;
      if (screen !== current) {
        const isTabSwitch = TAB_ROOTS.has(screen) && TAB_ROOTS.has(current);
        setNavDirection(isTabSwitch ? 'tab' : 'forward');
        historyRef.current = [...historyRef.current.slice(-8), current];
        setActiveScreen(screen);
      }
    },
    []
  );

  const goBack = useCallback(() => {
    setNavDirection('back');
    if (historyRef.current.length === 0) {
      setActiveScreen('home');
      return;
    }
    const next = [...historyRef.current];
    const last = next.pop() ?? 'home';
    historyRef.current = next;
    setActiveScreen(last);
  }, []);

  const resetNavigation = useCallback(
    (screen: ScreenId, direction: 'forward' | 'back' | 'tab' = 'forward') => {
      historyRef.current = [];
      setNavDirection(direction);
      setActiveScreen(screen);
    },
    []
  );

  const value = useMemo<NavigationContextValue>(
    () => ({
      activeScreen,
      navDirection,
      selectedEventId,
      exploreSearchQuery,
      setExploreSearchQuery,
      navigate,
      goBack,
      resetNavigation,
    }),
    [
      activeScreen,
      navDirection,
      selectedEventId,
      exploreSearchQuery,
      setExploreSearchQuery,
      navigate,
      goBack,
      resetNavigation,
    ]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used inside NavigationProvider');
  }
  return ctx;
}
