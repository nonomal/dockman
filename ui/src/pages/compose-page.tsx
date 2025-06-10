import {useEffect, useState} from "react";
import {ChevronDown, ChevronRight, FileText, Plus, Trash2} from 'lucide-react';
import {YamlEditor} from "../components/editor.tsx";
import {callRPC, downloadFile, uploadFile, useClient} from "../lib/api.ts";
import {ComposeService, type FileGroup} from "../gen/compose/v1/compose_pb.ts"
import {AddFileButton} from "../components/button-popup.tsx";
import {AsyncButton} from "../components/send-button.tsx";

export const ComposePage = () => {
    const [files, setFiles] = useState<FileGroup[]>([]);
    const [selectedFile, setSelectedFile] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const composeClient = useClient(ComposeService)

    async function fetchData() {
        const {val, err} = await callRPC(() => composeClient.list({}))
        console.log("calling fetchData");
        if (err) {
            setError(err)
        } else {
            setFiles(val?.groups ?? [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData();
    }, []);

    const addRootFile = async (filename: string) => {
        await composeClient.create({file: {filename: filename}, parent: ""})
        fetchData()
    };

    const addSubFile = async () => {
        return ""
    };

    const deleteFile = (fileId: string, parentId: string | null = null) => {
        console.log(`Deleting file ${fileId} with id ${parentId}`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-57px)] bg-blue-950 text-white">
                {/* Spinner */}
                <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-3 text-lg font-medium">Fetching files...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-57px)] bg-blue-950 p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="mt-3 text-xl font-semibold text-red-700">Error loading files</p>
                <p className="mt-1 text-center text-md text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-57px)]">
            <FileSidebar
                files={files}
                addRootFile={addRootFile}
                addSubFile={addSubFile}
                deleteFile={deleteFile}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
            />
            <FileContent filename={selectedFile}/>
        </div>
    );
};

// File Sidebar Component
const FileSidebar = (
    {
        files,
        addRootFile,
        addSubFile,
        deleteFile,
        selectedFile,
        setSelectedFile,
    }: {
        files: FileGroup[];
        addRootFile: any;
        addSubFile: any;
        deleteFile: any;
        selectedFile: any;
        setSelectedFile: any;
    }) => {
    return (
        <div className="w-1/4 max-w-xs bg-gray-800/60 border-r border-gray-700 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Files</h2>
                <button
                    onClick={addRootFile}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                    aria-label="Add new file"
                >
                    <Plus size={18}/>
                </button>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                {files.map(file => (
                    <FileItem
                        key={file.root}
                        filename={file.root}
                        children={file.subFiles}
                        addSubFile={addSubFile}
                        deleteFile={deleteFile}
                        selectedFile={selectedFile}
                        setSelectedFile={setSelectedFile}
                    />
                ))}
            </div>
        </div>
    );
};

// Single File Item Component
const FileItem = (
    {
        filename,
        children,
        addSubFile,
        deleteFile,
        selectedFile,
        setSelectedFile
    }: {
        filename: string;
        children: string[];
        addSubFile: (filename: string) => Promise<string>;
        deleteFile: any;
        selectedFile: any;
        setSelectedFile: any;
    }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const isSelected = selectedFile?.name === filename;
    const isRoot = children.length === 0

    return (
        <div>
            <div
                className={`flex items-center justify-between group p-2 rounded-md cursor-pointer mb-1 transition-colors ${
                    isSelected ? 'bg-purple-600/30' : 'hover:bg-gray-700'
                }`}
            >
                <div className="flex items-center flex-grow" onClick={() => setSelectedFile(filename)}>
                    {children.length > 0 && (
                        <button onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded)
                        }} className="mr-1 p-0.5 rounded hover:bg-gray-600">
                            {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                        </button>
                    )}
                    <FileText size={16} className={`mr-2 ${isRoot ? '' : 'ml-4'}`}/>
                    <span className="truncate flex-1 text-sm">{filename}</span>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isRoot && (
                        <AddFileButton onSubmit={addSubFile} file={filename} isSubfile={isRoot}/>
                    )}
                    <button
                        onClick={() => deleteFile(filename, isRoot ? null : filename)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        aria-label="Delete file"
                    >
                        <Trash2 size={14}/>
                    </button>
                </div>
            </div>
            {isRoot && isExpanded && children.length > 0 && (
                <div className="pl-4 border-l border-gray-600 ml-2">
                    {children.map(subFile => (
                        <FileItem
                            key={subFile}
                            filename={subFile}
                            children={[]}
                            addSubFile={addSubFile}
                            deleteFile={deleteFile}
                            selectedFile={selectedFile}
                            setSelectedFile={setSelectedFile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


// File Content Display
const FileContent = (
    {filename}: { filename: string }
) => {
    if (!filename) {
        return (
            <div className="flex-grow p-8 flex items-center justify-center text-gray-500">
                <div className="text-center">
                    <FileText size={48} className="mx-auto mb-4"/>
                    <h2 className="text-xl">No file selected</h2>
                    <p>Select a file from the sidebar to view its content or create a new file.</p>
                </div>
            </div>
        );
    }

    let [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("")
    let saveContent = ""

    useEffect(
        () => {
            async function fetchContents() {
                const {file, err} = await downloadFile(filename)
                if (err) {
                    setError(err)
                } else {
                    setContent(file)
                }
                
                setLoading(false)
            }

            fetchContents();
        }
    )

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-57px)] bg-blue-950 text-white">
                <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-3 text-lg font-medium">Fetching files...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-57px)] bg-blue-950 p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="mt-3 text-xl font-semibold text-red-700">Error loading files</p>
                <p className="mt-1 text-center text-md text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex-grow p-1">
            <AsyncButton
                actionFunc={async function (): Promise<string> {
                    return await uploadFile(filename, saveContent)
                }}
                onSuccessMessage={"file saved"}
            >
                Save
            </AsyncButton>

            <YamlEditor
                key={filename}
                content={content}
                contentChange={code => {
                    saveContent = code;
                }}
            />
        </div>
    );
};
