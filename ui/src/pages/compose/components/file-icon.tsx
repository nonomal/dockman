import React from 'react';
import {Description} from '@mui/icons-material';
import {blue} from "@mui/material/colors";

interface SvgFromUrlProps {
    url: string;
    size?: number;
}

const SvgFromUrl: React.FC<SvgFromUrlProps> = ({url, size = 25}) => {
    return (
        <img
            src={url}
            alt="SVG from URL"
            width={size}
            height={size}
            style={{fill: 'currentColor'}} // Note: Styling is limited
        />
    );
};

const DockerComposeIcon = () => (
    <SvgFromUrl url={'/docker.svg'}/>
);

const YamlIcon = () => (
    <SvgFromUrl url={'/yaml.png'} />
);

const EnvIcon = () => (
    <SvgFromUrl url={'/env.png'}/>
);

const GitignoreIcon = () => (
    <SvgFromUrl url={'/git.svg'}/>
);

const DefaultFileIcon = () => (
    <Description sx={{color: blue[200]}}/>
);
export const DockerFolderIcon = () => (
    <SvgFromUrl url={'/docker-folder.svg'}/>
);


interface FileIconProps {
    filename: string;
}

const FileIcon: React.FC<FileIconProps> = ({filename}) => {
    if (filename.endsWith('compose.yaml') || filename.endsWith('compose.yml') ) {
        return <DockerComposeIcon/>;
    }
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
        return <YamlIcon/>;
    }
    if (filename.endsWith('.env')) {
        return <EnvIcon/>;
    }
    if (filename.endsWith('.gitignore')) {
        return <GitignoreIcon/>;
    }
    return <DefaultFileIcon/>;
};

export default FileIcon;