
import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  active: boolean;
  onPress: () => void;
};

// Кнопка добавления матча в избранное.
export function FavoriteButton({ active, onPress }: Props) {
  return (
      <Pressable
          onPress={onPress}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={
            active ? 'Убрать из избранного' : 'Добавить в избранное'
          }
      >
        <Text style={[styles.star, active && styles.active]}>
          {active ? '★' : '☆'}
        </Text>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  star: {
    fontSize: 27,
    color: '#899384',
  },
  active: {
    color: '#d7ff62',
  },
});
