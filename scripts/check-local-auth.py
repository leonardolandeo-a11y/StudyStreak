#!/usr/bin/env python3
"""Exercise real HTTP authentication in an explicitly selected local environment.

Uses only Python's standard library. Creates a unique synthetic account and
prints status codes, never passwords or tokens. Port 8080 requires explicit opt-in.
"""
import argparse
import json
import os
from pathlib import Path
import uuid
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base", nargs="?", default="http://127.0.0.1:18081")
    parser.add_argument("--allow-existing-local", action="store_true",
                        help="Explicitly authorize synthetic-account checks on local port 8080")
    sessions = parser.add_mutually_exclusive_group()
    sessions.add_argument("--session-out", type=Path,
                          help="Save a fresh synthetic session with permissions 600 for restart verification")
    sessions.add_argument("--resume-session", type=Path,
                          help="Verify and revoke a saved session after restarting the backend")
    args = parser.parse_args()
    base = args.base.rstrip("/")
    target = urlsplit(base)
    allowed_ports = (18080, 18081, 8080) if args.allow_existing_local else (18080, 18081)
    if (target.scheme != "http" or target.hostname not in ("localhost", "127.0.0.1")
            or target.port not in allowed_ports or target.path or target.username
            or target.query or target.fragment):
        raise SystemExit("Use loopback port 18080/18081, or explicitly opt into 8080 with --allow-existing-local")

    def call(path, expected, data=None, token=None):
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = "Bearer " + token
        request = Request(base + path, headers=headers,
                          data=json.dumps(data).encode() if data is not None else None)
        try:
            response = urlopen(request, timeout=15)
        except HTTPError as error:
            response = error
        with response:
            body = response.read()
            if response.code != expected:
                # Error payloads could contain sensitive values; do not print them.
                raise AssertionError(f"{request.get_method()} {path}: HTTP {response.code}, expected {expected}")
        print(f"{request.get_method()} {path}: HTTP {expected}")
        return json.loads(body) if body else None

    def tokens(body):
        assert all(isinstance(body.get(key), str) and body[key].count(".") == 2
                   for key in ("token", "refreshToken")), "Missing JWT token pair"
        assert body["token"] != body["refreshToken"]
        return body["token"], body["refreshToken"]

    if args.resume_session:
        saved = json.loads(args.resume_session.read_text())
        assert saved["base"] == base, "Saved session belongs to another API"
        call("/api/dashboard/goals", 200, token=saved["token"])
        access, refresh = tokens(call("/refresh", 200, {"refreshToken": saved["refreshToken"]}))
        assert refresh != saved["refreshToken"]
        call("/refresh", 401, {"refreshToken": saved["refreshToken"]})
        call("/api/dashboard/goals", 200, token=access)
        call("/logout", 204, {"refreshToken": refresh})
        call("/refresh", 401, {"refreshToken": refresh})
        print("Persisted access/refresh session verified after backend restart and then revoked.")
        return

    name = "schema_" + uuid.uuid4().hex[:16]
    password = "SchemaCheck2026-" + uuid.uuid4().hex
    account = {"username": name, "email": name + "@example.invalid",
               "password": password, "timeZone": "America/Lima"}
    call("/api/dashboard/goals", 401)
    call("/register", 400, {})
    user = call("/register", 201, account)
    assert isinstance(user["id"], int) and user["id"] > 0
    call("/register", 409, account)
    call("/login", 401, {"username": name, "password": "WrongPassword123"})
    access, refresh = tokens(call("/login", 200, {"username": name, "password": password}))
    call("/api/dashboard/goals", 200, token=access)
    call("/api/dashboard/goals", 401, token=refresh)
    new_access, new_refresh = tokens(call("/refresh", 200, {"refreshToken": refresh}))
    assert new_refresh != refresh, "Refresh token was not rotated"
    call("/refresh", 401, {"refreshToken": refresh})
    call("/api/dashboard/goals", 200, token=new_access)
    call("/logout", 204, {"refreshToken": new_refresh})
    call("/refresh", 401, {"refreshToken": new_refresh})
    # The existing contract revokes refresh sessions; access JWTs expire normally.
    call("/api/dashboard/goals", 200, token=new_access)
    if args.session_out:
        access, refresh = tokens(call("/login", 200, {"username": name, "password": password}))
        with os.fdopen(os.open(args.session_out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), "w") as output:
            json.dump({"base": base, "userId": user["id"], "token": access, "refreshToken": refresh}, output)
        print("Fresh synthetic session saved privately for restart verification.")
    print("Authentication check passed; JWT pairs verified without printing secrets.")


if __name__ == "__main__":
    main()
