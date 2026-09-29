import { Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamily, radius } from '../../theme/tokens';
import { PressableScale } from './PressableScale';

export function Chip({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { c } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 15,
        height: 40,
        borderRadius: radius.pill,
        backgroundColor: selected ? c.ink : c.surface,
        borderWidth: selected ? 0 : 1,
        borderColor: c.line,
        shadowColor: c.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: selected ? 0.2 : 0.04,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      {icon}
      <Text
        style={{
          fontFamily: fontFamily.semibold,
          fontSize: 13,
          color: selected ? c.bg : c.ink2,
        }}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

export function Tag({
  label,
  tone = 'muted',
}: {
  label: string;
  tone?: 'primary' | 'gold' | 'success' | 'danger' | 'info' | 'muted';
}) {
  const { c } = useTheme();
  const map = {
    primary: [c.primarySoft, c.onPrimarySoft],
    gold: [c.goldSoft, c.onGoldSoft],
    success: [c.successSoft, c.onSuccessSoft],
    danger: [c.dangerSoft, c.onDangerSoft],
    info: [c.infoSoft, c.onInfoSoft],
    muted: [c.surface2, c.ink2],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View
      style={{
        paddingHorizontal: 12,
        height: 30,
        borderRadius: radius.pill,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: fontFamily.semibold, fontSize: 12, color: fg }}>{label}</Text>
    </View>
  );
}
