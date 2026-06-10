import type { ThreeEvent } from "@react-three/fiber";
import type { NodeSnapshot } from "../domain/types";
import type { ScenePosition } from "./layout";

type NodeMeshProps = {
  node: NodeSnapshot;
  position: ScenePosition;
  selected: boolean;
  onSelect: (nodeId: string) => void;
};

const NODE_COLORS: Record<NodeSnapshot["role"], string> = {
  leader: "#f59e0b",
  candidate: "#2563eb",
  follower: "#5f6f82"
};

export function NodeMesh({ node, position, selected, onSelect }: NodeMeshProps) {
  const isDown = node.status === "down";
  const nodeColor = isDown ? "#68717d" : NODE_COLORS[node.role];
  const opacity = isDown ? 0.34 : 1;
  const yOffset = isDown ? -0.18 : 0;

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onSelect(node.id);
  }

  return (
    <group position={[position[0], position[1] + yOffset, position[2]]} onClick={handleClick}>
      {node.role === "leader" && !isDown ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
          <torusGeometry args={[0.72, 0.045, 12, 48]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.7} />
        </mesh>
      ) : null}

      {selected ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <torusGeometry args={[0.9, 0.035, 12, 48]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.82} />
        </mesh>
      ) : null}

      <mesh>
        <sphereGeometry args={[0.44, 32, 20]} />
        <meshStandardMaterial color={nodeColor} emissive={nodeColor} emissiveIntensity={isDown ? 0.02 : 0.18} transparent opacity={opacity} />
      </mesh>

      <mesh position={[0.26, 0.24, 0.24]}>
        <sphereGeometry args={[0.09, 12, 8]} />
        <meshBasicMaterial color={isDown ? "#8b1f2d" : "#16a34a"} transparent opacity={isDown ? 0.5 : 1} />
      </mesh>
    </group>
  );
}
