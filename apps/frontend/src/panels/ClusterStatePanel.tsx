import type { ClusterSnapshot, NodeSnapshot } from "../domain/types";
import { selectLeader, selectSelectedNode } from "../domain/selectors";

type ClusterStatePanelProps = {
  snapshot: ClusterSnapshot | null;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
};

function roleLabel(node: NodeSnapshot): string {
  return `${node.role} / ${node.status}`;
}

function partitionLabel(snapshot: ClusterSnapshot | null): string {
  if (!snapshot || snapshot.network.partitions.length === 0) {
    return "healed";
  }

  return snapshot.network.partitions
    .map((partition) => partition.groups.map((group) => group.join(", ")).join(" | "))
    .join("; ");
}

export function ClusterStatePanel({ snapshot, selectedNodeId, onSelectNode }: ClusterStatePanelProps) {
  const leader = selectLeader(snapshot);
  const selectedNode = selectSelectedNode(snapshot, selectedNodeId);

  return (
    <section className="panel cluster-panel" aria-labelledby="cluster-heading">
      <div className="panel-header">
        <h2 id="cluster-heading">Cluster State</h2>
        <span>{snapshot?.running ? "running" : "paused"}</span>
      </div>

      <dl className="summary-grid">
        <div>
          <dt>Leader</dt>
          <dd>{leader?.id ?? "none"}</dd>
        </div>
        <div>
          <dt>Nodes</dt>
          <dd>{snapshot?.nodes.length ?? 0}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{snapshot ? `${snapshot.timeMs}ms` : "unknown"}</dd>
        </div>
        <div>
          <dt>Latency</dt>
          <dd>{snapshot ? `${snapshot.network.latencyMs}ms` : "unknown"}</dd>
        </div>
        <div>
          <dt>Partition</dt>
          <dd>{partitionLabel(snapshot)}</dd>
        </div>
      </dl>

      <div className="node-list" role="list" aria-label="Cluster nodes">
        {snapshot?.nodes.length ? (
          snapshot.nodes.map((node) => (
            <button
              type="button"
              role="listitem"
              key={node.id}
              className={node.id === selectedNodeId ? "node-row node-row-selected" : "node-row"}
              onClick={() => onSelectNode(node.id)}
            >
              <span>
                <strong>{node.id}</strong>
                <small>{roleLabel(node)}</small>
              </span>
              <span className={`node-status node-status-${node.status}`}>{node.status}</span>
            </button>
          ))
        ) : (
          <p className="empty-state">Waiting for nodes.</p>
        )}
      </div>

      <div className="details">
        <h3>Selected Node</h3>
        {selectedNode ? (
          <dl className="detail-list">
            <div>
              <dt>ID</dt>
              <dd>{selectedNode.id}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{selectedNode.role}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedNode.status}</dd>
            </div>
            <div>
              <dt>Known leader</dt>
              <dd>unknown</dd>
            </div>
            <div>
              <dt>Last heartbeat</dt>
              <dd>unknown</dd>
            </div>
          </dl>
        ) : (
          <p className="empty-state">No node selected.</p>
        )}
      </div>
    </section>
  );
}
