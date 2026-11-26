import React, { memo, useId } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';
import { EventArtworkTheme } from '../../types/collegeConnect';

export const CampusClocktowerIllustration: React.FC<{
  isDark?: boolean;
  height?: number;
}> = memo(({ isDark = false, height = 200 }) => {
  const hillBack = isDark ? '#14201A' : '#CED8CA';
  const hillFront = isDark ? '#1D3127' : '#A9B9A5';
  const treeLight = isDark ? '#274835' : '#5E7861';
  const treeDark = isDark ? '#1D3628' : '#415C47';
  const wallLight = isDark ? '#3D3122' : '#DFC19E';
  const wallWing = isDark ? '#32281C' : '#D4B491';
  const roof = isDark ? '#543825' : '#7D5338';
  const win = isDark ? '#0D1410' : '#344A3D';
  const spire = isDark ? '#2D6A4F' : '#1C3B2B';
  const clockBg = isDark ? '#141916' : '#F8F5EE';
  const clockStroke = isDark ? '#A88662' : '#7D5338';
  const hand = isDark ? '#74B492' : '#1C3B2B';

  return (
    <View style={{ width: '100%', height }}>
      <Svg width="100%" height="100%" viewBox="0 0 360 220" preserveAspectRatio="xMidYMax slice">
        <Path
          d="M0 185C55 162 105 170 165 184C225 198 290 156 360 175V220H0V185Z"
          fill={hillBack}
        />
        <Path
          d="M0 198C75 184 140 205 210 194C275 184 320 194 360 188V220H0V198Z"
          fill={hillFront}
        />
        <Circle cx="48" cy="166" r="24" fill={treeLight} />
        <Circle cx="72" cy="172" r="18" fill={treeDark} />
        <Circle cx="305" cy="166" r="22" fill={treeLight} />
        <Circle cx="332" cy="174" r="16" fill={treeDark} />

        <Rect x="118" y="128" width="174" height="66" rx="4" fill={wallWing} />
        <Path d="M112 128L130 112H286L298 128H112Z" fill={roof} />
        {[146, 174, 202, 230, 258].map((x) => (
          <G key={x}>
            <Rect x={x} y="140" width="14" height="20" rx="7" fill={win} />
            <Rect x={x} y="168" width="14" height="18" rx="2" fill={win} />
          </G>
        ))}

        <Rect x="68" y="72" width="58" height="122" rx="3" fill={wallLight} />
        <Path d="M64 72L97 22L130 72H64Z" fill={spire} />
        <Line
          x1="97"
          y1="10"
          x2="97"
          y2="24"
          stroke={hand}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <Circle cx="97" cy="94" r="14" fill={clockBg} stroke={clockStroke} strokeWidth="2.5" />
        <Path
          d="M97 86V94L103 97"
          stroke={hand}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <Rect x="87" y="122" width="20" height="32" rx="10" fill={win} />
        <Rect x="85" y="166" width="24" height="28" rx="12" fill={spire} />
      </Svg>
    </View>
  );
});

export const BotanicalLeavesDoodle: React.FC<{ isDark?: boolean; size?: number }> = memo(
  ({ isDark = false, size = 96 }) => {
    const stroke = isDark ? '#74B492' : '#405F4A';
    const fillA = isDark ? 'rgba(45,106,79,0.55)' : 'rgba(117,148,121,0.55)';
    const fillB = isDark ? 'rgba(36,74,54,0.7)' : 'rgba(152,170,149,0.65)';

    return (
      <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <Path
          d="M18 112C34 86 58 60 92 22"
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <Path
          d="M44 78C30 62 32 42 48 34C54 50 52 66 44 78Z"
          fill={fillA}
          stroke={stroke}
          strokeWidth="1.5"
        />
        <Path
          d="M66 54C82 48 98 54 104 68C88 72 74 66 66 54Z"
          fill={fillB}
          stroke={stroke}
          strokeWidth="1.5"
        />
        <Path
          d="M30 96C16 86 12 72 20 58C32 68 36 82 30 96Z"
          fill={fillB}
          stroke={stroke}
          strokeWidth="1.5"
        />
      </Svg>
    );
  }
);

