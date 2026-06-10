import { useEffect, useMemo } from "react";
import { CanvasTexture, LinearFilter, SpriteMaterial } from "three";
import type { NodeSnapshot } from "../domain/types";
import type { ScenePosition } from "./layout";

type NodeLabelProps = {
  node: NodeSnapshot;
  position: ScenePosition;
};

const ROLE_LABELS: Record<NodeSnapshot["role"], string> = {
  leader: "L",
  candidate: "C",
  follower: "F"
};

export function NodeLabel({ node, position }: NodeLabelProps) {
  const material = useMemo(() => {
    const texture = createLabelTexture(`${node.id}  ${ROLE_LABELS[node.role]}`);
    return new SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  }, [node.id, node.role]);

  useEffect(() => {
    return () => {
      material.map?.dispose();
      material.dispose();
    };
  }, [material]);

  return <sprite material={material} position={[position[0], position[1] + 0.92, position[2]]} scale={[1.55, 0.42, 1]} />;
}

function createLabelTexture(label: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 112;

  const context = canvas.getContext("2d");
  if (!context) {
    return new CanvasTexture(canvas);
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(248, 250, 252, 0.92)";
  roundRect(context, 12, 16, 360, 72, 14);
  context.fill();
  context.strokeStyle = "rgba(113, 128, 150, 0.35)";
  context.lineWidth = 4;
  context.stroke();

  context.fillStyle = "#111827";
  context.font = "600 34px Inter, Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, canvas.width / 2, canvas.height / 2, 320);

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
