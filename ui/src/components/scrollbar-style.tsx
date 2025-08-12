const scrollbarStyles = {
    '&::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
    },
    '&::-webkit-scrollbar-track': {
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
        background: 'rgba(255, 255, 255, 0.3)',
        borderRadius: '4px',
        '&:hover': {
            background: 'rgba(255, 255, 255, 0.5)',

        }
    },
    '&::-webkit-scrollbar-corner': {
        background: 'transparent',
    },
    // Firefox scrollbar styling
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1)',

};

export default scrollbarStyles;