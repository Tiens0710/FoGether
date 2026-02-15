"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

type CameraViewProps = {
    onClose: () => void;
    onUploadSuccess?: (url: string) => void;
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

    const startCamera = async () => {
        try {
            setError(null);
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Trình duyệt không hỗ trợ Camera hoặc context không an toàn (cần HTTPS/localhost).");
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
            }
        } catch (err: any) {
            console.error("Error accessing camera:", err);
            setError("Không thể truy cập Camera. Vui lòng cấp quyền, dùng HTTPS hoặc thử trên thiết bị khác.\n" + (err.message || err));
        }
    };

    useEffect(() => {
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
                onUploadSuccess(publicUrl);
            }
            onClose();

        } catch (error: any) {
            console.error("Upload failed:", error);
            alert("Lỗi khi tải ảnh: " + (error.message || error));
        } finally {
            setUploading(false);
        }
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
                // Preview State
                <div className="relative flex-1 bg-black flex items-center justify-center">
                    <Image
                        src={capturedImage}
                        alt="Captured"
                        fill
                        className="object-contain"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-8 flex justify-between items-center bg-gradient-to-t from-black/80 to-transparent">
                        <button
                            onClick={retake}
                            disabled={uploading}
                            className="text-white font-semibold text-lg drop-shadow-md disabled:opacity-50"
                        >
                            Chụp lại
                        </button>
                        <button
                            onClick={uploadImage}
                            disabled={uploading}
                            className="bg-primary text-white px-6 py-2 rounded-full font-bold shadow-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <span className="material-icons-round animate-spin">refresh</span>
                                    Đang tải...
                                </>
                            ) : (
                                "Sử dụng"
                            )}
                        </button>
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
                                            (Trình duyệt chặn do chưa cấp quyền hoặc không phải HTTPS)
                                        </span>
                                    </p>

                                    <button
                                        onClick={handleGalleryClick}
                                        className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 mx-auto transition-colors"
                                    >
                                        <span className="material-icons-round">photo_library</span>
                                        Chọn từ thư viện
                                    </button>

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
