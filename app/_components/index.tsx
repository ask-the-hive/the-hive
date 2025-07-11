'use client'

import Image from 'next/image';
import { motion } from 'framer-motion';

// Original graph imports - commented out for easy restoration
/*
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
*/

// Logo Component
function LogoComponent() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Text at the top */}
      <div className="absolute top-0 left-0 right-0 z-10 text-center pt-16">
        <motion.h1
          className="text-5xl md:text-6xl font-bold text-brand-600 mb-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.21, 1.11, 0.81, 0.99] }}
        >
          The Hive
        </motion.h1>
        <motion.p
          className="text-xl md:text-2xl text-neutral-600 dark:text-white mb-8 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.21, 1.11, 0.81, 0.99] }}
        >
          A modular network of interoperable DeFi agents
        </motion.p>
      </div>
      
      {/* Logo in the center */}
      <motion.div 
        className="relative"
        initial={{ 
          opacity: 0, 
          scale: 0.3,
          y: 100,
          rotateY: 45,
          rotateX: 15
        }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          y: 0,
          rotateY: 0,
          rotateX: 0
        }}
        whileHover={{ 
          scale: 1.1
        }}
        transition={{ 
          duration: 1.2, 
          delay: 0.5, 
          ease: [0.21, 1.11, 0.81, 0.99],
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
      >
        <Image
          src="/logo.png"
          alt="The Hive Logo"
          width={500}
          height={500}
          className="drop-shadow-2xl"
          priority
        />
      </motion.div>
    </div>
  );
}

// Original ReactFlowPro component - commented out for easy restoration
/*
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
    <div className="relative w-full h-full">
      <div className="absolute top-0 left-0 right-0 z-10 text-center pt-16">
        <motion.h1
          className="text-5xl md:text-6xl font-bold text-brand-600 mb-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.21, 1.11, 0.81, 0.99] }}
        >
          The Hive
        </motion.h1>
        <motion.p
          className="text-xl md:text-2xl text-neutral-600 dark:text-white mb-8 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.21, 1.11, 0.81, 0.99] }}
        >
          A modular network of interoperable DeFi agents
        </motion.p>
      </div>
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
        panOnDrag={[1, 2]}
        zoomOnDoubleClick={false}
        zoomOnScroll={true}
        fitView
        fitViewOptions={{
          padding: 0.7,
          minZoom: 0.4,
          maxZoom: 1.5,
        }}
        minZoom={0.4}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 150, zoom: 0.6 }}
        style={{ 
          pointerEvents: 'none',
          background: 'transparent',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <Background color="#d19900" gap={16} size={1} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      </ReactFlow>
    </div>
  );
}
*/

function GraphComponent() {
  // To restore the original graph, uncomment the ReactFlowProvider section below
  // and comment out the LogoComponent section
  
  return (
    <div className="absolute inset-0 w-full h-full">
      <LogoComponent />
    </div>
  );
  
  // Original graph implementation - uncomment to restore
  /*
  return (
    <ReactFlowProvider>
      <div className="absolute inset-0 w-full h-full">
        <ReactFlowPro />
      </div>
    </ReactFlowProvider>
  );
  */
}

export default GraphComponent;
