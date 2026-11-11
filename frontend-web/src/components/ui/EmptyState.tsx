import { AcademicEmpty } from '../academic/Academic';
interface EmptyStateProps { message: string; }
function EmptyState({ message }: EmptyStateProps) {
    return <div className="rounded-control border border-dashed border-outline-strong bg-surface px-4 py-3 text-sm text-content-muted break-words">
        <AcademicEmpty>{message}</AcademicEmpty>
    </div>;
}
export default EmptyState;
