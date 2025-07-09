from flask import Flask, jsonify, request
from flask import Flask, request, jsonify
from flask_cors import CORS
from neo4j_utils import Neo4jHandler
from graph_logic import build_graph, find_path
from math import radians, cos, sin, asin, sqrt
import requests

app = Flask(__name__)
CORS(app)

neo4j = Neo4jHandler("neo4j+s://2d42c7af.databases.neo4j.io", "neo4j", "rDA0Gv33sVOz0OJl0KnYD94JHGLMTZHUvCvyqBXxD-0")

EMISSION_FACTORS = {
    "car": 0.15,     # kg CO₂ per km (average passenger car)
    "truck": 0.2,     # kg CO₂ per km (freight truck)
    "train": 0.045,   # kg CO₂ per km (freight rail)
    "plane": 0.6    # kg CO₂ per km (average commercial flight)
}



@app.route("/api/clear", methods=["POST"])
def clear_database():
    try:
        with neo4j.driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")
        return jsonify({"status": "success", "message": "Database cleared"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500



@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    question = data.get("question", "")

    # Fetch relevant data from Neo4j
    with neo4j.driver.session() as session:
        nodes = session.run("MATCH (n:Location) RETURN n.name AS name").values()
        edges = session.run("MATCH (a:Location)-[r:ROUTE]->(b:Location) RETURN a.name, b.name, r.transport, r.distance, r.carbon").values()

    # Format the data as context
    context = f"Locations: {', '.join([n[0] for n in nodes])}\n"
    context += "Routes:\n"
    for edge in edges:
        context += f"From {edge[0]} to {edge[1]} by {edge[2]}: {edge[3]:.2f}km, {edge[4]:.2f}g CO2\n"

    # Combine context with user question
    prompt = f"You are a supply chain assistant. Here is the current network:\n{context}\nUser question: {question}"

    # Send to Ollama
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.2",
            "prompt": prompt,
            "stream": False,
        }
    )
    answer = response.json().get("response", "")
    return jsonify({"answer": answer})


@app.route("/api/path", methods=["POST"])
def compute_path():
    data = request.json
    start = data["start"]
    end = data["end"]
    metric = data.get("metric", "distance")

    edges = neo4j.get_graph()
    G = build_graph(edges)
    path = find_path(G, start, end, metric)
    print(f"Computed path from {start} to {end} using metric '{metric}': {path}")
    return jsonify({"path": path})


# pulls from database and returns a graph in Cytoscape format
@app.route("/api/graph")
def get_graph():
    edges = neo4j.get_graph()
    with neo4j.driver.session() as session:
        result = session.run("MATCH (n:Location) RETURN n.name AS name, n.lat AS lat, n.lon AS lon")
        nodes = [{"name": r["name"], "lat": r["lat"], "lon": r["lon"]} for r in result]

    formatted_edges = []
    for edge in edges:
        formatted_edges.append({
            "source": edge["source"],
            "target": edge["target"],
            "distance": edge["distance"],
            "carbon": edge["carbon"],
            # Always provide a string for transport, defaulting to 'unknown' if missing or None
            "transport": edge.get("transport") if edge.get("transport") else "unknown"
        })

    return jsonify({
        "nodes": nodes,
        "edges": formatted_edges
    })


@app.route("/api/node", methods=["POST"])
def add_node():
    data = request.json
    name = data["name"]
    lat = data.get("lat")
    lon = data.get("lon")

    try:
        with neo4j.driver.session() as session:
            session.run(
                "MERGE (n:Location {name: $name}) "
                "SET n.lat = $lat, n.lon = $lon",
                name=name, lat=lat, lon=lon
            )
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route("/api/nodes")
def get_nodes():
    try:
        with neo4j.driver.session() as session:
            result = session.run("MATCH (n:Location) RETURN DISTINCT n.name AS name")
            names = [record["name"] for record in result]
        return jsonify({"nodes": names})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#updates database when user adds an edge/node

def haversine(lon1, lat1, lon2, lat2):
    # convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    # haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return c * r

@app.route("/api/edge", methods=["POST"])
def add_edge():
    data = request.json
    source = data["source"]
    target = data["target"]
    transport = data["transport"]

    try:
        with neo4j.driver.session() as session:
            # Get coordinates for source and target
            result = session.run(
                "MATCH (a:Location), (b:Location) "
                "WHERE a.name = $source AND b.name = $target "
                "RETURN a.lat AS lat1, a.lon AS lon1, b.lat AS lat2, b.lon AS lon2",
                source=source, target=target
            )
            record = result.single()
            if not record or None in (record["lat1"], record["lon1"], record["lat2"], record["lon2"]):
                return jsonify({"error": "Missing coordinates for source or target node"}), 400

            lat1, lon1, lat2, lon2 = float(record["lat1"]), float(record["lon1"]), float(record["lat2"]), float(record["lon2"])
            distance = haversine(lon1, lat1, lon2, lat2)

            emission_factor = EMISSION_FACTORS.get(transport)
            if emission_factor is None:
                return jsonify({"error": "Invalid transport type"}), 400
            carbon = distance * emission_factor


            session.run("""
                MATCH (a:Location {name: $source})
                MATCH (b:Location {name: $target})
                MERGE (a)-[:ROUTE {distance: $distance, carbon: $carbon, transport: $transport}]->(b)
            """, source=source, target=target, distance=distance, carbon=carbon, transport=transport)
        return jsonify({"status": "success", "distance": distance})
    except Exception as e:
        return jsonify({"error": str(e)}), 500






if __name__ == "__main__":
    app.run(debug=True)
