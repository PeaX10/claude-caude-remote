import { View, StyleSheet } from 'react-native';
import { GitTab } from '../../components/git-tab';
import { colors } from '../../theme/colors';

export default function GitScreen() {
  return (
    <View style={styles.container}>
      <GitTab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});