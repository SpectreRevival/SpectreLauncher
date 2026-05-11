import React, {useEffect, useState} from "react";
import {invoke} from "@tauri-apps/api/core";
import {IconPlus, IconServerOff, IconX} from "@tabler/icons-react";
import {listen, Event} from "@tauri-apps/api/event";

interface ServerLogLine {
    text: string;
    is_err: boolean;
}

export default function ServersPage() {
    const [serverRunning, setServerRunning] = useState(false);
    const [gamePort, setGamePort] = useState<number>(0);
    const [socialPort, setSocialPort] = useState<number>(0);
    const [websocketPort, setWebsocketPort] = useState<number>(0);
    const [serverLogs, setServerLogs] = useState<ServerLogLine[]>([]);
    const [nextCommand, setNextCommand] = useState<string>("");

    useEffect(() => {
        setInterval(async () => {
            setServerRunning(await invoke("is_server_running"));
        }, 10);
    }, []);

    useEffect(() => {
        let unlistenout: (() => void) | undefined;
        let unlistenerr: (() => void) | undefined;

        async function StartStdoutListener() {
            unlistenout = await listen("new-stdout-content", (event: Event<string>) => {
                setServerLogs((prev) => [...prev, {text: event.payload, is_err: false}]);
            });
        }

        async function StartStderrListener() {
            unlistenerr = await listen("new-stderr-content", (event: Event<string>) => {
                setServerLogs((prev) => [...prev, {text: event.payload, is_err: true}]);
            });
        }

        StartStdoutListener();
        StartStderrListener();
        return () => {
            if (unlistenout) {
                unlistenout();
            }
            if (unlistenerr) {
                unlistenerr();
            }
        }
    }, []);

    const HandleGamePortChange = (event: any) => {
        setGamePort(event.target.value);
    }

    const HandleSocialPortChange = (event: any) => {
        setSocialPort(event.target.value);
    }

    const HandleWebsocketPortChange = (event: any) => {
        setWebsocketPort(event.target.value);
    }

    const HandleNextCommandChange = (event: any) => {
        setNextCommand(event.target.value);
    }

    const HandleNextCommandKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if(event.key === "Enter"){
            // Send the command
            invoke("sendstdincommand", {
                content: nextCommand + "\n"
            });
            setNextCommand("");
        }
    }

    function LaunchBackend() {
        invoke("launch_pragmabackend", {
            gamePort: Number(gamePort),
            socialPort: Number(socialPort),
            websocketPort: Number(websocketPort)
        }).catch(err => console.error("Failed to launch:", err));
    }

    function ShutdownServer(){
        invoke("shutdown_pragmabackend");
    }

    return (
        <>
            {serverRunning
                ? <div className="card">
                    <div className={"card-body"}>
                        <pre className={"console"} id={"serverconsole"}>
{serverLogs.map((log, index) => (
    <div key={index} className={`${log.is_err ? 'text-danger' : 'text-green'} mb-3`}>
        {log.text}
    </div>
))}
                        </pre>
                        <input type={"text"} className={"form-control"} onChange={HandleNextCommandChange} value={nextCommand} onKeyDown={HandleNextCommandKey}/>
                    </div>
                    <div className="card-footer">
                        <button type="button" className={"close me-auto btn-danger btn"} onClick={ShutdownServer}>
                            <IconServerOff className={"me-2"}></IconServerOff>
                            Shut down server
                        </button>
                    </div>
                </div>
                : <>
                    <h1 className={"text-danger"}>Server is not running</h1>
                    <button type="button" className="btn btn-primary" data-bs-toggle="modal"
                            data-bs-target="#exampleModal">
                        <IconPlus className={"me-2"}/> Create Server
                    </button>
                    <div className="modal" id="exampleModal" tabIndex={-1}>
                        <div className="modal-dialog" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Create new pragmabackend server</h5>
                                    <button type="button" className="btn-close" data-bs-dismiss="modal"
                                            aria-label="Close"></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Game Port</label>
                                        <input type={"number"} className={"form-control"} name={"gamePort"}
                                               placeholder={"Enter game traffic port"} value={gamePort}
                                               onChange={HandleGamePortChange}></input>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Social Port</label>
                                        <input type={"number"} className={"form-control"} name={"socialPort"}
                                               placeholder={"Enter social traffic port"} value={socialPort}
                                               onChange={HandleSocialPortChange}></input>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Websocket Port</label>
                                        <input type={"number"} className={"form-control"} name={"websocketPort"}
                                               placeholder={"Enter websocket traffic port"} value={websocketPort}
                                               onChange={HandleWebsocketPortChange}></input>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-danger me-auto"
                                            data-bs-dismiss="modal">
                                        <IconX className="me-2"/>
                                        Cancel
                                    </button>
                                    <button type="button" className="btn btn-primary"
                                            data-bs-dismiss="modal" onClick={LaunchBackend}>
                                        <IconPlus className={"me-2"}/> Create
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            }
        </>
    )
}