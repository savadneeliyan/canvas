// floorPlansUtils.js

export const getCurrentIndex = (id, floorPlans) => {
    const item = floorPlans.find((item) => item?.enc_id == id);
    return item?.display_index;
};

export const floorIndex = (id, floorPlans, selTraversibleDetails, floorPlansPathSort) => {
    let floorss;
    if (getCurrentIndex(selTraversibleDetails?.from_floor_id, floorPlans) > getCurrentIndex(selTraversibleDetails?.to_floor_id, floorPlans)) {
        floorss = floorPlansPathSort.sort((a, b) => b.display_index - a.display_index);
    } else {
        floorss = floorPlansPathSort.sort((a, b) => a.display_index - b.display_index);
    }

    const index = floorss?.findIndex((item) => id == item.enc_id);
    return index;
};

export const checkFloorConnections = (selectedVTS, isAccending, allVerticalTransports, selTraversibleDetails, floorPlans) => {
    const matchingItems = [];
    for (let item1 of selectedVTS) {
        for (let item2 of allVerticalTransports) {
            if (
                (isAccending && item1.vt_id === item2.vt_id && floorIndex(item1?.floor_plan_id, floorPlans, selTraversibleDetails) <= floorIndex(selTraversibleDetails?.to_floor_id, floorPlans, selTraversibleDetails)) ||
                (!isAccending && item1.vt_id === item2.vt_id && floorIndex(item1?.floor_plan_id, floorPlans, selTraversibleDetails) >= floorIndex(selTraversibleDetails?.to_floor_id, floorPlans, selTraversibleDetails))
            ) {
                matchingItems.push(item2);
            }
        }
    }
    if (matchingItems.length > 0) {
        return matchingItems;
    } else {
        return null;
    }
}

export const findShortestVTS = (data, from, graph) => {
    let minLength = Infinity;
    let shortestItem = null;
    data?.forEach((item) => {
        const path = dijkstraWithLength(
            graph, // Assuming `graph` is accessible in the current scope
            from,
            item.name
        );
        console.log(path, "sp");
        if (path?.length < minLength) {
            minLength = path.length;
            shortestItem = item;
        }
    });
    return shortestItem;
}



