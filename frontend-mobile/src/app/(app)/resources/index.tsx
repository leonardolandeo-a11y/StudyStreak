import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/ui/Screen';
import { ActionButton } from '../../../components/ui/ActionButton';
import { StatusMessage } from '../../../components/ui/StatusMessage';
import { palette } from '../../../constants/palette';
import { googleBooksService } from '../../../services/googleBooksService';
import type { StudyBook } from '../../../types/studyBook';

type SearchRequest = { term: string; revision: number };

export default function StudyResources() {
  const { topic } = useLocalSearchParams<{ topic?: string }>();
  const initialTopic = typeof topic === 'string' ? topic.trim().slice(0, 80) : '';
  const [query, setQuery] = useState(initialTopic);
  const [request, setRequest] = useState<SearchRequest | null>(
    initialTopic ? { term: initialTopic, revision: 0 } : null,
  );
  const [books, setBooks] = useState<StudyBook[]>([]);
  const [loading, setLoading] = useState(Boolean(initialTopic));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();

    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setError(null);
      try {
        const results = await googleBooksService.search(request.term, controller.signal);
        if (!controller.signal.aborted) setBooks(results);
      } catch {
        if (!controller.signal.aborted) {
          setError('Books could not be loaded. Check your connection and try again.');
          setBooks([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    });

    return () => controller.abort();
  }, [request]);

  function submitSearch() {
    const term = query.trim();
    if (term.length < 2 || term.length > 80) {
      setError('Enter between 2 and 80 characters.');
      return;
    }
    setRequest((previous) => ({ term, revision: (previous?.revision ?? 0) + 1 }));
  }

  function retry() {
    setRequest((previous) => previous ? { ...previous, revision: previous.revision + 1 } : null);
  }

  async function openBook(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      setError('The book link could not be opened on this device.');
    }
  }

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <Text style={styles.title}>Study resources</Text>
      <Text style={styles.muted}>Find books related to your study goals using Google Books.</Text>
      <View style={styles.searchBox}>
        <Text style={styles.label}>Topic</Text>
        <TextInput
          accessibilityLabel="Book search topic"
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Example: differential equations"
          placeholderTextColor={palette.muted}
          maxLength={80}
          autoCapitalize="sentences"
          returnKeyType="search"
          onSubmitEditing={submitSearch}
        />
        <ActionButton title="Search books" busy={loading} onPress={submitSearch} />
      </View>
      {loading ? <ActivityIndicator size="large" color={palette.primary} /> : null}
      {error ? <StatusMessage error message={error} /> : null}
      {error && request ? <ActionButton title="Retry search" secondary onPress={retry} /> : null}
      {!request ? <Text style={styles.muted}>Enter a topic to find study books.</Text> : null}
      {request && !loading && !error && books.length === 0 ? (
        <Text style={styles.muted}>No books were found. Try a broader topic.</Text>
      ) : null}
      {!loading && !error ? books.map((book) => (
        <View key={book.id} style={styles.card}>
          <Text style={styles.bookTitle}>{book.title}</Text>
          <Text style={styles.muted}>{book.authors.length ? book.authors.join(', ') : 'Unknown author'}</Text>
          {book.publishedDate ? <Text style={styles.muted}>Published: {book.publishedDate}</Text> : null}
          {book.description ? <Text style={styles.description} numberOfLines={4}>{book.description}</Text> : null}
          {book.infoLink ? <ActionButton title="View book details" secondary
            onPress={() => { if (book.infoLink) void openBook(book.infoLink); }} /> : null}
        </View>
      )) : null}
      <Text style={styles.credit}>Book information provided by Google Books.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: palette.primary, fontWeight: '700', fontSize: 15 },
  title: { color: palette.text, fontSize: 28, fontWeight: '800' },
  muted: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  label: { color: palette.text, fontSize: 15, fontWeight: '700' },
  searchBox: { gap: 12, borderWidth: 1, borderColor: palette.border,
    backgroundColor: palette.surface, padding: 17, borderRadius: 16 },
  input: { borderWidth: 1, borderColor: palette.border, borderRadius: 10,
    color: palette.text, paddingHorizontal: 14, minHeight: 48, fontSize: 16,
    backgroundColor: palette.surfaceRaised },
  card: { borderWidth: 1, borderColor: palette.border, borderRadius: 16,
    backgroundColor: palette.surface, padding: 17, gap: 10 },
  bookTitle: { color: palette.text, fontWeight: '800', fontSize: 18 },
  description: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  credit: { color: palette.muted, fontSize: 12, paddingVertical: 6 },
});
