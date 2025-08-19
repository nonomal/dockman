import {IconButton, Tooltip} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import {ContentCopy} from '@mui/icons-material';

interface CopyButtonProps {
    activeID: string;
    thisID: string;
    handleCopy: (id: string) => void;
    tooltip: string;
}


function CopyButton({handleCopy, activeID, thisID, tooltip}: CopyButtonProps) {
    return (
        <Tooltip
            title={activeID === thisID ? "Copied!" : tooltip}
            placement="top">
            <IconButton
                onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(thisID)
                }}
                size="small"
                sx={{position: 'relative', flexShrink: 0}}
            >
                <CheckIcon
                    fontSize="inherit"
                    sx={{
                        position: 'absolute',
                        opacity: activeID === thisID ? 1 : 0,
                        transition: 'opacity 0.2s',
                        color: 'success.main'
                    }}
                />
                <ContentCopy
                    fontSize="inherit"
                    sx={{
                        opacity: activeID === thisID ? 0 : 1,
                        transition: 'opacity 0.2s',
                    }}
                />
            </IconButton>
        </Tooltip>
    );
};

export default CopyButton;