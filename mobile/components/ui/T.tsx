import { Text, type TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { type as scale } from '../../theme/tokens';

type Kind = keyof typeof scale;

export function T({
  kind = 'body',
  color,
  center,
  children,
  style,
  numberOfLines,
}: {
  kind?: Kind;
  color?: string;
  center?: boolean;
  children: React.ReactNode;
  style?: TextStyle;
  numberOfLines?: number;
}) {
  const { c } = useTheme();
  const s = scale[kind];
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontSize: s.size,
          lineHeight: s.lh,
          fontFamily: s.family,
          letterSpacing: s.ls,
          color: color ?? c.ink,
          textAlign: center ? 'center' : 'left',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