export const CrownDoodle: React.FC<{ color?: string; width?: number; height?: number }> = memo(
  ({ color = '#1A241E', width = 38, height = 26 }) => (
    <Svg width={width} height={height} viewBox="0 0 48 32" fill="none">
      <Path
        d="M6 25L4 10L16 17L24 5L32 17L44 10L42 25H6Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
);

export const PaperPlaneDoodle: React.FC<{ color?: string; width?: number; height?: number }> = memo(
  ({ color = '#1C261F', width = 68, height = 36 }) => (
    <Svg width={width} height={height} viewBox="0 0 88 46" fill="none">
      <Path
        d="M4 38C18 39 30 30 40 22"
        stroke={color}
        strokeOpacity="0.5"
        strokeWidth="1.6"
        strokeDasharray="3 4"
        strokeLinecap="round"
      />
      <Path
        d="M44 16L82 6L64 34L54 22L44 16Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Path d="M82 6L54 22L56 32" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  )
);

export const SwirlDoodle: React.FC<{ color?: string; size?: number }> = memo(
  ({ color = '#1C261F', size = 34 }) => (
    <Svg width={size} height={size * 0.7} viewBox="0 0 46 32" fill="none">
      <Path
        d="M4 26C10 10 24 6 28 16C31 23 20 26 18 19C16 12 28 6 42 10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  )
);

export const SparkStarDoodle: React.FC<{ color?: string; size?: number }> = memo(
  ({ color = '#1C261F', size = 24 }) => (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M14 2L16.8 10.5L25.5 11.2L18.5 16.5L20.8 25L14 20.2L7.2 25L9.5 16.5L2.5 11.2L11.2 10.5L14 2Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </Svg>
  )
);

export const MusicNoteDoodle: React.FC<{ color?: string; size?: number }> = memo(
  ({ color = '#1C261F', size = 28 }) => (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="M14 24V7L26 4V11L14 14"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="10.5" cy="24" r="3.5" fill={color} />
    </Svg>
  )
);

export const CurvedWaveCutout: React.FC<{ fillColor: string; height?: number }> = memo(
  ({ fillColor, height = 32 }) => (
    <View style={{ width: '100%', height }}>
      <Svg width="100%" height="100%" viewBox="0 0 360 32" preserveAspectRatio="none">
        <Path d="M0 16C78 34 150 2 232 14C286 22 326 24 360 8V32H0V16Z" fill={fillColor} />
      </Svg>
    </View>
  )
);

const ARTWORK_PALETTES: Record<
  EventArtworkTheme,
  { c1: string; c2: string; glow: string; accent: string; secondary: string }
> = {
  music_fest: {
    c1: '#1B2B23',
    c2: '#101A14',
    glow: '#E4C18A',
    accent: '#74B492',
    secondary: '#D9A76A',
  },
  open_mic: {
    c1: '#35241F',
    c2: '#171211',
    glow: '#F2B880',
    accent: '#E8D5B7',
    secondary: '#C97B63',
  },
  photography: {
    c1: '#33423A',
    c2: '#171E1B',
    glow: '#CED8CA',
    accent: '#A8C4B1',
    secondary: '#E8D5B7',
  },
  business_plan: {
    c1: '#283B32',
    c2: '#141D19',
    glow: '#D4DFC7',
    accent: '#82B99B',
    secondary: '#E8D5B7',
  },
  blood_camp: {
    c1: '#49272A',
    c2: '#1F1214',
    glow: '#F2A3A3',
    accent: '#F5D0D0',
    secondary: '#D96B6B',
  },
  hackathon: {
    c1: '#192E3A',
    c2: '#0D161C',
    glow: '#88C4D8',
    accent: '#74B492',
    secondary: '#A5D6E6',
  },
  campus_general: {
    c1: '#234533',
    c2: '#112219',
    glow: '#CED8CA',
    accent: '#E8D5B7',
    secondary: '#74B492',
  },
};

export const EventArtworkCard: React.FC<{
  theme: EventArtworkTheme;
  style?: ViewStyle;
  compact?: boolean;
}> = memo(({ theme, style, compact = false }) => {
  const uid = useId().replace(/:/g, '');
  const p = ARTWORK_PALETTES[theme] ?? ARTWORK_PALETTES.campus_general;
  const gradId = `grad_${theme}_${uid}`;

  return (
    <View style={[styles.artworkWrap, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={p.c1} />
            <Stop offset="1" stopColor={p.c2} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="320" height="200" fill={`url(#${gradId})`} />
        <Circle cx="240" cy="44" r="78" fill={p.glow} fillOpacity="0.16" />
        <Circle cx="80" cy="170" r="64" fill={p.accent} fillOpacity="0.12" />

        {theme === 'music_fest' && (
          <G>
            <Polygon points="75,0 135,195 35,195" fill={p.glow} fillOpacity="0.18" />
            <Polygon points="235,0 285,195 165,195" fill={p.accent} fillOpacity="0.16" />
            <Rect x="40" y="138" width="240" height="8" rx="4" fill={p.glow} fillOpacity="0.35" />
            <Path
              d="M0 195V166C24 156 38 168 56 160C74 152 88 168 112 158C136 148 148 168 172 156C196 144 214 166 238 158C262 150 288 166 320 154V195H0Z"
              fill="#0A120D"
              fillOpacity="0.72"
            />
            {!compact && (
              <G>
                <Circle cx="96" cy="54" r="3" fill={p.glow} />
                <Circle cx="164" cy="36" r="2.5" fill={p.accent} />
                <Circle cx="222" cy="56" r="3.5" fill={p.glow} />
              </G>
            )}
          </G>
        )}

        {theme === 'open_mic' && (
          <G>
            <Polygon points="160,0 245,200 75,200" fill={p.glow} fillOpacity="0.2" />
            <Rect
              x="148"
              y="64"
              width="24"
              height="40"
              rx="12"
              fill={p.accent}
              fillOpacity="0.85"
            />
            <Line x1="160" y1="104" x2="160" y2="178" stroke={p.accent} strokeWidth="4" />
            <Path d="M132 178H188" stroke={p.accent} strokeWidth="4" strokeLinecap="round" />
          </G>
        )}

        {theme === 'photography' && (
          <G>
            <Rect
              x="78"
              y="66"
              width="164"
              height="92"
              rx="18"
              fill={p.accent}
              fillOpacity="0.22"
              stroke={p.accent}
              strokeWidth="3"
            />
            <Rect x="122" y="48" width="76" height="22" rx="8" fill={p.accent} fillOpacity="0.3" />
            <Circle
              cx="160"
              cy="112"
              r="32"
              fill="#0F1713"
              fillOpacity="0.55"
              stroke={p.glow}
              strokeWidth="4"
            />
            <Circle cx="160" cy="112" r="16" fill={p.glow} fillOpacity="0.35" />
          </G>
        )}

        {theme === 'business_plan' && (
          <G>
            <Rect x="64" y="122" width="32" height="54" rx="6" fill={p.accent} fillOpacity="0.45" />
            <Rect x="116" y="96" width="32" height="80" rx="6" fill={p.accent} fillOpacity="0.65" />
            <Rect x="168" y="72" width="32" height="104" rx="6" fill={p.glow} fillOpacity="0.75" />
            <Path
              d="M68 102L130 74L184 52L248 34"
              stroke={p.secondary}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <Circle cx="248" cy="34" r="7" fill={p.secondary} />
          </G>
        )}

        {theme === 'blood_camp' && (
          <G>
            <Path
              d="M160 156C160 156 96 116 96 76C96 56 112 42 132 42C145 42 155 50 160 59C165 50 175 42 188 42C208 42 224 56 224 76C224 116 160 156 160 156Z"
              fill={p.secondary}
              fillOpacity="0.8"
            />
            <Path
              d="M160 72V104M144 88H176"
              stroke="#FFF6F6"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </G>
        )}

        {theme === 'hackathon' && (
          <G>
            <Rect
              x="48"
              y="42"
              width="224"
              height="122"
              rx="14"
              fill="#091116"
              fillOpacity="0.72"
              stroke={p.accent}
              strokeWidth="2.5"
            />
            <Path
              d="M114 86L86 106L114 126M206 86L234 106L206 126M172 78L148 134"
              stroke={p.glow}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>
        )}

        {theme === 'campus_general' && (
          <G>
            <Path
              d="M0 165C75 130 140 175 215 142C265 120 295 134 320 126V200H0V165Z"
              fill={p.glow}
              fillOpacity="0.24"
            />
            <Circle cx="160" cy="84" r="34" stroke={p.accent} strokeWidth="3" strokeOpacity="0.6" />
          </G>
        )}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  artworkWrap: {
    overflow: 'hidden',
    backgroundColor: '#1C3B2B',
  },
});
