import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { radius, shadowSm } from '../../theme/tokens';

export function Card({
  children,
  style,
  pad = 16,
  flat,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  pad?: number;
  flat?: boolean;
}) {
  const { c, mode } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.surface,
          borderRadius: radius.lg,
          padding: pad,
          ...(flat ? {} : shadowSm(mode)),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
