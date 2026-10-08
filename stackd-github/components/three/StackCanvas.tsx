"use client";

import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { fmtPct } from "@/lib/allocation";
import { layoutStack, SIDE, type Cell } from "@/lib/layout3d";
import type { Finish, StackAsset } from "@/lib/types";
import { glowTexture, gradientTexture, labelTexture, tickerTexture } from "./textures";

export interface StackApi {
  /** Renders a clean, centred frame and returns it as a PNG data URL. */
  capture: () => string | null;
  resetCamera: () => void;
}

interface Props {
  assets: StackAsset[];
  mode: "hero" | "builder";
  exploded?: boolean;
  showLabels?: boolean;
  autoRotate?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  apiRef?: MutableRefObject<StackApi | null>;
  /** reduced motion: no drift, no easing */
  calm?: boolean;
}

const EXPLODE = 0.95;
const CAM_DIR = new THREE.Vector3(6.4, 4.4, 7.6).normalize();
const BASE_DIST = 10.8;
const ZERO: [number, number, number] = [0, 0, 0];
const FLOOR = -SIDE / 2 - 0.05;

const FINISH: Record<Finish, THREE.MeshPhysicalMaterialParameters & { glow: number }> = {
  glass: { metalness: 0.15, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04, iridescence: 0.55, envMapIntensity: 1.5, glow: 0.24 },
  metal: { metalness: 0.95, roughness: 0.26, clearcoat: 0.35, clearcoatRoughness: 0.2, envMapIntensity: 1.6, glow: 0.07 },
  ceramic: { metalness: 0.05, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25, envMapIntensity: 1, glow: 0.05 },
  gloss: { metalness: 0.25, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.3, glow: 0.12 },
  satin: { metalness: 0.1, roughness: 0.5, clearcoat: 0.15, sheen: 0.6, envMapIntensity: 0.9, glow: 0.08 },
};

const decalGeo = new THREE.PlaneGeometry(1, 0.5);
const WHITE = new THREE.Color("#ffffff");
const DIM = new THREE.Color("#5b6072");
const noRaycast = () => null;

function distFor(aspect: number, exploded: boolean) {
  return BASE_DIST * Math.max(1, 1.12 / aspect) * (exploded ? 1.42 : 1);
}

interface BlockProps {
  asset: StackAsset;
  cell: Cell;
  leaving: boolean;
  index: number;
  ex: MutableRefObject<number>;
  selected: boolean;
  dimmed: boolean;
  hovered: boolean;
  labels: boolean;
  calm: boolean;
  fontsReady: boolean;
  interactive: boolean;
  onHover: (id: string | null) => void;
  onSelect?: (id: string | null) => void;
}

