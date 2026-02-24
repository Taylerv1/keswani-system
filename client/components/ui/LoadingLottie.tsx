"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface LoadingLottieProps {
  size?: number;
  className?: string;
  src?: string;
  zoom?: number;
}

const DEFAULT_LOADING_SRC =
  "https://lottie.host/4adb13b3-ba40-4c21-b97c-9327bb81880b/JEsxyqiDzb.lottie";

export default function LoadingLottie({
  size = 56,
  className,
  src = DEFAULT_LOADING_SRC,
  zoom = 2.6,
}: LoadingLottieProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      role="status"
      aria-label="Loading"
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${zoom})`,
          transformOrigin: "center",
        }}
      >
        <DotLottieReact src={src} loop autoplay style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
