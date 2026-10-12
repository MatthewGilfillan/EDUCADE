"""Exercise teacher judgments, native validation, saved levels and all three views."""
import functools
import os
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('EDUCADE_SCREENSHOTS','/tmp/educade-standards-screenshots'))
OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT/'public')))
Thread(target=server.serve_forever,daemon=True).start()
base=os.environ.get('EDUCADE_BASE_URL',f'http://127.0.0.1:{server.server_port}').rstrip('/')
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        for width in [1440,1024,390,320]:
            page=browser.new_page(viewport={'width':width,'height':1000})
            errors=[];failed=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.on('response',lambda response:failed.append(response.url) if response.status>=400 else None)
            page.goto(base+'/teacher.html#class/reading/comprehension/overview',wait_until='networkidle')
            original=page.evaluate('JSON.stringify(EDUCADE_DEMO.students)')
            page.locator('[data-class-mode=standards]').click()
            assert page.locator('.standards-descriptor strong').all_text_contents()==['Beginning','Approaching','Meeting','Exceeding']
            assert page.locator('.class-table .hp-track,.class-table .heat-cell').count()==0
            if width==1440:
                page.evaluate('scrollTo(0,0)')
                page.screenshot(path=str(OUT/'class-initial-standards-1440.png'))
            first=page.locator('tr[data-student=alex] .standards-badge strong').first
            assert first.inner_text()=='Beginning'
            page.locator('tr[data-student=alex] .score-cell').first.click()
            form=page.locator('[data-standards-review]')
            assert page.locator('.standards-attempts .attempt').count()==20
            form.locator('[name=level]').select_option('meeting')
            assert not form.evaluate('el=>el.checkValidity()')
            form.locator('[name=consistent]').check()
            form.locator('[name=independent]').check()
            assert form.evaluate('el=>el.checkValidity()')
            form.get_by_role('button',name='Save level',exact=True).click()
            assert form.locator('[role=status]').inner_text()=='Level saved.'
            page.keyboard.press('Escape')
            assert first.inner_text()=='Meeting'
            page.locator('tr[data-student=alex] .score-cell').first.click()
            form.locator('[name=level]').select_option('exceeding')
            form.locator('[name=extension]').check()
            assert not form.evaluate('el=>el.checkValidity()')
            form.locator('[name=note]').fill('Integrates several pieces of evidence on a more demanding text.')
            assert form.evaluate('el=>el.checkValidity()')
            form.get_by_role('button',name='Save level',exact=True).click()
            page.keyboard.press('Escape')
            assert first.inner_text()=='Exceeding'
            page.get_by_role('button',name='Show skill evidence for Alex Chen',exact=True).click()
            page.get_by_role('button',name='Show Inference evidence across the class',exact=True).click()
            assert page.locator('tr[data-student=alex] .student-skill-cell').first.locator('.compact-evidence').count()==1
            assert page.locator('.class-table .hp-track').count()==0
            page.evaluate('scrollTo(0,0)')
            page.screenshot(path=str(OUT/f'class-standards-{width}.png'))
            page.locator('[data-class-mode=heatmap]').click()
            assert page.locator('tr[data-student=alex] .heat-cell strong').first.inner_text()=='45%'
            page.locator('[data-class-mode=bars]').click()
            assert page.locator('tr[data-student=alex] .hp-value').first.inner_text()=='45%'
            page.locator('[data-class-mode=standards]').click()
            page.reload(wait_until='networkidle')
            assert page.locator('[data-class-mode=standards]').get_attribute('aria-pressed')=='true'
            assert first.inner_text()=='Exceeding'
            page.locator('#class-tab-overall').click()
            page.wait_for_selector('#class-tab-overall[aria-selected=true]')
            summary=page.locator('tr[data-student=alex] .standards-domain-summary').first
            assert summary.locator('strong').inner_text()=='9 skill levels'
            assert summary.locator('.exceeding').inner_text()=='1'
            page.locator('tr[data-student=alex] [data-standards-domain=reading]').click()
            page.wait_for_selector('#class-tab-literacy[aria-selected=true]')
            page.locator('.profile-link[data-student=alex]').click()
            page.wait_for_selector('#tab-overall')
            page.locator('#tab-literacy').click();page.wait_for_selector('#tab-literacy[aria-selected=true]')
            page.locator('[data-mode=standards]').click()
            assert page.locator('.standards-profile-skill').count()==8
            assert page.locator('.standards-badge strong').first.inner_text()=='Exceeding'
            assert page.locator('#skill-chart .hp-track,.radar-target').count()==0
            page.locator('.profile-grid').scroll_into_view_if_needed()
            page.evaluate('scrollTo(0,document.querySelector(".profile-grid").getBoundingClientRect().top+scrollY-15)')
            page.screenshot(path=str(OUT/f'profile-standards-{width}.png'))
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            page.reload(wait_until='networkidle')
            assert page.locator('[data-mode=standards]').get_attribute('aria-pressed')=='true'
            page.locator('#tab-foundations').click();page.wait_for_selector('#tab-foundations[aria-selected=true]')
            assert page.locator('.standards-profile-skill').count()==8
            page.locator('.standards-profile-skill').first.click()
            assert page.locator('[data-standards-review]').count()==0
            assert 'No evidence yet' in page.locator('.standards-editor').inner_text()
            page.keyboard.press('Escape')
            assert page.evaluate('JSON.stringify(EDUCADE_DEMO.students)')==original
            assert not errors and not failed,(errors,failed)
            page.close()
            print(f'PASS: Standards Progress, native rubric validation, evidence alignment, shared judgments, saved modes and unchanged scores at {width}px',flush=True)
        browser.close()
finally:
    server.shutdown()
