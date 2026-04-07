import os
import sqlite3
from datetime import datetime

DB_PATH = os.path.join(os.getcwd(), "data", "chatbot.db")

# garante que a pasta data exista
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def connect():
    return sqlite3.connect(DB_PATH)


def create_table():
    conn = connect()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT,
        category TEXT,
        response TEXT,
        created_at TEXT
    )
    """)

    conn.commit()
    conn.close()


def save_interaction(question, category, response):
    conn = connect()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO interactions (question, category, response, created_at)
    VALUES (?, ?, ?, ?)
    """, (question, category, response, datetime.now().isoformat()))

    conn.commit()
    conn.close()


def get_all_interactions():
    conn = connect()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM interactions")
    data = cursor.fetchall()

    conn.close()
    return data