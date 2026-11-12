import { UserRoundPlus } from "lucide-react";
import { TrackingAvatar } from "./TrackingAvatar";
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
        <form onSubmit={handleSubmit} className="tracking-search">
            <h2 className="sr-only">Send Tracking Request</h2>

            <div className="min-w-0">
                <label htmlFor="partner-search" className="sr-only">
                    Study partner
                </label>
                <input
                    id="partner-search"
                    type="search"
                    autoComplete="off"
                    value={query}
                    onChange={(event) => handleQueryChange(event.target.value)}
                    placeholder="Search partner by username or email"
                    className="w-full rounded-lg border border-outline-strong bg-slate-950 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                    required
                    minLength={2}
                    maxLength={100}
                />
                {selected ? (
                    <div className="mt-3 flex min-w-0 items-center gap-3 rounded-control bg-accent-soft p-3" role="status"><TrackingAvatar id={selected.id} name={selected.username} /><p className="min-w-0 truncate text-sm text-accent" title={selected.username}>Selected: @{selected.username}</p></div>
                ) : query.trim().length >= 2 ? (
                    <div className="mt-2 rounded-lg border border-outline-strong bg-slate-950 p-2">
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
                                className="flex min-h-14 w-full min-w-0 items-center gap-3 rounded-control px-3 py-2 text-left text-sm text-content hover:bg-surface-hover focus-visible:bg-surface-hover"
                            >
                                <TrackingAvatar id={user.id} name={user.username} /><span className="min-w-0 truncate font-medium" title={user.username}>@{user.username}</span>
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
                className="study-button tracking-send bg-accent text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
                <UserRoundPlus size={18} aria-hidden="true"/>{loading ? "Sending..." : "Send Request"}
            </button>
        </form>
    );
}

export default TrackingLinkForm;
