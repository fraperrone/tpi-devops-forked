// app.js - Lógica de la To-Do list (cliente) 1
const API_BASE = window.__API_BASE__ || 'http://127.0.0.1:8000';

let state = {
  todos: [],
  filter: 'all'
};

// Helpers
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);

async function apiFetchTodos(filter) {
  const res = await fetch(`${API_BASE}/todos?filter=${encodeURIComponent(filter)}`);
  if (!res.ok) throw new Error(`API fetch todos failed: ${res.status}`);
  return res.json();
}

async function apiCreateTodo(payload) {
  const res = await fetch(`${API_BASE}/todos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('create failed');
  return res.json();
}

async function apiUpdateTodo(id, payload) {
  const res = await fetch(`${API_BASE}/todos/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('update failed');
  return res.json();
}

async function apiDeleteTodo(id) {
  const res = await fetch(`${API_BASE}/todos/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('delete failed');
  return res.json();
}

async function apiClearCompleted() {
  const res = await fetch(`${API_BASE}/todos/clear_completed`, { method: 'POST' });
  if (!res.ok) throw new Error('clear failed');
  return res.json();
}

async function load() {
  try {
    const data = await apiFetchTodos(state.filter);
    state.todos = data.map(d => ({ id: d.id, title: d.title, completed: !!d.completed, createdAt: new Date(d.createdAt).getTime() }));
    return;
  } catch (err) {
    console.warn('Backend not available, falling back to localStorage', err);
  }

  // Fallback localStorage
  try {
    const raw = localStorage.getItem('tpi_todos_v1');
    state.todos = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error cargando storage', e);
    state.todos = [];
  }
}

// Keep save() for localStorage fallback/out-of-band sync
async function saveLocal() {
  try {
    localStorage.setItem('tpi_todos_v1', JSON.stringify(state.todos));
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
}

// Rendering
const todosEl = document.getElementById('todos');
const addForm = document.getElementById('add-form');
const newTodoInput = document.getElementById('new-todo');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clear-completed');

function render() {
  // Clear
  todosEl.innerHTML = '';

  const items = state.todos.filter(t => {
    if (state.filter === 'all') return true;
    if (state.filter === 'active') return !t.completed;
    if (state.filter === 'completed') return t.completed;
  });

  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'todo-empty';
    empty.textContent = 'No hay tareas que mostrar.';
    empty.style.padding = '16px';
    empty.style.color = 'var(--muted)';
    todosEl.appendChild(empty);
    return;
  }

  for (const t of items) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (t.completed ? ' completed' : '');
    li.dataset.id = t.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = t.completed;
    checkbox.setAttribute('aria-label', t.title ? `Marcar ${t.title}` : 'Marcar tarea');

    checkbox.addEventListener('change', () => {
      toggleComplete(t.id);
    });

    const label = document.createElement('div');
    label.className = 'label';

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = t.title;
    title.tabIndex = 0;
    title.addEventListener('dblclick', () => startEdit(t.id, title));
    title.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') startEdit(t.id, title);
    });

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = new Date(t.createdAt).toLocaleString();

    label.appendChild(title);
    label.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.title = 'Editar';
    editBtn.innerHTML = '✏️';
    editBtn.addEventListener('click', () => startEdit(t.id, title));

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn';
    delBtn.title = 'Eliminar';
    delBtn.innerHTML = '🗑️';
    delBtn.addEventListener('click', () => removeTodo(t.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(actions);

    todosEl.appendChild(li);
  }
}

// Actions
function addTodo(title) {
  const trimmed = title.trim();
  if (!trimmed) return false;
  const payload = { id: uid(), title: trimmed, completed: false };
  (async () => {
    try {
      await apiCreateTodo(payload);
    } catch (e) {
      console.warn('Create API failed, falling back to local add', e);
      state.todos.unshift({ ...payload, createdAt: Date.now() });
      saveLocal();
    }
    await load();
    render();
  })();
  return true;
}

function removeTodo(id) {
  (async () => {
    try {
      await apiDeleteTodo(id);
    } catch (e) {
      console.warn('Delete API failed, falling back to local remove', e);
      state.todos = state.todos.filter(t => t.id !== id);
      await saveLocal();
    }
    await load();
    render();
  })();
}

function toggleComplete(id) {
  const t = state.todos.find(x => x.id === id);
  if (!t) return;
  t.completed = !t.completed;
  (async () => {
    try {
      await apiUpdateTodo(id, { completed: t.completed });
    } catch (e) {
      console.warn('Update API failed, saving locally', e);
      await saveLocal();
    }
    await load();
    render();
  })();
}

function startEdit(id, titleNode) {
  const li = titleNode.closest('.todo-item');
  if (!li) return;
  const old = titleNode.textContent;
  const input = document.createElement('input');
  input.value = old;
  input.className = 'edit-input';
  li.querySelector('.label').replaceChild(input, titleNode);
  input.focus();
  input.select();

  function finish(saveEdit) {
    if (saveEdit) {
      const val = input.value.trim();
      if (val) {
        const t = state.todos.find(x => x.id === id);
        if (t) t.title = val;
      }
    }
    (async () => {
      try {
        const t = state.todos.find(x => x.id === id);
        if (t) await apiUpdateTodo(id, { title: t.title });
      } catch (e) {
        console.warn('Update API failed', e);
        await saveLocal();
      }
      await load();
      render();
    })();
  }

  input.addEventListener('blur', () => finish(true));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') finish(true);
    if (e.key === 'Escape') finish(false);
  });
}

function clearCompleted() {
  (async () => {
    try {
      await apiClearCompleted();
    } catch (e) {
      console.warn('Clear completed API failed', e);
      state.todos = state.todos.filter(t => !t.completed);
      await saveLocal();
    }
    await load();
    render();
  })();
}

function setFilter(f) {
  state.filter = f;
  filterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === f));
  // Reload tasks for the filter from backend
  load().then(() => render());
}

// Event wiring
addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = newTodoInput.value;
  if (addTodo(value)) newTodoInput.value = '';
  newTodoInput.focus();
});

filterButtons.forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));
clearCompletedBtn.addEventListener('click', () => clearCompleted());

// Init
(function init(){
  // Load from backend first, then render
  load().then(() => render());

  // Reload when the window/tab regains focus, to keep in sync with DB
  window.addEventListener('focus', () => { load().then(() => render()); });
})();
