import networkx as nx

def build_graph(edges):
    G = nx.DiGraph()
    for edge in edges:
        G.add_edge(
            edge["source"], edge["target"],
            distance=edge["distance"],
            carbon=edge["carbon"]
        )
    return G

def find_path(G, start, end, metric="distance"):
    try:
        return nx.dijkstra_path(G, start, end, weight=metric)
    except Exception as e:
        return {"error": str(e)}