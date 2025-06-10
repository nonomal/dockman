import {type FC, type FormEvent, useState} from 'react';
import {Plus} from 'lucide-react'; // Assuming you use lucide-react for icons

interface AddSubFileButtonProps {
    file: string;
    isSubfile: boolean;
    onSubmit: (filename: string) => Promise<string>;
}

export const AddFileButton: FC<AddSubFileButtonProps> = ({onSubmit}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setNewFileName('');
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true)
        setError("")
        if (newFileName.trim()) {
            onSubmit(newFileName.trim()).then(value => {
                if (value) {
                    setError(value)
                } else {
                    handleCloseModal();
                }
                setIsLoading(false)
            })
        }
    };

    return (
        <>
            <button
                onClick={handleOpenModal}
                className="p-1 text-gray-400 hover:text-white"
                aria-label={`Add a sub-file to }`}
            >
                <Plus size={14}/>
            </button>

            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
                    aria-modal="true"
                    role="dialog"
                >
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                        <form onSubmit={handleSubmit}>
                            <h2 className="text-lg font-semibold text-white">Add New File</h2>
                            <p className="mt-1 text-sm text-gray-400">
                                Enter a name for the new file under "".
                            </p>

                            <div className="mt-4">
                                <label htmlFor="fileName" className="sr-only">File Name</label>
                                <input
                                    type="text"
                                    id="fileName"
                                    value={newFileName}
                                    onChange={(e) => setNewFileName(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., new-document.md"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-300 bg-transparent rounded-md hover:bg-gray-700 focus:outline-none"
                                >
                                    Cancel
                                </button>

                                {isLoading ?
                                    <div
                                        className="flex flex-col items-center justify-center h-[calc(100vh-57px)] bg-blue-950 text-white">
                                        <div
                                            className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                        <p className="mt-3 text-lg font-medium">Fetching files...</p>
                                    </div>
                                    : <button
                                        type="submit"
                                        disabled={!newFileName.trim()}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none disabled:bg-gray-500 disabled:cursor-not-allowed"
                                    >
                                        Create File
                                    </button>
                                }
                            </div>
                        </form>
                    </div>
                    {
                        error ?
                            <div>{error}</div>
                            : <div></div>
                    }
                </div>
            )}
        </>
    );
};