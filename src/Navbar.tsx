import NavbarItem from "./NavbarItem.tsx";
import {IconDeviceGamepad, IconServerCog, IconSettings} from "@tabler/icons-react";
export default function Navbar() {

    return (
        <>
            <aside className="navbar navbar-vertical navbar-expand-sm position-absolute" data-bs-theme="dark">
                <div className="container-fluid">
                    <button className="navbar-toggler" type="button">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <h1 className="navbar-brand navbar-brand-autodark">
                        <a href="#">
                            <img src={"/SpectreRELight.png"} className={"me-3"} alt={"Spectre Revival logo"} width={window.innerWidth * 0.05}></img>
                            SpectreRevival
                        </a>
                    </h1>
                    <div className="collapse navbar-collapse" id="sidebar-menu">
                        <ul className="navbar-nav pt-lg-3">
                            <NavbarItem to={"/"} label={"Play"} icon={<IconDeviceGamepad></IconDeviceGamepad>}></NavbarItem>
                            <NavbarItem to={"/servers"} label={"Servers"} icon={<IconServerCog></IconServerCog>}></NavbarItem>
                            <NavbarItem to={"/settings"} label={"Settings"} icon={<IconSettings></IconSettings>}></NavbarItem>
                        </ul>
                    </div>
                </div>
            </aside>
        </>
    )
}