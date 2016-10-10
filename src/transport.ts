import * as WebSocket from "ws"
import writeToken from "./write-token"
import { Identity } from "./identity"

export default class Transport {
    protected wire: WebSocket
    protected messageCounter = 0
    protected listeners = []
    protected uncorrelatedListener: Function
    connect(address: string): Promise<void> { 
        return new Promise((resolve, reject) => {
            this.wire = new WebSocket(address)
            this.wire.addEventListener("open", resolve)
            this.wire.addEventListener("error", reject)
            this.wire.addEventListener("ping", (data, flags) => this.wire.pong(data, flags, true))
            this.wire.addEventListener("message", this.onmessage.bind(this))
        })
    } 
    authenticate(identity: Identity): Promise<string> {
        const { uuid } = identity
        return new Promise((resolve, reject) => {
            this.sendAction("request-external-authorization", {
                uuid,
                type: "file-token", // Other type for browser? Ask @xavier
                authorizationToken: null // Needed?
            }, true)
                .then(({ action, payload }) => {
                    if (action != "external-authorization-response")
                        reject(new UnexpectedAction(action))
                    else {
                        const token: string = payload.token
                        return writeToken(payload.file, token) 
                            .then(() => {
                                return this.sendAction("request-authorization", { 
                                    uuid,
                                    type: "file-token"
                                }, true)
                                    .then(({ action, payload }) => {
                                        if (action != "authorization-response")
                                            reject(new UnexpectedAction(action))
                                        else if (payload.success !== true)
                                            reject(new Error(`Success=${payload.success}`))
                                        else 
                                            resolve(token)
                                    })
                                    .catch(reject)
                            })
                    }
                })
                .catch(reject)
        })
    }
    send(data, flags?): Promise<any> {
        return new Promise(resolve => {
            this.wire.send(JSON.stringify(data), flags, resolve)
        })
    }
    sendAction(action: string, payload = null, uncorrelated = false): Promise<Message> {
        return new Promise((resolve, reject) => {
            const id = this.messageCounter++
            this.send({
                action,
                payload,
                messageId: id
            })
            this.addListener(id, resolve, reject, uncorrelated)
        })
    }
    shutdown(): Promise<void> {
        this.wire.terminate()
        return Promise.resolve()
    }

    protected addListener(id: number, resolve: Function, reject: Function, uncorrelated: boolean): void {
        if (uncorrelated)  
            this.uncorrelatedListener = resolve
        else if (id in this.listeners) 
            reject(new Error(`Listener for ${id} already registered`))
        else 
            this.listeners[id] = { resolve, reject }
            // Timeout and reject()?
    }
    protected onmessage(message, flags?): void {
        const data = JSON.parse(message.data), 
            id: number = data.correlationId 
        if (!("correlationId" in data)) 
            this.uncorrelatedListener.call(null, data)
            //throw new Error("Message has no .correlationId")
        else if (!(id in this.listeners))            
            throw new Error(`No listener registered for ${id}`)
        else {
            const { resolve, reject } = this.listeners[id]
            if (data.action != "ack")
                reject(new Error(`Got ${data.action}, not "ack"`))
            else if (!("payload" in data) || !data.payload.success)
                reject(new Error(`No success, ${data.payload && data.payload.success}`))
            else
                resolve.call(null, data)
            delete this.listeners[id]
        }
    }
}

class UnexpectedAction extends Error {
    constructor(action: string) {
        super(`Unexpected message with action=${action}`)
    }
}

export class Message {
    action: string
    payload: {
        success: boolean,
        data
    }
}