/**
 * Pembungkus layar: latar bertema + area aman.
 */

import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { useTheme } from './ThemeProvider';

export interface ScreenProps {
  children: ReactNode;
  /** Sisipkan padding atas sebesar area aman (layar tanpa header sendiri). */
  edgeTop?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, edgeTop = true, style }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.background,
          paddingTop: edgeTop ? insets.top : 0,
          paddingBottom: insets.bottom,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
