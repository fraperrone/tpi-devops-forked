-- Init script for todos_db
CREATE DATABASE IF NOT EXISTS todos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'todo_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON todos_db.* TO 'todo_user'@'%';
FLUSH PRIVILEGES;