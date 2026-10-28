import { useEffect, useState, type SubmitEvent } from "react";
import { searchUsers } from "../../services/userSearchService";
import type { UserSearchResult } from "../../types/userSearch";

interface TrackingLinkFormProps {
    onSubmit: (receiverId: number) => Promise<boolean>;
    loading: boolean;
}

function TrackingLinkForm({ onSubmit, loading }: TrackingLinkFormProps) {
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<UserSearchResult | null>(null);
    const [results, setResults] = useState<UserSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (selected || query.trim().length < 2) {
            return;
        }
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setSearching(true);
            setError(null);
            try {
                const users = await searchUsers(query.trim(), controller.signal);
                if (!controller.signal.aborted) {
                    setResults(users);
                }
            } catch {
                if (!controller.signal.aborted) {
                    setResults([]);
                    setError("Could not search for users. Try again.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setSearching(false);
                }
            }
        }, 300);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, selected]);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selected || loading) {
            return;
        }
        if (await onSubmit(selected.id)) {
            setSelected(null);
            setQuery("");
            setResults([]);
            setError(null);
        }
    }

    function handleQueryChange(value: string) {
        setQuery(value);
        setSelected(null);
        setResults([]);
        setError(null);
        setSearching(false);
    }

    return (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/10">
            <p className="text-sm font-medium text-sky-400">Tracking</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-100">Send Tracking Request</h2>
            <p className="mt-1 text-sm text-slate-400">Find a study partner by username or their exact email address.</p>

            <div className="mt-5">
                <label htmlFor="partner-search" className="mb-2 block text-sm font-medium text-slate-300">
                    Study partner
                </label>
                <input
                    id="partner-search"
                    type="search"
                    autoComplete="off"
                    value={query}
                    onChange={(event) => handleQueryChange(event.target.value)}
                    placeholder="Enter a username or email"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                    required
                    minLength={2}
                    maxLength={100}
                />
                {selected ? (
                    <p className="mt-2 text-sm text-emerald-300" role="status">Selected: @{selected.username}</p>
                ) : query.trim().length >= 2 ? (
                    <div className="mt-2 rounded-lg border border-slate-700 bg-slate-950 p-2">
                        {searching && <p className="px-2 py-1 text-sm text-slate-400" role="status">Searching...</p>}
                        {!searching && error && <p className="px-2 py-1 text-sm text-red-300" role="alert">{error}</p>}
                        {!searching && !error && results.length === 0 && (
                            <p className="px-2 py-1 text-sm text-slate-400" role="status">No users found. Try another username.</p>
                        )}
                        {!searching && !error && results.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => {
                                    setSelected(user);
                                    setQuery(user.username);
                                    setResults([]);
                                }}
                                className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-800 focus:bg-slate-800 focus:outline-none"
                            >
                                @{user.username}
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="mt-2 text-xs text-slate-500">Type at least two characters to search.</p>
                )}
            </div>

            <button
                type="submit"
                disabled={loading || !selected}
                className="mt-5 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading ? "Sending..." : "Send Request"}
            </button>
        </form>
    );
}

export default TrackingLinkForm;
