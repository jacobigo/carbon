import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

export default function GraphView({ elements, highlightedPath = [] }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    console.log("Initializing Cytoscape with elements:", elements);
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
            color: "#fff", // Set edge label text to white
            "font-size": 18, // Make edge label text bigger
            "text-outline-width": 4, // Add outline for visibility
            "text-outline-color": "#222", // Dark outline for contrast
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
      console.log(`Highlighting node: ${nodeId}`);
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
