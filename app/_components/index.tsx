'use client'

import { useCallback, useEffect } from 'react';

import {
  ReactFlow,
  ProOptions,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  NodeOrigin,
  addEdge,
  OnConnect,
  Background,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CentralNode from './nodes/CentralNode';
import AgentNode from './nodes/AgentNode';

import useForceLayout from '../_hooks/use-force-layout';

import { initialNodes, initialEdges } from '../_data/initial-elements';

const proOptions: ProOptions = { account: 'paid-pro', hideAttribution: true };

type ExampleProps = {
  strength?: number;
  distance?: number;
};

const nodeOrigin: NodeOrigin = [0.5, 0.5];

const defaultEdgeOptions = { style: { stroke: '#d19900', strokeWidth: 2 } };

const nodeTypes = {
  central: CentralNode,
  agent: AgentNode,
};

function ReactFlowPro({ strength = -500, distance = 150 }: ExampleProps = {}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (nodes.length === 0) {
      setNodes(initialNodes);
    }
  }, [nodes.length, setNodes]);

  const dragEvents = useForceLayout({ strength, distance });

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      proOptions={proOptions}
      onConnect={onConnect}
      onNodeDragStart={dragEvents.start}
      onNodeDrag={dragEvents.drag}
      onNodeDragStop={dragEvents.stop}
      nodeOrigin={nodeOrigin}
      defaultEdgeOptions={defaultEdgeOptions}
      panOnDrag={true}
      zoomOnDoubleClick={false}
      zoomOnScroll={false}
      fitView
    >
      <Background />
    </ReactFlow>
  );
}

function GraphComponent() {
  return (
    <ReactFlowProvider>
      <ReactFlowPro />
    </ReactFlowProvider>
  );
}

export default GraphComponent;
