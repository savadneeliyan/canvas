import PriorityQueue from "./priorityQueue";

function dijkstra(graph, startNode, endNode) {
    const distances = {};
    const visited = {};
    const previous = {};
    const priorityQueue = new PriorityQueue();

    for (const node in graph.nodes) {
        if (node === startNode) {
            distances[node] = 0;
            priorityQueue.enqueue(node, 0);
        } else {
            distances[node] = Infinity;
        }
        visited[node] = false;
        previous[node] = null;
    }

    while (!priorityQueue.isEmpty()) {
        const { element: currentNode } = priorityQueue.dequeue();

        if (currentNode === endNode) {
            const path = [];
            let node = currentNode;
            while (node !== null) {
                path.unshift(node);
                node = previous[node];
            }
            return path;
        }

        if (visited[currentNode]) {
            continue;
        }

        visited[currentNode] = true;

        const neighbors = graph.edges[currentNode];
        for (const neighbor in neighbors) {
            const distance = distances[currentNode] + neighbors[neighbor];

            if (distance < distances[neighbor]) {
                distances[neighbor] = distance;
                previous[neighbor] = currentNode;
                priorityQueue.enqueue(neighbor, distance);
            }
        }
    }

    // No path found
    return null;
}



export default dijkstra;