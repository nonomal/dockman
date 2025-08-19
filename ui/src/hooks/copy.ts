import {useState} from "react";

export function useCopyButton() {
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const handleCopy = (id: string) => {
        navigator.clipboard.writeText(id).then()
        setCopiedId(id)
        setTimeout(() => {
            setCopiedId(null)
        }, 1500)
    }

    return {handleCopy, copiedId}
}

