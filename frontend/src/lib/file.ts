export interface File {
    name: string;
    content: string;
}

export interface FileAndFile {
    rootFile: File;
    subFiles: File[],
}

export const initialFiles = [
    {
        name: 'Getting Started.md',
        content: '# Welcome to your new editor!\n\nThis is a simple markdown editor. Select a file from the sidebar to view its content, or create a new one.',
        subFiles: [
            {
                name: 'basics.md',
                content: '## Basics\n\n- Create files\n- Create sub-files\n- Delete files'
            },
            {
                name: 'advanced.md',
                content: '## Advanced\n\nThere are no advanced features yet.'
            },
        ],
    },
    {
        name: 'Project Ideas.txt',
        content: 'Project Ideas:\n\n1. Build this editor.\n2. Create a backup system.\n3. Add cloud sync.',
        subFiles: [],
    },
];
