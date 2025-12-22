import { useState, useEffect } from "react";

/* ---------------------------------- */
/* Types */
/* ---------------------------------- */
interface SlideshowImage {
  src: string;
  alt: string;
}

interface SlideshowProps {
  images: SlideshowImage[];
  autoSlide?: boolean;
  interval?: number;
  className?: string;
  imageClassName?: string;
}

/* ---------------------------------- */
/* Component */
/* ---------------------------------- */
const Slideshow: React.FC<SlideshowProps> = ({
  images,
  autoSlide = true,
  interval = 5000,
  className = "",
  imageClassName = "",
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  /* Auto Slide */
  useEffect(() => {
    if (!autoSlide || images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoSlide, interval, images.length]);

  if (!images.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No images available
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <img
        src={images[currentIndex].src}
        alt={images[currentIndex].alt}
        loading="lazy"
        className={`absolute inset-0 w-full h-full object-contain ${imageClassName}`}
      />
    </div>
  );
};

export default Slideshow;
