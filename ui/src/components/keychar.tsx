import React from "react";
import {Typography} from "@mui/material";

export const KeyChar = (props: { children: React.ReactNode }) => (
    <Typography
        component="kbd"
        sx={{
            px: 0.75,
            py: 0.25,
            border: (theme) => `1px solid ${theme.palette.action.disabled}`,
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            lineHeight: '1rem',
        }}
    >
        {props.children}
    </Typography>
);