function Block({ asset, cell, leaving, index, ex, selected, dimmed, hovered, labels, calm, fontsReady, interactive, onHover, onSelect }: BlockProps) {
  const group = useRef<THREE.Group>(null!);
  const mesh = useRef<THREE.Mesh>(null!);
  const sprite = useRef<THREE.Sprite>(null!);
  const decals = useRef<(THREE.Mesh | null)[]>([]);
  const cur = useRef(new THREE.Vector3(0.02, 0.02, 0.02));
  const built = useRef(new THREE.Vector3());
  const started = useRef(false);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const material = useMemo(() => {
    const { glow, ...params } = FINISH[asset.finish];
    const m = new THREE.MeshPhysicalMaterial({ ...params, map: gradientTexture(asset.color, asset.color2), emissive: asset.color, emissiveIntensity: glow });
    m.userData.glow = glow;
    return m;
  }, [asset.color, asset.color2, asset.finish]);
  useEffect(() => () => material.dispose(), [material]);

  const decalMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tickerTexture(asset.ticker, asset.color, fontsReady),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [asset.ticker, asset.color, fontsReady],
  );
  useEffect(() => () => decalMat.dispose(), [decalMat]);

  const labelMat = useMemo(() => new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false, opacity: 0 }), []);
  useEffect(() => () => labelMat.dispose(), [labelMat]);
  useEffect(() => {
    labelMat.map = labelTexture(asset.ticker, fmtPct(asset.bp), asset.color, fontsReady);
    labelMat.needsUpdate = true;
  }, [labelMat, asset.ticker, asset.bp, asset.color, fontsReady]);

  useLayoutEffect(() => {
    // labels stay out of the contact-shadow pass, which only sees layer 0
    sprite.current.layers.set(1);
    const m = mesh.current;
    return () => m.geometry.dispose();
  }, []);

  useFrame((state, dt) => {
    const k = calm ? 1 : 1 - Math.exp(-Math.min(dt, 0.05) * 8);
    const e = ex.current;

    tmp.set(cell.center[0], cell.center[1], cell.center[2]).multiplyScalar(1 + EXPLODE * e);
    if (!calm) tmp.y += Math.sin(state.clock.elapsedTime * 0.9 + index * 1.7) * 0.05 * e;
    if (!started.current) {
      // new blocks drop in from above and grow into their cell
      group.current.position.copy(tmp);
      if (!calm) group.current.position.y += 1.3;
      started.current = true;
    }
    group.current.position.lerp(tmp, k);
    const s = THREE.MathUtils.lerp(group.current.scale.x, hovered && !leaving ? 1.035 : 1, k);
    group.current.scale.setScalar(s);

    const target = leaving ? ZERO : cell.size;
    cur.current.x = THREE.MathUtils.lerp(cur.current.x, target[0], k);
    cur.current.y = THREE.MathUtils.lerp(cur.current.y, target[1], k);
    cur.current.z = THREE.MathUtils.lerp(cur.current.z, target[2], k);
    const w = Math.max(0.02, cur.current.x);
    const h = Math.max(0.02, cur.current.y);
    const d = Math.max(0.02, cur.current.z);
    const b = built.current;
    if (Math.abs(b.x - w) > 0.003 || Math.abs(b.y - h) > 0.003 || Math.abs(b.z - d) > 0.003) {
      // rebuilt instead of scaled so corner radii stay true while a block resizes
      mesh.current.geometry.dispose();
      mesh.current.geometry = new RoundedBoxGeometry(w, h, d, 4, Math.min(0.13, Math.min(w, h, d) * 0.3));
      b.set(w, h, d);
    }
    const solid = Math.min(w, h, d) > 0.04;
    mesh.current.visible = solid;

    material.color.lerp(dimmed ? DIM : WHITE, k);
    const glow = (material.userData.glow as number) + (hovered ? 0.22 : 0) + (selected ? 0.2 : 0);
    material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, dimmed ? 0.02 : glow, k);

    const eps = 0.006;
    const faces: [number, number, number, number, number][] = [
      [w, h, 0, 0, d / 2 + eps],
      [w, h, 0, 0, -d / 2 - eps],
      [d, h, w / 2 + eps, 0, 0],
      [d, h, -w / 2 - eps, 0, 0],
      [w, d * 2, 0, h / 2 + eps, 0],
    ];
    for (let i = 0; i < 5; i++) {
      const p = decals.current[i];
      if (!p) continue;
      const [fw, fh, x, y, z] = faces[i];
      const width = Math.min(fw * 0.7, fh * 0.7, 1.5);
      p.visible = solid && width > 0.2;
      p.position.set(x, y, z);
      p.scale.set(width, width, 1);
    }
    decalMat.opacity = THREE.MathUtils.lerp(decalMat.opacity, dimmed ? 0.35 : 1, k);

    sprite.current.position.set(0, h / 2 + 0.3, 0);
    labelMat.opacity = THREE.MathUtils.lerp(labelMat.opacity, labels && solid && !leaving ? 1 : 0, k);
    sprite.current.visible = labelMat.opacity > 0.02;
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(asset.id);
  };

  return (
    <group ref={group}>
      <mesh
        ref={mesh}
        material={material}
        onPointerOver={interactive ? over : undefined}
        onPointerOut={interactive ? () => onHover(null) : undefined}
        onClick={
          interactive
            ? (e) => {
                e.stopPropagation();
                if (e.delta < 6) onSelect?.(asset.id);
              }
            : undefined
        }
      />
      {[0, Math.PI, Math.PI / 2, -Math.PI / 2].map((ry, i) => (
        <mesh key={i} ref={(m) => void (decals.current[i] = m)} geometry={decalGeo} material={decalMat} rotation={[0, ry, 0]} raycast={noRaycast} />
      ))}
      <mesh ref={(m) => void (decals.current[4] = m)} geometry={decalGeo} material={decalMat} rotation={[-Math.PI / 2, 0, 0]} raycast={noRaycast} />
      <sprite ref={sprite} material={labelMat} scale={[1.26, 0.36, 1]} renderOrder={20} raycast={noRaycast} />
    </group>
  );
}

type Controls = { target: THREE.Vector3; update: () => void; addEventListener: (t: string, f: () => void) => void; removeEventListener: (t: string, f: () => void) => void };

