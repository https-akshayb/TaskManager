const apiUrl = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('taskSection').style.display = 'block';
        fetchTasks();
    } else {
        document.getElementById('authSection').style.display = 'block';
        document.getElementById('taskSection').style.display = 'none';
    }
});

// Authentication
document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok) {
        localStorage.setItem('token', data.token);
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('taskSection').style.display = 'block';
        fetchTasks();
    } else {
        alert(data.error);
    }
});

// Registration
function showRegisterForm() {
    const username = prompt("Enter username:");
    const password = prompt("Enter password:");
    if (username && password) {
        fetch(`${apiUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        }).then(response => {
            if (response.ok) {
                alert("Registration successful");
                window.location.reload();
            } else {
                alert("Registration failed");
            }
        });
    }
}

// Fetch and display tasks
async function fetchTasks(showCompleted = false) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${apiUrl}/tasks?completed=${showCompleted}`, {
        headers: { 'Authorization': token }
    });
    const tasks = await response.json();
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        li.innerHTML = `${task.title} (Due: ${task.due_date}, ${task.description})
            <button onclick="editTask(${task.id})">Edit</button>
            <button onclick="deleteTask(${task.id})">Delete</button>
            ${!task.completed ? `<button onclick="markAsCompleted(${task.id})">Mark as Completed</button>` : ''}`;

        taskList.appendChild(li);
    });
}

// Add task
async function addTask() {
    const title = document.getElementById('taskTitle').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const description = document.getElementById('taskDescription').value;
    const token = localStorage.getItem('token');

    await fetch(`${apiUrl}/tasks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({ title, due_date: dueDate, description, completed: false })
    });

    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDueDate').value = '';
    document.getElementById('taskDescription').value = '';
    fetchTasks();
}

// Edit task
async function editTask(taskId) {
    const token = localStorage.getItem('token');
    const task = await (await fetch(`${apiUrl}/tasks/${taskId}`, {
        headers: { 'Authorization': token }
    })).json();

    const newTitle = prompt("Enter new title:", task.title);
    const newDueDate = prompt("Enter new due date (YYYY-MM-DD):", task.due_date);
    const newDescription = prompt("Enter new description:", task.description);

    if (newTitle && newDueDate && newDescription) {
        await fetch(`${apiUrl}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ title: newTitle, due_date: newDueDate, description: newDescription, completed: task.completed })
        });

        fetchTasks();
    }
}

// Delete task
async function deleteTask(taskId) {
    const token = localStorage.getItem('token');
    await fetch(`${apiUrl}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
    });

    fetchTasks();
}

// Mark task as completed
async function markAsCompleted(taskId) {
    const token = localStorage.getItem('token');
    await fetch(`${apiUrl}/tasks/${taskId}/completed`, {
        method: 'PATCH',
        headers: { 'Authorization': token }
    });

    fetchTasks();
}

// Logout user
function logoutUser() {
    localStorage.removeItem('token');
    window.location.reload();
}
