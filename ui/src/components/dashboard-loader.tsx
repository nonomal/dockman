import {type FC, useEffect, useState} from 'react';
import {Box, Fade, type SxProps, Typography} from '@mui/material';
import type {Theme} from '@mui/material/styles';

const defaultMessages = [
    'Sometimes science is more art than science.',
    'Generating witty dialog...',
    'Swapping time and space...',
    'Spinning up the hamster...',
    'Shoveling coal...',
    'Definitely not mining crypto...',
    'KEEP SUMMER SAFE',
    'you fucked with squirrels morty...',
];

interface EntertainingLoaderProps {
    /** An array of strings to cycle through. */
    messages?: string[];
    /** The time in milliseconds between each message change. */
    intervalDuration?: number;
    /** MUI's sx prop for custom styling. */
    sx?: SxProps<Theme>;
}


function getRandomIndex(len: number) {
    return Math.floor(Math.random() * len);
}

const EntertainingLoader: FC<EntertainingLoaderProps> = ({
                                                             messages = defaultMessages,
                                                             intervalDuration = 900,
                                                             sx,
                                                         }) => {
    const [messageIndex, setMessageIndex] = useState(
        // Start with a random message right away
        getRandomIndex(messages.length)
    );

    useEffect(() => {
        const interval = setInterval(() => {
            // On each tick, just pick a new random index. No need to check the previous one.
            const nextIndex = getRandomIndex(messages.length);
            setMessageIndex(nextIndex);
        }, intervalDuration);


        return () => clearInterval(interval);
    }, [messages.length, intervalDuration]); // Effect dependencies are typed and safe

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                p: 3,
                ...sx,
            }}
        >
            {/*<CircularProgress/>*/}
            <Box sx={{mt: 2, height: '24px', textAlign: 'center'}}>
                <Fade in={true} key={messageIndex}>
                    <Typography variant="h6" color="text.secondary">
                        {messages[messageIndex]}
                    </Typography>
                </Fade>
            </Box>
        </Box>
    );
};

export default EntertainingLoader;