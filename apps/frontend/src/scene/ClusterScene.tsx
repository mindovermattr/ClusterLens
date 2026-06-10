import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import type { ClusterSnapshot, NetworkMessageSnapshot } from "../domain/types";
import { EdgeMesh } from "./EdgeMesh";
import { NodeLabel } from "./labels";
import { getEdgeState, getNodeLayout, getSceneEdges, isMessageVisible } from "./layout";
import { MessageParticle } from "./MessageParticle";
import { NodeMesh } from "./NodeMesh";

type ClusterSceneProps = {
  snapshot: ClusterSnapshot | null;
  activeMessages: NetworkMessageSnapshot[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
};

export function ClusterScene({ snapshot, activeMessages, selectedNodeId, onSelectNode }: ClusterSceneProps) {
  const nodeLayout = useMemo(() => getNodeLayout(snapshot?.nodes ?? []), [snapshot?.nodes]);
  const nodeIds = useMemo(() => snapshot?.nodes.map((node) => node.id) ?? [], [snapshot?.nodes]);
  const edges = useMemo(() => getSceneEdges(nodeIds), [nodeIds]);
  const sceneTimeMs = useSceneTime(snapshot?.timeMs ?? null, activeMessages.length > 0);
  const visibleMessages = useMemo(
    () => activeMessages.filter((message) => isMessageVisible(message, sceneTimeMs)),
    [activeMessages, sceneTimeMs]
  );

  return (
    <section className="scene-panel" aria-labelledby="scene-heading">
      <div className="scene-panel-header">
        <div>
          <h2 id="scene-heading">Cluster Scene</h2>
          <p>{snapshot ? `${snapshot.nodes.length} nodes / ${visibleMessages.length} messages` : "Waiting for snapshot"}</p>
        </div>
        {snapshot?.network.partitions.length ? <span className="partition-badge">partitioned</span> : null}
      </div>

      <div className="scene-canvas" role="img" aria-label="WebGL cluster visualization">
        <Canvas camera={{ position: [0, 6.8, 8.2], fov: 48 }} dpr={[1, 1.8]} onPointerMissed={() => onSelectNode(null)}>
          <color attach="background" args={["#f7f9fc"]} />
          <ambientLight intensity={0.78} />
          <directionalLight position={[4, 7, 5]} intensity={1.4} />
          <SceneFloor />

          {edges.map(([sourceNodeId, targetNodeId]) => {
            const source = nodeLayout.get(sourceNodeId)?.position;
            const target = nodeLayout.get(targetNodeId)?.position;

            if (!source || !target) {
              return null;
            }

            return (
              <EdgeMesh
                key={`${sourceNodeId}-${targetNodeId}`}
                source={source}
                target={target}
                state={getEdgeState(sourceNodeId, targetNodeId, snapshot?.network.partitions ?? [])}
              />
            );
          })}

          {snapshot?.nodes.map((node) => {
            const layout = nodeLayout.get(node.id);
            if (!layout) {
              return null;
            }

            return (
              <group key={node.id}>
                <NodeMesh node={node} position={layout.position} selected={node.id === selectedNodeId} onSelect={onSelectNode} />
                <NodeLabel node={node} position={layout.position} />
              </group>
            );
          })}

          {visibleMessages.map((message) => {
            const source = nodeLayout.get(message.sourceNodeId)?.position;
            const target = nodeLayout.get(message.targetNodeId)?.position;

            if (!source || !target) {
              return null;
            }

            return <MessageParticle key={message.id} message={message} source={source} target={target} nowMs={sceneTimeMs} />;
          })}
        </Canvas>
      </div>
    </section>
  );
}

function useSceneTime(snapshotTimeMs: number | null, active: boolean): number {
  const [sceneTimeMs, setSceneTimeMs] = useState(snapshotTimeMs ?? 0);

  useEffect(() => {
    if (snapshotTimeMs === null) {
      setSceneTimeMs(0);
      return;
    }

    const startedAtMs = performance.now();
    setSceneTimeMs(snapshotTimeMs);

    if (!active) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSceneTimeMs(snapshotTimeMs + performance.now() - startedAtMs);
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [active, snapshotTimeMs]);

  return sceneTimeMs;
}

function SceneFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]}>
        <ringGeometry args={[3.88, 4.52, 96]} />
        <meshBasicMaterial color="#d8e0eb" transparent opacity={0.72} />
      </mesh>
      <gridHelper args={[10, 10, "#d6dee8", "#e8edf4"]} position={[0, -0.5, 0]} />
    </group>
  );
}
