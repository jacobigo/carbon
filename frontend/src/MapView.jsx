import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoibW5ldmkiLCJhIjoiY21jOWcyZGZzMTRrZjJqcHc4MDgwbmtpMyJ9.-Quc9vFiwkmwNc0rNO4mHQ';

export default function MapView({ nodes = [], edges = [] }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // ✅ Initialize map only once
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98, 39],
      zoom: 1.5,
      projection: 'mercator',
    });

    mapRef.current = map;

    map.on('load', () => {
      // Initialize empty GeoJSON source
      map.addSource('nodes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.addLayer({
        id: 'nodes-layer',
        type: 'circle',
        source: 'nodes',
        paint: {
          'circle-radius': 6,
          'circle-color': '#007cbf'
        }
      });
    });
  }, []);

  // ✅ Manually update node data when needed
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getSource('nodes')) return;

    const geojson = {
      type: 'FeatureCollection',
      features: nodes.map(node => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [node.lon, node.lat],
        },
        properties: { ...node },
      }))
    };

    map.getSource('nodes').setData(geojson);
  }, [nodes]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '90vh' }}
      className="rounded shadow"
    />
  );
}
