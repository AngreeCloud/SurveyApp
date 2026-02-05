from __future__ import annotations

import csv
import io
import os
from datetime import datetime
from typing import Iterable

from flask import Flask, jsonify, make_response, request, render_template, send_from_directory
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


def fetch_one(query: str, params: Iterable | None = None) -> dict | None:
    rows = fetch_all(query, params)
    return rows[0] if rows else None


def execute(query: str, params: Iterable | None = None) -> None:
    database_url = get_database_url()
    with connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query, params or ())
        conn.commit()


def ensure_schema() -> None:
    execute(
        """
        CREATE TABLE IF NOT EXISTS satisfaction_feedback (
            id SERIAL PRIMARY KEY,
            satisfaction_level TEXT NOT NULL,
            seq INTEGER,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
        """
    )
    execute(
        """
        ALTER TABLE satisfaction_feedback
        ADD COLUMN IF NOT EXISTS seq INTEGER
        """
    )
    execute(
        """
        CREATE INDEX IF NOT EXISTS idx_feedback_created_at
        ON satisfaction_feedback (created_at)
        """
    )
    execute(
        """
        CREATE INDEX IF NOT EXISTS idx_feedback_level_date
        ON satisfaction_feedback (satisfaction_level, created_at)
        """
    )


def build_stats(rows: list[dict]) -> dict:
    total = sum(int(row["count"]) for row in rows)
    stats = [
        {
            "level": row["satisfaction_level"],
            "count": int(row["count"]),
            "percentage": f"{(int(row['count']) / total * 100):.1f}" if total > 0 else "0.0",
        }
        for row in rows
    ]
    return {"total": total, "stats": stats}


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
    
    app = Flask(__name__, static_folder="../static", template_folder="../templates")
    CORS(app)
    ensure_schema()

    @app.route("/")
    def index():
        return render_template("admin.html")

    @app.route("/kiosk")
    def kiosk():
        return render_template("kiosk.html")

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

        seq_row = fetch_one(
            """
            SELECT COALESCE(MAX(seq), 0) + 1 AS next_seq
            FROM satisfaction_feedback
            WHERE satisfaction_level = %s
              AND DATE(created_at) = CURRENT_DATE
            """,
            (satisfaction_level,),
        )
        next_seq = int(seq_row["next_seq"]) if seq_row else 1

        execute(
            """
            INSERT INTO satisfaction_feedback (satisfaction_level, seq)
            VALUES (%s, %s)
            """,
            (satisfaction_level, next_seq),
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

        current_stats = build_stats(rows)

        overall_rows = fetch_all(
            """
            SELECT satisfaction_level, COUNT(*) AS count
            FROM satisfaction_feedback
            GROUP BY satisfaction_level
            """,
            (),
        )
        overall_stats = build_stats(overall_rows)

        today_rows = fetch_all(
            """
            SELECT satisfaction_level, COUNT(*) AS count
            FROM satisfaction_feedback
            WHERE DATE(created_at) = CURRENT_DATE
            GROUP BY satisfaction_level
            """,
            (),
        )
        today_stats = build_stats(today_rows)

        return jsonify(
            {
                **current_stats,
                "overall": overall_stats,
                "today": today_stats,
            }
        )

    @app.get("/api/admin/export")
    def admin_export():
        format_value = request.args.get("format", "csv")
        date = parse_date(request.args.get("date"))

        if date:
            rows = fetch_all(
                """
                SELECT
                    id,
                    satisfaction_level,
                    TO_CHAR(created_at, 'DD/MM/YYYY') AS data,
                    TO_CHAR(created_at, 'HH24:MI:SS') AS hora
                FROM satisfaction_feedback
                WHERE DATE(created_at) = %s
                ORDER BY created_at DESC
                """,
                (date,),
            )
        else:
            rows = fetch_all(
                """
                SELECT
                    id,
                    satisfaction_level,
                    TO_CHAR(created_at, 'DD/MM/YYYY') AS data,
                    TO_CHAR(created_at, 'HH24:MI:SS') AS hora
                FROM satisfaction_feedback
                ORDER BY created_at DESC
                """,
                (),
            )

        if format_value == "csv":
            output = io.StringIO(newline="")
            output.write("\ufeff")
            writer = csv.writer(output, delimiter=";", lineterminator="\n")
            writer.writerow(["ID", "Nível de Satisfação", "Data", "Hora"])
            for row in rows:
                writer.writerow(
                    [
                        row["id"],
                        row["satisfaction_level"],
                        row["data"],
                        row["hora"],
                    ]
                )

            response = make_response(output.getvalue())
            response.headers["Content-Type"] = "text/csv; charset=utf-8"
            response.headers[
                "Content-Disposition"
            ] = f"attachment; filename=feedback-{datetime.utcnow().date().isoformat()}.csv"
            return response

        if format_value == "txt":
            output = io.StringIO(newline="")
            writer = csv.writer(output, delimiter="\t", lineterminator="\n")
            writer.writerow(["ID", "Nível de Satisfação", "Data", "Hora"])
            for row in rows:
                writer.writerow(
                    [
                        row["id"],
                        row["satisfaction_level"],
                        row["data"],
                        row["hora"],
                    ]
                )

            response = make_response(output.getvalue())
            response.headers["Content-Type"] = "text/plain; charset=utf-8"
            response.headers[
                "Content-Disposition"
            ] = f"attachment; filename=feedback-{datetime.utcnow().date().isoformat()}.txt"
            return response

        return jsonify({"error": "Invalid format"}), 400

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
