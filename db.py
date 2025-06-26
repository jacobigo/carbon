from neo4j import GraphDatabase

uri = "neo4j+s://2d42c7af.databases.neo4j.io"
user = "neo4j"
password = "rDA0Gv33sVOz0OJl0KnYD94JHGLMTZHUvCvyqBXxD-0"
AUTH = (user, password)

with GraphDatabase.driver(uri, auth=AUTH) as driver:
    driver.verify_connectivity()

summary = driver.execute_query("""
    MERGE (a:Location {name: 'Factory A'})
    MERGE (b:Location {name: 'Warehouse B'})
    MERGE (c:Location {name: 'Port C'})
    MERGE (a)-[:ROUTE {distance: 100, carbon: 80}]->(b)
    MERGE (a)-[:ROUTE {distance: 150, carbon: 40}]->(c)
    MERGE (c)-[:ROUTE {distance: 70, carbon: 20}]->(b)
    """,
).summary
print("Created {nodes_created} nodes in {time} ms.".format(
    nodes_created=summary.counters.nodes_created,
    time=summary.result_available_after
))