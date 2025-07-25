import {useEffect, useState} from 'react';
import {
    Box,
    Chip, Dialog,
    IconButton,
    InputAdornment,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    TextField,
    Typography
} from '@mui/material';
import {Close, FilterList, Folder, FolderOpen, InsertDriveFile, Search} from '@mui/icons-material';

interface File {
    id: number;
    name: string;
    type: 'file' | 'folder';
    path: string;
    children?: File[];
}

// Mock file data structure
const mockFiles: File[] = [
    {
        id: 1, name: 'src', type: 'folder', path: 'src/', children: [
            {
                id: 2, name: 'components', type: 'folder', path: 'src/components/', children: [
                    {id: 3, name: 'Header.tsx', type: 'file', path: 'src/components/Header.tsx'},
                    {id: 4, name: 'Sidebar.tsx', type: 'file', path: 'src/components/Sidebar.tsx'},
                ]
            },
            {
                id: 5, name: 'utils', type: 'folder', path: 'src/utils/', children: [
                    {id: 6, name: 'helpers.ts', type: 'file', path: 'src/utils/helpers.ts'},
                ]
            },
            {id: 7, name: 'App.tsx', type: 'file', path: 'src/App.tsx'},
            {id: 8, name: 'index.tsx', type: 'file', path: 'src/index.tsx'},
        ]
    },
    {
        id: 9, name: 'public', type: 'folder', path: 'public/', children: [
            {id: 10, name: 'index.html', type: 'file', path: 'public/index.html'},
        ]
    },
    {id: 11, name: 'package.json', type: 'file', path: 'package.json'},
    {id: 12, name: 'README.md', type: 'file', path: 'README.md'},
    {id: 13, name: 'tsconfig.json', type: 'file', path: 'tsconfig.json'},
];

const mockFileContent: Record<string, string> = {
    'src/App.tsx': `console.log("hello world")`,
    'package.json': `{ "name": "my-app" }`,
    'README.md': `# My App`,
};

interface TelescopeProps {
    isVisible: boolean;
    onDismiss: () => void;
}

