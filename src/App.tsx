import "@tabler/core/dist/css/tabler.min.css";
import "./App.css";
import Navbar from "./Navbar.tsx";
import { Routes, Route } from "react-router-dom";
import PlayPage from "./pages/PlayPage.tsx";
import ServersPage from "./pages/ServersPage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";

function App() {

  return (
    <div className={"page"}>
        <Navbar></Navbar>
        <div className={"page-wrapper"}>
            <div className={"page-body"}>
                <div className={"container-xl"}>
                    <Routes>
                        <Route path={"/"} element={<PlayPage></PlayPage>}></Route>
                        <Route path={"/servers"} element={<ServersPage></ServersPage>}></Route>
                        <Route path={"/settings"} element={<SettingsPage></SettingsPage>}></Route>
                        <Route path={"*"} element={<NotFoundPage></NotFoundPage>}></Route>
                    </Routes>
                </div>
            </div>
        </div>
    </div>
  );
}

export default App;
