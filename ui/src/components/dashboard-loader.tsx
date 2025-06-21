import {type FC, useEffect, useState} from 'react';
import {Box, Fade, type SxProps, Typography} from '@mui/material';
import type {Theme} from '@mui/material/styles';

const defaultMessages = [
    'Sometimes science is more art than science.',
    'Generating witty dialog...',
    'Nothing is true, everything is permitted',
    'Swapping time and space...',
    'Spinning up the hamster...',
    'Shoveling coal...',
    'Definitely not mining crypto...',
    'KEEP SUMMER SAFE',
    'You fucked with squirrels morty...',
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
                                                             intervalDuration = 1200,
                                                             sx,
                                                         }) => {

    const [messageIndex, setMessageIndex] = useState(getRandomIndex(messages.length));

    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = getRandomIndex(messages.length);
            setMessageIndex(nextIndex);
        }, intervalDuration);


        return () => clearInterval(interval);
    }, [messages.length, intervalDuration]);

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
            <Box sx={{mt: 2, height: '24px', textAlign: 'center'}}>
                <Fade in={true} key={messageIndex}>
                    <Typography
                        variant="h4"
                        sx={{
                            ...shimmerAnimation,
                            color: 'rgba(255, 255, 255, 0.5)',
                            backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.2) 100%)',
                            backgroundSize: '200% auto',
                            backgroundClip: 'text',
                            textFillColor: 'transparent',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            animation: 'shimmer 6s linear infinite',
                        }}
                    >
                        {messages[messageIndex]}
                    </Typography>
                </Fade>
            </Box>
        </Box>
    );
};

const shimmerAnimation = {
    '@keyframes shimmer': {
        '0%': {
            backgroundPosition: '-200% 0',
        },
        '100%': {
            backgroundPosition: '200% 0',
        },
    },
};

export default EntertainingLoader;