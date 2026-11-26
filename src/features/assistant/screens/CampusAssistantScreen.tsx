import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  AlertCircleIcon,
  RefreshIcon,
  SendIcon,
  SparklesIcon,
} from '../../../components/icons/NavIcons';
import {
  EventRowCard,
  ScreenHeader,
  TactilePressable,
} from '../../../components/ui/RNPrimitives';
import { createChatMessage, sendCampusChatMessages } from '../../../services/api/campusChatService';
import { useAuth, useCampusData, useNavigation, useTheme, useUIState } from '../../../store';
import { FONTS, RADII, SPACING, TOUCH_TARGET } from '../../../theme/tokens';
import { CampusChatMessage } from '../../../types/collegeConnect';

const STARTER_PROMPTS = [
  'List all events related to tech',
  'Free events & workshops',
  'Cultural, music & art events',
  'Upcoming events this month',
];

interface ScrollableHandle {
  scrollToEnd?: (options?: { animated?: boolean }) => void;
}

const ScrollableThread = ScrollView as unknown as React.ComponentType<
  React.ComponentProps<typeof ScrollView> & { ref?: React.Ref<ScrollableHandle> }
>;

export const CampusAssistantScreen: React.FC = () => {
  const { profile } = useAuth();
  const { visibleEvents, toggleEventSaved } = useCampusData();
  const { navigate } = useNavigation();
  const { chatMessages, setChatMessages, clearChatMessages } = useUIState();
  const { theme } = useTheme();

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollableHandle | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [chatMessages.length, sending]);

  const eventsById = useMemo(() => {
    const map = new Map(visibleEvents.map((evt) => [evt.id, evt]));
    return map;
  }, [visibleEvents]);

  const firstName =
    profile.name && profile.name !== 'Campus Member' ? profile.name.split(' ')[0] : 'there';

  const submitPrompt = async (rawText: string, baseMessages?: CampusChatMessage[]) => {
    const clean = rawText.trim();
    if (!clean || sending) return;

    const existing = baseMessages ?? chatMessages.filter((m) => !m.error);
    const userMsg = createChatMessage({
      role: 'user',
      text: clean,
    });
    const nextHistory = [...existing, userMsg];

    setChatMessages(nextHistory);
    setDraft('');
    setSending(true);

    try {
      const result = await sendCampusChatMessages(nextHistory);
      const aiMsg = createChatMessage({
        role: 'model',
        text: result.reply,
        matchedEventIds: result.matchedEventIds,
        followUpSuggestions: result.followUpSuggestions,
      });
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to reach Campus AI right now.';
      const errMsg = createChatMessage({
        role: 'model',
        text: message,
        error: true,
      });
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleRetryLast = () => {
    const lastUser = [...chatMessages].reverse().find((m) => m.role === 'user');
    if (!lastUser || sending) return;
    const withoutError = chatMessages.filter((m) => !m.error);
    const idx = withoutError.lastIndexOf(lastUser);
    const trimmedBase = idx >= 0 ? withoutError.slice(0, idx) : withoutError;
    void submitPrompt(lastUser.text, trimmedBase);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader
        title="Campus AI"
        subtitle="Discover events by your interests"
        showBack
        handwrittenTitle
        rightSlot={
          chatMessages.length > 0 ? (
            <TactilePressable
              onPress={() => {
                if (!sending) clearChatMessages();
              }}
              disabled={sending}
              scaleTo={0.92}
              accessibilityLabel="Start new chat"
              style={[
                styles.resetBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: sending ? 0.5 : 1,
                },
              ]}
            >
              <RefreshIcon size={17} color={theme.text} />
            </TactilePressable>
          ) : undefined
        }
      />

      <ScrollableThread
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.threadContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {chatMessages.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View
              style={[
                styles.welcomeCard,
                { backgroundColor: theme.sage, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.sparkBadge,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <SparklesIcon
                  size={20}
                  color={theme.isDark ? theme.primaryBright : theme.primary}
                />
              </View>
              <Text style={[styles.welcomeTitle, { color: theme.text }]}>
                Hey {firstName}, what are you interested in?
              </Text>
              <Text style={[styles.welcomeDesc, { color: theme.textMuted }]}>
                Ask in natural language—for example, &ldquo;list all events related to tech&rdquo;
                or &ldquo;free cultural workshops&rdquo;—and I&apos;ll check every live campus event
                for you.
              </Text>
              <View
                style={[
                  styles.catalogCountPill,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.catalogCountText, styles.tabular, { color: theme.text }]}>
                  Scanning {visibleEvents.length} live campus{' '}
                  {visibleEvents.length === 1 ? 'event' : 'events'}
                </Text>
              </View>
            </View>

            <Text style={[styles.starterHeading, { color: theme.textMuted }]}>
              Try asking
            </Text>

            <View style={styles.starterGrid}>
              {STARTER_PROMPTS.map((prompt) => (
                <TactilePressable
                  key={prompt}
                  onPress={() => {
                    void submitPrompt(prompt);
                  }}
                  scaleTo={0.96}
                  style={[
                    styles.starterChip,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <SparklesIcon
                    size={14}
                    color={theme.isDark ? theme.primaryBright : theme.primary}
                  />
                  <Text style={[styles.starterChipText, { color: theme.text }]}>{prompt}</Text>
                </TactilePressable>
              ))}
            </View>
          </View>
        ) : (
          chatMessages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isLatestModel =
              !isUser && index === chatMessages.length - 1 && !msg.error && !sending;
            const matchedEvents = (msg.matchedEventIds ?? [])
              .map((id) => eventsById.get(id))
              .filter((evt): evt is NonNullable<typeof evt> => Boolean(evt));

            if (isUser) {
              return (
                <View key={msg.id} style={styles.userRow}>
                  <View style={[styles.userBubble, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.userText, { color: theme.primaryFg }]}>{msg.text}</Text>
                  </View>
                </View>
              );
            }

            if (msg.error) {
              const lastUserText =
                [...chatMessages.slice(0, index)]
                  .reverse()
                  .find((m) => m.role === 'user')
                  ?.text.trim() ?? '';
              return (
                <View key={msg.id} style={styles.modelRow}>
                  <View
                    style={[
                      styles.errorBubble,
                      { backgroundColor: theme.dangerBg, borderColor: theme.danger },
                    ]}
                  >
                    <View style={styles.errorHeader}>
                      <AlertCircleIcon size={16} color={theme.danger} />
                      <Text style={[styles.errorTitle, { color: theme.danger }]}>
                        Could not reach Campus AI
                      </Text>
                    </View>
                    <Text style={[styles.errorBody, { color: theme.text }]}>{msg.text}</Text>
                    <View style={styles.errorActionsRow}>
                      <TactilePressable
                        onPress={handleRetryLast}
                        scaleTo={0.96}
                        style={[styles.retryBtn, { backgroundColor: theme.danger }]}
                      >
                        <Text style={styles.retryBtnText}>Try Again</Text>
                      </TactilePressable>
                      <TactilePressable
                        onPress={() =>
                          navigate('explore', {
                            searchQuery: lastUserText,
                          })
                        }
                        scaleTo={0.96}
                        style={[
                          styles.exploreFallbackBtn,
                          { backgroundColor: theme.surface, borderColor: theme.border },
                        ]}
                      >
                        <Text style={[styles.exploreFallbackText, { color: theme.text }]}>
                          Browse in Explore
                        </Text>
                      </TactilePressable>
                    </View>
                  </View>
                </View>
              );
            }

            return (
              <View key={msg.id} style={styles.modelRow}>
                <View
                  style={[
                    styles.modelBubble,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.modelHeader}>
                    <SparklesIcon
                      size={14}
                      color={theme.isDark ? theme.primaryBright : theme.primary}
                    />
                    <Text
                      style={[
                        styles.modelHeaderLabel,
                        { color: theme.isDark ? theme.primaryBright : theme.primary },
                      ]}
                    >
                      Campus Guide
                    </Text>
                  </View>

                  <Text style={[styles.modelText, { color: theme.text }]}>{msg.text}</Text>

                  {matchedEvents.length > 0 ? (
                    <View style={styles.matchedEventsWrap}>
                      <Text style={[styles.matchedHeading, { color: theme.textMuted }]}>
                        Matching Events ({matchedEvents.length})
                      </Text>
                      {matchedEvents.map((evt) => (
                        <EventRowCard
                          key={evt.id}
                          event={evt}
                          onPress={() => navigate('event_detail', { eventId: evt.id })}
                          onToggleSave={toggleEventSaved}
                          style={{ backgroundColor: theme.bg }}
                        />
                      ))}
                    </View>
                  ) : null}

                  {isLatestModel &&
                  msg.followUpSuggestions &&
                  msg.followUpSuggestions.length > 0 ? (
                    <View style={styles.followUpRow}>
                      {msg.followUpSuggestions.map((suggestion) => (
                        <TactilePressable
                          key={suggestion}
                          onPress={() => {
                            void submitPrompt(suggestion);
                          }}
                          scaleTo={0.96}
                          style={[
                            styles.followUpChip,
                            { backgroundColor: theme.sage, borderColor: theme.border },
                          ]}
                        >
                          <Text style={[styles.followUpText, { color: theme.text }]}>
                            {suggestion}
                          </Text>
                        </TactilePressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })
        )}

        {sending ? (
          <View style={styles.modelRow}>
            <View
              style={[
                styles.typingBubble,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <SparklesIcon
                size={15}
                color={theme.isDark ? theme.primaryBright : theme.primary}
              />
              <Text style={[styles.typingText, { color: theme.textMuted }]}>
                Checking all campus events...
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollableThread>

      <View
        style={[
          styles.composerWrap,
          { backgroundColor: theme.bg, borderTopColor: theme.border },
        ]}
      >
        <View
          style={[
            styles.inputShell,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => {
              void submitPrompt(draft);
            }}
            returnKeyType="send"
            placeholder="Ask about tech, music, free workshops..."
            placeholderTextColor={theme.textMuted}
            editable={!sending}
            style={[styles.composerInput, { color: theme.text }]}
          />
          <TactilePressable
            onPress={() => {
              void submitPrompt(draft);
            }}
            disabled={sending || draft.trim().length === 0}
            scaleTo={0.92}
            accessibilityLabel="Send message"
            style={[
              styles.sendBtn,
              {
                backgroundColor: theme.primary,
                opacity: sending || draft.trim().length === 0 ? 0.45 : 1,
              },
            ]}
          >
            <SendIcon size={17} color={theme.primaryFg} />
          </TactilePressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  resetBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: RADII.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 24,
    gap: 12,
  },
  emptyWrap: {
    gap: 12,
    paddingTop: 6,
  },
  welcomeCard: {
    borderRadius: RADII.xl,
    borderWidth: 1,
    padding: 18,
    gap: 10,
    alignItems: 'flex-start',
  },
  sparkBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontFamily: FONTS.ui,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 23,
  },
  welcomeDesc: {
    fontFamily: FONTS.ui,
    fontSize: 13.5,
    lineHeight: 20,
  },
  catalogCountPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    borderWidth: 1,
    marginTop: 2,
  },
  catalogCountText: {
    fontFamily: FONTS.ui,
    fontSize: 11.5,
    fontWeight: '600',
  },
  starterHeading: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  starterGrid: {
    gap: 8,
  },
  starterChip: {
    minHeight: TOUCH_TARGET,
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  starterChipText: {
    fontFamily: FONTS.ui,
    fontSize: 13.5,
    fontWeight: '600',
    flexShrink: 1,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  userBubble: {
    maxWidth: '84%',
    borderRadius: RADII.lg,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  userText: {
    fontFamily: FONTS.ui,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  modelRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  modelBubble: {
    width: '100%',
    borderRadius: RADII.lg,
    borderTopLeftRadius: 6,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modelHeaderLabel: {
    fontFamily: FONTS.ui,
    fontSize: 11.5,
    fontWeight: '700',
  },
  modelText: {
    fontFamily: FONTS.ui,
    fontSize: 14,
    lineHeight: 21,
  },
  matchedEventsWrap: {
    gap: 8,
    paddingTop: 4,
  },
  matchedHeading: {
    fontFamily: FONTS.ui,
    fontSize: 11.5,
    fontWeight: '700',
  },
  followUpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 2,
  },
  followUpChip: {
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  followUpText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '600',
  },
  typingBubble: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    fontWeight: '500',
  },
  errorBubble: {
    width: '100%',
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorTitle: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    fontWeight: '700',
  },
  errorBody: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    lineHeight: 19,
  },
  errorActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  retryBtn: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontFamily: FONTS.ui,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exploreFallbackBtn: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: RADII.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreFallbackText: {
    fontFamily: FONTS.ui,
    fontSize: 12.5,
    fontWeight: '600',
  },
  composerWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
  },
  inputShell: {
    minHeight: 50,
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  composerInput: {
    flex: 1,
    fontFamily: FONTS.ui,
    fontSize: 14,
    height: 44,
    outlineStyle: 'none',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
