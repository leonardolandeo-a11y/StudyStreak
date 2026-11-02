import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/ui/Screen';
import { ActionButton } from '../../../components/ui/ActionButton';
import { StatusMessage } from '../../../components/ui/StatusMessage';
import { palette } from '../../../constants/palette';
import { getBookSearchErrorMessage, googleBooksService } from '../../../services/googleBooksService';
import type { StudyBook } from '../../../types/studyBook';

type SearchRequest = { term: string; revision: number };

export default function StudyResources() {
  const { topic } = useLocalSearchParams<{ topic?: string }>();
  const initialTopic = typeof topic === 'string' ? topic.trim().slice(0, 80) : '';
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
  }, [request]);

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
      {!request && !error ? <Text style={styles.muted}>Enter a topic to find study books.</Text> : null}
      {request && !loading && !error && books.length === 0 ? (
        <Text style={styles.muted}>No books were found. Try a broader topic.</Text>
      ) : null}
      {!loading && !error ? books.map((book) => (
        <Pressable key={book.id} accessibilityRole="button"
          accessibilityLabel={`View details for ${book.title}`} onPress={() => showBook(book)}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={styles.bookRow}>
            {book.thumbnailUrl ? (
              <Image source={{ uri: book.thumbnailUrl }} style={styles.thumbnail} resizeMode="contain" />
            ) : null}
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.muted}>{book.authors?.length ? book.authors.join(', ') : 'Unknown author'}</Text>
              {book.publishedDate ? <Text style={styles.muted}>Published: {book.publishedDate}</Text> : null}
            </View>
          </View>
          {book.description ? <Text style={styles.description} numberOfLines={3}>{book.description}</Text> : null}
          <Text style={styles.tapHint}>View book details ›</Text>
        </Pressable>
      )) : null}
      <Text style={styles.credit}>Book information provided by Google Books.</Text>

      <Modal visible={selectedBook !== null} animationType="slide" transparent
        onRequestClose={closeBook} statusBarTranslucent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close book details"
              onPress={closeBook} style={styles.closeButton}>
              <Text style={styles.closeText}>✕ Close</Text>
            </Pressable>
            <ScrollView keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalBody}>
              {selectedBook ? (
                <>
                  {selectedBook.thumbnailUrl ? (
                    <Image source={{ uri: selectedBook.thumbnailUrl }}
                      style={styles.cover} resizeMode="contain" />
                  ) : null}
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
                    <ActionButton title="Preview on Google Books" secondary
                      onPress={() => { if (selectedBook.previewLink) void openBook(selectedBook.previewLink); }} />
                  ) : null}
                  <ActionButton title="Open on Google Books"
                    disabled={!selectedBook.infoLink}
                    onPress={() => { if (selectedBook.infoLink) void openBook(selectedBook.infoLink); }} />
                  <Text style={styles.credit}>Reading availability depends on the publisher.</Text>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  pressed: { opacity: 0.75 },
  bookRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  bookInfo: { flex: 1, gap: 6 },
  thumbnail: { width: 76, height: 110, borderRadius: 5, backgroundColor: palette.surfaceRaised },
  bookTitle: { color: palette.text, fontWeight: '800', fontSize: 18 },
  description: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  tapHint: { color: palette.primary, fontSize: 14, fontWeight: '700' },
  credit: { color: palette.muted, fontSize: 12, paddingVertical: 6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'flex-end' },
  modalPanel: { backgroundColor: palette.background, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 18,
    paddingBottom: 24, height: '90%', borderWidth: 1, borderColor: palette.border },
  closeButton: { alignSelf: 'flex-end', paddingVertical: 10, paddingHorizontal: 4 },
  closeText: { color: palette.primary, fontWeight: '700', fontSize: 15 },
  modalBody: { paddingBottom: 28, gap: 14 },
  cover: { width: 140, height: 195, alignSelf: 'center', backgroundColor: palette.surfaceRaised },
  detailTitle: { color: palette.text, fontWeight: '800', fontSize: 24, lineHeight: 30 },
  detailDescription: { color: palette.text, fontSize: 15, lineHeight: 23 },
});
