"""
Pytest configuration for CourseIntel backend tests.

Sets asyncio mode to "auto" so @pytest.mark.asyncio is not required on every
async test, and pins the event loop scope to suppress the deprecation warning
from pytest-asyncio about unset fixture loop scope.
"""
import pytest


def pytest_configure(config):
    config.addinivalue_line(
        "markers",
        "asyncio: mark test as async (handled by pytest-asyncio)",
    )
