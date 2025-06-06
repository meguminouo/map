// TDX API服務

const CLIENT_ID = process.env.NEXT_PUBLIC_TDX_CLIENT_ID;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_TDX_CLIENT_SECRET;
const BASE_URL = 'https://tdx.transportdata.tw/api/basic/v2';

// 取得API授權token
async function getAuthToken() {
    try {
        const response = await fetch('https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get auth token');
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Auth error:', error);
        throw error;
    }
}

// 取得捷運路網資料
export async function getMetroNetwork() {
    try {
        const token = await getAuthToken();
        const response = await fetch(
            `${BASE_URL}/Rail/Metro/Network/TRTC?$format=JSON`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('無法取得捷運路網資料');
        }

        return await response.json();
    } catch (error) {
        console.error('捷運路網資料錯誤:', error);
        throw error;
    }
}

// 取得站點資料
export async function getStations() {
    try {
        const token = await getAuthToken();
        const response = await fetch(
            `${BASE_URL}/Rail/Metro/Station/TRTC?$format=JSON`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('無法取得站點資料');
        }

        const data = await response.json();
        return data.map(station => ({
            ...station,
            StationID: station.StationID.trim(),
        }));
    } catch (error) {
        console.error('站點資料錯誤:', error);
        throw error;
    }
}

// 取得路線站點資料
async function getRouteStations() {
    try {
        const token = await getAuthToken();
        const response = await fetch(
            `${BASE_URL}/Rail/Metro/StationOfRoute/TRTC?$format=JSON`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('無法取得路線站點資料');
        }

        return await response.json();
    } catch (error) {
        console.error('路線站點資料錯誤:', error);
        throw error;
    }
}

// 尋找最短路徑
function findShortestPath(routeStations, startStation, endStation) {
    // 找出包含起點和終點的路線
    const startLines = [];
    const endLines = [];

    routeStations.forEach(route => {
        const stations = route.Stations;
        const hasStart = stations.some(s => s.StationID === startStation.StationID);
        const hasEnd = stations.some(s => s.StationID === endStation.StationID);

        if (hasStart) startLines.push(route);
        if (hasEnd) endLines.push(route);
    });

    // 直達路線
    const directLine = startLines.find(sl => 
        endLines.some(el => el.LineID === sl.LineID)
    );

    if (directLine) {
        const stations = directLine.Stations;
        const startIndex = stations.findIndex(s => s.StationID === startStation.StationID);
        const endIndex = stations.findIndex(s => s.StationID === endStation.StationID);
        const stationCount = Math.abs(endIndex - startIndex);

        return {
            routes: [{
                LineID: directLine.LineID,
                Direction: startIndex < endIndex ? 0 : 1,
                FromStation: startStation.StationID,
                ToStation: endStation.StationID,
                StationCount: stationCount
            }],
            transfers: []
        };
    }

    // 需要轉乘的情況
    let bestPath = null;
    let minTransfers = Infinity;

    startLines.forEach(sl => {
        endLines.forEach(el => {
            // 尋找共同轉乘站
            const transferStations = routeStations.filter(rs =>
                rs.Stations.some(s => sl.Stations.some(ss => ss.StationID === s.StationID)) &&
                rs.Stations.some(s => el.Stations.some(es => es.StationID === s.StationID))
            );

            transferStations.forEach(ts => {
                const transfer = ts.Stations.find(s =>
                    sl.Stations.some(ss => ss.StationID === s.StationID) &&
                    el.Stations.some(es => es.StationID === s.StationID)
                );

                if (transfer) {
                    const path = {
                        routes: [
                            {
                                LineID: sl.LineID,
                                FromStation: startStation.StationID,
                                ToStation: transfer.StationID,
                                StationCount: calculateStationCount(sl.Stations, startStation.StationID, transfer.StationID)
                            },
                            {
                                LineID: el.LineID,
                                FromStation: transfer.StationID,
                                ToStation: endStation.StationID,
                                StationCount: calculateStationCount(el.Stations, transfer.StationID, endStation.StationID)
                            }
                        ],
                        transfers: [transfer]
                    };

                    if (path.transfers.length < minTransfers) {
                        minTransfers = path.transfers.length;
                        bestPath = path;
                    }
                }
            });
        });
    });

    return bestPath;
}

// 計算站數
function calculateStationCount(stations, fromId, toId) {
    const fromIndex = stations.findIndex(s => s.StationID === fromId);
    const toIndex = stations.findIndex(s => s.StationID === toId);
    return Math.abs(toIndex - fromIndex);
}

// 規劃路線
export async function planRoute(stations, start, end) {
    try {
        const startStation = stations.find(s => s.StationName.Zh_tw === start);
        const endStation = stations.find(s => s.StationName.Zh_tw === end);

        if (!startStation || !endStation) {
            throw new Error('起點或終點站不存在');
        }

        const routeStations = await getRouteStations();
        const path = findShortestPath(routeStations, startStation, endStation);

        if (!path) {
            throw new Error('無法找到合適的路線');
        }

        // 計算總時間（假設每站約3分鐘）
        const totalStations = path.routes.reduce((sum, route) => sum + route.StationCount, 0);
        const totalTime = totalStations * 3;

        // 處理轉乘資訊
        const transfers = path.transfers.map(station => 
            `在${station.StationName.Zh_tw}站轉乘`
        );

        return {
            startStation,
            endStation,
            estimatedTime: `約${totalTime}分鐘`,
            transfers,
            detail: {
                SubRoutes: path.routes.map(route => ({
                    ...route,
                    RunTime: route.StationCount * 3 * 60 // 轉換為秒
                }))
            }
        };
    } catch (error) {
        console.error('路線規劃錯誤:', error);
        throw error;
    }
}
