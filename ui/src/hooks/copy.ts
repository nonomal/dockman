import {type MouseEvent, useState} from "react";

export function useCopyButton() {
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const handleCopy = (event: MouseEvent<HTMLButtonElement>, id: string) => {
        event.stopPropagation()
        navigator.clipboard.writeText(id).then()
        setCopiedId(id)
        setTimeout(() => {
            setCopiedId(null)
        }, 1500)
    }

    return {handleCopy, copiedId}
}

