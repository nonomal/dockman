export const formatBytes = (bytes: number | bigint, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(Number(bytes)) / Math.log(k))
    return parseFloat((Number(bytes) / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}


// Determines the color based on resource usage percentage.
// - Green for normal usage (< 70%)
// - Yellow for high usage (70-90%)
// - Red for critical usage (> 90%)
export const getUsageColor = (value: number): 'success.main' | 'warning.main' | 'error.main' => {
    if (value > 90) {
        return 'error.main' // Critical
    }
    if (value > 70) {
        return 'warning.main' // High
    }
    return 'success.main' // Normal
}


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
