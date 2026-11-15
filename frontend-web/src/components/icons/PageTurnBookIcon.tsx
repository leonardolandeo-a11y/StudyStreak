import { BookOpen, type LucideProps } from "lucide-react";

/** Keep the original book outline; only the additional leaf turns around its spine. */
export function PageTurnBookIcon(props: LucideProps) {
    return <BookOpen {...props}>
        <path className="sidebar-resource-page" d="M12 5a5 5 0 0 1 4-2h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4a5 5 0 0 0-4 2Z" />
    </BookOpen>;
}
