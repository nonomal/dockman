import React, {useEffect, useRef, useState} from "react"
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    TextField,
    Typography
} from "@mui/material"
import {Add, AddCircleOutline, ArrowBack, Cancel, ErrorOutline, InsertDriveFile} from "@mui/icons-material"
import {DockerFolderIcon} from "./file-icon.tsx";

interface AddFileDialogProps {
    open: boolean
    onClose: () => void
    onConfirm: (name: string) => void
    parentName: string
}

type PresetType = 'file' | 'compose-directory'
type CreationStep = 'preset-selection' | 'name-input'

interface FilePreset {
    type: PresetType
    title: string
    description: string
    icon: React.ReactNode
    extensions?: string[]
}

const FILE_PRESETS: FilePreset[] = [
    {
        type: 'file',
        title: 'File or Directory',
        description: 'Create files: somefile.txt, docs/readme.md',
        icon: <InsertDriveFile color="primary" sx={{fontSize: '2rem'}}/>,
        extensions: ['.js', '.json', '.yaml', '.yml', '.env', '.txt', '.md', '.dockerfile', '.gitignore', '-compose.yaml', '-compose.yml']
    },
    {
        type: 'compose-directory',
        title: 'Compose Directory',
        description: 'Create directory with compose file: router/router-compose.yaml',
        icon: <DockerFolderIcon/>
    }
]

