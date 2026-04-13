from __future__ import annotations

import logging
import time
from collections.abc import Callable
from uuid import uuid4

from fastapi import Request, Response

LOGGER = logging.getLogger("studypro.observability")

CRITICAL_PATH_PREFIXES = (
    "/v2/",
    "/auth/login",
    "/billing/checkout",
    "/billing/status",
    "/billing/webhook",
    "/chat",
)


def is_critical_path(path: str) -> bool:
    return any(path.startswith(prefix) for prefix in CRITICAL_PATH_PREFIXES)


async def timing_middleware(request: Request, call_next: Callable) -> Response:
    if not is_critical_path(request.url.path):
        return await call_next(request)

    request_id = request.headers.get("x-request-id") or str(uuid4())
    started = time.perf_counter()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    except Exception:
        LOGGER.exception(
            "request.failed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
            },
        )
        raise
    finally:
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        LOGGER.info(
            "request.completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": status_code,
                "duration_ms": elapsed_ms,
            },
        )
