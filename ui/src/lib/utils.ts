/**
 * Generates a clickable URL for a container image, pointing to its repository.
 * Handles Docker Hub and other public/private registries.
 * @param {string} imageName The full name of the docker image (e.g., "nginx:latest", "gcr.io/my-project/my-image:v1").
 * @returns {string} The full URL to the image's web home page.
 */
export const getImageHomePageUrl = (imageName: string): string => {
    if (!imageName) {
        return '#'; // Return a non-functional link if name is missing
    }

    // Strip the tag or digest from the image name
    // e.g., "nginx:latest" -> "nginx", "gcr.io/img@sha256:..." -> "gcr.io/img"
    let cleanName = imageName.split('@')[0];
    const tagIndex = cleanName.lastIndexOf(':');
    if (tagIndex > 0 && !cleanName.substring(tagIndex + 1).includes('/')) {
        cleanName = cleanName.substring(0, tagIndex);
    }

    const nameSplit = cleanName.split('/');
    const firstPart = nameSplit[0];
    const isCustomRegistry = firstPart.includes('.') || firstPart.includes(':');

    const customRegistryMap: Record<string, (image: string[]) => string> = {
        "lscr.io": (splits: string[]) => {
            // expected ["lscr.io", "linuxserver", "radarr"] <- get last part
            return `https://docs.linuxserver.io/images/docker-${splits[2]}`;
        },
    };

    if (isCustomRegistry) {
        const registryDomain = nameSplit[0];
        const customUrl = customRegistryMap[registryDomain];
        if (customUrl) {
            // For known custom registries with special URL patterns
            return customUrl(nameSplit);
        }
        // For other registries, link to the registry itself
        return `https://${cleanName}`;
    } else {
        // It's a Docker Hub image
        if (nameSplit.length === 1) {
            // Official Docker Hub image (e.g., "nginx")
            return `https://hub.docker.com/_/${cleanName}`;
        } else {
            // User/organization image (e.g., "user/image")
            return `https://hub.docker.com/r/${cleanName}`;
        }
    }
}

export const getStatusChipColor = (status: string): "success" | "warning" | "default" | "error" => {
    if (status.toLowerCase().startsWith('up')) return 'success';
    if (status.toLowerCase().startsWith('exited')) return 'error';
    if (status.toLowerCase().includes('restarting')) return 'warning';
    return 'default';
};


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

export const formatBytes = (bytes: number | bigint, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(Number(bytes)) / Math.log(k));
    return parseFloat((Number(bytes) / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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