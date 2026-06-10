import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";
import type { NetworkMessageSnapshot } from "../domain/types";
import { getMessageProgress, type ScenePosition } from "./layout";

type MessageParticleProps = {
  message: NetworkMessageSnapshot;
  source: ScenePosition;
  target: ScenePosition;
  nowMs: number;
};

const MESSAGE_COLORS: Record<NetworkMessageSnapshot["type"], string> = {
  heartbeat: "#22c55e",
  election: "#3b82f6",
  answer: "#06b6d4",
  coordinator: "#f59e0b"
};

export function MessageParticle({ message, source, target, nowMs }: MessageParticleProps) {
  const meshRef = useRef<Mesh>(null);
  const timeAnchorRef = useRef<{ clockMs: number; snapshotMs: number } | null>(null);
  const color = MESSAGE_COLORS[message.type];

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    const clockMs = clock.getElapsedTime() * 1000;
    if (!timeAnchorRef.current || timeAnchorRef.current.snapshotMs !== nowMs) {
      timeAnchorRef.current = { clockMs, snapshotMs: nowMs };
    }

    const currentMs = timeAnchorRef.current.snapshotMs + (clockMs - timeAnchorRef.current.clockMs);
    const progress = getMessageProgress(message, currentMs);
    const arc = Math.sin(progress * Math.PI) * 0.72;

    mesh.position.set(
      source[0] + (target[0] - source[0]) * progress,
      0.28 + arc,
      source[2] + (target[2] - source[2]) * progress
    );
  });

  return (
    <mesh ref={meshRef} position={source}>
      <sphereGeometry args={[0.13, 16, 12]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
    </mesh>
  );
}
