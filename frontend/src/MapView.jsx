import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoibW5ldmkiLCJhIjoiY21jOWcyZGZzMTRrZjJqcHc4MDgwbmtpMyJ9.-Quc9vFiwkmwNc0rNO4mHQ';

export default function MapView({ nodes = [], edges = [] }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Setup once
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-98, 39],
      zoom: 2.5,

    });

    mapRef.current = map;

    map.on("load", () => {
      // Build coordinate lookup
      const nodeCoords = {};
      nodes.forEach((n) => {
        if (n.name && n.lat && n.lon) {
          nodeCoords[n.name] = [Number(n.lon), Number(n.lat)];
        }
      });
      console.log("✅ Node coordinates:", nodeCoords);

      // === Nodes ===
      const nodeFeatures = nodes.map((node) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [node.lon, node.lat]
        },
        properties: { ...node }
      }));

      map.addSource("nodes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: nodeFeatures
        }
      });

      map.addLayer({
        id: "nodes-layer",
        type: "circle",
        source: "nodes",
        paint: {
          "circle-radius": 6,
          "circle-color": "#007cbf"
        }
      });

      map.addLayer({
        id: "nodes-labels",
        type: "symbol",
        source: "nodes",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-offset": [0, 1.2],
          "text-anchor": "top"
        },
        paint: {
          "text-color": "#333"
        }
      });

      // === Edges ===
      const edgeFeatures = edges
        .map((edge) => {
          const from = nodeCoords[edge.source];
          const to = nodeCoords[edge.target];
          if (!from || !to) return null;

          return {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [from, to]
            },
            properties: { ...edge }
          };
        })
        .filter(Boolean);

      map.addSource("edges", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: edgeFeatures
        }
      });

      console.log("✅ Edge features:", edgeFeatures);
      map.addLayer({
        id: "edges-layer",
        type: "line",
        source: "edges",
        paint: {
          "line-color": [
          "match",
          ["get", "transport"],
          "car", "#1e90ff",      // blue
          "truck", "#f59e42",    // orange
          "train", "#22c55e",    // green
          "plane", "#e11d48",    // red
          "#888"                 // default gray
        ],
        "line-width": 3
        }
      });

      console.log("✅ Edge features:", edgeFeatures);
    });
  }, [nodes, edges]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height: "80vh" }}
      className="rounded shadow"
    />
  );
}