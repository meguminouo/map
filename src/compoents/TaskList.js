export default function TaskList({ tasks }) {
    return (
        <div className="space-y-2">
            {tasks.map((task, index) => (
                <li
                    key={index}
                    className="border p-2 rounded"
                
                >
                    {task}
                </li>
            ))}
        </div>
    );
}