import React from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
}

export const HomeIcon: React.FC<IconProps> = ({
  size = 22,
  color = '#1A241E',
  strokeWidth = 2,
  filled = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z"
      fill={filled ? color : 'none'}
      fillOpacity={filled ? 0.18 : 0}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 21V12H15V21"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CompassIcon: React.FC<IconProps> = ({
  size = 22,
  color = '#1A241E',
  strokeWidth = 2,
  filled = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="12"
      r="9.5"
      fill={filled ? color : 'none'}
      fillOpacity={filled ? 0.16 : 0}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Path
      d="M16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76Z"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const BookmarkIcon: React.FC<IconProps> = ({
  size = 22,
  color = '#1A241E',
  strokeWidth = 2,
  filled = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 21L12 16L5 21V5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21Z"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const UserIcon: React.FC<IconProps> = ({
  size = 22,
  color = '#1A241E',
  strokeWidth = 2,
  filled = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="8"
      r="4"
      fill={filled ? color : 'none'}
      fillOpacity={filled ? 0.2 : 0}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Path
      d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const BellIcon: React.FC<IconProps> = ({
  size = 22,
  color = '#1A241E',
  strokeWidth = 2,
  filled = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
      fill={filled ? color : 'none'}
      fillOpacity={filled ? 0.16 : 0}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.73 21C13.3722 21.6168 12.7131 21.9964 12 21.9964C11.2869 21.9964 10.6278 21.6168 10.27 21"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const SearchIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#5B665F',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7.5" stroke={color} strokeWidth={strokeWidth} />
    <Line
      x1="16.5"
      y1="16.5"
      x2="21"
      y2="21"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const PlusIcon: React.FC<IconProps> = ({
  size = 22,
  color = '#FFFFFF',
  strokeWidth = 2.4,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line
      x1="12"
      y1="5"
      x2="12"
      y2="19"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line
      x1="5"
      y1="12"
      x2="19"
      y2="12"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const CalendarIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#1A241E',
  strokeWidth = 2,
  filled = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="3"
      y="4"
      width="18"
      height="18"
      rx="3"
      fill={filled ? color : 'none'}
      fillOpacity={filled ? 0.14 : 0}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1="16"
      y1="2"
      x2="16"
      y2="6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line
      x1="8"
      y1="2"
      x2="8"
      y2="6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

export const UsersIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#1A241E',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="7.5" r="3.5" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M2.5 19.5C2.5 16.5 5.4 14.5 9 14.5C12.6 14.5 15.5 16.5 15.5 19.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Circle cx="16.8" cy="8.5" r="2.7" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M17.5 14.8C19.8 15.3 21.5 17 21.5 19.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const MegaphoneIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#1A241E',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 11V13C3 14.1 3.9 15 5 15H6.5L10 20H12.5L10.5 15H13L19 18V6L13 9H5C3.9 9 3 9.9 3 11Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 9.5C21.6 10.3 21.6 13.7 21 14.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#FFFFFF',
  strokeWidth = 2.2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line
      x1="5"
      y1="12"
      x2="19"
      y2="12"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Polyline
      points="13 6 19 12 13 18"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({
  size = 22,
  color = '#1A241E',
  strokeWidth = 2.2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline
      points="15 18 9 12 15 6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#5B665F',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline
      points="9 6 15 12 9 18"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SlidersIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#1A241E',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line
      x1="4"
      y1="6"
      x2="20"
      y2="6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line
      x1="4"
      y1="12"
      x2="20"
      y2="12"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line
      x1="4"
      y1="18"
      x2="20"
      y2="18"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Circle cx="9" cy="6" r="2" fill={color} />
    <Circle cx="15" cy="12" r="2" fill={color} />
    <Circle cx="11" cy="18" r="2" fill={color} />
  </Svg>
);

export const ShareIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#1A241E',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth={strokeWidth} />
    <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
    <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth={strokeWidth} />
    <Line x1="8.6" y1="13.5" x2="15.4" y2="17.5" stroke={color} strokeWidth={strokeWidth} />
    <Line x1="15.4" y1="6.5" x2="8.6" y2="10.5" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

export const MapPinIcon: React.FC<IconProps> = ({
  size = 16,
  color = '#5B665F',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21C16 17 19 13.4 19 9.5C19 5.9 15.9 3 12 3C8.1 3 5 5.9 5 9.5C5 13.4 8 17 12 21Z"
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Circle cx="12" cy="9.5" r="2.5" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

export const ClockIcon: React.FC<IconProps> = ({
  size = 16,
  color = '#5B665F',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
    <Polyline
      points="12 7 12 12 15.5 14"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const TicketIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#5B665F',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9V6C3 4.9 3.9 4 5 4H19C20.1 4 21 4.9 21 6V9C19.3 9 18 10.3 18 12C18 13.7 19.3 15 21 15V18C21 19.1 20.1 20 19 20H5C3.9 20 3 19.1 3 18V15C4.7 15 6 13.7 6 12C6 10.3 4.7 9 3 9Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  </Svg>
);

export const SettingsIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#FFFFFF',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M19.4 15A1.65 1.65 0 0 0 19.73 16.82L19.79 16.88A2 2 0 0 1 16.96 19.71L16.9 19.65A1.65 1.65 0 0 0 15.08 19.32A1.65 1.65 0 0 0 14 20.83V21A2 2 0 0 1 10 21V20.91A1.65 1.65 0 0 0 8.92 19.4A1.65 1.65 0 0 0 7.1 19.73L7.04 19.79A2 2 0 0 1 4.21 16.96L4.27 16.9A1.65 1.65 0 0 0 4.6 15.08A1.65 1.65 0 0 0 3.09 14H3A2 2 0 0 1 3 10H3.09A1.65 1.65 0 0 0 4.6 8.92A1.65 1.65 0 0 0 4.27 7.1L4.21 7.04A2 2 0 0 1 7.04 4.21L7.1 4.27A1.65 1.65 0 0 0 8.92 4.6H9A1.65 1.65 0 0 0 10 3.09V3A2 2 0 0 1 14 3V3.09A1.65 1.65 0 0 0 15.08 4.6A1.65 1.65 0 0 0 16.9 4.27L16.96 4.21A2 2 0 0 1 19.79 7.04L19.73 7.1A1.65 1.65 0 0 0 19.4 8.92V9A1.65 1.65 0 0 0 20.91 10H21A2 2 0 0 1 21 14H20.91A1.65 1.65 0 0 0 19.4 15Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#1C5E3B',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={strokeWidth} />
    <Polyline
      points="8.5 12.5 11 15 16 9.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const AlertCircleIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#B93829',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={strokeWidth} />
    <Line
      x1="12"
      y1="8"
      x2="12"
      y2="12.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Circle cx="12" cy="16" r="1" fill={color} />
  </Svg>
);

export const ShieldIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#1C3B2B',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3L4 6.5V11.5C4 16.2 7.4 20.4 12 21.5C16.6 20.4 20 16.2 20 11.5V6.5L12 3Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Polyline
      points="9 12 11 14 15.5 9.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const XIcon: React.FC<IconProps> = ({ size = 20, color = '#1A241E', strokeWidth = 2.2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line
      x1="6"
      y1="6"
      x2="18"
      y2="18"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line
      x1="18"
      y1="6"
      x2="6"
      y2="18"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const HelpCircleIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#1A241E',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M9.5 9.2C9.8 7.9 10.9 7 12.2 7C13.8 7 15 8.1 15 9.5C15 10.7 14.2 11.4 13.1 12C12.4 12.4 12 13 12 13.8V14.2"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Circle cx="12" cy="17" r="1" fill={color} />
  </Svg>
);

export const CodeIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#1A241E',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline
      points="8 7 3 12 8 17"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline
      points="16 7 21 12 16 17"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="13.5"
      y1="5"
      x2="10.5"
      y2="19"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#FFFFFF',
  strokeWidth = 2.4,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline
      points="5 12.5 10 17.5 19 7.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const RefreshIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#1A241E',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 11A8 8 0 0 0 5.6 6.2L3 9"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline
      points="3 4 3 9 8 9"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4 13A8 8 0 0 0 18.4 17.8L21 15"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline
      points="21 20 21 15 16 15"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SunIcon: React.FC<IconProps> = ({ size = 18, color = '#1A241E', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth={strokeWidth} />
    <Line
      x1="12"
      y1="2"
      x2="12"
      y2="4.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line
      x1="12"
      y1="19.5"
      x2="12"
      y2="22"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line
      x1="4.9"
      y1="4.9"
      x2="6.7"
      y2="6.7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line
      x1="17.3"
      y1="17.3"
      x2="19.1"
      y2="19.1"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line
      x1="2"
      y1="12"
      x2="4.5"
      y2="12"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line
      x1="19.5"
      y1="12"
      x2="22"
      y2="12"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const MoonIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#1A241E',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12.8A9 9 0 1 1 11.2 3A7 7 0 0 0 21 12.8Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SmartphoneIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#1A241E',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="6" y="2" width="12" height="20" rx="2.5" stroke={color} strokeWidth={strokeWidth} />
    <Line
      x1="10.5"
      y1="18.5"
      x2="13.5"
      y2="18.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const MailIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#5B665F',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="5" width="18" height="14" rx="2.5" stroke={color} strokeWidth={strokeWidth} />
    <Polyline
      points="3.5 6.5 12 13 20.5 6.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const LockIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#5B665F',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="4.5"
      y="10.5"
      width="15"
      height="10"
      rx="2.5"
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Path
      d="M8 10.5V7.5C8 5.29 9.79 3.5 12 3.5C14.21 3.5 16 5.29 16 7.5V10.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const EyeIcon: React.FC<IconProps> = ({ size = 18, color = '#5B665F', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2.5 12C4.6 7.8 8 5.5 12 5.5C16 5.5 19.4 7.8 21.5 12C19.4 16.2 16 18.5 12 18.5C8 18.5 4.6 16.2 2.5 12Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#5B665F',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 3L21 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path
      d="M10.6 5.7C11.06 5.57 11.53 5.5 12 5.5C16 5.5 19.4 7.8 21.5 12C20.6 13.8 19.4 15.2 18 16.3M14.1 14.1C13.56 14.66 12.82 15 12 15C10.34 15 9 13.66 9 12C9 11.18 9.34 10.44 9.9 9.9M6.3 7.5C4.7 8.6 3.4 10.1 2.5 12C4.6 16.2 8 18.5 12 18.5C13.5 18.5 14.9 18.1 16.2 17.4"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const LogOutIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#1A241E',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H9"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline
      points="16 17 21 12 16 7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="21"
      y1="12"
      x2="9"
      y2="12"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const KeyIcon: React.FC<IconProps> = ({ size = 18, color = '#5B665F', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="7.5" cy="15.5" r="4.5" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M10.8 12.2L20 3M16.5 6.5L19.5 9.5M14 9L16.5 11.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const GoogleGIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.8 12.23C21.8 11.5 21.74 10.8 21.62 10.12H12V14.12H17.5C17.26 15.38 16.54 16.45 15.46 17.16V19.76H18.76C20.69 17.98 21.8 15.36 21.8 12.23Z"
      fill="#4285F4"
    />
    <Path
      d="M12 22C14.76 22 17.07 21.09 18.76 19.76L15.46 17.16C14.55 17.77 13.38 18.14 12 18.14C9.34 18.14 7.09 16.34 6.29 13.93H2.88V16.61C4.56 19.95 8.01 22 12 22Z"
      fill="#34A853"
    />
    <Path
      d="M6.29 13.93C6.08 13.32 5.96 12.67 5.96 12C5.96 11.33 6.08 10.68 6.29 10.07V7.39H2.88C2.19 8.77 1.8 10.34 1.8 12C1.8 13.66 2.19 15.23 2.88 16.61L6.29 13.93Z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.86C13.5 5.86 14.85 6.38 15.91 7.39L18.84 4.46C17.06 2.8 14.75 1.8 12 1.8C8.01 1.8 4.56 3.85 2.88 7.39L6.29 10.07C7.09 7.66 9.34 5.86 12 5.86Z"
      fill="#EA4335"
    />
  </Svg>
);

export const SparklesIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#1E3A2B',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3L13.9 8.1L19 10L13.9 11.9L12 17L10.1 11.9L5 10L10.1 8.1L12 3Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 16L19.8 18.2L22 19L19.8 19.8L19 22L18.2 19.8L16 19L18.2 18.2L19 16Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SendIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#FFFFFF',
  strokeWidth = 2.2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 3L14 21L10.8 13.2L3 10L21 3Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="21"
      y1="3"
      x2="10.8"
      y2="13.2"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);
