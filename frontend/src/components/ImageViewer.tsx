import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

interface ImageViewerProps {
    images: string[];
    currentIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function ImageViewer({ images, currentIndex: initialIndex, isOpen, onClose }: ImageViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[110]"
            >
                <X size={28} />
            </button>

            {images.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 sm:left-10 p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all z-[110]"
                    >
                        <ChevronLeft size={32} />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-4 sm:right-10 p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all z-[110]"
                    >
                        <ChevronRight size={32} />
                    </button>
                </>
            )}

            <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                <img
                    src={images[currentIndex]}
                    alt={`Image ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-lg pointer-events-auto animate-in zoom-in-95 duration-500"
                    onClick={(e) => e.stopPropagation()}
                />

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-xl">
                    <p className="text-white font-black tracking-widest text-xs uppercase">
                        Ảnh {currentIndex + 1} / {images.length}
                    </p>
                </div>
            </div>
        </div>
    );
}