export default function Telescope({isVisible, onDismiss}: TelescopeProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState('');
    const [expandedFolders, setExpandedFolders] = useState(new Set<number>([1]));
    const [filteredFiles, setFilteredFiles] = useState<File[]>(mockFiles);

    // API Connection Functions (Placeholders)
    const fetchFileContent = async (filePath: string) => {
        // TODO: Replace with actual API call
        // const response = await fetch(`${API_ENDPOINTS.fetchFileContent}?path=${filePath}`);
        // return response.text();
        return mockFileContent[filePath] || `Content of ${filePath}\n\nThis is placeholder content.`;
    };

    const filterFiles = (files: File[], query: string): [File[], Set<number>] => {
        const newExpanded = new Set<number>();
        if (!query) {
            return [files, newExpanded];
        }

        const lowerCaseQuery = query.toLowerCase();

        const filter = (items: File[]): File[] => {
            return items.reduce((acc, item) => {
                const isMatch = item.name.toLowerCase().includes(lowerCaseQuery);

                if (item.type === 'folder') {
                    const filteredChildren = filter(item.children || []);
                    if (isMatch || filteredChildren.length > 0) {
                        newExpanded.add(item.id);
                        acc.push({...item, children: isMatch ? item.children : filteredChildren});
                    }
                } else if (isMatch) {
                    acc.push(item);
                }

                return acc;
            }, [] as File[]);
        }

        const filtered = filter(files);
        return [filtered, newExpanded];
    };

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            const [results, newExpanded] = filterFiles(mockFiles, searchQuery);
            setFilteredFiles(results);
            if (searchQuery) {
                setExpandedFolders(newExpanded);
            } else {
                // Reset to default when search is cleared
                setExpandedFolders(new Set<number>([1]));
            }
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    const handleFileSelect = async (file: File) => {
        if (file.type === 'file') {
            setSelectedFile(file);
            const content = await fetchFileContent(file.path);
            setFileContent(content);
        }
    };

    const toggleFolder = (folderId: number) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    const renderFileTree = (files: File[], level = 0) => {
        return files.map((file) => (
            <Box key={file.id}>
                <ListItemButton
                    onClick={() => file.type === 'folder' ? toggleFolder(file.id) : handleFileSelect(file)}
                    sx={{
                        pl: 2 + level * 2,
                        py: 0.5,
                        '&:hover': {bgcolor: 'action.hover'}
                    }}
                >
                    <ListItemIcon sx={{minWidth: 32}}>
                        {file.type === 'folder' ?
                            (expandedFolders.has(file.id) ? <FolderOpen fontSize="small"/> :
                                <Folder fontSize="small"/>) :
                            <InsertDriveFile fontSize="small"/>
                        }
                    </ListItemIcon>
                    <ListItemText
                        primary={file.name}
                        primaryTypographyProps={{
                            fontSize: '0.875rem',
                            color: file.type === 'folder' ? 'primary.main' : 'text.primary'
                        }}
                    />
                </ListItemButton>
                {file.type === 'folder' && file.children && expandedFolders.has(file.id) && (
                    <Box>
                        {renderFileTree(file.children, level + 1)}
                    </Box>
                )}
            </Box>
        ));
    };

    return (
        <Dialog
            open={isVisible}
            onClose={onDismiss}
            maxWidth="md"
            fullWidth
            scroll="paper"
            aria-labelledby="changelog-dialog-title"
            slotProps={{
                paper: {
                    sx: {
                        backgroundColor: '#1e293b', // Dark slate background for main dialog
                        border: '1px solid #334155',
                        borderRadius: 2,
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                        color: '#f1f5f9',
                    }
                }
            }}
        >
            <Box sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default'
            }}>
                {/* Header */}
                <Box sx={{
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper'
                }}>
                    <Typography variant="h6" sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <FilterList/>
                        Telescope File Explorer
                    </Typography>
                    {selectedFile && (
                        <Chip
                            label={selectedFile.path}
                            variant="outlined"
                            size="small"
                            onDelete={() => {
                                setSelectedFile(null);
                                setFileContent('');
                            }}
                            deleteIcon={<Close/>}
                            sx={{mt: 1}}
                        />
                    )}
                </Box>

                {/* Main Content Area */}
                <Box sx={{display: 'flex', flex: 1, overflow: 'hidden'}}>
                    {/* File List Sidebar */}
                    <Paper
                        elevation={0}
                        sx={{
                            width: 300,
                            borderRight: 1,
                            borderColor: 'divider',
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: 'background.paper'
                        }}
                    >
                        <Box sx={{p: 1, borderBottom: 1, borderColor: 'divider'}}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Files
                            </Typography>
                        </Box>
                        <List sx={{flex: 1, overflow: 'auto', py: 0}}>
                            {renderFileTree(filteredFiles)}
                        </List>
                    </Paper>

                    {/* Content Window */}
                    <Box sx={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                        {selectedFile ? (
                            <>
                                <Box sx={{
                                    p: 2,
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper'
                                }}>
                                    <Typography variant="subtitle1" sx={{fontFamily: 'monospace'}}>
                                        {selectedFile.path}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    flex: 1,
                                    p: 2,
                                    overflow: 'auto',
                                    bgcolor: 'grey.50',
                                    fontFamily: 'monospace'
                                }}>
                <pre style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.875rem',
                    lineHeight: 1.5
                }}>
                  {fileContent}
                </pre>
                                </Box>
                            </>
                        ) : (
                            <Box sx={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'text.secondary'
                            }}>
                                <Typography variant="h6">
                                    Select a file to preview its content
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Search Bar at Bottom */}
                <Paper
                    elevation={3}
                    sx={{
                        p: 2,
                        borderTop: 1,
                        borderColor: 'divider',
                        bgcolor: 'background.paper'
                    }}
                >
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search files... (type to filter)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search/>
                                </InputAdornment>
                            ),
                            endAdornment: searchQuery && (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setSearchQuery('')}
                                        edge="end"
                                        size="small"
                                    >
                                        <Close/>
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: 'background.default'
                            }
                        }}
                    />
                </Paper>
            </Box>
        </Dialog>
    );
}