# 🧠 AI Chat Full-Stack App (React + Python + Docker)

This project is a full-stack AI chatbot web application built with:

- ⚛️ **React** frontend (located in `./frontend`)
- 🐍 **Python (Flask/Django)** backend (located in `./backend`)
- 🐳 **Docker** for containerized development
- 🔁 Supports API integration with LLMs Ollama

---
## 📁 Folder Structure

AI/
├── backend/
│ ├── app.py
│ ├── requirements.txt
│ ├── venv/ (optional - for local runs)
│ └── ...
├── frontend/
│ ├── src/
│ ├── public/
│ ├── package.json
│ └── ...
├── docker-compose.yml
└── README.md
---

## ⚙️ Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and **running**
- Internet connection to pull dependencies

---

## 🐳 Running the App with Docker

### 1. ✅ Start Docker Desktop
Ensure Docker is running and set to **Linux containers**.

# Build and run containers
docker-compose up --build
----------------------------------------------------

#🧪 Option 2: Run Without Docker (Manually)
🖥️ Run Backend (Python Flask)

cd backend
pip install -r requirements.txt
py manage.py runserver
-----------------------------------------------
⚛️ Run Frontend (React)


cd frontend
npm install