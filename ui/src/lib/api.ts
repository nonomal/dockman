import {type Client, ConnectError, createClient} from "@connectrpc/connect";
import {createConnectTransport} from "@connectrpc/connect-web";
import type {DescService} from "@bufbuild/protobuf";
import {useMemo} from "react";

const API_URL = import.meta.env.MODE === 'development'
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
    } catch (error: any) {
        console.error(`Error: ${error.message}`);

        if (error instanceof ConnectError) {
            return {val: null, err: `${error.code}: ${error.message}`};
        }
        return {val: null, err: `Unknown error while calling api: ${error.message}`};
    }
}


export async function uploadFile(filename: string, contents: string): Promise<string> {
    try {
        const formData = new FormData();
        // Create a File object from the string content.
        // 'fileContent' is wrapped in an array as the first argument.
        const file = new File([contents], filename);

        formData.append('contents', file, filename);

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

export async function downloadFile(filename: string): Promise<{ file: string; err: string }> {
    try {
        const response = await fetch(
            `${API_URL}/api/file/load/${encodeURIComponent(filename)}`,
            {cache: 'no-cache'}
        );
        if (!response.ok) {
            return {file: "", err: `Failed to download file: ${response.status} ${response.statusText}`};
        }
        const fileData = await response.text()
        return {file: fileData, err: ""};
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        return {file: "", err: error.toString()};
    }
}