export const onSelectVT = (data, allVerticalTransports, selTraversibleDetails, floorPlans, floorPlansPathSort, handlePontsAndEdges, setSelTraversibleDetails, toggleVerticalClose, showPath, toast, graph) => {
    let pathArray = [];
    let result;
    const isAccending = floorIndex(selTraversibleDetails?.from_floor_id, floorPlans, selTraversibleDetails, floorPlansPathSort) < floorIndex(selTraversibleDetails?.to_floor_id, floorPlans, selTraversibleDetails, floorPlansPathSort);
    console.log(isAccending);

    for (let i = floorIndex(selTraversibleDetails?.from_floor_id, floorPlans, selTraversibleDetails, floorPlansPathSort); isAccending ? (i <= floorIndex(selTraversibleDetails?.to_floor_id, floorPlans, selTraversibleDetails, floorPlansPathSort)) : (i >= floorIndex(selTraversibleDetails?.to_floor_id, floorPlans, selTraversibleDetails, floorPlansPathSort));) {
        const element = i;

        console.log(element);
        const selectedVTS = allVerticalTransports?.filter(
            (item) => data?.icon_id == item?.icon_id && element == floorIndex(item?.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort)
        );

        console.log(selectedVTS, 'selectedVTS');
        let topMostItem;
        if (i != floorIndex(selTraversibleDetails?.to_floor_id, floorPlans, selTraversibleDetails, floorPlansPathSort)) {
            topMostItem = checkTopFloorVTS(selectedVTS, isAccending, allVerticalTransports, selTraversibleDetails, floorPlans, floorPlansPathSort);
            topMostItem = topMostItem.filter((item) => result?.vt_id !== item?.vt_id);

            if (topMostItem.length === 0) {
                const diffrentTypeVT = allVerticalTransports.filter((item) => floorIndex(item?.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort) === floorIndex(result?.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort) && result?.vt_id !== item?.vt_id);
                console.log(diffrentTypeVT, 'diffrentTypeVT');
                topMostItem = checkTopFloorVTS(diffrentTypeVT, isAccending, allVerticalTransports, selTraversibleDetails, floorPlans, floorPlansPathSort);
                topMostItem = topMostItem.filter((item) => result?.vt_id !== item?.vt_id);
            }

        } else {
            topMostItem = [result];
        }
        console.log(result, 'result');
        console.log(topMostItem, 'topMostItem');

        let fromData;
        if (i === floorIndex(selTraversibleDetails?.from_floor_id, floorPlans, selTraversibleDetails, floorPlansPathSort)) {
            fromData = selTraversibleDetails?.from;
        } else if (i == floorIndex(selTraversibleDetails?.to_floor_id, floorPlans, selTraversibleDetails, floorPlansPathSort)) {
            fromData = selTraversibleDetails?.to;
        } else {
            fromData = `vertical_${result?.vtd_id}`;
        }
        console.log(fromData, 'fromData');
        const indexID = floorPlans[i]?.enc_id;
        handlePontsAndEdges(indexID);
        let shortestVt = findShortestVTS(convertVerticalPinData(topMostItem), fromData, graph);
        console.log(shortestVt, 'shortestVt');

        const from = i === floorIndex(selTraversibleDetails?.from_floor_id, floorPlans, selTraversibleDetails, floorPlansPathSort) ? selTraversibleDetails?.from : `vertical_${result?.vtd_id}`;
        let item = {
            floor_plan_id: shortestVt?.to_floor_id,
            from: from,
            to: i === floorIndex(selTraversibleDetails?.to_floor_id, floorPlans, selTraversibleDetails, floorPlansPathSort) ? selTraversibleDetails?.to : shortestVt?.name,
            to_vt_id: shortestVt?.vertical_transport_id,
            floor_plan: shortestVt?.floor_plan,
            vt_name: shortestVt?.vt_name
        };
        pathArray.push(item);
        if (floorIndex(result?.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort) != floorIndex(selTraversibleDetails?.to_floor_id, floorPlans, selTraversibleDetails, floorPlansPathSort)) {
            result = findHighestFloorPlanId(allVerticalTransports, item, isAccending, selTraversibleDetails, floorPlans, floorPlansPathSort);
            console.log(result);
            if (i === floorIndex(result?.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort)) {
                break;
            } else {
                i = floorIndex(result?.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort);
            }
        } else {
            break;
        }

    }
    console.log(pathArray, 'pathArray');
    setSelTraversibleDetails((prev) => ({
        ...prev,
        pathArray,
        is_miltiple: true
    }));
    handlePontsAndEdges(selTraversibleDetails?.from_floor_id);
    toggleVerticalClose();
    if (pathArray[pathArray?.length - 1]?.floor_plan_id == selTraversibleDetails?.to_floor_id) {
        showPath(pathArray[0]?.from, pathArray[0]?.to);
    } else {
        setSelTraversibleDetails((prev) => ({
            ...prev,
            pathArray,
            is_miltiple: false
        }));
        toast.warning('Sorry! The chosen vertical transport has no connection to your destination.');
    }
};

export const handlePontsAndEdges = (floor_id, allPointsAndEdges, graph) => {
    const floorPlanDtls = allPointsAndEdges?.find((item) => item?.fp_id == floor_id);
    if (floorPlanDtls?.edges_data) {
        const edges = JSON.parse(floorPlanDtls.edges_data);
        if (edges?.length === 0) {
            graph.restoreEdges();
        } else {
            graph.restoreEdges(edges);
            const nodeFromAPI = Object.keys(edges);
            nodeFromAPI?.forEach((n) => {
                graph.addNode(n);
            });
        }
    } else {
        graph.restoreEdges();
    }
    if (floorPlanDtls?.points_data) {
        const points = JSON.parse(floorPlanDtls.points_data);
        if (points?.length === 0) {
            graph.restorePositions();
        } else {
            graph.restorePositions(points);
        }
    } else {
        graph.restorePositions();
    }
};

