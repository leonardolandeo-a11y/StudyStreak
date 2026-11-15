import { AcademicHeading } from "../components/academic/Academic";
import {
    type FormEvent,
    useEffect,
    useRef,
    useState
} from "react";

import {
    BookOpen,
    ExternalLink,
    Search,
    X
} from "lucide-react";

import {
    useSearchParams
} from "react-router-dom";

import {
    getBookSearchErrorMessage,
    searchStudyBooks
} from "../services/googleBooksService";

import type {
    StudyBook
} from "../types/studyBook";

import LoadingState
    from "../components/ui/LoadingState";

import ErrorMessage
    from "../components/ui/ErrorMessage";

import EmptyState
    from "../components/ui/EmptyState";

type SearchRequest = {
    term:string;
    revision:number;
};

function ResourcesContent({ initialTopic, onSearch }: { initialTopic: string; onSearch: (topic: string) => void }) {
    const [query, setQuery] = useState(initialTopic);

    const [request, setRequest] = useState<SearchRequest | null>(
        initialTopic.length >= 2
            ? { term:initialTopic, revision:0 }
            : null
    );

    const [books, setBooks] = useState<StudyBook[]>([]);
    const [loading, setLoading] = useState(initialTopic.length >= 2);
    const [error, setError] = useState<string | null>(null);
    const [selectedBook, setSelectedBook] = useState<StudyBook | null>(null);
    const details = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (!selectedBook) return;
        const trigger = document.activeElement as HTMLElement | null;
        const dialog = details.current;
        const overflow = document.body.style.overflow;
        dialog?.showModal();
        document.body.style.overflow = "hidden";
        return () => {
            dialog?.close();
            document.body.style.overflow = overflow;
            if (trigger?.isConnected) trigger.focus();
        };
    }, [selectedBook]);

    useEffect(() => {
        if (!request) {
            return;
        }

        const controller = new AbortController();

        async function loadBooks() {
            try {
                setLoading(true);
                setError(null);

                const results = await searchStudyBooks(
                    request!.term,
                    controller.signal
                );

                if (!controller.signal.aborted) {
                    setBooks(results);
                }

            } catch (cause) {
                if (!controller.signal.aborted) {
                    setBooks([]);
                    setError(getBookSearchErrorMessage(cause));
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void loadBooks();

        return () => controller.abort();

    }, [request]);

    function submitSearch(event?:FormEvent) {
        event?.preventDefault();

        if (loading) {
            return;
        }

        const term = query.trim();

        if (term.length < 2 || term.length > 80) {
            setError("Enter between 2 and 80 characters.");
            setBooks([]);
            setRequest(null);
            return;
        }

        if (term !== initialTopic) { onSearch(term); return; }
        setSelectedBook(null);
        setError(null);
        setBooks([]);

        setRequest(previous => ({
            term,
            revision:(previous?.revision ?? 0) + 1
        }));
    }

    return (
        <div className="academic-page academic-module space-y-6">
            <AcademicHeading title="Find study books" eyebrow="Study resources" description="Search Google Books from StudyStreak and find resources related to your goals." glyph="book" />

            <form
                onSubmit={submitSearch}
                className="rounded-2xl border border-outline bg-surface p-5"
            >
                <label
                    htmlFor="book-search"
                    className="text-sm font-medium text-content-secondary"
                >
                    Topic
                </label>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <input
                        id="book-search"
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        maxLength={80}
                        placeholder="Example: differential equations"
                        className="min-w-0 flex-1 rounded-lg border border-outline-strong bg-surface-raised px-4 py-2.5 text-content outline-none placeholder:text-content-muted focus:border-sky-500"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-sky-400 disabled:opacity-50"
                    >
                        <Search size={17} />
                        {loading ? "Searching..." : "Search books"}
                    </button>
                </div>
            </form>

            {loading && (
                <LoadingState message="Searching Google Books..." />
            )}

            {error && (
                <ErrorMessage message={error} />
            )}

            {!request && !loading && !error && (
                <EmptyState message="Enter a study topic to search for books." />
            )}

            {request && !loading && !error && books.length === 0 && (
                <EmptyState message="No books found. Try a broader topic." />
            )}

            {!loading && !error && books.length > 0 && (
                <section>
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-content">
                                Search results
                            </h2>
                            <p className="mt-1 text-sm text-content-muted">
                                Select a book to view more details.
                            </p>
                        </div>

                        <span className="rounded-full border border-outline bg-surface px-3 py-1 text-xs font-medium text-content-muted">
                            {books.length} results
                        </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {books.map(book => (
                            <button
                                key={book.id}
                                type="button"
                                onClick={() => setSelectedBook(book)}
                                className="rounded-2xl border border-outline bg-surface p-5 text-left transition hover:-translate-y-0.5 hover:border-outline-strong hover:bg-surface"
                            >
                                <div className="flex gap-4">
                                    {book.thumbnailUrl ? (
                                        <img
                                            src={book.thumbnailUrl}
                                            alt="" loading="lazy" decoding="async"
                                            className="h-32 w-24 shrink-0 rounded-lg bg-surface-raised object-contain"
                                        />
                                    ) : (
                                        <div className="flex h-32 w-24 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-content-muted">
                                            <BookOpen size={28} />
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        <h3 className="line-clamp-3 font-semibold text-content">
                                            {book.title}
                                        </h3>
                                        <p className="mt-2 line-clamp-2 text-sm text-content-muted">
                                            {book.authors.length
                                                ? book.authors.join(", ")
                                                : "Unknown author"}
                                        </p>
                                        {book.publishedDate && (
                                            <p className="mt-2 text-xs text-slate-500">
                                                {book.publishedDate}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {selectedBook && (
                <dialog
                    ref={details}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="book-details-title"
                    className="book-details-dialog m-auto max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-2xl border-0 bg-surface-raised p-0 text-content backdrop:bg-black/70"
                    onCancel={event => { event.preventDefault(); setSelectedBook(null); }}
                    onClick={event => { if (event.target === event.currentTarget) setSelectedBook(null); }}
                >
                    <article
                        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-outline-strong bg-surface-raised p-6 shadow-2xl"
                        onClick={event => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-sky-400">
                                    Google Books
                                </p>
                                <h2
                                    id="book-details-title"
                                    className="mt-2 text-2xl font-bold text-content"
                                >
                                    {selectedBook.title}
                                </h2>
                            </div>

                            <button
                                type="button"
                                aria-label="Close book details"
                                onClick={() => setSelectedBook(null)}
                                className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-outline-strong text-content-muted hover:bg-surface-hover hover:text-content"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-6 grid gap-6 sm:grid-cols-[140px_1fr]">
                            {selectedBook.thumbnailUrl ? (
                                <img
                                    src={selectedBook.thumbnailUrl}
                                    alt=""
                                    className="w-full rounded-xl bg-surface object-contain"
                                />
                            ) : (
                                <div className="flex h-48 items-center justify-center rounded-xl bg-surface text-content-muted">
                                    <BookOpen size={36} />
                                </div>
                            )}

                            <div className="space-y-3 text-sm text-content-secondary">
                                <p>
                                    <span className="font-medium text-slate-500">Authors:</span>{" "}
                                    {selectedBook.authors.length
                                        ? selectedBook.authors.join(", ")
                                        : "Unknown"}
                                </p>

                                {selectedBook.publisher && (
                                    <p>
                                        <span className="font-medium text-slate-500">Publisher:</span>{" "}
                                        {selectedBook.publisher}
                                    </p>
                                )}

                                {selectedBook.publishedDate && (
                                    <p>
                                        <span className="font-medium text-slate-500">Published:</span>{" "}
                                        {selectedBook.publishedDate}
                                    </p>
                                )}

                                {selectedBook.pageCount && (
                                    <p>
                                        <span className="font-medium text-slate-500">Pages:</span>{" "}
                                        {selectedBook.pageCount}
                                    </p>
                                )}

                                {selectedBook.categories.length > 0 && (
                                    <p>
                                        <span className="font-medium text-slate-500">Categories:</span>{" "}
                                        {selectedBook.categories.join(", ")}
                                    </p>
                                )}
                            </div>
                        </div>

                        <p className="mt-6 whitespace-pre-wrap leading-7 text-content-secondary">
                            {selectedBook.description ??
                                "No description is available for this book."}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            {selectedBook.previewLink && (
                                <a
                                    href={selectedBook.previewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-on-accent hover:bg-sky-400"
                                >
                                    Preview book
                                    <ExternalLink size={16} />
                                </a>
                            )}

                            {selectedBook.infoLink && (
                                <a
                                    href={selectedBook.infoLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg border border-outline-strong px-4 py-2 text-sm font-medium text-content-secondary hover:bg-surface-hover"
                                >
                                    Open on Google Books
                                    <ExternalLink size={16} />
                                </a>
                            )}
                        </div>
                    </article>
                </dialog>
            )}
        </div>
    );
}

// Recreate the search state when URL topic changes, including navigation to /resources.
function Resources() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTopic = (searchParams.get("topic") ?? "").trim().slice(0, 80);
    const updateTopic = (topic: string) => setSearchParams(current => { const next = new URLSearchParams(current); next.set("topic", topic); return next; });
    return <ResourcesContent key={initialTopic} initialTopic={initialTopic} onSearch={updateTopic} />;
}

export default Resources;
