import {useEffect, useRef, useState} from "react";

function useSearch() {
    const [search, setSearch] = useState("")
    const searchInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.altKey && event.key === 'q') {
                event.preventDefault()
                searchInputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])


    return {search, setSearch, searchInputRef}
}

export default useSearch