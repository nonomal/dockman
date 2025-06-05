import {useEffect, useState} from "react";
import {ChevronDown, ChevronRight, FileText, Plus, Trash2} from 'lucide-react';
import {YamlEditor} from "./editor.tsx";
import {type FileAndFile} from "../lib/file.ts";
import {callRPC, composeClient} from "../lib/grpc.ts";

export const ComposePage = () => {
    const [files, _setFiles] = useState<FileAndFile[]>([]);
    const [selectedFile, setSelectedFile] = useState(files[0] || null);
    // const [loading, setLoading] = useState(false);
    const [_error, setError] = useState("");

    useEffect(() => {
        async function fetchData() {
            const {val, err} = await callRPC(() => composeClient.list({}))
            if (err !== null) {
                setError(err)
            }

            for (let _f of val!.files) {
                // const file = {
                //     name: f,
                //     content: "",
                // } as File
            }

            // setFiles(f)
        }

        fetchData();
    }, []);

    const addRootFile = () => {
        console.log("Adding root file");
    };

    const addSubFile = (parentId: string) => {
        console.log("Adding sub file: ", parentId);
    };

    const deleteFile = (fileId: string, parentId: string | null = null) => {
        console.log(`Deleting file ${fileId} with id ${parentId}`);
    };

    const updateFileContent = (fileId: string, newContent: string) => {
        console.log(`Updating content ${fileId}, ${newContent}`);
    };


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
            <FileContent file={selectedFile} onContentChange={updateFileContent}/>
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
        files: FileAndFile[];
        addRootFile: () => void;
        addSubFile: (parentId: string) => void;
        deleteFile: (fileId: string, parentId: string | null) => void;
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
                        key={file.rootFile.name}
                        file={file}
                        isRoot={true}
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
        file,
        isRoot,
        addSubFile,
        deleteFile,
        selectedFile,
        setSelectedFile
    }: {
        file: File;
        isRoot: boolean;
        addSubFile: any;
        deleteFile: any;
        selectedFile: any;
        setSelectedFile: any;
    }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const isSelected = selectedFile?.name === file.;

    return (
        <div>
            <div
                className={`flex items-center justify-between group p-2 rounded-md cursor-pointer mb-1 transition-colors ${
                    isSelected ? 'bg-purple-600/30' : 'hover:bg-gray-700'
                }`}
            >
                <div className="flex items-center flex-grow" onClick={() => setSelectedFile(file)}>
                    {isRoot && file.subFiles.length > 0 && (
                        <button onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded)
                        }} className="mr-1 p-0.5 rounded hover:bg-gray-600">
                            {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                        </button>
                    )}
                    <FileText size={16} className={`mr-2 ${isRoot ? '' : 'ml-4'}`}/>
                    <span className="truncate flex-1 text-sm">{file.name}</span>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isRoot && (
                        <button
                            onClick={() => addSubFile(file.id)}
                            className="p-1 text-gray-400 hover:text-white"
                            aria-label="Add sub-file"
                        >
                            <Plus size={14}/>
                        </button>
                    )}
                    <button
                        onClick={() => deleteFile(file.id, isRoot ? null : file.parentId)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        aria-label="Delete file"
                    >
                        <Trash2 size={14}/>
                    </button>
                </div>
            </div>
            {isRoot && isExpanded && file.subFiles.length > 0 && (
                <div className="pl-4 border-l border-gray-600 ml-2">
                    {file.subFiles.map(subFile => (
                        <FileItem
                            key={subFile.id}
                            file={{...subFile, parentId: file.id}}
                            isRoot={false}
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
const FileContent = ({file, onContentChange}) => {
    if (!file) {
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

    return (
        <div className="flex-grow p-1">
            <YamlEditor
                key={file.id}
                content={file.content}
            />
        </div>
    );
};
