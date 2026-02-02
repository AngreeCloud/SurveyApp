from __future__ import annotations

import csv
import io
import os
from datetime import datetime
from typing import Iterable

from flask import Flask, jsonify, make_response, request
from flask_cors import CORS
from dotenv import load_dotenv
from psycopg import connect
from psycopg.rows import dict_row
from pathlib import Path

ALLOWED_LEVELS = {"Muito Satisfeito", "Satisfeito", "Insatisfeito"}


def get_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is not set")
    return database_url


def fetch_all(query: str, params: Iterable | None = None) -> list[dict]:
    database_url = get_database_url()
    with connect(database_url, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(query, params or ())
            return cur.fetchall()


def execute(query: str, params: Iterable | None = None) -> None:
    database_url = get_database_url()
    with connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query, params or ())
        conn.commit()


def parse_date(date_str: str | None) -> str | None:
    if not date_str:
        return None
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return date_str
    except ValueError:
        return None


def create_app() -> Flask:
    root_env = Path(__file__).resolve().parents[1] / ".env"
    backend_env = Path(__file__).resolve().parent / ".env"
    load_dotenv(root_env)
    load_dotenv(backend_env)
    app = Flask(__name__)
    CORS(app)

    @app.get("/api/feedback")
    def get_feedback():
        date = parse_date(request.args.get("date"))
        limit = request.args.get("limit", "100")
        try:
            limit_value = int(limit)
        except ValueError:
            return jsonify({"error": "Invalid limit"}), 400

        if date:
            rows = fetch_all(
                """
                SELECT id, satisfaction_level, created_at
                FROM satisfaction_feedback
                WHERE DATE(created_at) = %s
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (date, limit_value),
            )
        else:
            rows = fetch_all(
                """
                SELECT id, satisfaction_level, created_at
                FROM satisfaction_feedback
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (limit_value,),
            )

        return jsonify(rows)

    @app.post("/api/feedback")
    def create_feedback():
        payload = request.get_json(silent=True) or {}
        satisfaction_level = payload.get("satisfaction_level")

        if satisfaction_level not in ALLOWED_LEVELS:
            return jsonify({"error": "Invalid satisfaction level"}), 400

        execute(
            """
            INSERT INTO satisfaction_feedback (satisfaction_level)
            VALUES (%s)
            """,
            (satisfaction_level,),
        )

        return jsonify({"success": True, "message": "Obrigado pelo seu feedback!"})

    @app.post("/api/admin/login")
    def admin_login():
        payload = request.get_json(silent=True) or {}
        password = payload.get("password")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

        if password == admin_password:
            return jsonify({"success": True})

        return jsonify({"error": "Invalid password"}), 401

    @app.get("/api/admin/stats")
    def admin_stats():
        date = parse_date(request.args.get("date"))

        if date:
            rows = fetch_all(
                """
                SELECT satisfaction_level, COUNT(*) AS count
                FROM satisfaction_feedback
                WHERE DATE(created_at) = %s
                GROUP BY satisfaction_level
                """,
                (date,),
            )
        else:
            rows = fetch_all(
                """
                SELECT satisfaction_level, COUNT(*) AS count
                FROM satisfaction_feedback
                GROUP BY satisfaction_level
                """,
                (),
            )

        total = sum(int(row["count"]) for row in rows)
        stats = [
            {
                "level": row["satisfaction_level"],
                "count": int(row["count"]),
                "percentage": f"{(int(row['count']) / total * 100):.1f}" if total > 0 else "0.0",
            }
            for row in rows
        ]

        return jsonify({"total": total, "stats": stats})

    @app.get("/api/admin/export")
    def admin_export():
        format_value = request.args.get("format", "csv")
        date = parse_date(request.args.get("date"))

        if date:
            rows = fetch_all(
                """
                SELECT id, satisfaction_level, created_at
                FROM satisfaction_feedback
                WHERE DATE(created_at) = %s
                ORDER BY created_at DESC
                """,
                (date,),
            )
        else:
            rows = fetch_all(
                """
                SELECT id, satisfaction_level, created_at
                FROM satisfaction_feedback
                ORDER BY created_at DESC
                """,
                (),
            )

        if format_value == "csv":
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["ID", "Nível de Satisfação", "Data", "Hora"])
            for row in rows:
                created_at = row["created_at"]
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(created_at)
                writer.writerow(
                    [
                        row["id"],
                        row["satisfaction_level"],
                        created_at.strftime("%d/%m/%Y"),
                        created_at.strftime("%H:%M:%S"),
                    ]
                )

            response = make_response(output.getvalue())
            response.headers["Content-Type"] = "text/csv"
            response.headers[
                "Content-Disposition"
            ] = f"attachment; filename=feedback-{datetime.utcnow().date().isoformat()}.csv"
            return response

        if format_value == "txt":
            lines = []
            for row in rows:
                created_at = row["created_at"]
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(created_at)
                lines.append(
                    "\n".join(
                        [
                            f"ID: {row['id']}",
                            f"Nível: {row['satisfaction_level']}",
                            f"Data: {created_at.strftime('%d/%m/%Y')}",
                            f"Hora: {created_at.strftime('%H:%M:%S')}",
                            "---",
                        ]
                    )
                )

            response = make_response("\n".join(lines))
            response.headers["Content-Type"] = "text/plain"
            response.headers[
                "Content-Disposition"
            ] = f"attachment; filename=feedback-{datetime.utcnow().date().isoformat()}.txt"
            return response

        return jsonify({"error": "Invalid format"}), 400

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="localhost", port=int(os.getenv("BACKEND_PORT", "3001")), debug=True)
