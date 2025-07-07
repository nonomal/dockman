import {type Client, ConnectError, createClient} from "@connectrpc/connect";
import {createConnectTransport} from "@connectrpc/connect-web";
import type {DescService} from "@bufbuild/protobuf";
import {useMemo} from "react";

export const API_URL = import.meta.env.MODE === 'development'
    ? "http://localhost:8866"
    : window.location.origin;

console.log(`API url: ${API_URL} `)

const transport = createConnectTransport({baseUrl: API_URL})

export function useClient<T extends DescService>(service: T): Client<T> {
    return useMemo(() => createClient(service, transport), [service]);
}

export async function callRPC<T>(exec: () => Promise<T>): Promise<{ val: T | null; err: string; }> {
    try {
        const val = await exec()
        return {val, err: ""}
    } catch (error: unknown) {
        if (error instanceof ConnectError) {
            console.error(`Error: ${error.message}`);
            return {val: null, err: `${error.code}: ${error.message}`};
        }

        return {val: null, err: `Unknown error while calling api: ${(error as Error).toString()}`};
    }
}


export async function uploadFile(filename: string, contents: string): Promise<string> {
    try {
        const formData = new FormData();
        const file = new File([contents], filename);

        formData.append('contents', file, btoa(filename));

        const response = await fetch(`${API_URL}/api/file/save`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            return `Server error: ${response.status} ${response.statusText} - ${errorText}`
        }

        console.log(`Uploaded ${file}, response status: ${response.status}`);
        return "";
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        return `Server error: ${error.message}`;
    }
}

export async function pingWithAuth() {
    try {
        console.log("Checking authentication status with server...");
        const response = await fetch('/auth/ping');
        console.log(`Server response isOK: ${response.ok}`);
        return response.ok
    } catch (error) {
        console.error("Authentication check failed:", error);
        return false
    }
}

export async function downloadFileAtCommit(filename: string, commitId: string): Promise<{ file: string; err: string }> {
    return download(`api/git/load/${encodeURIComponent(filename)}/${encodeURIComponent(commitId)}`);
}

export async function downloadFile(filename: string): Promise<{ file: string; err: string }> {
    return download(`api/file/load/${encodeURIComponent(filename)}`)
}

async function download(subPath: string) {
    try {
        const response = await fetch(
            `${API_URL}/${subPath}`,
            {cache: 'no-cache'}
        );
        if (!response.ok) {
            return {file: "", err: `Failed to download file: ${response.status} ${response.statusText}`};
        }
        const fileData = await response.text()
        return {file: fileData, err: ""};
    } catch (error: unknown) {
        console.error(`Error: ${(error as Error).toString()}`);
        return {file: "", err: (error as Error).toString()};
    }
}