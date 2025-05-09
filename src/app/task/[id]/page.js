'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TaskDetail({params}) {
    const router = useRouter();
    const { id } = params; // 從路由參數中獲取任務 ID
    const [title, setTitle] = useState(''); // 儲存任務標題
    const [description, setDescription] = useState(''); // 儲存任務描述

    const handleSave = () => {
        const savedTask = JSON.parse(localStorage.getItem('tasks')) || []; // 從 localStorage 獲取任務列表
        const updatedTasks = savedTask.map((task) => 
            task.id === Number(id) ? { ...task, title, description } : task // 更新任務
        );
        localStorage.setItem('tasks', JSON.stringify(updatedTasks)); // 儲存更新後的任務列表
        router.push('/'); // 返回主頁面
    };

    useEffect(() => {
        const savedTask = JSON.parse(localStorage.getItem('tasks')) || []; // 從 localStorage 獲取任務列表
        const task = savedTask.find((t) => t.id === Number(id)); // 根據 ID 查找任務
        if (task) {
            setTitle(task.title); // 設置任務標題
            setDescription(task.description); // 設置任務描述
        }
    }, [id]);
    
    return (
        <main className="p-4 max-w-md mx-auto">
            <h1 className="text-2x1 font-bold mb-4">
                Task Detail
            </h1>
            <input
                className="border p-2 w-full mb-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
            />
            <textarea
                className="border p-2 w-full mb-4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                rows={4}
            />
            <button
                className="bg-green-500 text-white px-4 py-2"
                onClick={handleSave}
            >
                Save
            </button>
        </main>   
    )
}