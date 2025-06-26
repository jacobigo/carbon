import axios from "axios";

const API_BASE = "http://localhost:5000";

const MAPBOX_TOKEN = "pk.eyJ1IjoibW5ldmkiLCJhIjoiY21jOWcyZGZzMTRrZjJqcHc4MDgwbmtpMyJ9.-Quc9vFiwkmwNc0rNO4mHQ";

export async function geocodeAddress(address) {
  const query = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.features && data.features.length > 0) {
    const [lon, lat] = data.features[0].center;
    return { lat, lon };
  } else {
    throw new Error("Address not found");
  }
}

export async function addNodeWithLocation(name, lat, lon) {
  const res = await fetch("http://localhost:5000/api/node", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, lat, lon }),
  });
  return await res.json();
}

export async function getOptimalPath(start, end, metric = "distance") {
  const res = await axios.post(`${API_BASE}/api/path`, {
    start,
    end,
    metric
  });
  return res.data;
}

export async function loadGraph() {
  const res = await fetch("http://localhost:5000/api/graph");
  return await res.json();
}


export async function addNode(name) {
  const res = await fetch("http://localhost:5000/api/node", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return await res.json();
}

export async function addEdge(source, target, distance, carbon) {
  const res = await fetch("http://localhost:5000/api/edge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, target, distance, carbon }),
  });
  return await res.json();
}

export async function getNodes() {
  const res = await fetch("http://localhost:5000/api/nodes");
  return await res.json();
}