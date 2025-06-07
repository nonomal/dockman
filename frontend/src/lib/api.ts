import {type Client, ConnectError, createClient} from "@connectrpc/connect";
import {createConnectTransport} from "@connectrpc/connect-web";
import type {DescService} from "@bufbuild/protobuf";
import {useMemo} from "react";

const url = import.meta.env ?
    "http://localhost:8866"
    : window.location.origin;

console.log(`API url: ${url} `)

const transport = createConnectTransport({baseUrl: url})

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
