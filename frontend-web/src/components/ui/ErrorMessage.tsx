interface ErrorMessageProps{
    message? : string;
}

function ErrorMessage({message}:ErrorMessageProps){
    return (
        <p className="p-6">
            {message}
        </p>
    )
}
export default ErrorMessage;