import assert from "node:assert/strict";
import test from "node:test";
import {
  collapseDirectedBranch,
  expandOneRelationshipLevel,
  focusedNeighborhoodIds,
  graphView,
  stableGraphHash,
  type NetworkGraphModel,
} from "../app/network-graph.ts";

const model: NetworkGraphModel = {
  rootId: "root",
  nodes: [
    { id: "root", role: "root" },
    { id: "agent:a", role: "major", parentId: "root" },
    { id: "agent:b", role: "major", parentId: "root" },
    { id: "task:a1", role: "endpoint", parentId: "agent:a" },
    { id: "task:a2", role: "endpoint", parentId: "agent:a" },
    { id: "task:b1", role: "endpoint", parentId: "agent:b" },
    { id: "orphan", role: "endpoint" },
  ],
  edges: [
    { id: "root:a", source: "root", target: "agent:a" },
    { id: "root:b", source: "root", target: "agent:b" },
    { id: "a:a1", source: "agent:a", target: "task:a1" },
    { id: "a:a2", source: "agent:a", target: "task:a2" },
    { id: "b:b1", source: "agent:b", target: "task:b1" },
    { id: "cycle", source: "task:a1", target: "agent:a" },
  ],
};

test("stable graph hashes do not depend on render order", () => {
  assert.equal(stableGraphHash("agent:a"), stableGraphHash("agent:a"));
  assert.notEqual(stableGraphHash("agent:a"), stableGraphHash("agent:b"));
});

test("one-level expansion adds immediate undirected neighbors only", () => {
  assert.deepEqual(
    [...expandOneRelationshipLevel(model, new Set(["root"]), "agent:a")].sort(),
    ["agent:a", "root", "task:a1", "task:a2"],
  );
});

test("focused neighborhood retains neighbors and shortest route to root", () => {
  assert.deepEqual([...focusedNeighborhoodIds(model, "task:a1")].sort(), [
    "agent:a",
    "root",
    "task:a1",
  ]);
  assert.deepEqual([...focusedNeighborhoodIds(model, "orphan")].sort(), [
    "orphan",
    "root",
  ]);
});

test("directed collapse handles cycles and keeps the branch root", () => {
  const visible = new Set(model.nodes.map((node) => node.id));
  assert.deepEqual(
    [...collapseDirectedBranch(model, visible, "agent:a")].sort(),
    ["agent:a", "agent:b", "orphan", "root", "task:b1"],
  );
});

test("graph views retain only edges whose endpoints remain visible", () => {
  const view = graphView(model, new Set(["root", "agent:b", "task:b1"]));
  assert.deepEqual(
    view.nodes.map((node) => node.id),
    ["root", "agent:b", "task:b1"],
  );
  assert.deepEqual(
    view.edges.map((edge) => edge.id),
    ["root:b", "b:b1"],
  );
});
