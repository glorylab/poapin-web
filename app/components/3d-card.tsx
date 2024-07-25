// app/components/3d-card.tsx

import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
} from "react";
import { cn } from "~/src/cn";

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

const MouseEnterContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>] | undefined
>(undefined);

export const CardContainer = ({
  children,
  className,
  containerClassName,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);
  const [isGyroEnabled, setIsGyroEnabled] = useState(false);
  const [initialOrientation, setInitialOrientation] = useState<{ beta: number | null; gamma: number | null }>({ beta: null, gamma: null });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isGyroEnabled) return;
    const { left, top, width, height } =
      containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 25;
    const y = (e.clientY - top - height / 2) / 25;
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsMouseEntered(true);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    setIsMouseEntered(false);
    containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
  };

  const handleOrientation = (event: DeviceOrientationEvent) => {
    if (!containerRef.current || !isGyroEnabled) return;
    const { beta, gamma } = event;
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    
    if (beta !== null && gamma !== null) {
      let deltaX, deltaY;
      if (initialOrientation.beta === null || initialOrientation.gamma === null) {
        setInitialOrientation({ beta, gamma });
        return;
      } else {
        deltaX = gamma - initialOrientation.gamma;
        deltaY = beta - initialOrientation.beta;
      }

      // Limit the rotation
      const maxRotation = 7.2;
      const x = isLandscape 
        ? Math.max(-maxRotation, Math.min(maxRotation, deltaX / 5))
        : Math.max(-maxRotation, Math.min(maxRotation, deltaY / 5));
      const y = isLandscape
        ? Math.max(-maxRotation, Math.min(maxRotation, deltaY / 5))
        : Math.max(-maxRotation, Math.min(maxRotation, -deltaX / 5));

      containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
    }
  };

  useEffect(() => {
    const initiate = async () => {
      const requestPermission = (DeviceOrientationEvent as unknown as DeviceOrientationEventiOS).requestPermission;
      const iOS = typeof requestPermission === 'function';
      if (iOS) {
        const permission = await requestPermission();
        if (permission === 'granted') {
          window.addEventListener("deviceorientation", handleOrientation);
        }
      } else {
        window.addEventListener("deviceorientation", handleOrientation);
      }
    };

    if (isGyroEnabled) {
      setInitialOrientation({ beta: null, gamma: null });
      initiate();
    } else {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (containerRef.current) {
        containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isGyroEnabled]);

  return (
    <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
      <div
        className={cn(
          "py-20 flex flex-col items-center justify-center",
          containerClassName
        )}
        style={{
          perspective: "1000px",
        }}
      >
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={cn(
            "flex items-center justify-center relative transition-all duration-200 ease-linear",
            className
          )}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
};

export const CardBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "h-96 w-96 [transform-style:preserve-3d]  [&>*]:[transform-style:preserve-3d]",
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardItem = ({
  as: Tag = "div",
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...rest
}: {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  translateX?: number | string;
  translateY?: number | string;
  translateZ?: number | string;
  rotateX?: number | string;
  rotateY?: number | string;
  rotateZ?: number | string;
  [key: string]: any;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isMouseEntered] = useMouseEnter();

  useEffect(() => {
    handleAnimations();
  }, [isMouseEntered]);

  const handleAnimations = () => {
    if (!ref.current) return;
    if (isMouseEntered) {
      ref.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
    } else {
      ref.current.style.transform = `translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`;
    }
  };

  return (
    <Tag
      ref={ref}
      className={cn("w-fit transition duration-200 ease-linear", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export const useMouseEnter = () => {
  const context = useContext(MouseEnterContext);
  if (context === undefined) {
    throw new Error("useMouseEnter must be used within a MouseEnterProvider");
  }
  return context;
};