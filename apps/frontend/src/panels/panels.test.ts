import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { ClusterSnapshot } from "../domain/types";
import { ClusterStatePanel } from "./ClusterStatePanel";
import { ControlPanel } from "./ControlPanel";
import { EventLogPanel } from "./EventLogPanel";

const snapshot: ClusterSnapshot = {
  timeMs: 1200,
  running: true,
  leaderId: "node-3",
  nodes: [
    { id: "node-1", role: "follower", status: "alive" },
    { id: "node-2", role: "follower", status: "down" },
    { id: "node-3", role: "leader", status: "alive" }
  ],
  network: {
    latencyMs: 200,
    packetLossRate: 0,
    partitions: [{ groups: [["node-1", "node-2"], ["node-3"]] }],
    messages: []
  }
};

afterEach(() => {
  cleanup();
});

describe("ClusterStatePanel", () => {
  test("shows leader, partition, selected node details, and node selection", () => {
    const onSelectNode = vi.fn();

    render(
      React.createElement(ClusterStatePanel, {
        snapshot,
        selectedNodeId: "node-2",
        onSelectNode
      })
    );

    const panel = screen.getByRole("region", { name: "Cluster State" });
    const nodeList = within(panel).getByRole("list", { name: "Cluster nodes" });

    expect(within(panel).getAllByText("node-3")).toHaveLength(2);
    expect(within(panel).getByText("node-1, node-2 | node-3")).toBeTruthy();
    expect(within(panel).getAllByText("down")).toHaveLength(2);
    expect(within(panel).getAllByText("node-2")).toHaveLength(2);

    fireEvent.click(within(nodeList).getAllByRole("listitem")[0]);

    expect(onSelectNode).toHaveBeenCalledWith("node-1");
  });
});

describe("ControlPanel", () => {
  test("dispatches critical commands and respects node/partition state", () => {
    const onCommand = vi.fn(() => true);

    render(
      React.createElement(ControlPanel, {
        connectionStatus: "connected",
        snapshot,
        selectedNodeId: "node-1",
        latencyDraftMs: 200,
        onLatencyDraftChange: vi.fn(),
        onCommand
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    fireEvent.click(screen.getByRole("button", { name: "Kill" }));
    fireEvent.click(screen.getByRole("button", { name: "Heal" }));

    expect(onCommand).toHaveBeenCalledWith({ type: "simulation:start" });
    expect(onCommand).toHaveBeenCalledWith({ type: "node:kill", nodeId: "node-1" });
    expect(onCommand).toHaveBeenCalledWith({ type: "network:healPartition" });
    expect(screen.getByRole("button", { name: "Partition" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Restore" }).hasAttribute("disabled")).toBe(true);
  });

  test("disables commands while disconnected", () => {
    render(
      React.createElement(ControlPanel, {
        connectionStatus: "disconnected",
        snapshot,
        selectedNodeId: "node-1",
        latencyDraftMs: 200,
        onLatencyDraftChange: vi.fn(),
        onCommand: vi.fn()
      })
    );

    expect(screen.getByRole("button", { name: "Start" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Kill" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("slider").hasAttribute("disabled")).toBe(true);
  });
});

describe("EventLogPanel", () => {
  test("renders newest entries first with formatted times and fallback cells", () => {
    render(
      React.createElement(EventLogPanel, {
        entries: [
          {
            timestampMs: 500,
            eventType: "message_sent",
            source: "node-1",
            target: "node-2",
            message: "node-1 sent election to node-2"
          },
          {
            timestampMs: 1500,
            eventType: "leader_changed",
            source: null,
            target: "node-3",
            message: "node-3 became leader"
          }
        ]
      })
    );

    const rows = screen.getAllByRole("row");

    expect(rows[1].textContent).toContain("1.5s");
    expect(rows[1].textContent).toContain("leader_changed");
    expect(rows[1].textContent).toContain("-");
    expect(rows[1].textContent).toContain("node-3 became leader");
    expect(rows[2].textContent).toContain("500ms");
  });
});
