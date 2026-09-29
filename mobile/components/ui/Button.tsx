import { ActivityIndicator, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamily, radius, type } from '../../theme/tokens';
import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  variant = 'primary',
  size = 'lg',
  loading,
  disabled,
  icon,
  iconAfter,
  fullWidth = true,
  style,
  onPress,
}: {
  title: string;
  variant?: Variant;
  size?: 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconAfter?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
}) {
  const { c, mode } = useTheme();
  const h = size === 'lg' ? 50 : 44;

  const bg =
    variant === 'primary'
      ? c.primary
      : variant === 'danger'
        ? c.danger
        : variant === 'secondary'
          ? c.surface2
          : 'transparent';
  const fg =
    variant === 'primary'
      ? c.onPrimary
      : variant === 'danger'
        ? '#FFFFFF'
        : variant === 'secondary'
          ? c.ink
          : c.primary;
  void mode;

  return (
    <PressableScale
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        {
          height: h,
          borderRadius: 14,
          backgroundColor: bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 18,
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          shadowColor: variant === 'primary' ? c.primary : c.shadow,
          shadowOffset: { width: 0, height: variant === 'primary' ? 6 : 1 },
          shadowOpacity: variant === 'primary' ? 0.22 : 0.05,
          shadowRadius: variant === 'primary' ? 12 : 6,
          elevation: variant === 'primary' ? 3 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text
            style={{
              color: fg,
              fontFamily: fontFamily.semibold,
              fontSize: size === 'lg' ? 16 : 14,
              letterSpacing: 0.2,
            }}
          >
            {title}
          </Text>
          {iconAfter ? <Ionicons name={iconAfter} size={18} color={fg} /> : null}
        </View>
      )}
    </PressableScale>
  );
}

export { radius, type };
