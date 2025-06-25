import {useState} from 'react';
import {useSnackbar} from './snackbar.ts';
import {type ComposeActionResponse} from '../gen/docker/v1/docker_pb.ts';
import {ConnectError} from '@connectrpc/connect';

export function useDockerActions() {
    const {showSuccess} = useSnackbar();
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string>('');
    const [actionLogStream, setActionLogStream] = useState<AsyncIterable<ComposeActionResponse> | null>(null);
    const [logTitle, setLogTitle] = useState('');

    const performAction = async (
        actionName: string,
        actionFn: () => AsyncIterable<ComposeActionResponse>,
        successMessage: string,
        pageName: string
    ) => {
        setActiveAction(actionName);
        setActionError('');
        setLogTitle(`${actionName} - ${pageName}`);
        setActionLogStream(null); // Clear previous stream

        const stream = actionFn();
        setActionLogStream(stream); // Set the new stream to open the panel

        try {
            // Await the stream completion to show success/error messages
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for await (const _ of stream) {
                // We just need to consume the stream
            }
            showSuccess(`Deployment ${successMessage} successfully!`);
        } catch (error: unknown) {
            const errorMessage = error instanceof ConnectError
                ? `Failed to ${actionName} deployment\n${error.code} ${error.name}: ${error.message}`
                : `Failed to ${actionName} deployment\nUnknown Error: ${(error as Error).toString()}`;
            setActionError(errorMessage);
        } finally {
            setActiveAction(null);
        }
    };

    const clearActionError = () => setActionError('');

    return {
        activeAction,
        actionError,
        actionLogStream,
        logTitle,
        setActionError,
        performAction,
        clearActionError,
        setActionLogStream, // Allow parent to override stream for individual logs
        setLogTitle,      // Allow parent to set title for individual logs
    };
}