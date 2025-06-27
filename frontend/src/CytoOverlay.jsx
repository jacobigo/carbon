import React, { useEffect, useRef } from "react";
import Cytoscape from "cytoscape";

export default function CytoscapeOverlay({ mapRef, nodes = [], edges = [] }) {
  const cyRef = useRef();

  useEffect(() => {
    const container = cyRef.current;

    const cy = Cytoscape({
      container,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#0ea5e9',
            label: 'data(id)',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#22c55e',
            'target-arrow-color': '#22c55e',
            'target-arrow-shape': 'triangle',
          },
        },
      ],
      layout: { name: 'preset' },
      elements: [],
    });

    const map = mapRef.current?.getMap?.();

    if (!map) return;

    const project = (node) => {
      if (!node.lat || !node.lon) return null;
      const point = map.project([node.lon, node.lat]);
      return { x: point.x, y: point.y };
    };

    // Convert nodes with positions
    const cyNodes = nodes.map((node) => {
      const pos = project(node);
      return pos
        ? { data: { id: node.name }, position: pos }
        : null;
    }).filter(Boolean);

    const cyEdges = edges.map((e) => ({
      data: { id: `${e.source}-${e.target}`, source: e.source, target: e.target },
    }));

    cy.add([...cyNodes, ...cyEdges]);
    cy.resize();
    cy.center();

    return () => cy.destroy();
  }, [nodes, edges]);

  return (
    <div
      ref={cyRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
    />
  );
}