'use client';

import { useState, useEffect } from 'react';

export default function TodosPage() {
    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTodos() {
            try {
                const res = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=20');
                if (!res.ok) throw new Error('Failed to fetch todos');

                await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate a delay

                const data = await res.json();
                setTodos(data);
            } catch (err) {
                console.log(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchTodos();
    }, []);

    return(
        <main className='p-4 max-w-xl mx-auto'>
            <h1 className='text-2xl font-bold mb-4'>Todos</h1>
            
            {loading && <p>Loading...</p>}
            
            {!loading && (
            <u1 className='space-y-2'>
                {todos.map((todo) => (
                    <li key={todo.id} className='border p-2 rounded'>
                        <h2 className='font-semibold'>
                            {todo.title} {todo.completed ? 'Done' : ''}
                        </h2>
                    </li>
                ))}
            </u1>
        )}
        </main>
    );
}