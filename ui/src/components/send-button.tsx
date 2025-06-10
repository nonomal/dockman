import * as React from "react";
import {useEffect, useState} from "react";

// A simple spinner SVG component
const Spinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
         viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

type ActionStatus = "success" | "error";

interface PopupProps {
    status: ActionStatus | undefined;
    message: string | undefined;
    onClose: () => void;
}

// Popup component to show success or failure messages
const Popup = ({status, message, onClose}: PopupProps) => {
    useEffect(() => {
        // Automatically close the popup after 3 seconds
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        // Cleanup the timer if the component unmounts or status changes
        return () => clearTimeout(timer);
    }, [onClose]);

    if (!status) return null;

    const isSuccess = status === 'success';
    const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500';
    const icon = isSuccess ? (
        // Success Icon (Checkmark)
        <svg className="w-6 h-6 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"
             xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
    ) : (
        // Failure Icon (X)
        <svg className="w-6 h-6 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"
             xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
    );

    return (
        <div className="fixed top-5 right-5 animate-fade-in-down">
            <div className={`flex items-center ${bgColor} text-white text-sm font-bold px-4 py-3 rounded-lg shadow-lg`}
                 role="alert">
                {icon}
                <p>{message}</p>
            </div>
        </div>
    );
};

interface AsyncButtonProps extends React.PropsWithChildren {
    actionFunc: () => Promise<string>
    onSuccessMessage: string
}

interface ActionResult {
    status: ActionStatus;
    message: string;
}

export const AsyncButton = ({actionFunc, onSuccessMessage, children}: AsyncButtonProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ActionResult | null>(null);

    const handleClick = async () => {
        setIsLoading(true);
        setResult(null);
        const err = await actionFunc()
        if (err) {
            setResult({status: 'error', message: err || 'An unknown error occurred.'});
        }
        setResult({status: 'success', message: onSuccessMessage});

        setIsLoading(false);
    };

    return (
        <>
            <button
                onClick={handleClick}
                disabled={isLoading}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
                {isLoading ? <Spinner/> : null}
                {isLoading ? 'Processing...' : children}
            </button>
            <Popup
                status={result?.status}
                message={result?.message}
                onClose={() => setResult(null)}
            />
        </>
    );
};
