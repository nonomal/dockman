import {createClient} from "@connectrpc/connect";
import {createConnectTransport} from "@connectrpc/connect-web";
import {ComposeService} from "../gen/compose/v1/compose_pb.ts";

const transport = createConnectTransport({
    baseUrl: window.location.hostname,
});

export const composeClient = createClient(ComposeService, transport);


export async function callRPC<T>(exec: () => Promise<T>): Promise<{ val: T | null; err: string; }> {
    try {
        const val = await exec()
        return {val, err: ""}
    } catch (e: any) {
        return {val: null, err: e.toString()}
    }
}
