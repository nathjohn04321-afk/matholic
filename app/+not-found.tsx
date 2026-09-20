import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { spacing } from '@/lib/theme';

export default function NotFound() {
  return (
    <Screen>
      <View style={styles.container}>
        <Text variant="title" weight="700">
          Halaman tidak ditemukan
        </Text>
        <Link href="/" asChild>
          <Button label="Kembali ke beranda" icon="home-outline" />
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
});
