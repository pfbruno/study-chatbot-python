import os
import sqlite3
from datetime import datetime

DB_PATH = os.path.join(os.getcwd(), "data", "chatbot.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def connect():
    return sqlite3.connect(DB_PATH)


def create_table():
    conn = connect()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        category TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at TEXT NOT NULL
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

    cursor.execute("""
    SELECT id, question, category, response, created_at
    FROM interactions
    ORDER BY id ASC
    """)
    data = cursor.fetchall()

    conn.close()
    return data


def get_recent_interactions(limit=20):
    conn = connect()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id, question, category, response, created_at
    FROM interactions
    ORDER BY id DESC
    LIMIT ?
    """, (limit,))
    data = cursor.fetchall()

    conn.close()
    return data[::-1]