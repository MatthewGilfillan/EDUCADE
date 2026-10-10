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
            page = browser.new_page(viewport={"width": width, "height": 900}, has_touch=width <= 760)
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
            # SVG portraits load their source separately from HTML images.
            page.evaluate("""async () => {
                const source = document.querySelector('.reward-art-avatar image');
                const portrait = new Image();
                portrait.src = source.getAttribute('href');
                await portrait.decode();
            }""")
            page.locator("#rewards").screenshot(path=str(OUTPUT / f"rewards-{width}.png"))
            carousel = page.locator('.world-carousel')
            active_world = carousel.locator('.world-slide:not([hidden])')
            titles = ['Viking Quest', 'Scribe of the Nile', 'The Oracle’s Quest', 'Roads of Rome', 'Jade Scrolls']
            assert active_world.count() == 1
            assert active_world.locator('h3').inner_text() == titles[0]
            assert 'First world planned' in active_world.inner_text()
            # Finish the short slide fade and exclude an unrelated fixed link.
            page.locator('#worlds').screenshot(path=str(OUTPUT / f"worlds-viking-{width}.png"), animations='disabled', style='.skip{visibility:hidden!important}')
            for i in range(1, 6):
                page.locator('#world-next').click()
                assert active_world.count() == 1
                assert active_world.locator('h3').inner_text() == titles[i % 5]
                assert carousel.locator('[aria-pressed=true]').count() == 1
                if i < 5:
                    assert 'Future concept' in active_world.inner_text()
                    page.locator('#worlds').screenshot(path=str(OUTPUT / f"worlds-{i}-{width}.png"), animations='disabled', style='.skip{visibility:hidden!important}')
            page.locator('#world-previous').click()
            assert active_world.locator('h3').inner_text() == titles[4]
            carousel.get_by_role('button', name='Show The Oracle’s Quest', exact=True).click()
            assert active_world.locator('h3').inner_text() == titles[2]
            page.locator('#world-stage').focus()
            page.keyboard.press('ArrowRight')
            assert active_world.locator('h3').inner_text() == titles[3]
            assert 'Roads of Rome' in carousel.locator('[aria-live=polite]').inner_text()
            page.keyboard.press('ArrowLeft')
            assert active_world.locator('h3').inner_text() == titles[2]
            page.keyboard.press('End')
            assert active_world.locator('h3').inner_text() == titles[4]
            page.keyboard.press('Home')
            assert active_world.locator('h3').inner_text() == titles[0]
            page.emulate_media(reduced_motion='reduce')
            page.locator('#world-next').click()
            assert active_world.evaluate('el => getComputedStyle(el).animationName') == 'none'
            page.locator('#world-previous').click()
            page.emulate_media(reduced_motion='no-preference')
            if width <= 760:
                # Actual Chromium touch input, including a normal vertical pan.
                client = page.context.new_cdp_session(page)

                def gesture(dx, dy):
                    art = active_world.locator('.world-art')
                    art.scroll_into_view_if_needed()
                    box = art.bounding_box()
                    x = box['x'] + box['width'] / 2 - dx / 2
                    y = box['y'] + box['height'] / 2 - dy / 2
                    client.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y}]})
                    for step in [.25, .5, .75, 1]:
                        client.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x + dx * step, 'y': y + dy * step}]})
                    client.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})

                gesture(-100, 0)
                page.wait_for_selector('.world-slide[data-world="scribe-of-the-nile"]:not([hidden])')
                gesture(100, 0)
                page.wait_for_selector('.world-slide[data-world="viking-quest"]:not([hidden])')
                gesture(0, 100)
                assert active_world.locator('h3').inner_text() == titles[0], 'Vertical scrolling changed world'
                client.detach()
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Carousel overflow at {width}"
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
            if width<=760:page.locator('.menu').click()
            assert page.locator('[data-teacher-entry]').is_visible()
            assert 'No sign-in required' in page.locator('[data-teacher-entry]').inner_text()
            page.locator('[data-teacher-entry]').click()
            page.wait_for_selector('#student-rows')
            assert 'Demo data' in page.locator('.dashboard-footer').inner_text()
            assert page.locator('input[type=password],input[type=email]').count()==0
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
