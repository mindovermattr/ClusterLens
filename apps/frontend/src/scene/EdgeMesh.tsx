import type { EdgeState, ScenePosition } from "./layout";

type EdgeMeshProps = {
  source: ScenePosition;
  target: ScenePosition;
  state: EdgeState;
};

export function EdgeMesh({ source, target, state }: EdgeMeshProps) {
  const color = state === "blocked" ? "#d97706" : "#8da0b6";
  const opacity = state === "blocked" ? 0.32 : 0.42;
  const points = new Float32Array([...source, ...target]);

  if (state === "blocked") {
    return (
      <group>
        <line>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[points, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={color} transparent opacity={opacity} />
        </line>
        <mesh position={midpoint(source, target)}>
          <boxGeometry args={[0.24, 0.24, 0.24]} />
          <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.2} />
        </mesh>
      </group>
    );
  }

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  );
}

function midpoint(source: ScenePosition, target: ScenePosition): ScenePosition {
  return [(source[0] + target[0]) / 2, 0.02, (source[2] + target[2]) / 2];
}
