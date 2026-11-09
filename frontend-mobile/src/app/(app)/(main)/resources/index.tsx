import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../../components/ui/Screen';
import { CreationModal } from '../../../../components/ui/CreationModal';
import { NavigationPressable } from '../../../../components/navigation/NavigationPressable';
import { BookCover } from '../../../../components/resources/BookCover';
import { FormField } from '../../../../components/ui/FormField';
import { ActionButton } from '../../../../components/ui/ActionButton';
import { StatusMessage } from '../../../../components/ui/StatusMessage';
import { useAppearance, useThemedStyles } from '../../../../hooks/useAppearance';
import type { ThemeColors } from '../../../../features/appearance/theme';
import { getBookSearchErrorMessage, googleBooksService } from '../../../../services/googleBooksService';
import type { StudyBook } from '../../../../types/studyBook';

type SearchRequest = { term: string; revision: number };

export default function StudyResources() {
  const { topic } = useLocalSearchParams<{ topic?: string }>();
  const initialTopic = typeof topic === 'string' ? topic.trim().slice(0, 80) : '';
  return <ResourcesContent key={initialTopic} initialTopic={initialTopic} />;
}
function ResourcesContent({ initialTopic }: { initialTopic: string }) {
  const styles = useThemedStyles(createStyles);
  const { theme: { colors: palette } } = useAppearance();
  const hasInitialSearch = initialTopic.length >= 2;
  const [query, setQuery] = useState(initialTopic);
  const [request, setRequest] = useState<SearchRequest | null>(
    hasInitialSearch ? { term: initialTopic, revision: 0 } : null,
  );
  const [books, setBooks] = useState<StudyBook[]>([]);
  const [loading, setLoading] = useState(hasInitialSearch);
  const [error, setError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<StudyBook | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    if (!request) return;
    const controller = new AbortController();

    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setError(null);
      try {
        const results = await googleBooksService.search(request.term, controller.signal);
        if (!controller.signal.aborted) setBooks(results);
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(getBookSearchErrorMessage(caught));
          setBooks([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    });

    return () => controller.abort();
  }, [request]));

  function submitSearch() {
    if (loading) return;
    const term = query.trim();
    if (term.length < 2 || term.length > 80) {
      setError('Enter between 2 and 80 characters.');
      setBooks([]);
      setRequest(null);
      return;
    }
    setSelectedBook(null);
    setError(null);
    setBooks([]);
    setLoading(true);
    setRequest((previous) => ({ term, revision: (previous?.revision ?? 0) + 1 }));
  }

  function retry() {
    if (!request || loading) return;
    setError(null);
    setLoading(true);
    setRequest((previous) => previous ? { ...previous, revision: previous.revision + 1 } : null);
  }

  function showBook(book: StudyBook) {
    setLinkError(null);
    setSelectedBook(book);
  }

  function closeBook() {
    setSelectedBook(null);
    setLinkError(null);
  }

  async function openBook(url: string) {
    setLinkError(null);
    try {
      if (!url.startsWith('https://')) throw new Error('Invalid book URL');
      await Linking.openURL(url);
    } catch {
      setLinkError('This book link could not be opened on your device.');
    }
  }

  return (
    <Screen themed compact>
      <Text style={styles.title}>Study resources</Text>
      <Text style={styles.muted}>Find books related to your study goals using Google Books.</Text>
      <View style={styles.searchBox}>
        <FormField variant="subtle" label="Book search topic" value={query} onChangeText={setQuery}
          placeholder="Example: differential equations" maxLength={80} autoCapitalize="sentences"
          returnKeyType="search" onSubmitEditing={submitSearch} />
        <View style={styles.searchActions}>
          <ActionButton compact title="Search books" busy={loading} onPress={submitSearch} />
          {loading ? <ActionButton compact secondary title="Cancel search" onPress={() => {
            setRequest(null); setLoading(false); setBooks([]); setError(null);
          }} /> : null}
        </View>
      </View>
      {loading ? <ActivityIndicator size="large" color={palette.primary} /> : null}
      {error ? <StatusMessage error message={error} /> : null}
      {error && request ? <ActionButton compact title="Retry search" secondary onPress={retry} /> : null}
      {!request && !error ? <Text style={styles.muted}>Enter a topic to find study books.</Text> : null}
      {request && !loading && !error && books.length === 0 ? (
        <Text style={styles.muted}>No books were found. Try a broader topic.</Text>
      ) : null}
      {!loading && !error ? books.map((book) => (
        <NavigationPressable key={book.id} accessibilityRole="button"
          accessibilityLabel={`View details for ${book.title}`} onPress={() => showBook(book)}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={styles.bookRow}>
            <BookCover key={book.thumbnailUrl ?? book.id} uri={book.thumbnailUrl} title={book.title} />
            <View style={styles.bookInfo}>
              <Text numberOfLines={2} style={styles.bookTitle}>{book.title}</Text>
              <Text numberOfLines={2} style={styles.muted}>{book.authors?.length ? book.authors.join(', ') : 'Unknown author'}</Text>
              {book.publishedDate ? <Text style={styles.muted}>Published: {book.publishedDate}</Text> : null}
            </View>
          </View>
          {book.description ? <Text style={styles.description} numberOfLines={3}>{book.description}</Text> : null}
          <Text style={styles.tapHint}>View book details ›</Text>
        </NavigationPressable>
      )) : null}
      <Text style={styles.credit}>Book information provided by Google Books.</Text>

      <CreationModal visible={selectedBook !== null} title="Book details" onClose={closeBook} cancelLabel="Close book details">
              {selectedBook ? (
                <>
                  <View style={{ alignItems: 'center' }}><BookCover key={selectedBook.id} uri={selectedBook.thumbnailUrl} title={selectedBook.title} large /></View>
                  <Text style={styles.detailTitle}>{selectedBook.title}</Text>
                  <Text style={styles.muted}>{selectedBook.authors?.length
                    ? selectedBook.authors.join(', ') : 'Unknown author'}</Text>
                  {selectedBook.publisher ? (
                    <Text style={styles.muted}>Publisher: {selectedBook.publisher}</Text>
                  ) : null}
                  {selectedBook.publishedDate ? (
                    <Text style={styles.muted}>Published: {selectedBook.publishedDate}</Text>
                  ) : null}
                  {selectedBook.pageCount ? (
                    <Text style={styles.muted}>Pages: {selectedBook.pageCount}</Text>
                  ) : null}
                  {selectedBook.categories?.length ? (
                    <Text style={styles.muted}>Categories: {selectedBook.categories.join(', ')}</Text>
                  ) : null}
                  {selectedBook.description ? (
                    <Text style={styles.detailDescription}>{selectedBook.description}</Text>
                  ) : (
                    <Text style={styles.muted}>No description is available for this book.</Text>
                  )}
                  {linkError ? <StatusMessage error message={linkError} /> : null}
                  {selectedBook.previewLink ? (
                    <ActionButton compact title="Preview on Google Books" secondary
                      onPress={() => { if (selectedBook.previewLink) void openBook(selectedBook.previewLink); }} />
                  ) : null}
                  <ActionButton compact title="Open on Google Books"
                    disabled={!selectedBook.infoLink}
                    onPress={() => { if (selectedBook.infoLink) void openBook(selectedBook.infoLink); }} />
                  <Text style={styles.credit}>Reading availability depends on the publisher.</Text>
                </>
              ) : null}
      </CreationModal>
    </Screen>
  );
}

const createStyles = (palette: ThemeColors) => StyleSheet.create({
  title: { color: palette.text, fontSize: 24, fontWeight: '700' },
  muted: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  searchBox: { gap: 10 },
  searchActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { borderWidth: 1, borderColor: palette.border, borderRadius: 12,
    backgroundColor: palette.surface, padding: 12, gap: 10 },
  pressed: { opacity: 0.75 },
  bookRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  bookInfo: { flex: 1, minWidth: 0, gap: 4 },
  bookTitle: { color: palette.text, fontWeight: '600', fontSize: 16 },
  description: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  tapHint: { color: palette.primary, fontSize: 13, fontWeight: '600' },
  credit: { color: palette.muted, fontSize: 12, paddingVertical: 6 },
  detailTitle: { color: palette.text, fontWeight: '700', fontSize: 22, lineHeight: 28 },
  detailDescription: { color: palette.text, fontSize: 15, lineHeight: 23 },
});
