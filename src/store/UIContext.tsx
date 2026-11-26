import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CampusChatMessage, FeedbackBanner, UIStateMode } from '../types/collegeConnect';

interface UIContextValue {
  uiStateMode: UIStateMode;
  publishSheetOpen: boolean;
  inspectorOpen: boolean;
  feedback: FeedbackBanner | null;
  chatMessages: CampusChatMessage[];
  setUIStateMode: (mode: UIStateMode) => void;
  setPublishSheetOpen: (open: boolean) => void;
  closePublishSheet: () => void;
  toggleInspector: () => void;
  setInspectorOpen: (open: boolean) => void;
  showFeedback: (kind: FeedbackBanner['kind'], title: string, message: string) => void;
  clearFeedback: () => void;
  setChatMessages: React.Dispatch<React.SetStateAction<CampusChatMessage[]>>;
  clearChatMessages: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uiStateMode, setUIStateModeState] = useState<UIStateMode>('default');
  const [publishSheetOpen, setPublishSheetOpenState] = useState(false);
  const [inspectorOpen, setInspectorOpenState] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackBanner | null>(null);
  const [chatMessages, setChatMessages] = useState<CampusChatMessage[]>([]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const setUIStateMode = useCallback((mode: UIStateMode) => setUIStateModeState(mode), []);
  const setPublishSheetOpen = useCallback((open: boolean) => setPublishSheetOpenState(open), []);
  const closePublishSheet = useCallback(() => setPublishSheetOpenState(false), []);
  const toggleInspector = useCallback(() => setInspectorOpenState((prev) => !prev), []);
  const setInspectorOpen = useCallback((open: boolean) => setInspectorOpenState(open), []);
  const showFeedback = useCallback(
    (kind: FeedbackBanner['kind'], title: string, message: string) => {
      setFeedback({ id: String(Date.now()), kind, title, message });
    },
    []
  );
  const clearFeedback = useCallback(() => setFeedback(null), []);
  const clearChatMessages = useCallback(() => setChatMessages([]), []);

  const value = useMemo<UIContextValue>(
    () => ({
      uiStateMode,
      publishSheetOpen,
      inspectorOpen,
      feedback,
      chatMessages,
      setUIStateMode,
      setPublishSheetOpen,
      closePublishSheet,
      toggleInspector,
      setInspectorOpen,
      showFeedback,
      clearFeedback,
      setChatMessages,
      clearChatMessages,
    }),
    [
      uiStateMode,
      publishSheetOpen,
      inspectorOpen,
      feedback,
      chatMessages,
      setUIStateMode,
      setPublishSheetOpen,
      closePublishSheet,
      toggleInspector,
      setInspectorOpen,
      showFeedback,
      clearFeedback,
      clearChatMessages,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export function useUIState(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error('useUIState must be used inside UIProvider');
  }
  return ctx;
}
