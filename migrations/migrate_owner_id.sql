-- ./migrations/migrate_owner_id.sql

-- 1. Добавляем новую колонку integer
ALTER TABLE documents ADD COLUMN owner_id_new integer;

-- 2. Копируем значения через JOIN по email, приводя owner_id к varchar
UPDATE documents d
SET owner_id_new = u.id
FROM users u
WHERE d.owner_id::varchar = u.email;

-- 3. Удаляем старую колонку
ALTER TABLE documents DROP COLUMN owner_id;

-- 4. Переименовываем новую колонку
ALTER TABLE documents RENAME COLUMN owner_id_new TO owner_id;

-- 5. Добавляем foreign key
ALTER TABLE documents
ADD CONSTRAINT documents_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id);