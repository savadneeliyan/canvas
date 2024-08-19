import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

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

    
    const points = [
      { x: 561.4743922138606, y: 101.57075635919335 },
      { x: 424.62691842839286  , y: 236.11776269079417},
      { x: 415.66008017227216, y: 371.0093545252013  },
      { x: 167.01389865271258, y: 437.1863452896028},
      { x: 1332.7637130480766, y: 295.5322495549937},
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
        stroke: 'gray',
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
      const updateSubPath = () => {
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



      // Attach event listener to update the sub-path when the rectangle is moved
      rectangle.on('moving', updateSubPath);

       // Attach event listener to constrain the connection point to the line
       connectionPoint.on('moving', constrainConnectionPoint);

       // Store this sub-path in the subPaths array for later use
       subPaths.push({ rectangle, subPathPoint, connectionPoint, subPathLine, updateSubPath });


      // Initial update
      updateSubPath();
    };

     // Create multiple sub-paths
     createSubPath(800, 300);
     createSubPath(900, 400);
     createSubPath(700, 200);


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

     // Attach event listeners to update all sub-paths when the main path is moved
     circles.forEach(circle => {
      circle.on('moving', () => {
        updatePolyline();
        subPaths.forEach(subPath => subPath.updateSubPath());
      });
    });

    document.addEventListener("mousedown", (opt) => {
      if (opt.button === 1) {
        isPanning.current = true;
        lastPosX.current = opt.clientX;
        lastPosY.current = opt.clientY;
      }
    });

    document.addEventListener("mouseup", () => {
      isPanning.current = false;
    });

    return () => {
      fabricCanvas.dispose();
    };
  }, []);




  


  return <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} />;
};

export default FabricCanvasLine;
