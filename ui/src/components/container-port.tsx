import {Box, Link, Tooltip} from '@mui/material';
import {type Port} from "../gen/docker/v1/docker_pb.ts";

interface PortMappingProps {
    port: Port;
}

export const ContainerPort = ({port}: PortMappingProps) => {
    const {host, public: publicPort, private: privatePort, type} = port;
    return (
        <>
            {publicPort && (
                <>
                    <Tooltip title="Public Port: open in new tab" arrow>
                        <Link
                            href={`http://${host || 'localhost'}:${publicPort}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{color: 'info.main', textDecoration: 'none', '&:hover': {textDecoration: 'underline'}}}
                        >
                            {host || 'localhost'}:{publicPort}
                        </Link>
                    </Tooltip>
                    {' → '}
                </>
            )}
            <Tooltip title="Internal container port" arrow>
                <Box component="span" sx={{color: 'success.main', cursor: 'help'}}>
                    {privatePort}/{type}
                </Box>
            </Tooltip>
        </>
    );
};
