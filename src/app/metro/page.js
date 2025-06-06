'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMetroNetwork, getStations, planRoute } from '@/services/metroService';

// 取得捷運路線顏色
function getLineColor(lineId) {
    const colors = {
        'BR': 'bg-brown-500 text-white',
        'R': 'bg-red-500 text-white',
        'G': 'bg-green-500 text-white',
        'O': 'bg-orange-500 text-white',
        'BL': 'bg-blue-500 text-white',
        'Y': 'bg-yellow-500 text-black',
        default: 'bg-gray-500 text-white'
    };

    // 檢查lineId的前綴來判斷路線
    for (const [prefix, color] of Object.entries(colors)) {
        if (lineId.startsWith(prefix)) {
            return color;
        }
    }
    return colors.default;
}

export default function MetroPage() {
    const [metroData, setMetroData] = useState([]);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startStation, setStartStation] = useState('');
    const [endStation, setEndStation] = useState('');
    const [departureTime, setDepartureTime] = useState('');
    const [route, setRoute] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [networkData, stationsData] = await Promise.all([
                    getMetroNetwork(),
                    getStations()
                ]);
                setMetroData(networkData);
                setStations(stationsData);
                setError(null);
            } catch (err) {
                console.error(err);
                setError('資料載入失敗，請稍後再試');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleRouteSearch = async (e) => {
        e.preventDefault();
        if (!startStation || !endStation || !departureTime) {
            alert('請填寫所有必要資訊');
            return;
        }
        
        try {
            setLoading(true);
            const routeResult = await planRoute(stations, startStation, endStation);
            setRoute({
                ...routeResult,
                time: departureTime,
            });
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className='p-4 max-w-6xl mx-auto'>
            <div className="flex justify-between items-center mb-6">
                <h1 className='text-3xl font-bold'>台北捷運即時資訊</h1>
                <Link href="/" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    回首頁
                </Link>
            </div>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            
            {loading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <section className='border rounded-lg p-4'>
                        <h2 className='text-xl font-semibold mb-4'>路線規劃</h2>
                        <form onSubmit={handleRouteSearch} className='space-y-4'>
                            <div>
                                <label className='block mb-1'>出發站</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={startStation}
                                    onChange={(e) => setStartStation(e.target.value)}
                                >
                                    <option value="">選擇起點站</option>
                                    {stations.map((station, index) => (
                                        <option key={index} value={station.StationName.Zh_tw}>
                                            {station.StationName.Zh_tw}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className='block mb-1'>目的站</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={endStation}
                                    onChange={(e) => setEndStation(e.target.value)}
                                >
                                    <option value="">選擇終點站</option>
                                    {stations.map((station, index) => (
                                        <option key={index} value={station.StationName.Zh_tw}>
                                            {station.StationName.Zh_tw}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className='block mb-1'>出發時間</label>
                                <input 
                                    type="datetime-local"
                                    value={departureTime}
                                    onChange={(e) => setDepartureTime(e.target.value)}
                                    className='w-full border rounded p-2'
                                />
                            </div>
                            <button 
                                type="submit"
                                className='w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600'
                            >
                                搜尋路線
                            </button>
                        </form>
                    </section>

                    <section className='border rounded-lg p-4'>
                        <h2 className='text-xl font-semibold mb-4'>捷運路線資訊</h2>
                <div className='space-y-4'>
                            {metroData.map((line, index) => (
                                <div key={index} className='border-b pb-2'>
                                    <h3 className='font-semibold'>{line.LineID} - {line.LineName?.Zh_tw}</h3>
                                    <p className='text-gray-600'>起點站: {line.StartingStationName?.Zh_tw}</p>
                                    <p className='text-gray-600'>終點站: {line.EndingStationName?.Zh_tw}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {route && (
                        <section className='border rounded-lg p-4 col-span-full'>
                            <h2 className='text-xl font-semibold mb-4'>規劃路線結果</h2>
                            <div className='bg-gray-50 p-4 rounded'>
                                <h3 className="font-semibold text-lg mb-2">路線摘要</h3>
                                <div className="space-y-2">
                                    <p>從 <span className="font-semibold">{route.startStation.StationName.Zh_tw}</span> 到 <span className="font-semibold">{route.endStation.StationName.Zh_tw}</span></p>
                                    <p>出發時間: {new Date(route.time).toLocaleString('zh-TW')}</p>
                                    <p>預估時間: {route.estimatedTime}</p>
                                </div>

                                {route.detail && route.detail.SubRoutes && (
                                    <div className="mt-4">
                                        <h3 className="font-semibold text-lg mb-2">搭乘路線</h3>
                                        <div className="space-y-4">
                                            {route.detail.SubRoutes.map((subRoute, index) => (
                                                <div key={index} className="relative pl-8 pb-4">
                                                    <div className="absolute left-0 top-0 bottom-0 w-4">
                                                        <div className="absolute left-1.5 top-2 bottom-0 w-0.5 bg-gray-300"></div>
                                                        <div className="absolute left-0 top-2 w-3 h-3 rounded-full border-2 border-blue-500 bg-white"></div>
                                                    </div>
                                                    <div className="bg-white rounded-lg shadow-sm p-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={`px-2 py-1 text-sm font-semibold rounded ${getLineColor(subRoute.LineID)}`}>
                                                                {subRoute.LineID}線
                                                            </span>
                                                            <span className="text-gray-500">
                                                                {Math.round(subRoute.RunTime / 60)}分鐘
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-600">
                                                            {stations.find(s => s.StationID === subRoute.FromStation)?.StationName.Zh_tw}
                                                            <span className="mx-2">→</span>
                                                            {stations.find(s => s.StationID === subRoute.ToStation)?.StationName.Zh_tw}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {route.transfers.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="font-semibold text-lg mb-2">轉乘提醒</h3>
                                        <ul className="list-disc list-inside space-y-1">
                                            {route.transfers.map((transfer, index) => (
                                                <li key={index} className="text-gray-700">{transfer}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </main>
    );
}
