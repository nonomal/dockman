import {atom} from "jotai";

export const sideBarState = atom(false);

export const openFiles = atom(new Set<string>())