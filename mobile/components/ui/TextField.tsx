import { useState } from 'react';
import { Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamily, radius } from '../../theme/tokens';
import { PressableScale } from './PressableScale';

export function TextField({
  label,
  error,
  icon,
  secure,
  style,
  ...rest
}: {
  label: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secure?: boolean;
} & TextInputProps & { style?: ViewStyle }) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);

  return (
    <View style={[{ gap: 8 }, style]}>
      <Text
        style={{
          fontFamily: fontFamily.semibold,
          fontSize: 12,
          letterSpacing: 1.1,
          color: c.muted,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.surface,
          borderRadius: radius.md,
          borderWidth: focused ? 2 : 1,
          borderColor: error ? c.danger : focused ? c.primary : c.line,
          paddingHorizontal: 14,
          height: 52,
          gap: 10,
        }}
      >
        {icon ? <Ionicons name={icon} size={20} color={focused ? c.primary : c.muted} /> : null}
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={c.muted}
          style={{
            flex: 1,
            fontFamily: fontFamily.regular,
            fontSize: 15,
            color: c.ink,
            height: '100%',
          }}
        />
        {secure ? (
          <PressableScale onPress={() => setHidden((h) => !h)}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.muted} />
          </PressableScale>
        ) : null}
      </View>
      {error ? (
        <Text style={{ fontFamily: fontFamily.medium, fontSize: 13, color: c.danger }}>{error}</Text>
      ) : null}
    </View>
  );
}