export const checkTopFloorVTS = (data, isAccending, allVerticalTransports, selTraversibleDetails, floorPlans, floorPlansPathSort) => {
    let checkDirectConnectionReturn = checkFloorConnections(data, isAccending, allVerticalTransports, selTraversibleDetails, floorPlans, floorPlansPathSort);
    console.log(checkDirectConnectionReturn, 'checkDirectConnectionReturn');
    const dataArray = (checkDirectConnectionReturn ?? data);
    const filteredArray = dataArray.reduce((acc, current) => {
        const floorPlanId = parseInt(floorIndex(current.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort));
        if (isAccending) {
            if (floorPlanId > (floorIndex(acc[0]?.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort) || 0) && floorPlanId <= floorIndex(selTraversibleDetails?.to_floor_id, floorPlans, selTraversibleDetails, floorPlansPathSort)) {
                return [current];
            } else if (floorPlanId === (floorIndex(acc[0]?.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort) || 0)) {
                acc.push(current);
            }
        } else {
            if (floorPlanId < (floorIndex(acc[0]?.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort) || floorIndex(dataArray[dataArray?.length - 1]?.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort)) && floorPlanId >= floorIndex(selTraversibleDetails?.to_floor_id, floorPlans, selTraversibleDetails, floorPlansPathSort)) {
                return [current];
            } else if (floorPlanId === (floorIndex(acc[0]?.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort) || floorIndex(dataArray[dataArray?.length - 1]?.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort))) {
                acc.push(current);
            }
        }
        return acc;
    }, []);
    console.log(filteredArray, 'filteredArray');
    const topVTIDS = filteredArray?.map((item) => item?.vt_id);
    const topFloorID = filteredArray?.map((item) => floorIndex(item?.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort));
    const filteredData = data.filter(item => topVTIDS.includes(item?.vt_id) && (!topFloorID.includes(floorIndex(item?.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort))));
    return filteredData;
};

export const convertVerticalPinData = (array) => {
    const data = array?.map((item) => ({
        enc_id: item?.vtd_id,
        name: `vertical_${item?.vtd_id}`,
        type: 6,
        to_floor_id: item?.floor_plan_id,
        vertical_transport_id: item?.vt_id,
        vt_name: item?.vt_name,
        floor_plan: item?.floor_plan
    }));
    return data ?? [];
};

export const findHighestFloorPlanId = (array, item, isAscending, selTraversibleDetails, floorPlans, floorPlansPathSort) => {
    let maxFloorPlanId = isAscending ? -Infinity : Infinity;
    let connectedItem;

    if (isAscending) {
        array.forEach((arrItem) => {
            if (arrItem.vt_id === item.to_vt_id) {
                if (floorIndex(arrItem.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort) > maxFloorPlanId && floorIndex(arrItem.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort) <= floorIndex(selTraversibleDetails?.to_floor_id, floorPlans, selTraversibleDetails, floorPlansPathSort)) {
                    maxFloorPlanId = floorIndex(arrItem.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort);
                    connectedItem = arrItem;
                }
            }
        });
    } else {
        array.forEach((arrItem) => {
            if (arrItem.vt_id === item.to_vt_id) {
                if (floorIndex(arrItem.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort) < maxFloorPlanId && floorIndex(arrItem.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort) >= floorIndex(selTraversibleDetails?.to_floor_id, floorPlans, selTraversibleDetails, floorPlansPathSort)) {
                    maxFloorPlanId = floorIndex(arrItem.floor_plan_id, floorPlans, selTraversibleDetails, floorPlansPathSort);
                    connectedItem = arrItem;
                }
            }
        });
    }
    return connectedItem;
};

export const handleNextPreviousClick = async (i, type, selTraversibleDetails, switchFloor, showPath, setSelTraversibleDetails) => {
    let index
    if (type == 'next') {
        index = i + 1
    } else {
        index = i - 1
    }

    console.log(index,selTraversibleDetails, 'index', type)
    const nextFloorData = selTraversibleDetails?.pathArray[index]
    console.log(nextFloorData, 'nextFloorData')
    const returnValue = await switchFloor(nextFloorData?.floor_plan_id, 'switch');
    setTimeout(() => {
        // if (index === selTraversibleDetails?.pathArray?.length - 1) {
        //   showPath(nextFloorData?.to, nextFloorData?.from)
        // } else {
        showPath(nextFloorData?.from, nextFloorData?.to)
        // }

    }, 1000);

    setSelTraversibleDetails((prev) => ({
        ...prev,
        isNext: index
    }))
}

