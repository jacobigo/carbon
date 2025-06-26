from flask import Flask, jsonify, request
from flask import Flask, request, jsonify
from flask_cors import CORS
from neo4j_utils import Neo4jHandler
from graph_logic import build_graph, find_path

app = Flask(__name__)
CORS(app)

neo4j = Neo4jHandler("neo4j+s://2d42c7af.databases.neo4j.io", "neo4j", "rDA0Gv33sVOz0OJl0KnYD94JHGLMTZHUvCvyqBXxD-0")

@app.route("/api/path", methods=["POST"])
def compute_path():
    data = request.json
    start = data["start"]
    end = data["end"]
    metric = data.get("metric", "distance")

    edges = neo4j.get_graph()
    G = build_graph(edges)
    path = find_path(G, start, end, metric)
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
            "carbon": edge["carbon"]
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
@app.route("/api/edge", methods=["POST"])
def add_edge():
    data = request.json
    source = data["source"]
    target = data["target"]
    distance = data["distance"]
    carbon = data["carbon"]

    try:
        with neo4j.driver.session() as session:
            session.run("""
                MATCH (a:Location {name: $source})
                MATCH (b:Location {name: $target})
                MERGE (a)-[:ROUTE {distance: $distance, carbon: $carbon}]->(b)
            """, source=source, target=target, distance=distance, carbon=carbon)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500




if __name__ == "__main__":
    app.run(debug=True)
