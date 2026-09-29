import { Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamily, radius } from '../../theme/tokens';
import { PressableScale } from './PressableScale';

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: c.surface2,
        borderRadius: radius.md,
        padding: 4,
        gap: 4,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <PressableScale
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              height: 36,
              borderRadius: radius.sm,
              backgroundColor: active ? c.surface : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: c.shadow,
              shadowOffset: { width: 0, height: active ? 2 : 0 },
              shadowOpacity: active ? 0.12 : 0,
              shadowRadius: 6,
              elevation: active ? 2 : 0,
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily.semibold,
                fontSize: 13,
                color: active ? c.ink : c.muted,
              }}
            >
              {o.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
