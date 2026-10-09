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
            assert 'Demo dashboard · Fictional data' in page.locator('.demo-banner').inner_text()
            original_data=page.evaluate('JSON.stringify(EDUCADE_DEMO.students)')
            original_scores=page.locator('.score-cell').evaluate_all('(cells)=>cells.map(c=>c.getAttribute("aria-label"))')
            page.locator('[data-class-mode=heatmap]').click()
            assert page.locator('.heat-cell').count()==24
            assert page.locator('.score-cell').evaluate_all('(cells)=>cells.map(c=>c.getAttribute("aria-label"))')==original_scores
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'Heatmap overflow at {width}'
            page.screenshot(path=str(OUT/f'heatmap-{width}.png'),full_page=True)
            page.locator('[data-learner=alex].heat-cell').first.click()
            evidence=page.locator('#evidence-content').inner_text()
            assert '45%' in evidence
            page.keyboard.press('Escape')
            page.locator('[data-class-mode=bars]').click()
            assert page.locator('.score-cell.selected-skill[data-learner=alex]').count()==1
            page.locator('[data-class-mode=heatmap]').click()
            page.reload(wait_until='networkidle')
            assert page.locator('[data-class-mode=heatmap]').get_attribute('aria-pressed')=='true'
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
                open_group=page.locator('.skill-group[open]').get_attribute('id')
                page.locator('[data-mode=radar]').click()
                assert page.locator('#'+open_group).get_attribute('open') is not None
                page.locator('[data-mode=bars]').click()
                page.locator('.skill-group[open] .individual-skill').first.click()
                assert page.locator('#evidence-dialog').is_visible()
                assert 'EDU.G5.' in page.locator('.evidence-id').inner_text()
                assert page.locator('.attempt').count()>0
                assert 'CCSS reference text checked' in page.locator('.standard').inner_text()
                assert page.evaluate('document.querySelector("#evidence-dialog").scrollWidth<=document.querySelector("#evidence-dialog").clientWidth')
                if domain=='reading':page.locator('#evidence-dialog').screenshot(path=str(OUT/f'evidence-{width}.png'))
                page.keyboard.press('Escape');assert not page.locator('#evidence-dialog').is_visible()
            page.locator('#tab-reading').click();page.locator('[data-mode=radar]').click()
            page.locator('[data-section=foundations]').click()
            page.wait_for_function('document.querySelector("[data-section=foundations]").getAttribute("aria-pressed")==="true"')
            assert page.locator('[data-mode=radar]').is_disabled()
            assert page.locator('.skill-group').count()==3
            page.locator('#group-affixed summary').click()
            page.locator('#group-affixed .individual-skill').first.click()
            assert 'No evidence yet' in page.locator('#evidence-content').inner_text()
            assert page.locator('.attempt').count()==0
            page.keyboard.press('Escape')
            page.locator('[data-section=comprehension]').click()
            page.wait_for_selector('.radar-area')
            page.reload(wait_until='networkidle');assert page.locator('.radar-area').is_visible()
            page.locator('#tab-reading').focus();page.keyboard.press('ArrowRight')
            page.wait_for_function('document.querySelector("#tab-writing").getAttribute("aria-selected")==="true"')
            for learner in ['maya','leo','sofia','noah','ella','alex']:
                page.locator('#switch-student').select_option(learner)
                page.wait_for_function('(id)=>location.hash.includes("student/"+id+"/")',arg=learner)
                expected=page.evaluate('(id)=>EDUCADE_DEMO.students.find(s=>s.id===id).name',learner)
                assert page.locator('h1').inner_text()==expected
            page.locator('[data-back-class]').click();page.wait_for_selector('#search-students')
            assert page.locator('[data-class-mode=heatmap]').get_attribute('aria-pressed')=='true'
            page.locator('#search-students').fill('');page.locator('#sort-students').select_option('support')
            assert 'Noah' in page.locator('#student-rows tr').first.inner_text()
            page.locator('[data-class-mode=bars]').click()
            assert page.locator('#sort-students').input_value()=='support'
            assert 'Noah' in page.locator('#student-rows tr').first.inner_text()
            page.locator('#search-students').fill('Ella')
            page.locator('[data-class-mode=heatmap]').click()
            assert page.locator('#search-students').input_value()=='Ella'
            assert page.locator('#student-rows tr').count()==1
            assert page.evaluate('JSON.stringify(EDUCADE_DEMO.students)')==original_data
            assert not errors,errors
            assert not failed,failed
            page.close();print(f'PASS: teacher class/profile, all domains, charts, evidence, unassessed skills, search, keyboard and mobile layout at {width}px',flush=True)

        # Exercise the real supplied portraits, including both files decoding
        # and rendering at their declared dimensions. No substituted artwork.
        for width in [1440,768,390,320]:
            page=browser.new_page(viewport={'width':width,'height':1000})
            errors=[];failed=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.on('response',lambda response:failed.append(response.url) if response.status>=400 else None)
            page.goto(base+'/teacher.html',wait_until='networkidle')
            assert page.locator('#portrait-style').input_value()=='photos'
            for style in ['photos','vikings','initials']:
                assert page.locator(f'#portrait-style option[value={style}]').is_enabled()
            assert page.evaluate('''async () => {
                const decoded=await Promise.all(Object.values(EDUCADE_PORTRAITS).map(async sheet=>{
                    const image=new Image();image.src=sheet.src;await image.decode();
                    return image.naturalWidth===sheet.width && image.naturalHeight===sheet.height;
                }));return decoded.every(Boolean);
            }'''), 'Supplied portrait file missing, corrupted or dimension mismatch'
            original_data=page.evaluate('JSON.stringify(EDUCADE_DEMO.students)')
            page.locator('#portrait-style').select_option('photos')
            assert page.locator('#student-rows .portrait-image').count()==6
            photo_frames=page.locator('#student-rows .portrait-image').evaluate_all('(els)=>els.map(el=>el.getAttribute("viewBox"))')
            assert len(set(photo_frames))==6
            page.locator('[data-class-mode=heatmap]').click()
            page.screenshot(path=str(OUT/f'photos-heatmap-{width}.png'),full_page=True)
            page.locator('#portrait-style').select_option('vikings')
            assert page.locator('.heat-cell').count()==24
            viking_frames=page.locator('#student-rows .portrait-image').evaluate_all('(els)=>els.map(el=>el.getAttribute("viewBox"))')
            assert len(set(viking_frames))==6
            page.locator('[data-class-mode=bars]').click()
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            page.screenshot(path=str(OUT/f'vikings-bars-{width}.png'),full_page=True)
            page.locator('.name-button[data-student=maya]').click();page.wait_for_selector('.category-tabs')
            page.locator('#tab-vocabulary').click();page.wait_for_function('location.hash.includes("/vocabulary/")')
            page.locator('[data-mode=radar]').click()
            page.locator('#skill-chart [data-open-group]').first.click()
            selected=page.locator('.skill-group[open] .individual-skill').first
            skill=selected.get_attribute('data-evidence')
            selected.click();evidence=page.locator('#evidence-content').inner_text()
            # A presentation change does not replace/close the evidence dialog.
            page.locator('#portrait-style').evaluate("el=>{el.value='photos';el.dispatchEvent(new Event('change',{bubbles:true}));}")
            assert page.locator('#evidence-dialog').is_visible()
            assert page.locator('#evidence-content').inner_text()==evidence
            page.keyboard.press('Escape')
            page.locator('#portrait-style').select_option('initials')
            assert page.locator('.portrait-image').count()==0
            assert page.locator('.profile-avatar').inner_text()=='MP'
            assert page.locator('h1').inner_text()=='Maya Patel'
            assert page.locator('#tab-vocabulary').get_attribute('aria-selected')=='true'
            assert page.locator('.radar-area').is_visible()
            assert page.locator('.skill-group[open]').count()==1
            page.locator('[data-mode=bars]').click()
            assert page.locator(f'.individual-skill[data-evidence="{skill}"]').get_attribute('aria-pressed')=='true'
            page.locator('#portrait-style').select_option('vikings')
            page.reload(wait_until='networkidle')
            assert page.locator('#portrait-style').input_value()=='vikings'
            assert page.locator('.profile-avatar .portrait-image').count()==1
            assert page.locator('[data-mode=bars]').get_attribute('aria-pressed')=='true'
            assert page.locator('h1').inner_text()=='Maya Patel'
            assert page.evaluate('JSON.stringify(EDUCADE_DEMO.students)')==original_data
            for style in ['photos','vikings']:
                page.locator('#portrait-style').select_option(style)
                for learner in ['alex','maya','leo','sofia','noah','ella']:
                    page.locator('#switch-student').select_option(learner)
                    page.wait_for_function('(id)=>location.hash.includes("student/"+id+"/")',arg=learner)
                    assert page.locator('.profile-avatar').get_attribute('data-avatar-student')==learner
                    assert page.locator('.profile-avatar .portrait-image image').get_attribute('href')==('assets/portraits/sample-students.png' if style=='photos' else 'assets/portraits/viking-adventurers.png')
                    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
                page.locator('[data-mode=radar]').click()
                assert page.locator('.radar-area').is_visible()
                page.screenshot(path=str(OUT/f'{style}-profile-{width}.png'),full_page=True)
            assert not errors,errors
            assert not failed,failed
            page.close()
        print('PASS: actual photo/Viking files, all six portrait assignments, independent views, preserved selection/evidence and saved preferences at 1440/768/390/320px',flush=True)
        for storage in ['malformed','unavailable']:
            page=browser.new_page()
            script="localStorage.setItem('educade.teacher.presentation.v1','invalid JSON');" if storage=='malformed' else "Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}});"
            page.add_init_script(script)
            page.goto(base+'/teacher.html',wait_until='networkidle')
            assert page.locator('#student-rows tr').count()==6
            page.locator('[data-class-mode=heatmap]').click()
            assert page.locator('.heat-cell').count()==24
            if storage=='unavailable':assert 'for this visit' in page.locator('#preference-status').inner_text()
            page.close()
        print('PASS: malformed or blocked browser storage does not break the dashboard',flush=True)
        browser.close()
finally:
    server.shutdown();server.server_close()
