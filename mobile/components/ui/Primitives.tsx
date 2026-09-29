import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamily } from '../../theme/tokens';
import { Button } from './Button';
import { T } from './T';

export function Avatar({
  name,
  size = 52,
  color,
}: {
  name?: string;
  size?: number;
  color?: string;
}) {
  const { c } = useTheme();
  const initials = (name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color ?? c.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: fontFamily.bold, fontSize: size * 0.36, color: c.onPrimarySoft }}>
        {initials}
      </Text>
    </View>
  );
}

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <T kind="h2">{title}</T>
      {action ? (
        <Text
          onPress={onAction}
          style={{ fontFamily: fontFamily.semibold, fontSize: 14, color: c.primary }}
        >
          {action}
        </Text>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon = 'cube-outline',
  title,
  body,
  action,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  action?: string;
  onAction?: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 36, gap: 8, paddingHorizontal: 24 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: c.surface2,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        <Ionicons name={icon} size={30} color={c.muted} />
      </View>
      <T kind="h3" center>
        {title}
      </T>
      {body ? (
        <T kind="body" color={c.muted} center>
          {body}
        </T>
      ) : null}
      {action ? (
        <View style={{ marginTop: 12, alignSelf: 'stretch' }}>
          <Button title={action} size="md" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
