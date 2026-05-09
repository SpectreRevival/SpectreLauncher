import { useEffect, useState } from "react";
import { IconPlayerPlay } from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";

export default function PlayPage() {
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [spectreLaunched, setSpectreLaunched] = useState(false);
    const [tryingToLaunch, setTryingToLaunch] = useState(false);
    const carouselImages: string[] = [
        "/carousel/LoadingScreen_Commons.png",
        "/carousel/metro-4k.png",
        "/carousel/mill-4k.png",
        "/carousel/skyway-4k.png"
    ];

    function LaunchSpectre() {
        setTryingToLaunch(true);
        invoke("launch_spectre_divide");
    }

    useEffect(() => {
        const interval = setInterval(async () => {
            const isRunning = await invoke<boolean>("has_spectre_been_launched");
            setSpectreLaunched(isRunning);
            if (isRunning && tryingToLaunch) {
                setTryingToLaunch(false);
            }
        }, 10);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (carouselImages.length === 0) return;

        const interval = setInterval(() => {
            setCarouselIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [carouselImages.length]);

    return (
        <div
            className="position-fixed"
            style={{
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundImage: `url(${carouselImages[carouselIndex]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                transition: "background-image 0.6s ease-in-out",
            }}
        >
            {/* Overlay */}
            <div className="position-absolute w-100 h-100 bg-dark" style={{ top: 0, left: 0, opacity: 0.4, zIndex: 1 }} />

            {/* Play Button */}
            : <button className={`btn btn-primary btn-lg d-flex align-items-center gap-2 position-absolute ${spectreLaunched ? 'disabled' : ''}`}
                style={{ bottom: "2rem", right: "2rem", zIndex: 2 }} onClick={LaunchSpectre}>
                {!tryingToLaunch
                    ? <IconPlayerPlay size={24} />
                    : <div className="spinner-border text-white" role="status"></div>
                }
                <span>Play</span>
            </button>
        </div>
    );
}