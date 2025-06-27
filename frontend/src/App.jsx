import { useState, useEffect } from "react";
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
    distance: "",
    carbon: "",
  });

  // Load graph and node list
  const [mapData, setMapData] = useState({ nodes: [], edges: [] });

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
        label: `${e.distance}km / ${e.carbon}g`,
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
    const result = await getOptimalPath(start, end, metric);
    if (Array.isArray(result.path)) {
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
    const { source, target, distance, carbon } = edgeForm;
    if (!source || !target || !distance || !carbon) return;
    await addEdge(source, target, Number(distance), Number(carbon));
    setEdgeForm({ source: "", target: "", distance: "", carbon: "" });
    refreshGraph();
  };

  return (
    <div className="p-6 w-full mx-auto space-y-6">
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
      <div className="flex flex-row gap-3 w-full">
        {/* GraphView */}
        <div className="w-1/2 h-[600px] relative overflow-hidden z-10 min-w-0">
          <GraphView elements={graphElements} path={path} />
        </div>
        {/* MapView */}
        <div className="w-1/2 h-[600px] relative overflow-hidden z-10 min-w-0">
          <MapView nodes={mapData.nodes} />
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

              <input
                className="border p-2"
                type="number"
                placeholder="Distance (km)"
                value={edgeForm.distance}
                onChange={(e) =>
                  setEdgeForm({ ...edgeForm, distance: e.target.value })
                }
              />

              <input
                className="border p-2"
                type="number"
                placeholder="Carbon (g)"
                value={edgeForm.carbon}
                onChange={(e) =>
                  setEdgeForm({ ...edgeForm, carbon: e.target.value })
                }
              />

              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={handleAddEdge}
              >
                Add Edge
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
