import {useEffect, useState} from "react";
import {IconAlertTriangle, IconCheck, IconEdit, IconX} from "@tabler/icons-react";
import {open} from "@tauri-apps/plugin-dialog";
import {LazyStore} from "@tauri-apps/plugin-store";
import {invoke} from "@tauri-apps/api/core";

interface Settings {
  binaryPath: string;
  backendAddress: string;
  backendPort: number;
}

const store = new LazyStore('settingsStore.json', {
  autoSave: true,
  defaults: {
    binaryPath: "",
    backendAddress: "localhost",
    backendPort: 8080,
  }
});

const defaultSettings: Settings = {
  binaryPath: "",
  backendAddress: "localhost",
  backendPort: 8080,
};

export default function SettingsPage() {

  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings); // default values will be set by initial useEffect
  useEffect(() => {
    async function initSettings() {
      const savedBinary = await store.get<string>("binaryPath");
      const savedAddress = await store.get<string>("backendAddress");
      const savedPort = await store.get<number>("backendPort");
      const loadedSettings = {
        binaryPath: savedBinary ?? defaultSettings.binaryPath,
        backendAddress: savedAddress ?? defaultSettings.backendAddress,
        backendPort: savedPort ?? defaultSettings.backendPort,
      };
      if(loadedSettings.binaryPath == ""){
        const discoveredPath = await invoke<string | null>("find_spectre_divide_path");
        if(discoveredPath != null){
          loadedSettings.binaryPath = discoveredPath;
        }
      }
      setSettings(loadedSettings);
      setEditSettings(loadedSettings);
      if (savedBinary === null) await store.set("binaryPath", loadedSettings.binaryPath);
      if (savedAddress === null) await store.set("backendAddress", loadedSettings.backendAddress);
      if (savedPort === null) await store.set("backendPort", loadedSettings.backendPort);
    }
    initSettings();
  }, []);

  const [editSettings, setEditSettings] = useState<Settings>(settings);

  const handleEdit = () => {
    setEditSettings(settings);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSettings(editSettings);
    setIsEditing(false);
    await store.set("binaryPath", editSettings.binaryPath);
    await store.set("backendAddress", editSettings.backendAddress);
    await store.set("backendPort", editSettings.backendPort);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const ResetSettings = async () => {
    setEditSettings(defaultSettings);
  };

  async function PickFile(){
    const path = await open({
      multiple: false,
      filters: [
        {
          name: "Executables",
          extensions: ["exe", ""]
        }
      ]
    })
    setEditSettings({...editSettings, binaryPath: path ? path : ""})
  }

  const handleInputChange = (key: keyof Settings, value: string | number) => {
    setEditSettings({ ...editSettings, [key]: value });
  };

  return (
    <div className="container-xl py-5">
      <div className="page-wrapper">
        <div className="page-body">
          <div className="row mb-4">
            <div className="col-12">
              <h1 className="mb-4">Settings</h1>
            </div>
          </div>

          {/* Settings Card */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  {/* Binary Path Setting */}
                  <div className="row mb-4 align-items-center">
                    <div className="col-md-3">
                      <label className="form-label mb-0">
                        <strong>SpectreDivide Binary Path</strong>
                      </label>
                    </div>
                    <div className="col-md-7">
                      {isEditing ? (
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            value={editSettings.binaryPath}
                            onChange={(e) => handleInputChange("binaryPath", e.target.value)}
                            placeholder="Enter path or browse"
                          />
                          <button className="btn btn-outline-secondary" type="button" onClick={PickFile}>
                            Browse
                          </button>
                        </div>
                      ) : (
                        <div className="form-control-plaintext">{settings.binaryPath || "Not set"}</div>
                      )}
                    </div>
                  </div>

                  {/* Backend Address Setting */}
                  <div className="row mb-4 align-items-center">
                    <div className="col-md-3">
                      <label className="form-label mb-0">
                        <strong>Backend Address</strong>
                      </label>
                    </div>
                    <div className="col-md-7">
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-control"
                          value={editSettings.backendAddress}
                          onChange={(e) => handleInputChange("backendAddress", e.target.value)}
                          placeholder="e.g., localhost or 192.168.1.1"
                        />
                      ) : (
                        <div className="form-control-plaintext">{settings.backendAddress}</div>
                      )}
                    </div>
                  </div>

                  {/* Backend Port Setting */}
                  <div className="row mb-4 align-items-center">
                    <div className="col-md-3">
                      <label className="form-label mb-0">
                        <strong>Backend Port</strong>
                      </label>
                    </div>
                    <div className="col-md-7">
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-control"
                          value={editSettings.backendPort}
                          onChange={(e) => handleInputChange("backendPort", parseInt(e.target.value))}
                          placeholder="e.g., 8080"
                          min="1"
                          max="65535"
                        />
                      ) : (
                        <div className="form-control-plaintext">{settings.backendPort}</div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="row">
                    <div className="col-md-10">
                      {!isEditing ? (
                        <button className="btn btn-primary" onClick={handleEdit}>
                          <IconEdit size={20} className="me-2" />
                          Edit Settings
                        </button>
                      ) : (
                        <div className="btn-group" role="group">
                          <button className="btn btn-success" onClick={handleSave}>
                            <IconCheck size={20} className="me-2" />
                            Save
                          </button>
                          <button className="btn btn-secondary" onClick={handleCancel}>
                            <IconX size={20} className="me-2" />
                            Cancel
                          </button>
                          <button className={"btn btn-danger"} onClick={ResetSettings}>
                            <IconAlertTriangle size={20} className={"me-2"}></IconAlertTriangle>
                            Reset Settings
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}