function Scene({ assets, mode, exploded = false, showLabels = false, autoRotate = true, selectedId = null, onSelect, apiRef, calm = false }: Props) {
  const { gl, scene, camera, size } = useThree();
  const controls = useThree((s) => s.controls) as unknown as Controls | null;
  const root = useRef<THREE.Group>(null!);
  const frame = useRef<THREE.LineSegments>(null!);
  const ex = useRef(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [stageHover, setStageHover] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [, bump] = useState(0);
  const builder = mode === "builder";

  const cells = useMemo(() => layoutStack(assets), [assets]);

  // removed blocks keep rendering for a moment so they can shrink away
  const prev = useRef<{ assets: StackAsset[]; cells: Map<string, Cell> }>({ assets: [], cells: new Map() });
  const leaving = useRef(new Map<string, { asset: StackAsset; cell: Cell; at: number }>());
  if (prev.current.assets !== assets) {
    for (const a of prev.current.assets) {
      const cell = prev.current.cells.get(a.id);
      if (cell && !assets.some((b) => b.id === a.id)) leaving.current.set(a.id, { asset: a, cell, at: performance.now() });
    }
    for (const a of assets) leaving.current.delete(a.id);
    prev.current = { assets, cells };
  }

  useEffect(() => {
    let alive = true;
    document.fonts.ready.then(() => alive && setFontsReady(true));
    camera.layers.enable(1);
    return () => {
      alive = false;
    };
  }, [camera]);

  useEffect(() => {
    document.body.style.cursor = hovered && builder ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered, builder]);

  // hero: pointer over the canvas loosens the stack a little
  useEffect(() => {
    if (builder) return;
    const el = gl.domElement;
    const on = () => setStageHover(true);
    const off = () => setStageHover(false);
    el.addEventListener("pointerenter", on);
    el.addEventListener("pointerleave", off);
    return () => {
      el.removeEventListener("pointerenter", on);
      el.removeEventListener("pointerleave", off);
    };
  }, [gl, builder]);

  // camera goals: eased toward until reached or until the user grabs the view
  const goal = useRef<{ target: THREE.Vector3; dist: number; pos?: THREE.Vector3 } | null>(null);
  const aspect = size.width / Math.max(1, size.height);
  const live = useRef({ cells, exploded, aspect });
  live.current = { cells, exploded, aspect };

  useEffect(() => {
    if (!builder) {
      camera.position.copy(CAM_DIR).multiplyScalar(distFor(aspect, false) * 0.94);
      camera.lookAt(0, 0, 0);
    }
  }, [builder, camera, aspect]);

  useEffect(() => {
    if (!builder) return;
    const cell = selectedId ? live.current.cells.get(selectedId) : undefined;
    if (cell && cell.size[0] > 0) {
      const f = 1 + (exploded ? EXPLODE : 0);
      goal.current = { target: new THREE.Vector3(...cell.center).multiplyScalar(f), dist: distFor(live.current.aspect, exploded) * 0.78 };
    } else {
      goal.current = { target: new THREE.Vector3(), dist: distFor(live.current.aspect, exploded) };
    }
  }, [builder, selectedId, exploded]);

  useEffect(() => {
    if (!controls) return;
    const stop = () => (goal.current = null);
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls]);

  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      resetCamera: () => {
        const dist = distFor(live.current.aspect, live.current.exploded);
        goal.current = { target: new THREE.Vector3(), dist, pos: CAM_DIR.clone().multiplyScalar(dist) };
      },
      capture: () => {
        try {
          const pos = camera.position.clone();
          const quat = camera.quaternion.clone();
          const rootY = root.current.position.y;
          root.current.position.y = 0;
          camera.position.copy(CAM_DIR).multiplyScalar(distFor(live.current.aspect, live.current.exploded));
          camera.lookAt(0, 0, 0);
          camera.updateMatrixWorld();
          // the card shows every block at full strength, even if one is selected on screen
          const undo: (() => void)[] = [];
          scene.traverse((o) => {
            const m = (o as THREE.Mesh).material;
            if (m instanceof THREE.MeshPhysicalMaterial && typeof m.userData.glow === "number") {
              const color = m.color.clone();
              const glow = m.emissiveIntensity;
              m.color.copy(WHITE);
              m.emissiveIntensity = m.userData.glow;
              undo.push(() => {
                m.color.copy(color);
                m.emissiveIntensity = glow;
              });
            } else if (m instanceof THREE.MeshBasicMaterial && m.polygonOffset) {
              const opacity = m.opacity;
              m.opacity = 1;
              undo.push(() => (m.opacity = opacity));
            }
          });
          gl.render(scene, camera);
          const url = gl.domElement.toDataURL("image/png");
          undo.forEach((f) => f());
          camera.position.copy(pos);
          camera.quaternion.copy(quat);
          camera.updateMatrixWorld();
          root.current.position.y = rootY;
          gl.render(scene, camera);
          return url;
        } catch {
          return null;
        }
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, camera, gl, scene]);

  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, dt) => {
    const k = calm ? 1 : 1 - Math.exp(-Math.min(dt, 0.05) * 5.5);
    const want = builder ? (exploded ? 1 : 0) : stageHover ? 0.2 : 0;
    ex.current = Math.abs(want - ex.current) < 0.0005 ? want : THREE.MathUtils.lerp(ex.current, want, k);

    if (!calm) root.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
    if (!builder) {
      if (!calm) root.current.rotation.y += dt * 0.22;
      root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, -state.pointer.y * 0.16, k * 0.6);
      root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, -state.pointer.x * 0.1, k * 0.6);
    }
    if (frame.current) (frame.current.material as THREE.LineBasicMaterial).opacity = 0.16 * (1 - ex.current);

    const g = goal.current;
    if (g && controls) {
      controls.target.lerp(g.target, k);
      if (g.pos) camera.position.lerp(g.pos, k);
      v.copy(camera.position).sub(controls.target);
      const len = v.length();
      v.setLength(THREE.MathUtils.lerp(len, g.dist, k));
      camera.position.copy(controls.target).add(v);
      controls.update();
      const posDone = !g.pos || camera.position.distanceTo(g.pos) < 0.05;
      if (controls.target.distanceTo(g.target) < 0.01 && Math.abs(len - g.dist) < 0.03 && posDone) goal.current = null;
    }

    if (leaving.current.size) {
      const now = performance.now();
      let changed = false;
      for (const [id, l] of leaving.current) {
        if (now - l.at > 650) {
          leaving.current.delete(id);
          changed = true;
        }
      }
      if (changed) bump((n) => n + 1);
    }
  });

  const frameGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(SIDE, SIDE, SIDE)), []);
  const labels = builder && (showLabels || exploded);
  const blocks = [
    ...assets.map((asset) => ({ asset, cell: cells.get(asset.id)!, leaving: false })),
    ...[...leaving.current.values()].map((l) => ({ asset: l.asset, cell: l.cell, leaving: true })),
  ];

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 6]} intensity={2.4} />
      <directionalLight position={[-7, 3, -4]} intensity={1.1} color="#68E9FF" />
      <directionalLight position={[2, -3, -7]} intensity={0.9} color="#8A78FF" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 6, 2]} rotation={[-Math.PI / 2, 0, 0]} scale={[9, 9, 1]} color="#F6F8FF" />
        <Lightformer form="rect" intensity={2.2} position={[-7, 1, 2]} rotation={[0, Math.PI / 2, 0]} scale={[8, 5, 1]} color="#68E9FF" />
        <Lightformer form="rect" intensity={1.8} position={[7, 2, -2]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 5, 1]} color="#4285FF" />
        <Lightformer form="rect" intensity={1.2} position={[0, 1, -8]} scale={[10, 4, 1]} color="#8A78FF" />
        <Lightformer form="rect" intensity={0.5} position={[0, -6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[9, 9, 1]} color="#2443DA" />
      </Environment>

      <group ref={root}>
        {blocks.map((b, i) => (
          <Block
            key={b.asset.id}
            asset={b.asset}
            cell={b.cell}
            leaving={b.leaving}
            index={i}
            ex={ex}
            selected={selectedId === b.asset.id}
            dimmed={Boolean(selectedId) && selectedId !== b.asset.id}
            hovered={builder && hovered === b.asset.id}
            labels={labels}
            calm={calm}
            fontsReady={fontsReady}
            interactive={builder}
            onHover={setHovered}
            onSelect={onSelect}
          />
        ))}
        {builder && (
          <lineSegments ref={frame} geometry={frameGeo} raycast={noRaycast}>
            <lineBasicMaterial color="#68E9FF" transparent opacity={0.16} depthWrite={false} />
          </lineSegments>
        )}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR - 0.02, 0]} raycast={noRaycast}>
        <planeGeometry args={[11, 11]} />
        <meshBasicMaterial map={glowTexture()} transparent depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <ContactShadows position={[0, FLOOR, 0]} scale={11} blur={2.6} far={4.5} opacity={0.75} resolution={512} color="#02030a" />

      {builder && (
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={5}
          maxDistance={24}
          maxPolarAngle={Math.PI * 0.62}
          autoRotate={autoRotate && !calm && !selectedId}
          autoRotateSpeed={0.7}
        />
      )}
    </>
  );
}

export default function StackCanvas(props: Props) {
  const start = CAM_DIR.clone().multiplyScalar(BASE_DIST * 1.25);
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [start.x, start.y, start.z], fov: 32, near: 0.5, far: 80 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" }}
      onPointerMissed={(e) => {
        if (props.mode === "builder" && e.type === "click") props.onSelect?.(null);
      }}
      style={{ touchAction: props.mode === "builder" ? "none" : "pan-y" }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
