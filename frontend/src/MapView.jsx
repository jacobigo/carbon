import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = 'pk.eyJ1IjoibW5ldmkiLCJhIjoiY21jOWcyZGZzMTRrZjJqcHc4MDgwbmtpMyJ9.-Quc9vFiwkmwNc0rNO4mHQ';

export default function MapView({ nodes = [], edges = [] }) {
  const mapRef = useRef();

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98, 39], // USA center
      zoom: 3.5,
    });

    // Add markers for each node
    nodes.forEach((node) => {
      if (node.lat && node.lon) {
        new mapboxgl.Marker({ color: '#0ea5e9' })
          .setLngLat([node.lon, node.lat])
          .setPopup(new mapboxgl.Popup().setText(node.name))
          .addTo(map);
      }
    });

    // Draw lines for each route
    edges.forEach((edge) => {
      const src = nodes.find((n) => n.name === edge.source);
      const tgt = nodes.find((n) => n.name === edge.target);

      if (src && tgt && src.lat && src.lon && tgt.lat && tgt.lon) {
        map.addSource(`${edge.source}->${edge.target}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [src.lon, src.lat],
                [tgt.lon, tgt.lat],
              ],
            },
          },
        });

        map.addLayer({
          id: `${edge.source}->${edge.target}`,
          type: 'line',
          source: `${edge.source}->${edge.target}`,
          paint: {
            'line-color': '#22c55e',
            'line-width': 3,
          },
        });
      }
    });

    return () => map.remove();
  }, [nodes, edges]);

  return <div ref={mapRef} className="w-full h-[500px] rounded shadow" />;
}
