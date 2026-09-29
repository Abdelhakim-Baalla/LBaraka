import { ScrollView, StatusBar, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

export function Screen({
  children,
  scroll,
  pad = 16,
  padBottom = 32,
  edges = ['top', 'left', 'right'],
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  pad?: number;
  padBottom?: number;
  edges?: Edge[];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}) {
  const { c, dark } = useTheme();
  const inner = (
    <View style={[{ flex: 1, paddingHorizontal: pad }, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: c.bg }, style]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: padBottom, flexGrow: 1 }}
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}
