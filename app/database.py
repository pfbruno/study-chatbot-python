import sqlite3
from datetime import datetime

DB_NAME = "data/chatbot.db"


def connect():
    return sqlite3.connect(DB_NAME)


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