import { lazy, Suspense, useEffect, useRef, useState } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
}

export default function SplineScene({ scene, className = "", style, onLoad }: SplineSceneProps) {
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  return (
    <div
      ref={containerRef}
      className={`spline-scene-container ${className}`}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Loading shimmer */}
      {!loaded && (
        <div
          className="spline-loading"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            zIndex: 1,
          }}
        >
          <div className="spline-loader" />
        </div>
      )}

      <Suspense fallback={null}>
        <Spline
          scene={scene}
          onLoad={handleLoad}
          style={{
            width: "100%",
            height: "100%",
            opacity: loaded ? 1 : 0,
            transition: "opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </Suspense>
    </div>
  );
}
