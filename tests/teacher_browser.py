"""Exercise the interactive teacher prototype with the actual DOM and demo records."""
import functools
import os
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('EDUCADE_SCREENSHOTS','/tmp/educade-teacher-screenshots'))
OUT.mkdir(parents=True,exist_ok=True)
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(ROOT/'public')))
Thread(target=server.serve_forever,daemon=True).start()
base=os.environ.get('EDUCADE_BASE_URL',f'http://127.0.0.1:{server.server_port}').rstrip('/')
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
        for width in [1440,1024,768,640,390,320]:
            page=browser.new_page(viewport={'width':width,'height':1000})
            errors=[];failed=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.on('response',lambda response:failed.append(response.url) if response.status>=400 else None)
            page.goto(base+'/teacher.html',wait_until='networkidle')
            assert page.locator('#student-rows tr').count()==6
            assert page.locator('.brand img').get_attribute('src')=='assets/logo.png'
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'Class overflow at {width}'
            page.screenshot(path=str(OUT/f'class-{width}.png'),full_page=True)
            page.locator('#search-students').fill('no match');assert page.locator('#empty-class').is_visible()
            page.locator('#search-students').fill('Alex');assert page.locator('#student-rows tr').count()==1
            page.locator('.name-button').click();page.wait_for_selector('.category-tabs')
            assert page.locator('h1').inner_text()=='Alex Chen'
            for domain in ['reading','writing','grammar','vocabulary']:
                page.locator('#tab-'+domain).click()
                page.wait_for_function('(domain)=>document.querySelector("#tab-"+domain).getAttribute("aria-selected")==="true"',arg=domain)
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'{domain} overflow at {width}'
                counts=page.evaluate('''() => {
                    const D=EDUCADE_DEMO, domain=document.querySelector('[role=tab][aria-selected=true]').dataset.domain;
                    const groups=D.groups.filter(g=>g.domain===domain && (domain!=='reading'||g.section==='comprehension'));
                    const records=D.students[0].evidence.filter(r=>groups.some(g=>g.skills.some(s=>s.id===r.skillId)));
                    return D.summarize(records);
                }''')
                for key in ['independent','supported','hints']:
                    assert page.locator('[data-count='+key+']').inner_text()==str(counts[key])
                page.locator('[data-mode=radar]').click();assert page.locator('.radar-area').is_visible()
                assert page.locator('.radar-skills button').count()<=4
                page.screenshot(path=str(OUT/f'{domain}-radar-{width}.png'),full_page=True)
                page.locator('[data-mode=bars]').click();assert page.locator('#skill-chart .hp').count()>0
                page.locator('#skill-chart [data-open-group]').first.click()
                page.locator('.skill-group[open] .individual-skill').first.click()
                assert page.locator('#evidence-dialog').is_visible()
                assert 'EDU.G5.' in page.locator('.evidence-id').inner_text()
                assert page.locator('.attempt').count()>0
                assert 'CCSS reference text checked' in page.locator('.standard').inner_text()
                assert page.evaluate('document.querySelector("#evidence-dialog").scrollWidth<=document.querySelector("#evidence-dialog").clientWidth')
                if domain=='reading':page.locator('#evidence-dialog').screenshot(path=str(OUT/f'evidence-{width}.png'))
                page.keyboard.press('Escape');assert not page.locator('#evidence-dialog').is_visible()
            page.locator('#tab-reading').click();page.locator('[data-section=foundations]').click()
            page.wait_for_function('document.querySelector("[data-section=foundations]").getAttribute("aria-pressed")==="true"')
            assert page.locator('[data-mode=radar]').is_disabled()
            assert page.locator('.skill-group').count()==3
            page.locator('#group-affixed summary').click()
            page.locator('#group-affixed .individual-skill').first.click()
            assert 'No evidence yet' in page.locator('#evidence-content').inner_text()
            assert page.locator('.attempt').count()==0
            page.keyboard.press('Escape')
            page.locator('[data-section=comprehension]').click();page.locator('#tab-reading').focus();page.keyboard.press('ArrowRight')
            page.wait_for_function('document.querySelector("#tab-writing").getAttribute("aria-selected")==="true"')
            for learner in ['maya','leo','sofia','noah','ella','alex']:
                page.locator('#switch-student').select_option(learner)
                page.wait_for_function('(id)=>location.hash.includes("student/"+id+"/")',arg=learner)
                expected=page.evaluate('(id)=>EDUCADE_DEMO.students.find(s=>s.id===id).name',learner)
                assert page.locator('h1').inner_text()==expected
            page.locator('[data-back-class]').click();page.wait_for_selector('#search-students')
            page.locator('#search-students').fill('');page.locator('#sort-students').select_option('support')
            assert 'Noah' in page.locator('#student-rows tr').first.inner_text()
            assert not errors,errors
            assert not failed,failed
            page.close();print(f'PASS: teacher class/profile, all domains, charts, evidence, unassessed skills, search, keyboard and mobile layout at {width}px',flush=True)
        browser.close()
finally:
    server.shutdown();server.server_close()