export function FileDialogCreate({open, onClose, onConfirm, parentName}: AddFileDialogProps) {
    const [step, setStep] = useState<CreationStep>('preset-selection')
    const [selectedPreset, setSelectedPreset] = useState<PresetType>('file')
    const [presetIndex, setPresetIndex] = useState(0)
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [selectedSuggestion, setSelectedSuggestion] = useState(0)
    const [showSuggestions, setShowSuggestions] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)
    const suggestionsListRef = useRef<HTMLUListElement>(null)

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (open) {
            if (parentName) {
                setStep('name-input')
                setSelectedPreset('file')
                setPresetIndex(0)
            } else {
                setStep('preset-selection')
                setSelectedPreset('file')
                setPresetIndex(0)
            }

            setName('')
            setError('')
            setSuggestions([])
            setSelectedSuggestion(0)
            setShowSuggestions(false)
        }
    }, [open, parentName])

    // Focus input when moving to name input step
    useEffect(() => {
        if (step === 'name-input' && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [step])

    // Scroll selected suggestion into view
    useEffect(() => {
        if (showSuggestions && suggestionsListRef.current) {
            const selectedElement = suggestionsListRef.current.children[selectedSuggestion] as HTMLElement
            if (selectedElement) {
                selectedElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                })
            }
        }
    }, [selectedSuggestion, showSuggestions])

    // Smart suggestion matching
    const getSmartSuggestions = (input: string, extensions: string[]): string[] => {
        if (!input.trim()) return []

        // const inputLower = input.toLowerCase()

        // If input already has an extension, find matching extensions
        const lastDotIndex = input.lastIndexOf('.')
        if (lastDotIndex > 0) {
            const baseFileName = input.substring(0, lastDotIndex)
            const partialExt = input.substring(lastDotIndex).toLowerCase()

            return extensions
                .filter(ext => ext.toLowerCase().startsWith(partialExt))
                .map(ext => `${baseFileName}${ext}`)
                .slice(0, 5) // Limit to 5 suggestions
        }

        // If input has a dash at the end, prioritize compose extensions
        if (input.endsWith('-')) {
            const composeExts = extensions.filter(ext => ext.includes('compose'))
            if (composeExts.length > 0) {
                return composeExts.map(ext => `${input.slice(0, -1)}${ext}`).slice(0, 3)
            }
        }

        // Default: show most common extensions
        const commonExts = ['.js', '.json', '.yaml', '.txt', '.md']
        const availableCommon = extensions.filter(ext => commonExts.includes(ext))

        return availableCommon
            .map(ext => `${input}${ext}`)
            .slice(0, 5)
    }

    // Generate suggestions based on preset and input
    useEffect(() => {
        if (step !== 'name-input' || selectedPreset !== 'file') {
            setSuggestions([])
            setShowSuggestions(false)
            return
        }

        const preset = FILE_PRESETS.find(p => p.type === 'file')
        if (preset?.extensions && name.trim()) {
            const newSuggestions = getSmartSuggestions(name, preset.extensions)
            setSuggestions(newSuggestions)
            setShowSuggestions(newSuggestions.length > 0)
            setSelectedSuggestion(0)
        } else {
            setSuggestions([])
            setShowSuggestions(false)
        }
    }, [name, selectedPreset, step])

    const validateInput = (input: string): string => {
        if (!input.trim()) return ''

        // Check for empty directories (path ending with /)
        if (input.endsWith('/')) {
            return 'Empty directories are not allowed. Please specify a filename.'
        }

        // Check for nested directories when parentName exists
        if (parentName && input.includes('/')) {
            return 'Subdirectories cannot be created here. Please enter a valid file name.'
        }

        // Check for multiple slashes (nested directories)
        const slashCount = (input.match(/\//g) || []).length
        if (slashCount > 1) {
            return 'Nested directories are not allowed. Use only one directory level.'
        }

        return ''
    }

    const handlePresetSelection = (preset: PresetType) => {
        setSelectedPreset(preset)
        setStep('name-input')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (step === 'preset-selection') {
            switch (e.key) {
                case 'ArrowUp': {
                    e.preventDefault()
                    const newUpIndex = presetIndex > 0 ? presetIndex - 1 : FILE_PRESETS.length - 1
                    setPresetIndex(newUpIndex)
                    setSelectedPreset(FILE_PRESETS[newUpIndex].type)
                    break
                }
                case 'ArrowDown': {
                    e.preventDefault()
                    const newDownIndex = presetIndex < FILE_PRESETS.length - 1 ? presetIndex + 1 : 0
                    setPresetIndex(newDownIndex)
                    setSelectedPreset(FILE_PRESETS[newDownIndex].type)
                    break
                }
                case 'Enter':
                    e.preventDefault()
                    handlePresetSelection(selectedPreset)
                    break
                case 'Escape':
                    onClose()
                    break
            }
        } else if (step === 'name-input') {
            // Check for Alt+B shortcut to go back to preset selection (only if no parent)
            if (e.altKey && e.key.toLowerCase() === 'b' && !parentName) {
                e.preventDefault()
                setStep('preset-selection')
                setName('')
                setError('')
                return
            }

            switch (e.key) {
                case 'ArrowUp':
                    if (showSuggestions && suggestions.length > 0) {
                        e.preventDefault()
                        setSelectedSuggestion(prev => prev > 0 ? prev - 1 : suggestions.length - 1)
                    }
                    break
                case 'ArrowDown':
                    if (showSuggestions && suggestions.length > 0) {
                        e.preventDefault()
                        setSelectedSuggestion(prev => prev < suggestions.length - 1 ? prev + 1 : 0)
                    }
                    break
                case 'Tab':
                    e.preventDefault()
                    if (showSuggestions && suggestions.length > 0) {
                        setName(suggestions[selectedSuggestion])
                        setShowSuggestions(false)
                    }
                    break
                case 'Enter':
                    e.preventDefault()
                    handleConfirm()
                    break
                case 'Escape':
                    if (showSuggestions) {
                        setShowSuggestions(false)
                    } else if (!parentName) {
                        // Only go back to preset selection if there's no parent
                        setStep('preset-selection')
                        setName('')
                        setError('')
                    } else {
                        // If there's a parent, close the dialog on Escape
                        onClose()
                    }
                    break
            }
        }
    }

    const handleConfirm = () => {
        let finalName = name.trim()

        if (!finalName) return

        const validationError = validateInput(finalName)
        if (validationError) {
            setError(validationError)
            return
        }

        // Apply preset-specific logic
        if (selectedPreset === 'compose-directory') {
            finalName = `${finalName}/${finalName}-compose.yaml`
        }

        onConfirm(finalName)
        onClose()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setName(value)

        const validationError = validateInput(value)
        setError(validationError)
    }

    const handleSuggestionClick = (suggestion: string) => {
        setName(suggestion)
        setShowSuggestions(false)
        inputRef.current?.focus()
    }

    const getDialogTitle = () => {
        if (step === 'preset-selection') {
            return parentName ? `Add to "${parentName}"` : "Create New"
        }

        const preset = FILE_PRESETS.find(p => p.type === selectedPreset)
        const baseTitle = preset ? `Create ${preset.title}` : "Create"
        return parentName ? `${baseTitle} in "${parentName}"` : baseTitle
    }

    const getHelperText = () => {
        if (selectedPreset === 'file') {
            return "Examples: file.js, config.yaml, docs/readme.md. Start typing for smart suggestions."
        } else if (selectedPreset === 'compose-directory') {
            return "Enter name (e.g., 'router'). Will create: router/router-compose.yaml"
        }
        return ""
    }

    const getPreviewText = () => {
        if (!name.trim()) return ""

        const validationError = validateInput(name)
        if (validationError) return ""

        switch (selectedPreset) {
            case 'compose-directory':
                return `${name}/${name}-compose.yaml`
            default:
                if (showSuggestions && suggestions.length > 0) {
                    return suggestions[selectedSuggestion]
                }
                return name
        }
    }

    const isCreateDisabled = () => {
        return !name.trim() || !!error || !!validateInput(name)
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            onKeyDown={handleKeyDown}
            slotProps={{
                paper: {
                    sx: {minHeight: '500px'}
                }
            }}
        >
            <DialogTitle sx={{display: 'flex', alignItems: 'center', gap: 1, pb: 1}}>
                <AddCircleOutline color="primary" sx={{fontSize: '1.5rem'}}/>
                <Typography variant="h6">{getDialogTitle()}</Typography>
            </DialogTitle>

            <DialogContent dividers sx={{pt: 3, pb: 3, minHeight: '350px'}}>
                {step === 'preset-selection' ? (
                    <Box>
                        <Typography variant="body1" color="text.secondary" sx={{mb: 3}}>
                            Choose what you want to create (use ↑↓ arrows, Enter to select):
                        </Typography>

                        <Box sx={{display: 'flex', gap: 2, flexDirection: 'column'}}>
                            {FILE_PRESETS.map((preset, index) => (
                                <Paper
                                    key={preset.type}
                                    elevation={index === presetIndex ? 3 : 1}
                                    sx={{
                                        p: 3,
                                        cursor: 'pointer',
                                        border: 2,
                                        borderColor: index === presetIndex ? 'primary.main' : 'transparent',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            elevation: 2,
                                            borderColor: 'primary.light'
                                        }
                                    }}
                                    onClick={() => {
                                        setPresetIndex(index)
                                        setSelectedPreset(preset.type)
                                        handlePresetSelection(preset.type)
                                    }}
                                >
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                                        {preset.icon}
                                        <Box sx={{flex: 1}}>
                                            <Typography variant="h6" sx={{mb: 0.5}}>
                                                {preset.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {preset.description}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    </Box>
                ) : (
                    <Box>
                        <Box sx={{position: 'relative', mb: 3}}>
                            <TextField
                                ref={inputRef}
                                autoFocus
                                fullWidth
                                label="Name"
                                variant="outlined"
                                value={name}
                                onChange={handleChange}
                                error={!!error}
                                helperText={error || getHelperText()}
                                size="medium"
                                sx={{
                                    '& .MuiInputBase-root': {
                                        fontSize: '1.1rem'
                                    }
                                }}
                            />

                            {showSuggestions && suggestions.length > 0 && (
                                <Paper
                                    elevation={3}
                                    sx={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        zIndex: 1000,
                                        maxHeight: '150px',
                                        overflow: 'auto',
                                        mt: 0.5
                                    }}
                                >
                                    <List
                                        ref={suggestionsListRef}
                                        dense
                                        sx={{p: 0}}
                                    >
                                        {suggestions.map((suggestion, index) => (
                                            <ListItemButton
                                                key={suggestion}
                                                selected={index === selectedSuggestion}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                sx={{py: 1}}
                                            >
                                                <ListItemText
                                                    primary={`${suggestion} ${(index === selectedSuggestion) ? "Tab to select" : ""}`}
                                                    slotProps={{
                                                        primary: {
                                                            variant: 'body1',
                                                            fontFamily: 'monospace',
                                                            fontSize: '1rem'
                                                        }
                                                    }}
                                                />
                                            </ListItemButton>
                                        ))}
                                    </List>
                                </Paper>
                            )}
                        </Box>

                        {/* Preview Section */}
                        {getPreviewText() && (
                            <Alert
                                severity="info"
                                icon={<InsertDriveFile/>}
                                sx={{
                                    mb: 2,
                                    '& .MuiAlert-message': {
                                        width: '100%'
                                    }
                                }}
                            >
                                <Typography variant="subtitle2" sx={{mb: 0.5}}>
                                    Will create:
                                </Typography>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontFamily: 'monospace',
                                        fontWeight: 'bold',
                                        color: 'primary.main'
                                    }}
                                >
                                    {getPreviewText()}
                                </Typography>
                            </Alert>
                        )}

                        {error && (
                            <Alert severity="error" icon={<ErrorOutline/>} sx={{mb: 2}}>
                                {error}
                            </Alert>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{px: 3, py: 2.5, gap: 2}}>
                <Button
                    onClick={step === 'name-input' && !parentName ? () => {
                        setStep('preset-selection');
                        setName('');
                        setError('');
                    } : onClose}
                    startIcon={step === 'name-input' && !parentName ? <ArrowBack/> : <Cancel/>}
                    size="large"
                >
                    {step === 'name-input' && !parentName ? 'Back' : 'Cancel'}
                </Button>

                {step === 'name-input' && (
                    <Button
                        onClick={handleConfirm}
                        variant="contained"
                        disabled={isCreateDisabled()}
                        startIcon={<Add/>}
                        size="large"
                        sx={{minWidth: '120px'}}
                    >
                        Create
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}
