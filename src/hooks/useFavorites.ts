
import { useState } from 'react';

// Избранные матчи по уникальному id.
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  const isFavorite = (id: string) => favorites.includes(id);

  const toggle = (id: string) => {
    setFavorites((current) =>
        current.includes(id)
            ? current.filter((favoriteId) => favoriteId !== id)
            : [...current, id]
    );
  };

  return { favorites, isFavorite, toggle };
}
