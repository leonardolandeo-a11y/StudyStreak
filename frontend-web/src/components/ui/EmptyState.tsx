interface EmptyStateProps{
    message:string;
}

function EmptyState( {message}:EmptyStateProps){
    return (
        <p className="p-6">
            {message}
        </p>
    );
}
export default EmptyState;