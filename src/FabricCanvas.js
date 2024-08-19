import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

const FabricCanvas = () => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const pointCount = 1000; 
  const cellSize = 50; 
  const clusterRadius = 5; 
  const isPanning = useRef(false);
  const lastPosX = useRef(0);
  const lastPosY = useRef(0);
  const clustersMap = useRef(new Map());
  const zoomThreshold = 1;
  const visibleObjects = useRef(new Set());

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

      const grid = divideIntoGridCells(fabricCanvas.width, fabricCanvas.height, cellSize);
      let viewport = updateVisibleArea(fabricCanvas)
      const clusters = groupLocationsInGrid(points, grid, cellSize, fabricCanvas,viewport);
      clustersMap.current = new Map(clusters.map(cluster => [cluster.object, cluster]));
      console.log(viewport)
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

      // Update visible clusters based on zoom and pan
      updateVisibleClusters(fabricCanvas, zoom);

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
    
          // Calculate panning distance
          const panningDistance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

          if (panningDistance > 100) {
            // Trigger your function here
            const grid = divideIntoGridCells(fabricCanvas.width, fabricCanvas.height, cellSize);
            let viewport = updateVisibleArea(fabricCanvas)
            const clusters = groupLocationsInGrid(points, grid, cellSize, fabricCanvas,viewport);
            clustersMap.current = new Map(clusters.map(cluster => [cluster.object, cluster]));
            // console.log(clustersMap.current,"clustersMap.current")
          }

        }
        fabricCanvas.requestRenderAll();
        lastPosX.current = e.clientX;
        lastPosY.current = e.clientY;
        // Update visible clusters during panning
        updateVisibleClusters(fabricCanvas, fabricCanvas.getZoom());
      }
    });

    const grid = divideIntoGridCells(fabricCanvas.width, fabricCanvas.height, cellSize);
    const points = generateRandomPoints(fabricCanvas.width, fabricCanvas.height, pointCount);
    let viewport = updateVisibleArea(fabricCanvas)
    const clusters = groupLocationsInGrid(points, grid, cellSize, fabricCanvas,viewport);

    clustersMap.current = new Map(clusters.map(cluster => [cluster.object, cluster]));

    // Initial rendering based on current viewport
    updateVisibleClusters(fabricCanvas, fabricCanvas.getZoom());

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


  const updateVisibleArea = (fabricCanvas) => {
    const transform = fabricCanvas.viewportTransform;
    if (transform) {
      const scaleX = transform[0]; // a
      const scaleY = transform[3]; // d
      const translateX = transform[4]; // e
      const translateY = transform[5]; // f

      // Calculate the visible area in canvas coordinates
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const topLeft = fabric.util.transformPoint({ x: 0, y: 0 }, fabric.util.invertTransform(transform));
      const bottomRight = fabric.util.transformPoint({ x: viewportWidth, y: viewportHeight }, fabric.util.invertTransform(transform));

      const visibleArea = {
        x1: topLeft.x,
        y1: topLeft.y,
        x2: bottomRight.x,
        y2: bottomRight.y,
      };

      // console.log('Visible Area:', visibleArea);
      return visibleArea
    }
  };


  const divideIntoGridCells = (canvasWidth, canvasHeight, cellSize) => {
    const rows = Math.ceil(canvasHeight / cellSize);
    const cols = Math.ceil(canvasWidth / cellSize);
    const grid = Array.from({ length: rows }, () => Array(cols).fill([]));
    return grid;
  };

  const generateRandomPoints = (width, height, count) => {
    const points = [
      { x: 561.4743922138606, y: 101.57075635919335 },
      { x: 440.8262824187778, y: 370.5443562082488 },
      { x: 429.0319582979199 , y: 387.63325017335467  },

      { x: 424.62691842839286  , y: 236.11776269079417},
      { x: 408.98038621036306   , y: 225.2945882298917},
      { x: 440.8515013136948    , y: 225.07189930198314},
      { x: 424.40026070570235, y: 209.91678406500168},

      { x: 415.66008017227216, y: 371.0093545252013  },
      { x: 427.3637611212783   , y: 353.55621659638314 },
      { x: 667.4326369675804, y: 436.159325981197 },
      { x: 155.63432268546197, y: 92.58180971263204 },


      { x: 167.01389865271258, y: 437.1863452896028},
      { x: 192.18801722414074, y: 401.1863452896028},
      { x: 169.23514440901508, y: 409.8138440840465},
      { x: 190.33604426912368, y: 432.22832787542814},



      { x: 1332.7637130480766, y: 295.5322495549937},
    ];

    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      points.push({ x, y });
    }

  //   for (let i = 0; i < count; i++) {
  //   // Decide randomly if the point should be inside or outside the canvas
  //   const inside = Math.random() > 0.5;

  //   let x, y;

  //   if (inside) {
  //     // Generate a point inside the canvas
  //     x = Math.floor(Math.random() * width);
  //     y = Math.floor(Math.random() * height);
  //   } else {
  //     // Generate a point outside the canvas
  //     const outsideMargin = 100; // Margin outside the canvas where points can be placed
  //     x = Math.random() > 0.5 
  //       ? Math.floor(Math.random() * (width + outsideMargin * 2)) - outsideMargin 
  //       : Math.floor(Math.random() * width);

  //     y = Math.random() > 0.5 
  //       ? Math.floor(Math.random() * (height + outsideMargin * 2)) - outsideMargin 
  //       : Math.floor(Math.random() * height);
  //   }

  //   points.push({ x, y });
  // }
    return points;
  };

  const groupLocationsInGrid = (points, grid, cellSize, fabricCanvas,viewport) => {
    
    points.forEach((point) => {
      if (isObjectInRectangle(point, fabricCanvas,viewport)) {
        const row = Math.floor(point.y / cellSize);
        const col = Math.floor(point.x / cellSize);
        grid[row][col] = [...grid[row][col], point];
      }
    });

    return grid.flatMap((row, rowIndex) =>
      row.flatMap((cell, colIndex) => {
        if (cell.length > 1) {
          const clusterCenter = {
            x: colIndex * cellSize + cellSize / 2,
            y: rowIndex * cellSize + cellSize / 2,
          };
          return {
            type: "cluster",
            object: new fabric.Circle({
              left: clusterCenter.x,
              top: clusterCenter.y,
              radius: 10,
              fill: "yellow",
              originX: "center",
              originY: "center",
            }),
            points: cell,
          };
        } else if (cell.length === 1) {
          return {
            type: "point",
            object: new fabric.Circle({
              left: cell[0].x,
              top: cell[0].y,
              radius: 5,
              fill: "green",
              originX: "center",
              originY: "center",
            }),
            points: cell,
          };
        }
        return null;
      })
    ).filter(Boolean);
  };

  const updateVisibleClusters = (fabricCanvas, zoom) => {
    const objectsToKeep = new Set();

    clustersMap.current.forEach((cluster) => {
      const clusterCenter = {
        x: cluster.object.left,
        y: cluster.object.top,
      };
      const isClusterInViewport = checkClusterInViewport(clusterCenter, clusterRadius, fabricCanvas);

      if (isClusterInViewport && zoom < zoomThreshold) {
        if (!visibleObjects.current.has(cluster.object)) {
          fabricCanvas.add(cluster.object);
          visibleObjects.current.add(cluster.object);
        }
        objectsToKeep.add(cluster.object);
      } else if (isClusterInViewport && zoom >= zoomThreshold) {
        cluster.points.forEach((point) => {
          const pointObject = new fabric.Circle({
            left: point.x,
            top: point.y,
            radius: 5,
            fill: "green",
            originX: "center",
            originY: "center",
          });
          if (!visibleObjects.current.has(pointObject)) {
            fabricCanvas.add(pointObject);
            visibleObjects.current.add(pointObject);
          }
          objectsToKeep.add(pointObject);
        });
      }
    });

    // Remove objects that are no longer visible
    visibleObjects.current.forEach((obj) => {
      if (!objectsToKeep.has(obj)) {
        fabricCanvas.remove(obj);
        visibleObjects.current.delete(obj);
      }
    });

    fabricCanvas.renderAll();
  };

  const checkClusterInViewport = (clusterCenter, clusterRadius, fabricCanvas) => {
    const viewport = fabricCanvas.viewportTransform;
    const left = viewport[4];
    const top = viewport[5];
    const width = window.innerWidth / fabricCanvas.getZoom();
    const height = window.innerHeight / fabricCanvas.getZoom();
    return (
      clusterCenter.x + clusterRadius > left &&
      clusterCenter.x - clusterRadius < left + width &&
      clusterCenter.y + clusterRadius > top &&
      clusterCenter.y - clusterRadius < top + height
    );
  };

  const isObjectInRectangle = (obj, fabricCanvas,viewport) => {
    // const viewportWidth = fabricCanvas.getWidth();
    // const viewportHeight = fabricCanvas.getHeight();
    // const viewportTransform = fabricCanvas.viewportTransform;
    // const zoom = fabricCanvas.getZoom();
    // const x = (obj.x - viewportTransform[4]) / zoom;
    // const y = (obj.y - viewportTransform[5]) / zoom;
    // const isInViewport = x >= 0 && x <= viewportWidth && y >= 0 && y <= viewportHeight;
    // return isInViewport;

    const viewportTransform = fabricCanvas.viewportTransform;
  const zoom = fabricCanvas.getZoom();

  // Transform the object's coordinates to the canvas's current zoom and translation
  const x = (obj.x - viewportTransform[4]) / zoom;
  const y = (obj.y - viewportTransform[5]) / zoom;

  // Check if the object's coordinates are within the given viewport bounds
  const isInViewport = 
    x >= viewport.x1 && x <= viewport.x2 && 
    y >= viewport.y1 && y <= viewport.y2;

  return isInViewport
  };

  return <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} />;
};

export default FabricCanvas;
