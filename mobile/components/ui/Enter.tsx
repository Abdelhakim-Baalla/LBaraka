import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { motion } from '../../theme/motion';

// Group entrance: fade + rise, staggered by index. No scale-from-zero,
// transform/opacity only, skipped under reduced motion.
export function Enter({
  index = 0,
  children,
}: {
  index?: number;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <Animated.View
      entering={FadeInDown.duration(motion.enterMs).delay(index * motion.staggerMs)}
    >
      {children}
    </Animated.View>
  );
}
