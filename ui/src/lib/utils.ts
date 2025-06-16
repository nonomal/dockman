export const getLanguageFromExtension = (filename?: string): string => {
    if (!filename) {
        return 'plaintext';
    }

    const extension = filename.split('.').pop()?.toLowerCase();
    if (!extension) {
        return 'plaintext';
    }

    const languageMap: Record<string, string> = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        json: 'json',
        css: 'css',
        html: 'html',
        yaml: 'yaml',
        yml: 'yaml',
        md: 'markdown',
        py: 'python',
        java: 'java',
        sh: 'shell',
        env: 'ini'
    };
    return languageMap[extension] || 'plaintext';
};

export const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatPercent = (value: number) => `${value.toFixed(2)}%`;

export function trim(str: string, ch: string) {
    let start = 0
    let end = str.length;

    while (start < end && str[start] === ch)
        ++start;

    while (end > start && str[end - 1] === ch)
        --end;

    return (start > 0 || end < str.length) ? str.substring(start, end) : str;
}