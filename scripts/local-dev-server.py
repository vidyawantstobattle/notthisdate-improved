#!/usr/bin/env python3
"""Local static server with route rewrite support for calendar links."""

from __future__ import annotations

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = PROJECT_ROOT / "public"


class LocalDevHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def _rewrite_pretty_routes(self) -> None:
        parsed = urlsplit(self.path)
        path = parsed.path

        if path == "/c" or path.startswith("/c/"):
            query = f"?{parsed.query}" if parsed.query else ""
            self.path = f"/calendar.html{query}"

    def do_GET(self):
        self._rewrite_pretty_routes()
        return super().do_GET()

    def do_HEAD(self):
        self._rewrite_pretty_routes()
        return super().do_HEAD()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Serve public/ with route rewrite support for /c/<calendarId>."
    )
    parser.add_argument("--port", type=int, default=8888, help="Port to serve on")
    args = parser.parse_args()

    server = ThreadingHTTPServer(("0.0.0.0", args.port), LocalDevHandler)

    print(f"Serving {PUBLIC_DIR} at http://localhost:{args.port}")
    print("Route rewrite enabled: /c/<calendarId> -> /calendar.html")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down local server...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
