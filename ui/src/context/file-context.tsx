import {type ReactNode, useCallback, useEffect, useState} from 'react'
import {useLocation, useNavigate} from 'react-router-dom'
import {callRPC, useClient} from "../lib/api.ts";
import {type FileGroup, FilesContext, type FilesContextType} from "../hooks/files.ts";
import {useHost} from "../hooks/host.ts";
import {useSnackbar} from "../hooks/snackbar.ts";
import {type DockmanYaml, FileService} from '../gen/files/v1/files_pb.ts';

export function FilesProvider({children}: { children: ReactNode }) {
    const navigate = useNavigate()
    const client = useClient(FileService)
    const {showError, showSuccess} = useSnackbar()
    const {selectedHost} = useHost()
    const location = useLocation()

    const [files, setFiles] = useState<FileGroup[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [dockmanYaml, setDockmanYaml] = useState<DockmanYaml | null>(null)

    const fetchDockmanYaml = async () => {
        const {val, err} = await callRPC(() => client.getDockmanYaml({}))
        if (err) {
            console.error("dockman yaml:", err)
            showError(err)
            setDockmanYaml(null)
        } else {
            setDockmanYaml(val)
        }
    }

    const fetchFiles = useCallback(async () => {
        setIsLoading(true)

        const {val, err} = await callRPC(() => client.list({}))
        if (err) {
            showError(err)
            setFiles([])
        } else if (val) {
            const res = val.groups.map<FileGroup>(group => ({
                name: group.root,
                children: [...group.subFiles]
            }))
            setFiles([...res])
        }

        await fetchDockmanYaml()

        setIsLoading(false)
    }, [client, selectedHost])

    const addFile = useCallback(async (filename: string, parent: string) => {
        if (parent) {
            filename = `${parent}/${filename}`
        }
        console.log("Creating new file...", filename)

        const {err} = await callRPC(() => client.create({filename}))
        if (err) {
            showError(`Error saving file: ${err}`)
            return
        } else {
            showSuccess(`${filename} created.`)
            navigate(`/stacks/${filename}`)
        }

        await fetchFiles()
    }, [client, fetchFiles, navigate])

    const deleteFile = useCallback(async (filename: string) => {
        const {err} = await callRPC(() => client.delete({filename}))
        if (err) {
            showError(`Error deleting file: ${err}`)
        } else {
            showSuccess(`${filename} deleted.`)
            const currentPath = location.pathname
            if (currentPath === `/stacks/${filename}`) {
                // If the user is currently viewing the deleted file, navigate away
                navigate('/stacks')
            }
        }

        await fetchFiles()
    }, [client, fetchFiles, location.pathname, navigate])

    const renameFile = async (oldFilename: string, newFileName: string) => {
        const {err} = await callRPC(() => client.rename({
            oldFilePath: oldFilename,
            newFilePath: newFileName
        }))
        if (err) {
            showError(`Error renaming file: ${err}`)
        } else {
            showSuccess(`${oldFilename} renamed to ${newFileName}`)
            const currentPath = location.pathname
            if (currentPath === `/stacks/${oldFilename}`) {
                // If the user is currently viewing the renamed file, navigate to renamed file
                navigate(`/stacks/${newFileName}`)
            }
        }

        await fetchFiles()
    }

    useEffect(() => {
        fetchFiles().then()
    }, [fetchFiles])

    const value: FilesContextType = {
        files,
        isLoading,
        addFile,
        deleteFile,
        renameFile,
        refetch: fetchFiles,
        dockmanYaml,
    }

    return (
        <FilesContext.Provider value={value}>
            {children}
        </FilesContext.Provider>
    )
}
