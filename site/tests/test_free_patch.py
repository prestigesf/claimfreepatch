"""Smoke test for the free patch shown on site/index.html.

Run from the repo root:
    pip install fastapi httpx
    python -m unittest discover -s site/tests -v

What it proves:
1. site/patch/main.py is byte-for-byte the patch the page shows and copies
   (both the <pre id="patchCode"> block and the PATCH.code string).
2. The SHA-256 pinned in the page (PATCH_SHA256) is the real hash of that file,
   so the in-browser check compares against a true value.
3. The patch runs: a FastAPI app built from it answers with the
   X-AI-Disclosure header on normal, 404 and POST responses.
"""
import ast
import hashlib
import html
import pathlib
import re
import unittest

SITE = pathlib.Path(__file__).resolve().parent.parent
PATCH_FILE = SITE / "patch" / "main.py"
PAGE = SITE / "index.html"
HEADER = "X-AI-Disclosure"
VALUE = "This interaction is powered by AI."


def page_text():
    return PAGE.read_text(encoding="utf-8")


def js_patch_code(src):
    block = re.search(r"code:\s*\n(.*?)\n  \};", src, re.S).group(1)
    parts = re.findall(r'"((?:[^"\\]|\\.)*)"|\'((?:[^\'\\]|\\.)*)\'', block)
    return "".join(
        ast.literal_eval('"' + (a or b.replace('"', '\\"')) + '"') for a, b in parts
    )


class FreePatchTest(unittest.TestCase):
    def setUp(self):
        self.code = PATCH_FILE.read_text(encoding="utf-8")
        self.src = page_text()

    def test_page_shows_exact_patch(self):
        pre = re.search(r'<pre id="patchCode">(.*?)</pre>', self.src, re.S).group(1)
        self.assertEqual(html.unescape(pre), self.code)
        self.assertEqual(js_patch_code(self.src), self.code)

    def test_pinned_sha256_is_real(self):
        pinned = re.search(r'PATCH_SHA256 = "([0-9a-f]{64})"', self.src).group(1)
        self.assertEqual(hashlib.sha256(self.code.encode("utf-8")).hexdigest(), pinned)

    def test_patch_adds_disclosure_header(self):
        from fastapi.testclient import TestClient

        ns = {}
        exec(compile(self.code, str(PATCH_FILE), "exec"), ns)
        app = ns["app"]

        @app.get("/hello")
        def hello():
            return {"ok": True}

        @app.post("/echo")
        def echo(body: dict):
            return body

        client = TestClient(app)
        r = client.get("/hello")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), {"ok": True})
        self.assertEqual(r.headers[HEADER], VALUE)

        r = client.get("/missing")
        self.assertEqual(r.status_code, 404)
        self.assertEqual(r.headers[HEADER], VALUE)

        r = client.post("/echo", json={"a": 1})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), {"a": 1})
        self.assertEqual(r.headers[HEADER], VALUE)


if __name__ == "__main__":
    unittest.main()
