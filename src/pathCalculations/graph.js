class Graph {
    constructor() {
        this.nodes = {};
        this.edges = {};
    }

    addNode(node, position) {
        this.nodes[node] = position;
        this.edges[node] = {};
    }

    addEdge(node1, node2, distance) {
        this.edges[node1][node2] = distance;
        this.edges[node2][node1] = distance; // Assuming undirected graph
    }

    getNeighbors(node) {
        return Object.keys(this.edges[node]);
    }
}

export default Graph;