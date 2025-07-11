import { useState, useEffect, useMemo } from "react";
import {
  getOptimalPath,
  loadGraph,
  addNode,
  addEdge,
  getNodes,
  addNodeWithLocation,
  geocodeAddress
} from "./api";
import GraphView from "./GraphView";
import MapView from "./MapView";
import 'mapbox-gl/dist/mapbox-gl.css'; // Import Mapbox CSS for styles
import "./ChatBot"
import Chatbot from "./ChatBot";

function App() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [metric, setMetric] = useState("distance");
  const [path, setPath] = useState([]);
  const [graphElements, setGraphElements] = useState([]);
  const [allNodes, setAllNodes] = useState([]);

  const [address, setAddress] = useState("");  
  const [newNode, setNewNode] = useState("");
  const [edgeForm, setEdgeForm] = useState({
    source: "",
    target: "",
    transport: "",
  });

  // Load graph and node list
  const [mapData, setMapData] = useState({ nodes: [], edges: [] });

  // Memoize the filtered nodes to prevent unnecessary re-renders
  const filteredNodes = useMemo(() => {
    return mapData.nodes.filter(n => n.lat && n.lon);
  }, [mapData.nodes]);

const refreshGraph = async () => {
  const res = await fetch("http://localhost:5000/api/graph");
  const data = await res.json();
  const cytoscapeElements = [
    ...data.nodes.map((n) => ({ data: { id: n.name } })),
    ...data.edges.map((e) => ({
      data: {
        id: `${e.source}->${e.target}`,
        source: e.source,
        target: e.target,
        label: `${Number(e.distance).toFixed(2)}km / ${Number(e.carbon).toFixed(2)}g`,
      },
    })),
  ];

  setGraphElements(cytoscapeElements);
  setAllNodes(data.nodes.map((n) => n.name));
  setMapData({ nodes: data.nodes, edges: data.edges });
  console.log("Graph data loaded:", data);
};

  useEffect(() => {
    refreshGraph();
  }, []);

  const handleSubmit = async () => {
    if (!start || !end) return;
    console.log("Finding optimal path from", start, "to", end, "using metric:", metric);
    const result = await getOptimalPath(start, end, metric);
    if (Array.isArray(result.path)) {
      console.log("Optimal path found:", result.path);
      setPath(result.path);
    } else {
      setPath([]);
    }
  };

  const handleAddNode = async () => {
    if (!newNode) return;
    await addNode(newNode);
    setNewNode("");
    refreshGraph();
  };

  const handleAddEdge = async () => {
    const { source, target, transport } = edgeForm;
    if (!source || !target || !transport) return;
    await addEdge(source, target, transport);
    setEdgeForm({ source: "", target: "", transport: "" });
    refreshGraph();
  };

  return (
    <div style={{ maxWidth: "25000px", margin: "0 auto" }}>
      <h1 className="text-3xl font-bold text-blue-700">Supply Chain Optimizer</h1>

      {/* Pathfinding Form */}
        <div className="flex flex-row md:flex-row gap-3 items-center">
          <select
            className="border p-2"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          >
            <option value="">Start Node</option>
            {allNodes.map((node) => (
          <option key={node} value={node}>
            {node}
          </option>
            ))}
          </select>

          <select
            className="border p-2"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          >
            <option value="">End Node</option>
            {allNodes.map((node) => (
          <option key={node} value={node}>
            {node}
          </option>
            ))}
          </select>

          <select
            className="border p-2"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
          >
            <option value="distance">Distance</option>
            <option value="carbon">Carbon</option>
          </select>

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleSubmit}
          >
            Find Optimal Path
          </button>
        </div>
        {/* Path Result & Graph/Map Section */}
      <div style={{ display: "flex", flexDirection: "row", gap: "1rem", width: "100%" }}>
        {/* GraphView */}
        <div style={{ width: "100%", height: "600px", position: "relative", overflow: "hidden", zIndex: 10, minWidth: 0 }}>
          <GraphView elements={graphElements} highlightedPath={path} />
        </div>
        {/* MapView */}
        <div style={{ width: "100%", height: "600px", position: "relative", overflow: "hidden", zIndex: 10, minWidth: 0 }}>
          <MapView nodes={filteredNodes} edges={mapData.edges}/>
        </div>
        <div style={{ width: "100%", height: "600px", position: "relative", overflow: "hidden", zIndex: 10, minWidth: 0 }}>
          <Chatbot/>
        </div>
      </div>
      {/* Graph Section */}
      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">Edit Graph</h2>

        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div>
  <h3 className="font-semibold mb-1">Add Node</h3>
  <input
    className="border p-2 mr-2"
    placeholder="Node name"
    value={newNode}
    onChange={(e) => setNewNode(e.target.value)}
  />
  <input
    className="border p-2 my-2"
    placeholder="Address (for geolocation)"
    value={address}
    onChange={(e) => setAddress(e.target.value)}
  />
  <button
    className="bg-green-600 text-white px-4 py-2 rounded"
    onClick={async () => {
      if (!newNode || !address) return;
      try {
        const { lat, lon } = await geocodeAddress(address);
        await addNodeWithLocation(newNode, lat, lon);
        setNewNode("");
        setAddress("");
        refreshGraph();
      } catch (err) {
        alert("Could not find location. Try a more specific address.");
      }
    }}
  >
    Add Node with Address
  </button>
</div>


          {/* Add Edge */}
          <div>
            <h3 className="font-semibold mb-1">Add Edge</h3>
            <div className="flex flex-col gap-2">
              <select
                className="border p-2"
                value={edgeForm.source}
                onChange={(e) =>
                  setEdgeForm({ ...edgeForm, source: e.target.value })
                }
              >
                <option value="">Source Node</option>
                {allNodes.map((node) => (
                  <option key={node} value={node}>
                    {node}
                  </option>
                ))}
              </select>

              <select
                className="border p-2"
                value={edgeForm.target}
                onChange={(e) =>
                  setEdgeForm({ ...edgeForm, target: e.target.value })
                }
              >
                <option value="">Target Node</option>
                {allNodes.map((node) => (
                  <option key={node} value={node}>
                    {node}
                  </option>
                ))}
              </select>

              <select
                className="border p-2"
                value={edgeForm.transport}
                onChange={(e) => setEdgeForm({ ...edgeForm, transport: e.target.value })}
              >
                  <option value="">Transport Type</option>
                  <option value="car">Car</option>
                  <option value="truck">Truck</option>
                  <option value="train">Train</option>
                  <option value="plane">Plane</option>
              </select>

              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={handleAddEdge}
              >
                Add Edge
              </button>

              <button
  className="bg-red-600 text-white px-4 py-2 rounded"
  onClick={async () => {
    if (window.confirm("Are you sure you want to clear the entire database?")) {
      const res = await fetch("http://localhost:5000/api/clear", {
        method: "POST"
      });
      const result = await res.json();
      if (result.status === "success") {
        alert("Database cleared");
        refreshGraph();
      } else {
        alert("Error: " + result.message);
      }
    }
  }}
>
  Clear Entire Database
</button>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
