"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

type CameraViewProps = {
    onClose: () => void;
    onUploadSuccess?: (data: {
        url: string;
        dishName: string;
        location: string;
        rating: number;
        note: string;
        latitude?: number;
        longitude?: number;
    }) => void;
};

export default function CameraView({ onClose, onUploadSuccess }: CameraViewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
    const [flashOn, setFlashOn] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Review State
    const [dishName, setDishName] = useState("");
    const [location, setLocation] = useState("");
    const [locationCoords, setLocationCoords] = useState<{ latitude: number, longitude: number } | null>(null);
    const [rating, setRating] = useState(5);
    const [note, setNote] = useState("");

    // ... within uploadImage ...


    const startCamera = async () => {
        try {
            setError(null);
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                // Determine why it's missing
                const isSecure = window.isSecureContext;
                throw new Error(`API Camera không tồn tại. Secure Context: ${isSecure}. (Cần HTTPS hoặc localhost)`);
            }

            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            });
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
                // Important for iOS: explicit play
                videoRef.current.play().catch(e => console.error("Error playing video:", e));
            }
        } catch (err: any) {
            console.error("Error accessing camera:", err);
            // Show detailed error for debugging
            setError(`${err.name}: ${err.message}`);
        }
    };

    useEffect(() => {
        // Force reset state on mount
        setCapturedImage(null);
        setError(null);
        setUploading(false);

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [facingMode]);

    const toggleCamera = () => {
        setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1); // Mirror effect fix
                if (facingMode === "environment") {
                    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset for back camera
                }

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageDataUrl = canvas.toDataURL("image/png");
                setCapturedImage(imageDataUrl);
            }
        }
    };

    const handleGalleryClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const retake = () => {
        setCapturedImage(null);
    };

    const uploadImage = async () => {
        if (!capturedImage) return;

        try {
            setUploading(true);

            // 1. Convert Data URL to Blob
            const response = await fetch(capturedImage);
            const blob = await response.blob();

            // 2. Generate unique filename
            const fileName = `camera-upload-${Date.now()}.png`;

            // 3. Upload to Supabase
            const { data, error } = await supabase.storage
                .from('images') // Make sure this bucket exists
                .upload(fileName, blob, {
                    contentType: 'image/png',
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // 4. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(fileName);

            console.log("Uploaded successfully:", publicUrl);
            // alert("Đã tải ảnh lên thành công!"); 
            if (onUploadSuccess) {
                onUploadSuccess({
                    url: publicUrl,
                    dishName,
                    location,
                    rating,
                    note,
                    latitude: locationCoords?.latitude,
                    longitude: locationCoords?.longitude
                });
            }
            onClose();

        } catch (error: any) {
            console.error("Upload failed:", error);
            alert("Lỗi khi tải ảnh: " + (error.message || error));
        } finally {
            setUploading(false);
        }
    };

    const [gettingLocation, setGettingLocation] = useState(false);

    const handleGetLocation = async () => {
        if (!navigator.geolocation) {
            alert("Trình duyệt không hỗ trợ định vị. Hãy thử trình duyệt khác.");
            return;
        }

        setGettingLocation(true);

        // Check permission status first (if supported)
        try {
            if (navigator.permissions) {
                const permStatus = await navigator.permissions.query({ name: 'geolocation' });
                if (permStatus.state === 'denied') {
                    alert("Bạn đã từ chối quyền định vị. Hãy vào Cài đặt trình duyệt > Quyền > Vị trí để bật lại.");
                    setGettingLocation(false);
                    return;
                }
            }
        } catch {
            // permissions API not supported, continue anyway
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setLocationCoords({ latitude, longitude });

                // Reverse geocoding: convert coordinates to address
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=vi`
                    );
                    const geo = await res.json();

                    if (geo && geo.display_name) {
                        // Lấy tên ngắn gọn: road, suburb, city
                        const addr = geo.address;
                        const shortName = [
                            addr?.road,
                            addr?.suburb || addr?.neighbourhood,
                            addr?.city || addr?.town || addr?.village
                        ].filter(Boolean).join(", ");

                        setLocation(shortName || geo.display_name.split(",").slice(0, 3).join(","));
                    } else {
                        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    }
                } catch {
                    // Fallback to coordinates if reverse geocoding fails
                    setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                }

                setGettingLocation(false);
            },
            (error) => {
                setGettingLocation(false);
                console.error("Geolocation error:", error);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        alert("Bạn chưa cấp quyền định vị.\n\nHãy bấm 'Cho phép' (Allow) khi trình duyệt hỏi, hoặc vào Cài đặt để bật lại.");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        alert("Không tìm được vị trí. Hãy thử lại ở nơi có sóng tốt hơn.");
                        break;
                    case error.TIMEOUT:
                        alert("Hết thời gian chờ định vị. Hãy thử lại.");
                        break;
                    default:
                        alert("Không thể lấy vị trí: " + error.message);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Hidden Canvas/Input */}
            <canvas ref={canvasRef} className="hidden" />
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />

            {capturedImage ? (
                // Review/Post State
                <div className="relative flex-1 bg-black flex flex-col">
                    <Image
                        src={capturedImage}
                        alt="Captured"
                        fill
                        className="object-cover"
                    />

                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center pt-safe">
                        <button onClick={retake} className="p-2 text-white/80 hover:text-white">
                            <span className="material-icons-round text-3xl">close</span>
                        </button>
                        <div className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full border border-white/10">
                            <span className="text-white text-xs font-bold tracking-wider">FOOD JOURNAL</span>
                        </div>
                        <div className="w-10"></div> {/* Spacer */}
                    </div>

                    {/* Card Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] p-6 pb-safe animate-slide-up transition-transform duration-300 ease-out z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                        {/* Drag Handle */}
                        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

                        <div className="text-center mb-6 border-b border-gray-100 pb-4">
                            <input
                                type="text"
                                placeholder="Tên món ăn"
                                value={dishName}
                                onChange={(e) => setDishName(e.target.value)}
                                className="w-full text-center text-3xl font-bold text-gray-800 placeholder:text-gray-300 border-none focus:ring-0 bg-transparent p-0"
                            />
                        </div>

                        <div className="space-y-6">
                            {/* Location Input */}
                            <div className="relative">
                                <span className={`absolute left-4 top-1/2 -translate-y-1/2 material-icons-round ${locationCoords ? "text-green-600" : "text-blue-600"}`}>
                                    {locationCoords ? "my_location" : "place"}
                                </span>
                                <input
                                    type="text"
                                    placeholder="Tên quán / Địa điểm"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className={`w-full pl-12 pr-24 py-4 bg-gray-50 border ${locationCoords ? "border-green-200 bg-green-50" : "border-gray-100"} rounded-2xl text-gray-800 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all`}
                                />
                                <button
                                    onClick={handleGetLocation}
                                    disabled={gettingLocation}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${gettingLocation
                                        ? "bg-yellow-100 text-yellow-700"
                                        : locationCoords
                                            ? "bg-green-100 text-green-700"
                                            : "bg-blue-50 hover:bg-blue-100 text-blue-600"
                                        }`}
                                >
                                    {gettingLocation ? (
                                        <span className="flex items-center gap-1">
                                            <span className="material-icons-round text-sm animate-spin">refresh</span>
                                            Đang lấy...
                                        </span>
                                    ) : locationCoords ? "✅ ĐÃ LẤY" : "📍 ĐỊNH VỊ"}
                                </button>
                            </div>

                            {/* Rating */}
                            <div className="flex flex-col items-center gap-3">
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">ĐÁNH GIÁ</span>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className="transition-transform active:scale-90 focus:outline-none"
                                        >
                                            <span className={`material-icons-round text-4xl ${star <= rating ? "text-blue-500" : "text-gray-200"}`}>
                                                favorite
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Note */}
                            <textarea
                                placeholder="Ghi chú nhanh về hương vị..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full p-4 h-24 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white resize-none transition-all"
                            />

                            {/* Submit Button */}
                            <button
                                onClick={uploadImage}
                                disabled={uploading || !location.trim()} // Require location
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                {uploading ? (
                                    <>
                                        <span className="material-icons-round animate-spin">refresh</span>
                                        Đang đăng...
                                    </>
                                ) : (
                                    <>
                                        Đăng lên Feed
                                        <span className="material-icons-round">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                // Camera State
                <>
                    <div className="relative flex-1 bg-black overflow-hidden rounded-b-xl">
                        {/* Top Controls */}
                        <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start pt-safe">
                            <button onClick={onClose} className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white">
                                <span className="material-icons-round text-2xl">close</span>
                            </button>
                            <div className="flex gap-4">
                                <button onClick={() => setFlashOn(!flashOn)} className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white">
                                    <span className="material-icons-round text-2xl">{flashOn ? "flash_on" : "flash_off"}</span>
                                </button>
                            </div>
                        </div>

                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                        />
                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-8 text-center z-20">
                                <div>
                                    <span className="material-icons-round text-5xl text-gray-500 mb-4">no_photography</span>
                                    <p className="text-white text-base leading-relaxed whitespace-pre-wrap mb-6">
                                        Không thể mở Camera.
                                        <br />
                                        <span className="text-sm text-gray-400 block mt-2 opacity-75">
                                            {error}
                                        </span>
                                    </p>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => startCamera()}
                                            className="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center justify-center gap-2 mx-auto transition-colors w-full"
                                        >
                                            <span className="material-icons-round">refresh</span>
                                            Thử lại
                                        </button>

                                        <button
                                            onClick={handleGalleryClick}
                                            className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center justify-center gap-2 mx-auto transition-colors w-full"
                                        >
                                            <span className="material-icons-round">photo_library</span>
                                            Chọn từ thư viện
                                        </button>
                                    </div>

                                    <button onClick={onClose} className="mt-8 text-sm text-gray-500 hover:text-gray-300 transition-colors">
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Controls */}
                    <div className="h-32 bg-black flex items-center justify-between px-8 pb-safe">
                        {/* Gallery */}
                        <button onClick={handleGalleryClick} className="w-12 h-12 rounded-lg bg-gray-800 border-2 border-white/20 overflow-hidden relative">
                            <span className="material-icons-round text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl">photo_library</span>
                        </button>

                        {/* Shutter */}
                        <button
                            onClick={handleCapture}
                            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative group active:scale-95 transition-transform"
                        >
                            <div className="w-16 h-16 rounded-full bg-white group-active:scale-90 transition-transform" />
                        </button>

                        {/* Switch Camera */}
                        <button
                            onClick={toggleCamera}
                            className="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center text-white backdrop-blur-sm active:rotate-180 transition-transform duration-300"
                        >
                            <span className="material-icons-round text-2xl">flip_camera_ios</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
