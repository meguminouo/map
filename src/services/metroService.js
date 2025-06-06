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
        const [networkResponse, routeStationsResponse, stationsResponse] = await Promise.all([
            fetch(`${BASE_URL}/Rail/Metro/Network/TRTC?$format=JSON`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${BASE_URL}/Rail/Metro/StationOfRoute/TRTC?$format=JSON`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${BASE_URL}/Rail/Metro/Station/TRTC?$format=JSON`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        if (!networkResponse.ok || !routeStationsResponse.ok || !stationsResponse.ok) {
            throw new Error('無法取得捷運路網資料');
        }

        const [networkData, routeStationsData, stationsData] = await Promise.all([
            networkResponse.json(),
            routeStationsResponse.json(),
            stationsResponse.json()
        ]);

// 整合路線資料
        return networkData.map(line => {
            // 找到對應路線的站點資料
            const routeInfo = routeStationsData.find(route => route.LineID === line.LineID);
            if (!routeInfo || !routeInfo.Stations) return line;

            // 將站點資訊與完整站點資料整合
            const stations = routeInfo.Stations.map(station => {
                const fullStationInfo = stationsData.find(s => s.StationID.trim() === station.StationID.trim());
                if (!fullStationInfo) return station;
                return {
                    ...station,
                    ...fullStationInfo
                };
            }).filter(Boolean);

            // 根據行駛方向排序站點
            const Direction0Stations = [...stations].sort((a, b) => a.Sequence - b.Sequence);
            const Direction1Stations = [...stations].sort((a, b) => b.Sequence - a.Sequence);

            return {
                ...line,
                Stations: stations,
                Direction0: {
                    StartStation: Direction0Stations[0]?.StationName,
                    EndStation: Direction0Stations[Direction0Stations.length - 1]?.StationName,
                },
                Direction1: {
                    StartStation: Direction1Stations[0]?.StationName,
                    EndStation: Direction1Stations[Direction1Stations.length - 1]?.StationName,
                },
                StationsCount: stations.length
            };
        }).filter(line => line.Stations && line.Stations.length > 0);
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

// 取得轉乘資料
async function getLineTransfers() {
    try {
        const token = await getAuthToken();
        const response = await fetch(
            `${BASE_URL}/Rail/Metro/LineTransfer/TRTC?$format=JSON`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('無法取得轉乘資料');
        }

        return await response.json();
    } catch (error) {
        console.error('轉乘資料錯誤:', error);
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
async function findShortestPath(routeStations, startStation, endStation) {
    // 取得轉乘資料
    const lineTransfers = await getLineTransfers();
    
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

    // 找出所有可能的轉乘組合
    const possibleTransfers = lineTransfers.filter(transfer => {
        const fromLine = startLines.some(sl => sl.LineID === transfer.FromLineID);
        const toLine = endLines.some(el => el.LineID === transfer.ToLineID);
        return fromLine && toLine;
    });

    if (possibleTransfers.length === 0) {
        return null;
    }

    // 找出最佳轉乘路線
    let bestPath = null;
    let minStations = Infinity;

    for (const transfer of possibleTransfers) {
        const fromLine = routeStations.find(rs => rs.LineID === transfer.FromLineID);
        const toLine = routeStations.find(rs => rs.LineID === transfer.ToLineID);
        
        if (fromLine && toLine) {
            const transferStation = fromLine.Stations.find(s => 
                s.StationID === transfer.FromStationID
            );

            if (transferStation) {
                const fromStationCount = calculateStationCount(
                    fromLine.Stations, 
                    startStation.StationID, 
                    transferStation.StationID
                );
                
                const toStationCount = calculateStationCount(
                    toLine.Stations,
                    transfer.ToStationID,
                    endStation.StationID
                );

                const totalStations = fromStationCount + toStationCount;

                if (totalStations < minStations) {
                    bestPath = {
                        routes: [
                            {
                                LineID: transfer.FromLineID,
                                FromStation: startStation.StationID,
                                ToStation: transfer.FromStationID,
                                StationCount: fromStationCount
                            },
                            {
                                LineID: transfer.ToLineID,
                                FromStation: transfer.ToStationID,
                                ToStation: endStation.StationID,
                                StationCount: toStationCount
                            }
                        ],
                        transfers: [transferStation]
                    };
                    minStations = totalStations;
                }
            }
        }
    }

    return bestPath;
}

// 取得票價資料
export async function getFareData(fromStationId, toStationId) {
    try {
        console.log('Fetching fare data for:', { fromStationId, toStationId });
        const token = await getAuthToken();
        
        // 確保 StationID 格式正確
        const cleanFromId = fromStationId.trim();
        const cleanToId = toStationId.trim();

        // 使用 OData filter 查詢票價
        const url = `${BASE_URL}/Rail/Metro/ODFare/TRTC?$filter=(OriginStationID eq '${cleanFromId}' and DestinationStationID eq '${cleanToId}') or (OriginStationID eq '${cleanToId}' and DestinationStationID eq '${cleanFromId}')&$format=JSON`;
        console.log('API URL:', url);

        const response = await fetch(url, {
            headers: { 
                'Authorization': `Bearer ${token}`,
            }
        });

        console.log('API Response status:', response.status);

        if (!response.ok) {
            throw new Error(`無法取得票價資料: ${response.status}`);
        }

        const fareData = await response.json();
        console.log('Fare data:', fareData);

        // API 回傳的資料就已經包含了兩個方向的票價
        const relevantFares = fareData;

        console.log('Filtered fares:', relevantFares);

        if (!relevantFares || relevantFares.length === 0) {
            throw new Error('查無此票價資料');
        }

        return relevantFares;
    } catch (error) {
        console.error('票價資料錯誤:', error);
        throw error;
    }
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
        const path = await findShortestPath(routeStations, startStation, endStation);

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
