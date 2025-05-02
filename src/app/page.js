'use client';

// 導入必要的模組和元件
import Image from "next/image";
import { useState } from "react";
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
  
  // 添加新任務的函數
  const addTask = () => {
    console.log("Before: ", tasks);            // 印出添加前的任務列表
    console.log("New Task: ", newTask);        // 印出要添加的新任務
    const updatedTasks = [...tasks, newTask];  // 使用展開運算符將新任務加入陣列
    setTasks(updatedTasks);                    // 更新任務列表狀態
    console.log("After: ", updatedTasks);      // 印出添加後的任務列表
    setNewTask("");                            // 清空輸入框
  };

  // 渲染使用者界面
  return (
    // 主要容器，使用 Tailwind CSS 設置內邊距
    <main className="p-4">
      {/* 標題 */}
      <h1 className="text-2xl font-bold">Task Board</h1>

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
      <TaskList tasks={tasks} />
    </main>
  );
}
