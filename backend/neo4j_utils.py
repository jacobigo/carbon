from neo4j import GraphDatabase

class Neo4jHandler:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def get_graph(self):
        query = "MATCH (n)-[r]->(m) RETURN n.name AS source, m.name AS target, r.distance AS distance, r.carbon AS carbon"
        with self.driver.session() as session:
            result = session.run(query)
            return [record.data() for record in result]