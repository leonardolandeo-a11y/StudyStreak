import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton } from '../ui/ActionButton';
import { PageControls } from '../ui/PageControls';
import { StatusMessage } from '../ui/StatusMessage';
import { palette } from '../../constants/palette';
import { userSearchService } from '../../services/userSearchService';
import { getApiErrorMessage } from '../../utils/apiError';
import type { PageResponse } from '../../types/page';
import type { UserSearchResult } from '../../types/userSearch';

export function PartnerSearch({ onSend, busy }: {
  onSend: (userId: number) => Promise<boolean>;
  busy: boolean;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [page, setPage] = useState(0);
  const [results, setResults] = useState<PageResponse<UserSearchResult> | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchTerm = query.trim();

  useEffect(() => {
    if (selected || searchTerm.length < 2 || searchTerm.length > 100) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      setSearchError(null);
      void userSearchService.search(searchTerm, page, controller.signal)
        .then((response) => {
          if (!controller.signal.aborted) setResults(response);
        })
        .catch((cause) => {
          if (!controller.signal.aborted) {
            setResults(null);
            setSearchError(getApiErrorMessage(cause, 'Could not search for users.'));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm, page, selected]);

  function updateQuery(value: string) {
    setQuery(value);
    setSelected(null);
    setPage(0);
    setResults(null);
    setSearchError(null);
    setSearching(false);
  }

  async function send() {
    if (!selected || busy) return;
    if (await onSend(selected.id)) {
      updateQuery('');
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Find a study partner</Text>
      <Text style={styles.description}>Search by username or exact email. Select a person to send a request.</Text>
      <TextInput
        accessibilityLabel="Search study partners"
        placeholder="Username or email"
        placeholderTextColor={palette.muted}
        value={query}
        onChangeText={updateQuery}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={100}
        style={styles.input}
      />
      {selected ? (
        <StatusMessage message={`Selected: @${selected.username}`} />
      ) : searchTerm.length < 2 ? (
        <Text style={styles.description}>Enter at least 2 characters.</Text>
      ) : (
        <View style={styles.results}>
          {searching ? <ActivityIndicator color={palette.primary} /> : null}
          {searchError ? <StatusMessage error message={searchError} /> : null}
          {!searching && !searchError && results?.empty ? (
            <Text style={styles.description}>No matching users.</Text>
          ) : null}
          {!searching && !searchError ? results?.content.map((user) => (
            <Pressable key={user.id} accessibilityRole="button" onPress={() => {
              setSelected(user);
              setResults(null);
            }} style={styles.result}>
              <Text style={styles.user}>@{user.username}</Text>
              <Text style={styles.select}>Select</Text>
            </Pressable>
          )) : null}
          {!searching && !searchError && results ? (
            <PageControls page={page} totalPages={results.totalPages} onChange={(next) => {
              setPage(next);
              setResults(null);
            }} />
          ) : null}
        </View>
      )}
      <ActionButton title="Send tracking request" disabled={!selected} busy={busy} onPress={() => { void send(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, padding: 18, borderRadius: 16, gap: 13 },
  heading: { color: palette.text, fontSize: 19, fontWeight: '700' },
  description: { color: palette.muted, fontSize: 13, lineHeight: 21 },
  input: { backgroundColor: palette.background, color: palette.text, borderWidth: 1, borderColor: palette.border, borderRadius: 12, minHeight: 48, paddingHorizontal: 14, fontSize: 15 },
  results: { backgroundColor: palette.background, borderRadius: 12, padding: 12, gap: 10 },
  result: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 6, borderBottomWidth: 1, borderColor: palette.border },
  user: { color: palette.text, fontSize: 15, fontWeight: '600' },
  select: { color: palette.primary, fontWeight: '700', fontSize: 13 },
});
