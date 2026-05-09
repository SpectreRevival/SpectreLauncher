import { Link, useLocation } from "react-router-dom";

export interface NavbarItemProps {
    to: string;
    label: string;
    icon?: React.ReactNode;
}

export default function NavbarItem({ to, label, icon }: NavbarItemProps) {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <li className={`nav-item ${isActive ? 'active' : ''}`}>
            <Link className={"nav-link"} to={to}>
                {icon ?
                    <span className={"nav-link-icon d-md-none d-lg-inline-block"}>{icon}</span>
                    : <></>
                }
                <span className={"nav-link-title"}>{label}</span>
            </Link>
        </li>
    )
}