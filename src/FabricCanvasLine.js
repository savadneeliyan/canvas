import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import Graph from './pathCalculations/graph';
import dijkstra from './pathCalculations/dijkstra';



const FabricCanvasLine = () => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const isPanning = useRef(false);
  const lastPosX = useRef(0);
  const lastPosY = useRef(0);

  useEffect(() => {
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "white",
    });

    setCanvas(fabricCanvas);

    fabricCanvas.on("mouse:wheel", (opt) => {
      const delta = opt.e.deltaY;
      let zoom = fabricCanvas.getZoom();

      
      if (delta > 0) {
        zoom /= 1.1;
      } else {
        zoom *= 1.1;
      }
      if (zoom > 10) zoom = 10;
      if (zoom < 0.1) zoom = 0.1;

      const mouse = fabricCanvas.getPointer(opt.e);
      const zoomPoint = new fabric.Point(mouse.x, mouse.y);

      fabricCanvas.zoomToPoint(zoomPoint, zoom);

      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    fabricCanvas.on("mouse:move", (opt) => {

      if (isPanning.current) {
        const e = opt.e;
        const vpt = fabricCanvas.viewportTransform;
       
        if (vpt) {
          const deltaX = e.clientX - lastPosX.current;
          const deltaY = e.clientY - lastPosY.current;
    
          // Update viewport transform
          vpt[4] += deltaX;
          vpt[5] += deltaY;
    
        }
        fabricCanvas.requestRenderAll();
        lastPosX.current = e.clientX;
        lastPosY.current = e.clientY;
       
      }
    });

    fabricCanvas.on("mouse:down", (opt) => {
      // console.log(greenPointCoords)
      if(opt.target){
        // const greenPointCoords = { x: 415.66008017227216, y: 371.0093545252013  }
        const greenPointCoords = { x: opt.target.left, y: opt.target.top }
        console.log(greenPointCoords)
      //   const greenPointCoords = { x: 800, y: 300 }; // The coordinates of your green point
        // findShortestPath('point0', greenPointCoords);
      }
    })



    
    const points = [
      { x: 1124.62691842839286  , y: 436.11776269079417},
      { x: 1132.7637130480766, y: 195.5322495549937},
      { x: 561.4743922138606, y: 101.57075635919335 },
      { x: 415.66008017227216, y: 371.0093545252013  },
      { x: 467.01389865271258, y: 437.1863452896028},
    ];

    const circles = points.map(point => {
      return new fabric.Circle({
        left: point.x,
        top: point.y,
        radius: 5,
        fill: 'red',
        originX: 'center',
        originY: 'center',
        hasControls: false,
        hasBorders: false,
        lockMovementX: false,
        lockMovementY: false,
        selectable: true,
      });
    });

    const polyline = new fabric.Polyline(points, {
      stroke: 'black',
      strokeWidth: 2,
      fill: 'transparent', 
      hasControls: false,
        hasBorders: false,
        lockMovementX: false,
        lockMovementY: false,
      selectable: false,
    });


    fabricCanvas.add(polyline);

    circles.forEach(circle => {
      fabricCanvas.add(circle);
    });

    const graph = new Graph();
    graph.polyline = points;

    points.forEach((point, index) => {
      graph.addNode(`point${index}`, { x: point.x, y: point.y });
      if (index > 0) {
        const distance = Math.hypot(
          point.x - points[index - 1].x,
          point.y - points[index - 1].y
        );
        graph.addEdge(`point${index - 1}`, `point${index}`, distance);
      }
    });

     // Array to store sub-paths (each will have a rectangle, connection point, sub-path point, and line)
     const subPaths = [];

     // Helper function to create a new sub-path
    const createSubPath = (left, top) => {
      // Create a rectangle (item) near the points
      const rectangle = new fabric.Rect({
        left,
        top,
        width: 10,
        height: 10,
        fill: 'blue',
        originX: 'center',
        originY: 'center',
        hasControls: true,
        hasBorders: true,
        lockMovementX: false,
        lockMovementY: false,
        selectable: false,
      });

      fabricCanvas.add(rectangle);

      // Create a circle for the sub-path point on the rectangle (yellow)
      const subPathPoint = new fabric.Circle({
        radius: 5,
        fill: 'yellow',
        originX: 'center',
        originY: 'center',
        hasControls: false,
        hasBorders: false,
        selectable: false,
      });

      fabricCanvas.add(subPathPoint);

      // Create a circle for the connection point on the main path (green)
      const connectionPoint = new fabric.Circle({
        radius: 5,
        fill: 'green',
        originX: 'center',
        originY: 'center',
        hasControls: false,
        hasBorders: false,
        selectable: true,
      });

      fabricCanvas.add(connectionPoint);

      // Create the sub-path line
      let subPathLine = new fabric.Line([0, 0, 0, 0], {
        stroke: 'green',
        strokeWidth: 2,
        selectable: false,
      });

      fabricCanvas.add(subPathLine);

      // Helper function to project a point onto a line segment
      const projectPointOnLine = (p, v, w) => {
        const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
        if (l2 === 0) return v;
        const t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        if (t < 0) return v;
        if (t > 1) return w;
        return {
          x: v.x + t * (w.x - v.x),
          y: v.y + t * (w.y - v.y),
        };
      };

      // Function to update the sub-path line and points
      const updateSubPath = (movedPointIndex) => {
        if(!movedPointIndex){

          let closestProjection = null;
          let minDistance = Infinity;
  
          // Get the updated points from the polyline
          const updatedPoints = polyline.get('points');
  
          // Loop over each segment of the polyline to find the closest point
          for (let i = 0; i < updatedPoints.length - 1; i++) {
            const v = updatedPoints[i];
            const w = updatedPoints[i + 1];
            const projection = projectPointOnLine({ x: rectangle.left, y: rectangle.top }, v, w);
            const distance = Math.hypot(projection.x - rectangle.left, projection.y - rectangle.top);
  
            if (distance < minDistance) {
              minDistance = distance;
              closestProjection = projection;
            }
          }
  
          if (closestProjection) {
            // Set the position of the connection point (green) on the main path
            connectionPoint.set({
              left: closestProjection.x,
              top: closestProjection.y,
            });
  
            // Set the position of the sub-path point (yellow) on the rectangle
            subPathPoint.set({
              left: rectangle.left,
              top: rectangle.top,
            });
  
            // Update the sub-path line
            subPathLine.set({
              x1: closestProjection.x,
              y1: closestProjection.y,
              x2: rectangle.left,
              y2: rectangle.top,
            });
          }
  
          fabricCanvas.renderAll();
        }else{

          subPaths.forEach(subPath => {
            const { connectionPoint, subPathLine } = subPath;
    
            // Determine the closest segment index for the connection point
            let closestSegmentIndex = null;
            let minDistance = Infinity;
    
            for (let i = 0; i < graph.polyline.length - 1; i++) {
                const segmentStart = graph.polyline[i];
                const segmentEnd = graph.polyline[i + 1];
                const projection = findClosestPointOnSegment({ x: connectionPoint.left, y: connectionPoint.top }, segmentStart, segmentEnd);
    
                const distance = Math.hypot(projection.x - connectionPoint.left, projection.y - connectionPoint.top);
    
                if (distance < minDistance) {
                    minDistance = distance;
                    closestSegmentIndex = i;
                }
            }
    
            // If the closest segment includes the moved point, update the connection point
            if (closestSegmentIndex === movedPointIndex || closestSegmentIndex === movedPointIndex - 1) {
                const segmentStart = graph.polyline[closestSegmentIndex];
                const segmentEnd = graph.polyline[closestSegmentIndex + 1];
                const projection = findClosestPointOnSegment({ x: connectionPoint.left, y: connectionPoint.top }, segmentStart, segmentEnd);
    
                connectionPoint.set({
                    left: projection.x,
                    top: projection.y,
                });
    
                subPathLine.set({
                    x1: projection.x,
                    y1: projection.y,
                    x2: subPath.subPathPoint.left,
                    y2: subPath.subPathPoint.top,
                });
    
                fabricCanvas.renderAll();
            }
        });
        }



      };


      // Function to constrain the movement of the connection point along the polyline
      const constrainConnectionPoint = (options) => {
        let closestProjection = null;
        let minDistance = Infinity;

        // Get the updated points from the polyline
        const updatedPoints = polyline.get('points');

        // Loop over each segment of the polyline to find the closest point
        for (let i = 0; i < updatedPoints.length - 1; i++) {
          const v = updatedPoints[i];
          const w = updatedPoints[i + 1];
          const projection = projectPointOnLine({ x: connectionPoint.left, y: connectionPoint.top }, v, w);
          const distance = Math.hypot(projection.x - connectionPoint.left, projection.y - connectionPoint.top);

          if (distance < minDistance) {
            minDistance = distance;
            closestProjection = projection;
          }
        }

        if (closestProjection) {
          connectionPoint.set({
            left: closestProjection.x,
            top: closestProjection.y,
          });

          // Update the sub-path line
          subPathLine.set({
            x1: closestProjection.x,
            y1: closestProjection.y,
            x2: rectangle.left,
            y2: rectangle.top,
          });
        }

        fabricCanvas.renderAll();
      };

      // console.log(graph,"graph")

      // Attach event listener to update the sub-path when the rectangle is moved
      // rectangle.on('moving', updateSubPath);

       // Attach event listener to constrain the connection point to the line
       connectionPoint.on('moving', constrainConnectionPoint);

       connectionPoint.on('mousedown', () => {
        // Get the coordinates of the start of the subpath
        const startCoords = {
            x: left,  // or subPath.subPathPoint.left if you want the yellow point
            y: top    // or subPath.subPathPoint.top if you want the yellow point
        };
        
        console.log('Start of Subpath:', startCoords);
        findShortestPath('point0', startCoords);

        // You can now use these coordinates for any purpose, such as highlighting, displaying, etc.
        // For example, you could move the rectangle or highlight it
    });

       // Store this sub-path in the subPaths array for later use
       subPaths.push({ rectangle, subPathPoint, connectionPoint, subPathLine, updateSubPath });


      // Initial update
      updateSubPath();
    };

     // Create multiple sub-paths
     createSubPath(800, 300);
     createSubPath(850, 350);
     createSubPath(950, 450);
     createSubPath(900, 400);
     createSubPath(600, 300);


    const updatePolyline = () => {
      polyline.set({
        points: circles.map(circle => ({
          x: circle.left,
          y: circle.top,
        })),
      });
      // updateSubPath();
      fabricCanvas.renderAll();
    };

    const drawShortestPath = (pathPoints) => {
      // Convert node names to coordinates
    const coordinates = pathPoints.map(nodeName => graph.nodes[nodeName]);

    // Check if the coordinates array is valid
    if (coordinates.some(coord => coord === undefined)) {
        console.error("Some coordinates are undefined:", coordinates);
        return;
    }

    // Draw the yellow line for the shortest path from start to the green point
    const pathLine = new fabric.Polyline(coordinates, {
        stroke: 'yellow',
        strokeWidth: 8,
        fill: 'transparent',
    });
    fabricCanvas.add(pathLine);

    // Find the last point (green point) in the coordinates array
    const lastPoint = coordinates[coordinates.length - 1];

    // Add the extension to the origin of the subpath (e.g., the rectangle's center)
    console.log(subPaths,"subPaths")
    // const subPathOrigin = {
    //     x: subPaths.rectangle.left,  // Or subPath.subPathPoint.left if you prefer the yellow point
    //     y: subPaths.rectangle.top    // Or subPath.subPathPoint.top if you prefer the yellow point
    // };

    // const extendedLine = new fabric.Line([lastPoint.x, lastPoint.y, subPathOrigin.x, subPathOrigin.y], {
    //     stroke: 'yellow',
    //     strokeWidth: 8,
    //     fill: 'transparent',
    // });

    // fabricCanvas.add(extendedLine);
      fabricCanvas.renderAll();
  };

     // Attach event listeners to update all sub-paths when the main path is moved
     circles.forEach((circle,index) => {
      circle.on('moving', () => {
        updatePolyline();
        subPaths.forEach(subPath => subPath.updateSubPath(index));
      });
    });

    document.addEventListener("mousedown", (opt) => {
      // console.log(opt.target)
      if (opt.button === 1) {
        isPanning.current = true;
        lastPosX.current = opt.clientX;
        lastPosY.current = opt.clientY;
      }
    });

    document.addEventListener("mouseup", () => {
      isPanning.current = false;
    });

    function findClosestPointOnSegment(p, v, w) {
      const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
      if (l2 === 0) return v;  // v == w case
      let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));  // Clamping t to [0, 1]
      return {
          x: v.x + t * (w.x - v.x),
          y: v.y + t * (w.y - v.y)
      };
  }
  
  function findShortestPathAlongLine(graph, startNode, endCoords) {
      // Find the closest point on the polyline to the endCoords
      const endProjection = {};
      let minDistance = Infinity;
  
      if (!graph.polyline || !Array.isArray(graph.polyline) || graph.polyline.length === 0) {
        console.error("Polyline is not properly initialized.");
    } else {

      for (let i = 0; i < graph.polyline.length - 1; i++) {
          const segmentStart = graph.polyline[i];
          const segmentEnd = graph.polyline[i + 1];
          const projection = findClosestPointOnSegment(endCoords, segmentStart, segmentEnd);
  
          const distance = Math.hypot(projection.x - endCoords.x, projection.y - endCoords.y);
          if (distance < minDistance) {
              minDistance = distance;
              endProjection.node = `segment${i}-${i + 1}`;
              endProjection.point = projection;
          }
      }
  
      // Add the end projection as a node in the graph
      graph.addNode(endProjection.node, endProjection.point);
  
      // Connect the projection point to the nearest segment nodes
      for (let i = 0; i < graph.polyline.length - 1; i++) {
          const segmentStart = graph.polyline[i];
          const segmentEnd = graph.polyline[i + 1];
          const segmentLength = Math.hypot(segmentEnd.x - segmentStart.x, segmentEnd.y - segmentStart.y);
          
          const distStartToProjection = Math.hypot(segmentStart.x - endProjection.point.x, segmentStart.y - endProjection.point.y);
          const distEndToProjection = Math.hypot(segmentEnd.x - endProjection.point.x, segmentEnd.y - endProjection.point.y);
  
          // Only connect if the projection lies on this segment
          if (distStartToProjection + distEndToProjection === segmentLength) {
              graph.addEdge(endProjection.node, `point${i}`, distStartToProjection);
              graph.addEdge(endProjection.node, `point${i + 1}`, distEndToProjection);
          }
      }
  
      // Now run Dijkstra's algorithm
      const path = dijkstra(graph, startNode, endProjection.node);
      console.log(graph,path,"path")
      // drawShortestPath(path)
      return path;
    }

  }



    const findShortestPath =  (startNode, endCoords)=> findShortestPathAlongLine(graph, startNode, endCoords);
    

    return () => {
      fabricCanvas.dispose();
    };
  }, []);


  


  return <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} />;
};

export default FabricCanvasLine;
