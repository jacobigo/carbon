import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

export default function GraphView({ elements, highlightedPath = [] }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(id)",
            "text-valign": "center",
            "background-color": "#0ea5e9",
            color: "#fff",
            "text-outline-width": 2,
            "text-outline-color": "#0ea5e9",
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#9ca3af",
            "target-arrow-color": "#9ca3af",
            "target-arrow-shape": "triangle",
            label: "data(label)",
            "font-size": 10,
            "text-rotation": "autorotate",
            "curve-style": "bezier",
          },
        },
        {
          selector: ".highlighted",
          style: {
            "line-color": "#22c55e",
            "target-arrow-color": "#22c55e",
            "background-color": "#22c55e",
            "text-outline-color": "#22c55e",
          },
        },
      ],
      layout: {
        name: "breadthfirst",
        directed: true,
        padding: 10,
      },
    });

    // Highlight selected path
    highlightedPath.forEach((nodeId, i) => {
      if (i < highlightedPath.length - 1) {
        const source = nodeId;
        const target = highlightedPath[i + 1];
        const edge = cy.getElementById(`${source}->${target}`);
        if (edge) edge.addClass("highlighted");
      }
      const node = cy.getElementById(nodeId);
      if (node) node.addClass("highlighted");
    });

    return () => {
      cy.destroy();
    };
  }, [elements, highlightedPath]);

  return <div ref={containerRef} style={{ height: "500px", width: "100%" }} />;
}
