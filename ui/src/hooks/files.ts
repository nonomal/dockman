import {useCallback, useEffect, useState} from 'react';
import {callRPC, useClient} from '../lib/api';
import {FileService} from '../gen/files/v1/files_pb';
import {useSnackbar} from './snackbar.ts';
import {useLocation, useNavigate} from 'react-router-dom';
import {useHost} from "./host.ts";

export interface FileGroup {
    name: string;
    children: string[];
}

export function useFiles() {
    const navigate = useNavigate();
    const client = useClient(FileService);
    const {showError, showSuccess} = useSnackbar();
    const {selectedHost} = useHost();
    const location = useLocation();

    const [files, setFiles] = useState<FileGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFiles = useCallback(async () => {
        console.log("Fetching files...");

        setIsLoading(true);
        const {val, err} = await callRPC(() => client.list({}));
        console.log("Calling api...");
        if (err) {
            showError(err);
            setFiles([]);
        } else if (val) {
            const res = val.groups.map<FileGroup>(group => ({
                name: group.root,
                children: [...group.subFiles]
            }));
            setFiles(res);
        }
        setIsLoading(false);
    }, [client, selectedHost, showError]);

    const addFile = useCallback(async (filename: string, parent: string) => {
        if (parent) {
            filename = `${parent}/${filename}`;
        }
        console.log("Creating new file...", filename);

        const {err} = await callRPC(() => client.create({filename}));
        if (err) {
            showError(`Error saving file: ${err}`);
        } else {
            showSuccess(`${filename} created.`);
            await fetchFiles();
            navigate(`/files/${filename}`);
        }
    }, [client, fetchFiles, navigate]);

    const deleteFile = useCallback(async (filename: string) => {
        const currentPath = location.pathname;

        const {err} = await callRPC(() => client.delete({filename}));
        if (err) {
            showError(`Error deleting file: ${err}`);
        } else {
            showSuccess(`${filename} deleted.`);
            await fetchFiles(); // Refetch after successful deletion
            if (currentPath == `/files/${filename}`) {
                // If the user is currently viewing the deleted file, navigate away
                navigate('/files');
            }
        }
    }, [client, fetchFiles, location.pathname, navigate]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    return {files, isLoading, addFile, deleteFile, refetch: fetchFiles};
}
