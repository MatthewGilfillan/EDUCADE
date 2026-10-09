"""Check the static front end. API responses are mocked, not backend validation."""
import functools
import os
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = Path(os.environ.get("EDUCADE_SCREENSHOTS", "/tmp/educade-screenshots"))
OUTPUT.mkdir(parents=True, exist_ok=True)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(ROOT / "public")))
Thread(target=server.serve_forever, daemon=True).start()
base = os.environ.get("EDUCADE_BASE_URL", f"http://127.0.0.1:{server.server_port}").rstrip("/")
try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"),
            args=["--no-sandbox"],
        )
        for width in [1440, 1024, 768, 640, 390, 320]:
            page = browser.new_page(viewport={"width": width, "height": 900})
            errors, failed = [], []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("response", lambda response: failed.append(response.url) if response.status >= 400 else None)
            page.goto(base, wait_until="networkidle")
            page.evaluate("""async () => {
                for (const image of document.images) image.loading = 'eager';
                await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
            }""")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Home overflow at {width}"
            assert page.evaluate("[...document.images].every(image => image.complete && image.naturalWidth > 0)"), "Broken image"
            assert "linear-gradient" in page.locator("#hero-title").evaluate("el => getComputedStyle(el).backgroundImage")
            page.screenshot(path=str(OUTPUT / f"home-{width}.png"), full_page=True)
            page.screenshot(path=str(OUTPUT / f"hero-{width}.png"))
            page.locator(".challenge-card").screenshot(path=str(OUTPUT / f"challenge-{width}.png"))
            page.locator("#student-tab").click()
            assert page.locator("#student-panel").is_visible()
            page.locator("#back-class").click()
            assert page.locator("#class-panel").is_visible()
            page.locator("#class-tab").focus()
            page.keyboard.press("ArrowRight")
            assert page.locator("#student-tab").get_attribute("aria-selected") == "true"
            page.keyboard.press("Home")
            assert page.locator("#class-tab").get_attribute("aria-selected") == "true"
            page.locator(".profile-hotspot").click()
            assert page.locator("#student-panel").is_visible()
            page.locator("#teachers").screenshot(path=str(OUTPUT / f"student-{width}.png"))
            page.locator(".class-hotspot").click()
            assert page.locator("#class-panel").is_visible()
            page.locator("#teachers").screenshot(path=str(OUTPUT / f"class-{width}.png"))
            page.locator('[data-answer="wrong"]').first.click()
            assert "Try another item" in page.locator("#feedback").inner_text()
            page.locator("#hint").click()
            assert page.locator("#hint-text").is_visible()
            page.locator('[data-answer="correct"]').click()
            assert page.locator("#challenge-status").inner_text() == "Challenge complete"
            assert "used a hint" in page.locator("#feedback").inner_text()
            page.locator("#reset").click()
            assert page.locator('[data-answer="correct"]').is_enabled()
            assert not page.locator("#hint-text").is_visible()
            if width <= 760:
                page.locator(".menu").click()
                assert page.locator("#navigation").is_visible()
                page.keyboard.press("Escape")
                assert not page.locator("#navigation").is_visible()
                page.locator(".menu").click()
                page.locator('#navigation a[href="#teachers"]').click()
                assert not page.locator("#navigation").is_visible()
            page.goto(base + "/signup.html", wait_until="networkidle")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Signup overflow at {width}"
            page.screenshot(path=str(OUTPUT / f"signup-{width}.png"), full_page=True)
            assert not errors, errors
            assert not failed, failed
            page.close()
            print(f"PASS: layout, assets and interactions at {width}px")

        page = browser.new_page()
        page.goto(base + "/signup.html")
        requests = []

        def api(route):
            request = route.request
            requests.append(request.post_data_json)
            assert request.method == "POST"
            assert request.headers["content-type"] == "application/json"
            route.fulfill(status=200, json={"ok": True})

        page.route("**/api/signup", api)
        page.locator("#submit").click()
        assert requests == [], "Invalid form submitted"
        page.locator("#name").fill("Browser Test")
        page.locator("#email").fill("test@example.invalid")
        page.locator('[name="consent"]').check()
        page.locator("#submit").click()
        page.wait_for_function("document.querySelector('#form-message').classList.contains('success')")
        assert requests == [{"name": "Browser Test", "email": "test@example.invalid", "website": "", "consent": True}]
        assert page.locator("#name").input_value() == ""
        assert page.locator("#submit").is_enabled()
        page.unroute("**/api/signup")
        page.route("**/api/signup", lambda route: route.fulfill(status=503, body="Service unavailable"))
        page.locator("#name").fill("Browser Test")
        page.locator("#email").fill("test@example.invalid")
        page.locator('[name="consent"]').check()
        page.locator("#submit").click()
        page.wait_for_function("document.querySelector('#form-message').classList.contains('error')")
        assert "not available yet" in page.locator("#form-message").inner_text()
        assert page.locator("#name").input_value() == "Browser Test"
        assert page.locator("#submit").is_enabled()
        print("PASS: sign-up validation, API payload, success and error handling (mocked API)")
        page.close()
        browser.close()
finally:
    server.shutdown()
    server.server_close()
