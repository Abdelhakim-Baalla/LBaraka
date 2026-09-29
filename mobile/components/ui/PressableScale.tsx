import { useEffect } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motion } from '../../theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Press feedback: scale 0.97 @ 160ms ease-out. Skipped under reduced motion.
export function PressableScale({
  style,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: PressableProps & { style?: StyleProp<ViewStyle> }) {
  const reduce = useReducedMotion();
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: s.value }],
  }));

  useEffect(() => {
    if (disabled) s.value = 1;
  }, [disabled, s]);

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={(e) => {
        if (!reduce) s.value = withTiming(motion.pressScale, { duration: motion.pressMs });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduce) s.value = withTiming(1, { duration: motion.pressMs });
        onPressOut?.(e);
      }}
      style={[anim, style]}
      {...rest}
    />
  );
}
