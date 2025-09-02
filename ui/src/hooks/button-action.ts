import {useState} from "react";

function useButtonAction() {
    const [activeAction, setActiveAction] = useState('')
    const buttonAction = async (callback: () => Promise<void>, actionName: string) => {
        setActiveAction(actionName)
        await callback()
        setActiveAction('')
    }

    return {activeAction, buttonAction}
}

export default useButtonAction