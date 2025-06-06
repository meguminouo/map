'use client';

// 導入必要的模組和元件
import Link from "next/link";
import { useState, useEffect } from "react";
import TaskList from "../compoents/TaskList";

// 主頁面元件
export default function Home() {
  // 使用 useState 管理狀態
  // tasks: 儲存所有任務的陣列
  // setTasks: 用於更新 tasks 的函數
  const [tasks, setTasks] = useState([]);

  // newTask: 儲存新任務的輸入值
  // setNewTask: 用於更新 newTask 的函數
  const [newTask, setNewTask] = useState("");

  const [nextId, setNextId] = useState(1); // 儲存下一個任務的 ID

  useEffect(() => {
      const savedTasks = JSON.parse(localStorage.getItem("tasks")) || []; // 從 localStorage 獲取任務列表
      setTasks(savedTasks); // 更新任務列表狀態
      const maxId = savedTasks.reduce((max, task) => Math.max(max, task.id), 0); // 獲取任務列表中的最大 ID
      setNextId(maxId + 1); // 設置下一個任務的 ID
    }, []);
  
  // 添加新任務的函數
  const addTask = () => {
    console.log("Before: ", tasks);            // 印出添加前的任務列表
    console.log("New Task: ", newTask);        // 印出要添加的新任務
    const newTaskObj = { 
      id: nextId,
      title: newTask,
      descripiton: '', 
    }; // 創建新任務物件
    const updatedTasks = [...tasks, newTaskObj];  // 使用展開運算符將新任務加入陣列
    setTasks(updatedTasks);                    // 更新任務列表狀態
    console.log("After: ", updatedTasks);      // 印出添加後的任務列表
    setNewTask('');                            // 清空輸入框

    setNextId(nextId + 1);                    // 更新下一個任務的 ID
    localStorage.setItem("tasks", JSON.stringify(updatedTasks)); // 儲存任務列表到 localStorage
  };
  const handledelete = (id) => {
    const newTask = tasks.filter((task) => task.id !== id); // 使用 filter 過濾掉要刪除的任務
    setTasks(newTask); // 更新任務列表狀態
    localStorage.setItem("tasks", JSON.stringify(newTask)); // 儲存更新後的任務列表到 localStorage
  }
  // 渲染使用者界面
  return (
    // 主要容器，使用 Tailwind CSS 設置內邊距
    <main className="p-4 max-w-md mx-auto">
      {/* 標題 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Task Board</h1>
        <Link href="/metro" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          捷運資訊
        </Link>
      </div>

      {/* 輸入區域容器 */}
      <div className="flex gap-2 mb-4">
        {/* 任務輸入框 */}
        <input
          className = "border p-2 flex-1"
          placeholder="Enter a task"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}  // 當輸入值改變時更新 newTask
        />
        {/* 添加按鈕 */}
        <button
          className="bg-blue-500 text-white px-4"
          onClick={addTask}  // 點擊時調用 addTask 函數
        >
          Add
        </button>
      </div>

      {/* 任務列表元件 */}
      <TaskList tasks={tasks} onDelete={handledelete} />
    </main>
  );
}
