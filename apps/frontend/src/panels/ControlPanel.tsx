import type { ClientCommand, ConnectionStatus } from "../domain/types";
import { selectPartitionGroups } from "../domain/selectors";
import type { ClusterSnapshot } from "../domain/types";

type ControlPanelProps = {
  connectionStatus: ConnectionStatus;
  snapshot: ClusterSnapshot | null;
  selectedNodeId: string | null;
  latencyDraftMs: number;
  onLatencyDraftChange: (latencyMs: number) => void;
  onCommand: (command: ClientCommand) => boolean;
};

export function ControlPanel({
  connectionStatus,
  snapshot,
  selectedNodeId,
  latencyDraftMs,
  onLatencyDraftChange,
  onCommand
}: ControlPanelProps) {
  const disconnected = connectionStatus !== "connected";
  const selectedNode = snapshot?.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const partitionGroups = selectPartitionGroups(snapshot, selectedNodeId);

  return (
    <section className="panel control-panel" aria-labelledby="controls-heading">
      <div className="panel-header">
        <h2 id="controls-heading">Controls</h2>
        <span className={`status-pill status-${connectionStatus}`}>{connectionStatus}</span>
      </div>

      <div className="button-row button-row-two">
        <button type="button" disabled={disconnected} onClick={() => onCommand({ type: "simulation:start" })}>
          Start
        </button>
        <button type="button" disabled={disconnected} onClick={() => onCommand({ type: "simulation:pause" })}>
          Pause
        </button>
        <button type="button" disabled={disconnected} onClick={() => onCommand({ type: "simulation:reset" })}>
          Reset
        </button>
      </div>

      <div className="button-row button-row-two">
        <button
          type="button"
          disabled={disconnected || !selectedNode || selectedNode.status === "down"}
          onClick={() => selectedNodeId && onCommand({ type: "node:kill", nodeId: selectedNodeId })}
        >
          Kill
        </button>
        <button
          type="button"
          disabled={disconnected || !selectedNode || selectedNode.status === "alive"}
          onClick={() => selectedNodeId && onCommand({ type: "node:restore", nodeId: selectedNodeId })}
        >
          Restore
        </button>
      </div>

      <label className="field">
        <span>Latency {latencyDraftMs}ms</span>
        <input
          type="range"
          min="0"
          max="2000"
          step="50"
          value={latencyDraftMs}
          disabled={disconnected}
          onChange={(event) => {
            const latencyMs = Number(event.currentTarget.value);
            onLatencyDraftChange(latencyMs);
            onCommand({ type: "network:setLatency", latencyMs });
          }}
        />
      </label>

      <div className="button-row">
        <button
          type="button"
          disabled={disconnected || !partitionGroups}
          onClick={() => partitionGroups && onCommand({ type: "network:createPartition", groups: partitionGroups })}
        >
          Partition
        </button>
        <button type="button" disabled={disconnected} onClick={() => onCommand({ type: "network:healPartition" })}>
          Heal
        </button>
      </div>
    </section>
  );
}
