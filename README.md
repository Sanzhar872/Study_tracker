# Study Tracker

Дневник учёбы: недельная сетка записей по предметам и темам.

## Стек

- Backend: FastAPI + PostgreSQL + SQLAlchemy + Alembic + Pydantic v2
- Frontend: React (Vite) + TypeScript

## 1. Установка PostgreSQL

Если PostgreSQL ещё не установлен:

1. Скачай установщик с [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) (или через `winget install PostgreSQL.PostgreSQL`).
2. В процессе установки задай пароль для пользователя `postgres` — запомни его, он понадобится ниже. Порт можно оставить по умолчанию — `5432`.
3. После установки создай базу данных `study_tracker`. Проще всего через **pgAdmin** (ставится вместе с PostgreSQL): открой pgAdmin → Servers → PostgreSQL → правой кнопкой на **Databases** → Create → Database → имя `study_tracker`.

   Либо через терминал (`psql` должен быть в PATH после установки):

   ```bash
   psql -U postgres -p 5433 -c "CREATE DATABASE study_tracker;"
   ```

   Введёт пароль, заданный на шаге 2. Флаг `-p` нужен, только если PostgreSQL слушает нестандартный порт (по умолчанию `5432`).

## 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Открой `.env` и подставь свой пароль от PostgreSQL:

```
DATABASE_URL=postgresql://postgres:ТВОЙ_ПАРОЛЬ@localhost:5432/study_tracker
```

Применить миграции и запустить сервер:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

Backend поднимется на http://localhost:8000 (Swagger-документация: http://localhost:8000/docs).

## 3. Frontend

Открой новый терминал:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend поднимется на http://localhost:5173.

## Первые шаги в приложении

1. Открой вкладку «Предметы и темы», добавь предмет (с цветом) и хотя бы одну тему.
2. Перейди на вкладку «Неделя», нажми «+» в нужном дне, выбери предмет → тему, укажи часы и что было сделано.
3. Клик по карточке записи открывает её для редактирования или удаления.

## Возможные проблемы

- **`psql`/`alembic` не найдены** — перезапусти терминал после установки PostgreSQL/Python, чтобы подхватился обновлённый PATH.
- **`password authentication failed`** — проверь пароль в `DATABASE_URL` в `backend/.env`.
- **CORS-ошибки в браузере** — убедись, что backend запущен на порту 8000, а `CORS_ORIGINS` в `backend/.env` (если переопределяешь) включает `http://localhost:5173`.
