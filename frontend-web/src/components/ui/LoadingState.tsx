interface LoadingStateProps{
    message?:string;
}
function LoadingState({message}:LoadingStateProps){
    return (
        <p className="p-6">
            {message}
        </p>
    )
}
export default LoadingState;