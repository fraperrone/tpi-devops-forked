# ToDo Backend (FastAPI)

This backend serves the ToDo REST API used by the front-end. It defaults to using a SQLite database placed under the repository `db/` folder. You can override the database to use MySQL by setting the `DATABASE_URL` environment variable.

Recommended dependencies are in `requirements.txt`.

Running locally (Windows PowerShell)

1. Create and activate a virtual environment (recommended):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Start the server (using default SQLite):

```powershell
cd back
.\run-backend.ps1
```

3. Start the server using MySQL (example):

```powershell
#$env:DATABASE_URL = 'mysql+pymysql://user:password@127.0.0.1:3306/todos_db'
#.\run-backend.ps1 -EnvDatabaseUrl $env:DATABASE_URL
```

Notes for MySQL
- Create the database beforehand. Example SQL (MySQL shell or client):

```sql
CREATE DATABASE todos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'todo_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON todos_db.* TO 'todo_user'@'localhost';
FLUSH PRIVILEGES;
```

Then set the DATABASE_URL environment variable: `mysql+pymysql://todo_user:secure_password@localhost:3306/todos_db`

Testing

Run tests with pytest from the `back` folder:

```powershell
cd back
pytest -q
```
