'use client';

import { useEffect, useState } from 'react';
import { getFareData } from '@/services/metroService';

export default function FareInfo({ fromStation, toStation }) {
    const [fareData, setFareData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchFareData() {
            if (!fromStation?.StationID || !toStation?.StationID) return;
            try {
                setLoading(true);
                const data = await getFareData(fromStation.StationID, toStation.StationID);
                setFareData(data);
                setError(null);
            } catch (err) {
                console.error('票價資料載入失敗:', err);
                setError('無法取得票價資訊');
            } finally {
                setLoading(false);
            }
        }

        fetchFareData();
    }, [fromStation, toStation]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
            </div>
        );
    }

    if (!fareData) {
        return (
            <div className="text-gray-500 text-center py-4">
                選擇起訖站以查看票價資訊
            </div>
        );
    }

    // Debug log
    console.log('Raw Fare Data:', fareData);

    if (!fareData || fareData.length === 0) {
        return (
            <div className="text-gray-500 text-center py-4">
                無法取得票價資訊
            </div>
        );
    }

    // 使用API回傳的票價資料
    const standardPrice = fareData[0].Fares[0].Price;

    // 整理票價資料，按照票種分類
    const ticketTypes = {
        standard: { label: '全票', price: standardPrice },
        senior: { label: '敬老票', price: Math.floor(standardPrice * 0.5) },
        child: { label: '孩童票', price: Math.floor(standardPrice * 0.5) },
        student: { label: '學生票', price: Math.floor(standardPrice * 0.8) },
        disability: { label: '愛心票', price: Math.floor(standardPrice * 0.5) }
    };

    console.log('API票價資料:', fareData);
    console.log('計算結果:', ticketTypes);

    return (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="mb-4">
                <h3 className="font-medium text-gray-700">
                    {fromStation.StationName.Zh_tw} → {toStation.StationName.Zh_tw}
                </h3>
            </div>
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg mb-4">
                <div className="text-xl font-semibold text-center mb-2 border-b pb-2">
                    全票票價：{ticketTypes.standard.price} 元
                </div>
                <div className="text-center mb-4">
                    <div className="text-blue-600 font-medium">
                        電子票證優惠價：{Math.floor(ticketTypes.standard.price * 0.8)} 元
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        * 實際票價可能因路線、距離而異，請以車站售票機顯示為準
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {Object.entries(ticketTypes).filter(([key]) => key !== 'standard').map(([key, type]) => (
                        type.price && (
                            <div key={key} className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="text-gray-700 font-medium mb-1">{type.label}</div>
                                <div className="text-sm">
                                    <div className="text-gray-600">單程票：{type.price} 元</div>
                                    <div className="text-blue-600">電子票證：{Math.floor(type.price * 0.8)} 元</div>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div>
            <div className="mt-4 space-y-1">
                <p className="text-sm text-gray-500">* 電子票證包含悠遊卡、一卡通等</p>
                <p className="text-sm text-gray-500">* 敬老及愛心優待票需出示相關證件</p>
                <p className="text-sm text-gray-500">* 兒童身高未滿115公分免費搭乘</p>
                <p className="text-sm text-blue-600">* 使用電子票證可享8折優惠</p>
                <p className="text-sm text-gray-500 mt-2">溫馨提醒：本站票價資訊僅供參考，實際票價請以捷運站售票機或詢問站務人員為準</p>
            </div>
        </div>
    );
}
