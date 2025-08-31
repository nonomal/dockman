import {useCallback, useEffect, useRef, useState} from 'react';

interface WebSocketOptions {
    onOpen?: (event: WebSocketEventMap['open']) => void;
    onClose?: (event: WebSocketEventMap['close']) => void;
    onMessage?: (message: any, event: WebSocketEventMap['message']) => void;
    onError?: (event: WebSocketEventMap['error']) => void;
    shouldReconnect?: boolean;
    reconnectAttempts?: number;
    reconnectInterval?: number;
}

interface WebSocketHook {
    socket: WebSocket | null;
    lastMessage: any | null;
    readyState: number;
    connectionStatus: string;
    sendMessage: (message: any) => boolean;
    reconnect: () => void;
    disconnect: () => void;
}

const useWebSocket = (url: string, options: WebSocketOptions = {}): WebSocketHook => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [lastMessage, setLastMessage] = useState<any | null>(null);
    const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
    const [connectionStatus, setConnectionStatus] = useState<string>('Connecting');

    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<any | null>(null);
    const reconnectAttemptsRef = useRef<number>(0);

    const {
        onOpen,
        onClose,
        onMessage,
        onError,
        shouldReconnect = true,
        reconnectAttempts = 5,
        reconnectInterval = 3000,
    } = options;

    // Map WebSocket ready states to human-readable strings
    const connectionStatusMap: { [key: number]: string } = {
        [WebSocket.CONNECTING]: 'Connecting',
        [WebSocket.OPEN]: 'Open',
        [WebSocket.CLOSING]: 'Closing',
        [WebSocket.CLOSED]: 'Closed',
    };

    const connect = useCallback(() => {
        try {
            const ws = new WebSocket(url);
            socketRef.current = ws;
            setSocket(ws);

            ws.onopen = (event) => {
                setReadyState(WebSocket.OPEN);
                setConnectionStatus(connectionStatusMap[WebSocket.OPEN]);
                reconnectAttemptsRef.current = 0;
                if (onOpen) onOpen(event);
            };

            ws.onclose = (event) => {
                setReadyState(WebSocket.CLOSED);
                setConnectionStatus(connectionStatusMap[WebSocket.CLOSED]);
                socketRef.current = null;
                setSocket(null);

                if (onClose) onClose(event);

                // Handle reconnection
                if (shouldReconnect && reconnectAttemptsRef.current < reconnectAttempts) {
                    reconnectAttemptsRef.current++;
                    setConnectionStatus(`Reconnecting... (${reconnectAttemptsRef.current}/${reconnectAttempts})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, reconnectInterval);
                }
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                setLastMessage(message);
                if (onMessage) onMessage(message, event);
            };

            ws.onerror = (event) => {
                setConnectionStatus('Error');
                if (onError) onError(event);
            };

        } catch (error) {
            console.error('WebSocket connection error:', error);
            setConnectionStatus('Error');
        }
    }, [url, onOpen, onClose, onMessage, onError, shouldReconnect, reconnectAttempts, reconnectInterval, connectionStatusMap]);

    // Send message function
    const sendMessage = useCallback((message: any): boolean => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(message));
            return true;
        }
        console.warn('WebSocket is not open. Unable to send message:', message);
        return false;
    }, []);

    // Manual reconnect function
    const reconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectAttemptsRef.current = 0;
        connect();
    }, [connect]);

    // Close connection function
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (socketRef.current) {
            socketRef.current.close();
        }
    }, []);

    // Initialize connection
    useEffect(() => {
        connect();

        // Cleanup on unmount
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [connect]);

    return {
        socket,
        lastMessage,
        readyState,
        connectionStatus,
        sendMessage,
        reconnect,
        disconnect,
    };
};

export default useWebSocket;