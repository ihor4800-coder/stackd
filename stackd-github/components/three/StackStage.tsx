"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ComponentProps } from "react";
import FlatStack from "../FlatStack";
import { Logo } from "../ui";

function Assembling() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <Logo size={72} className="assemble" />
      <span className="label">Assembling stack</span>
    </div>
  );
}

// Three.js never runs on the server and only loads when a stage is on screen.
const StackCanvas = dynamic(() => import("./StackCanvas"), { ssr: false, loading: Assembling });

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function StackStage(props: ComponentProps<typeof StackCanvas>) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => setOk(webglAvailable()), []);

  if (ok === null) return <Assembling />;
  if (!ok) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6">
        <FlatStack assets={props.assets} className="max-h-[80%] w-full max-w-md" />
        <p className="max-w-xs text-center text-xs text-mute">3D needs WebGL, which this browser has switched off. This flat view shows the same stack and everything else still works.</p>
      </div>
    );
  }
  return <StackCanvas {...props} />;
}
