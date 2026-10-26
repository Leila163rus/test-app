
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MATCHES_URL } from '../config';
import { FavoriteButton } from '../components/FavoriteButton';
import { UpdatedAgo } from '../components/UpdatedAgo';
import { useFavorites } from '../hooks/useFavorites';

type Team = {
  id: string;
  name: string;
  city: string;
};

type Match = {
  id: string;
  startsAt: string | null;
  status: 'finished' | 'live' | 'scheduled' | 'postponed' | 'unknown';
  minute?: number;
  home: Team;
  away: Team;
  score: { home: number; away: number } | null;
};

type Filter = 'all' | 'upcoming' | 'finished';

type MatchesResponse = {
  round: number;
  matches: Match[];
};

function statusLabel(match: Match) {
  switch (match.status) {
    case 'finished':
      return 'Завершён';
    case 'live':
      return match.minute != null ? `Идёт матч · ${match.minute}′` : 'Идёт матч';
    case 'scheduled':
      return 'Предстоящий';
    case 'postponed':
      return 'Перенесён';
    default:
      return 'Статус неизвестен';
  }
}

function formatDate(value: string | null) {
  if (!value) return 'Дата не назначена';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Дата неизвестна';

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const { isFavorite, toggle } = useFavorites();

  const loadMatches = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const response = await fetch(MATCHES_URL);
      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data = (await response.json()) as MatchesResponse;

      if (!Array.isArray(data.matches)) {
        throw new Error('Сервер вернул данные в неожиданном формате');
      }

      setMatches(data.matches);
      setUpdatedAt(new Date());
    } catch {
      setError('Не удалось загрузить матчи. Проверьте подключение к интернету.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  const filteredMatches = useMemo(() => {
    if (filter === 'upcoming') {
      return matches.filter((match) => match.status === 'scheduled');
    }

    if (filter === 'finished') {
      return matches.filter((match) => match.status === 'finished');
    }

    return matches;
  }, [matches, filter]);

  const filters: { label: string; value: Filter }[] = [
    { label: 'Все', value: 'all' },
    { label: 'Предстоящие', value: 'upcoming' },
    { label: 'Завершённые', value: 'finished' },
  ];

  const renderMatch = ({ item }: { item: Match }) => (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.date}>{formatDate(item.startsAt)}</Text>
          <FavoriteButton
              active={isFavorite(item.id)}
              onPress={() => toggle(item.id)}
          />
        </View>

        <View style={styles.teams}>
          <View style={styles.team}>
            <Text style={styles.teamName}>{item.home.name}</Text>
            <Text style={styles.city}>{item.home.city}</Text>
          </View>

          <Text style={styles.score}>
            {item.score
                ? `${item.score.home} : ${item.score.away}`
                : '— : —'}
          </Text>

          <View style={[styles.team, styles.awayTeam]}>
            <Text style={styles.teamName}>{item.away.name}</Text>
            <Text style={styles.city}>{item.away.city}</Text>
          </View>
        </View>

        <Text style={styles.status}>{statusLabel(item)}</Text>
      </View>
  );

  if (loading) {
    return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.message}>Загружаем матчи...</Text>
        </View>
    );
  }

  if (error && matches.length === 0) {
    return (
        <View style={styles.center}>
          <Text style={styles.message}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => void loadMatches()}>
            <Text style={styles.retryText}>Повторить</Text>
          </Pressable>
        </View>
    );
  }

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Матчи тура</Text>

        <View style={styles.filters}>
          {filters.map((item) => (
              <Pressable
                  key={item.value}
                  onPress={() => setFilter(item.value)}
                  style={[
                    styles.filterButton,
                    filter === item.value && styles.activeFilter,
                  ]}
              >
                <Text
                    style={[
                      styles.filterText,
                      filter === item.value && styles.activeFilterText,
                    ]}
                >
                  {item.label}
                </Text>
              </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <FlatList
            data={filteredMatches}
            keyExtractor={(item) => item.id}
            renderItem={renderMatch}
            contentContainerStyle={
              filteredMatches.length === 0 ? styles.emptyList : styles.list
            }
            ListEmptyComponent={
              <Text style={styles.message}>Матчей в этой категории нет.</Text>
            }
            refreshControl={
              <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => void loadMatches(true)}
              />
            }
            ListHeaderComponent={
              updatedAt ? (
                  <View style={styles.updated}>
                    <UpdatedAgo since={updatedAt} />
                    <Pressable onPress={() => void loadMatches(true)}>
                      <Text style={styles.refreshText}>Обновить</Text>
                    </Pressable>
                  </View>
              ) : null
            }
        />
      </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#101410',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
    color: '#f3f5ed',
    marginBottom: 20,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#20271f',
    borderWidth: 1,
    borderColor: '#303a2e',
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#d7ff62',
    borderColor: '#d7ff62',
  },
  filterText: {
    fontSize: 12,
    color: '#b8c0b2',
    fontWeight: '700',
  },
  activeFilterText: {
    color: '#17200e',
  },
  list: {
    paddingBottom: 30,
    gap: 12,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1a2119',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#303a2e',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  date: {
    color: '#a0aa99',
    fontSize: 12,
    flexShrink: 1,
    letterSpacing: 0.3,
  },
  teams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  team: {
    flex: 1,
  },
  awayTeam: {
    alignItems: 'flex-end',
  },
  teamName: {
    color: '#f3f5ed',
    fontSize: 14,
    fontWeight: '800',
  },
  city: {
    color: '#899384',
    fontSize: 11,
    marginTop: 5,
  },
  score: {
    color: '#d7ff62',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 1,
  },
  status: {
    color: '#d7ff62',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#303a2e',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#101410',
  },
  message: {
    color: '#c1c9bb',
    textAlign: 'center',
    fontSize: 15,
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: '#d7ff62',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  retryText: {
    color: '#17200e',
    fontWeight: '800',
  },
  updated: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshText: {
    color: '#d7ff62',
    fontWeight: '800',
    fontSize: 13,
  },
  errorText: {
    color: '#ff8b80',
    marginBottom: 12,
  },
});

