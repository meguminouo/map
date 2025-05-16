'use client';
import Link from "next/link";
import { use } from "react";

export default function TaskList({ tasks, onDelete }) {
    return (
        <div className="space-y-2">
            {tasks.map((task) => (
                <li
                    key={task.id}
                    className="border p-2 rounded flex justify-between items-center"
                >
                    <Link
                        href={`/task/${task.id}`}
                        className="text-blue-500 hover:underline"
                    >
                        {task.title}
                    </Link>
                    <button
                        className="text-red-500"
                        onClick={() => onDelete(task.id)}
                    >
                        Delete
                    </button>
                </li>
            ))}
        </div>
    );
}   