import {useEffect, useState} from "react";
import {invoke} from "@tauri-apps/api/core";
import {IconPlus, IconX} from "@tabler/icons-react";

export default function ServersPage() {
    const [serverRunning, setServerRunning] = useState(false);
    const [gamePort, setGamePort] = useState<number>(0);
    const [socialPort, setSocialPort] = useState<number>(0);
    const [websocketPort, setWebsocketPort] = useState<number>(0);

    useEffect(() => {
        setInterval(async () => {
            setServerRunning(await invoke("is_server_running"));
        }, 10);
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

    function LaunchBackend(){
        invoke("launch_pragmabackend", {
            gamePort: Number(gamePort),
            socialPort: Number(socialPort),
            websocketPort: Number(websocketPort)
        }).catch(err => console.error("Failed to launch:", err));
    }

    return (
        <>
            {serverRunning
                ? <h1>Server is running</h1>
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
                                        <input type={"number"} className={"form-control"} name={"gamePort"} placeholder={"Enter game traffic port"} value={gamePort} onChange={HandleGamePortChange}></input>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Social Port</label>
                                        <input type={"number"} className={"form-control"} name={"socialPort"} placeholder={"Enter social traffic port"} value={socialPort} onChange={HandleSocialPortChange}></input>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Websocket Port</label>
                                        <input type={"number"} className={"form-control"} name={"websocketPort"} placeholder={"Enter websocket traffic port"} value={websocketPort} onChange={HandleWebsocketPortChange}></input>
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