import {
    type FormEvent,
    useEffect,
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

function ResourcesContent({ initialTopic }: { initialTopic: string }) {
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

        setSelectedBook(null);
        setError(null);
        setBooks([]);

        setRequest(previous => ({
            term,
            revision:(previous?.revision ?? 0) + 1
        }));
    }

    return (
        <div className="space-y-8">
            <header>
                <p className="text-sm font-medium text-sky-400">
                    Study resources
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">
                    Find study books
                </h1>

                <p className="mt-2 max-w-2xl text-slate-400">
                    Search Google Books from StudyStreak and find resources related to your goals.
                </p>
            </header>

            <form
                onSubmit={submitSearch}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
            >
                <label
                    htmlFor="book-search"
                    className="text-sm font-medium text-slate-300"
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
                        className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-500"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50"
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
                            <h2 className="text-xl font-semibold text-slate-100">
                                Search results
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Select a book to view more details.
                            </p>
                        </div>

                        <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-400">
                            {books.length} results
                        </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {books.map(book => (
                            <button
                                key={book.id}
                                type="button"
                                onClick={() => setSelectedBook(book)}
                                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900"
                            >
                                <div className="flex gap-4">
                                    {book.thumbnailUrl ? (
                                        <img
                                            src={book.thumbnailUrl}
                                            alt=""
                                            className="h-32 w-24 shrink-0 rounded-lg bg-slate-950 object-contain"
                                        />
                                    ) : (
                                        <div className="flex h-32 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-slate-600">
                                            <BookOpen size={28} />
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        <h3 className="line-clamp-3 font-semibold text-slate-100">
                                            {book.title}
                                        </h3>
                                        <p className="mt-2 line-clamp-2 text-sm text-slate-400">
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
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={() => setSelectedBook(null)}
                >
                    <article
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="book-details-title"
                        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl"
                        onClick={event => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-sky-400">
                                    Google Books
                                </p>
                                <h2
                                    id="book-details-title"
                                    className="mt-2 text-2xl font-bold text-slate-100"
                                >
                                    {selectedBook.title}
                                </h2>
                            </div>

                            <button
                                type="button"
                                aria-label="Close book details"
                                onClick={() => setSelectedBook(null)}
                                className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-6 grid gap-6 sm:grid-cols-[140px_1fr]">
                            {selectedBook.thumbnailUrl ? (
                                <img
                                    src={selectedBook.thumbnailUrl}
                                    alt=""
                                    className="w-full rounded-xl bg-slate-900 object-contain"
                                />
                            ) : (
                                <div className="flex h-48 items-center justify-center rounded-xl bg-slate-900 text-slate-600">
                                    <BookOpen size={36} />
                                </div>
                            )}

                            <div className="space-y-3 text-sm text-slate-300">
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

                        <p className="mt-6 whitespace-pre-wrap leading-7 text-slate-300">
                            {selectedBook.description ??
                                "No description is available for this book."}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            {selectedBook.previewLink && (
                                <a
                                    href={selectedBook.previewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
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
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
                                >
                                    Open on Google Books
                                    <ExternalLink size={16} />
                                </a>
                            )}
                        </div>
                    </article>
                </div>
            )}
        </div>
    );
}

// Recreate the search state when URL topic changes, including navigation to /resources.
function Resources() {
    const [searchParams] = useSearchParams();
    const initialTopic = (searchParams.get("topic") ?? "").trim().slice(0, 80);
    return <ResourcesContent key={initialTopic} initialTopic={initialTopic} />;
}

export default Resources;
