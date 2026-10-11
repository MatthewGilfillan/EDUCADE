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
            assert page.locator('#student-rows tr[data-student]').count()==6
            assert page.locator('h1').inner_text()=='Teacher Dashboard'
            assert page.locator('.class-title').inner_text()=='Class 5A'
            assert page.locator('.stats').count()==0
            assert 'Reading skills at a glance' not in page.locator('#dashboard').inner_text()
            assert page.locator('.class-tabs [role=tab]').all_text_contents()==['Overall','Reading','Writing','Grammar','Vocabulary']
            assert page.locator('#class-tab-overall').get_attribute('aria-selected')=='true'
            assert page.locator('#search-students').bounding_box()['y']<page.locator('.class-tabs').bounding_box()['y']
            expected=page.evaluate("Object.keys(EDUCADE_DEMO.domains).map(domain=>EDUCADE_DEMO.domainStats(EDUCADE_DEMO.students[0],domain).score+'%')")
            assert page.locator('tr[data-student=alex] .score-cell .hp-value').all_text_contents()==expected
            collapsed_height=page.locator('tr[data-student=alex]').bounding_box()['height']
            page.get_by_role('button',name='Show skill evidence for Alex Chen',exact=True).click()
            assert page.get_by_role('button',name='Hide skill evidence for Alex Chen',exact=True).is_visible()
            assert page.locator('tr[data-student=alex]').bounding_box()['height']>collapsed_height+30
            page.screenshot(path=str(OUT/f'class-overall-{width}.png'),full_page=True)
            columns_before=page.locator('#skill-headings th').evaluate_all('els=>els.map((el,i)=>[i<2?null:el.offsetLeft,el.offsetWidth])')
            table_width=page.locator('.class-table').bounding_box()['width']
            page.get_by_role('button',name='Show all reading evidence for Alex Chen',exact=True).click()
            assert page.locator('#class-tab-overall').get_attribute('aria-selected')=='true'
            assert page.locator('h1').inner_text()=='Teacher Dashboard'
            assert '#student/' not in page.url
            subject=page.locator('#subject-evidence-alex-reading')
            assert subject.is_visible()
            assert subject.locator('.subject-evidence-section>h3').all_text_contents()==['Reading Foundations','Reading Comprehension']
            assert subject.locator('.subject-evidence-skill').count()==9
            response_ids=subject.locator('.subject-response').evaluate_all('els=>els.map(el=>el.dataset.responseId).sort()')
            expected_ids=page.evaluate('EDUCADE_DEMO.students[0].evidence.filter(record=>EDUCADE_DEMO.groups.some(group=>group.domain==="reading"&&group.skills.some(skill=>skill.id===record.skillId))).map(record=>record.id).sort()')
            assert response_ids==expected_ids and len(response_ids)==180
            assert subject.locator('.hp-track').count()==0
            assert page.locator('#skill-headings th').evaluate_all('els=>els.map((el,i)=>[i<2?null:el.offsetLeft,el.offsetWidth])')==columns_before
            assert page.locator('.class-table').bounding_box()['width']==table_width
            summary=subject.locator('.subject-evidence-skill>summary').first
            summary.focus();page.keyboard.press('Enter')
            assert subject.locator('.subject-evidence-skill').first.get_attribute('open') is not None
            history=subject.locator('.subject-response-history').first
            assert history.locator('.subject-response').count()==20
            assert history.locator('.subject-response h5').first.inner_text()=='Week 4 · Attempt 20'
            assert history.locator('.subject-response h5').last.inner_text()=='Week 1 · Attempt 1'
            history.locator('.subject-response').last.scroll_into_view_if_needed()
            assert history.evaluate('el=>el.scrollTop>0')
            page.locator('[data-class-mode=heatmap]').click()
            assert subject.locator('.subject-evidence-skill').first.get_attribute('open') is not None
            assert subject.locator('.subject-response').count()==180
            page.locator('[data-class-mode=bars]').click()
            assert subject.locator('.subject-evidence-skill').first.get_attribute('open') is not None
            assert page.locator('.class-table .hp-track').count()==24
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            if width in [1440,390]:
                page.locator('tr[data-student=alex]').screenshot(path=str(OUT/f'overall-reading-evidence-{width}.png'))
            page.get_by_role('button',name='Hide all reading evidence for Alex Chen',exact=True).click()
            assert subject.is_hidden()
            for domain in ['writing','grammar','vocabulary']:
                page.locator('#class-tab-'+domain).click()
                page.wait_for_function('(domain)=>document.querySelector("#class-tab-"+domain).getAttribute("aria-selected")==="true"',arg=domain)
                assert page.locator('tr[data-student=alex] .student-skill-evidence').first.is_visible()
                assert page.locator('tr[data-student=alex] .student-skill-evidence').count()==6
                assert page.locator('tr[data-student=alex] .compact-evidence .hp-track').count()==0
                for cell in page.locator('tr[data-student=alex] .student-skill-cell').all():
                    axis=cell.get_attribute('data-axis')
                    header=page.locator(f'.skill-heading[data-expand-skill="{axis}"]').locator('..').bounding_box()
                    evidence=cell.locator('.student-skill-evidence').bounding_box()
                    score=cell.locator('.score-cell').bounding_box()
                    assert abs(cell.bounding_box()['x']-header['x'])<1
                    assert evidence['x']>=cell.bounding_box()['x'] and evidence['x']+evidence['width']<=header['x']+header['width']+1
                    assert evidence['y']>=score['y']+score['height']
                    assert abs(cell.locator('.evidence-counts').bounding_box()['x']-cell.locator('.hp-track').bounding_box()['x'])<1
                assert page.locator('.score-cell').count()==36
                expected=page.evaluate('(domain)=>EDUCADE_DEMO.profileAxes[domain].map(axis=>EDUCADE_DEMO.skillStats(EDUCADE_DEMO.students[0],axis.id).score+"%")',domain)
                assert page.locator('tr[data-student=alex] .score-cell .hp-value').all_text_contents()==expected
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'Class {domain} overflow at {width}'
                page.locator('tr[data-student=alex] .score-cell').first.click()
                assert page.locator('.evidence-id').inner_text()==page.evaluate('(domain)=>EDUCADE_DEMO.profileAxes[domain][0].id',domain)
                page.keyboard.press('Escape')
                if domain=='writing':
                    columns_before=page.locator('#skill-headings th').evaluate_all('els=>els.map((el,i)=>({x:i<2?null:el.offsetLeft,width:el.offsetWidth}))')
                    table_width=page.locator('.class-table').bounding_box()['width']
                    page.get_by_role('button',name='Show Transitions evidence across the class',exact=True).click()
                    assert page.locator('#skill-headings th').count()==8
                    assert page.locator('#student-rows>tr').count()==6
                    assert page.locator('.class-table .hp-track').count()==36
                    assert page.locator('.student-skill-evidence:visible').count()==11
                    assert page.locator('.compact-evidence .hp-track,.skill-evidence-cell,.student-evidence-row').count()==0
                    assert page.locator('.class-table').bounding_box()['width']==table_width
                    assert page.locator('#skill-headings th').evaluate_all('els=>els.map((el,i)=>({x:i<2?null:el.offsetLeft,width:el.offsetWidth}))')==columns_before
                    for cell in page.locator('.expanded-skill-cell').all():
                        bar=cell.locator('.hp-track').bounding_box()
                        counts=cell.locator('.evidence-counts').bounding_box()
                        assert abs(counts['x']-bar['x'])<1 and counts['y']>bar['y']+bar['height']
                    transitions=page.locator('tr[data-student=alex] .expanded-skill-cell')
                    assert transitions.locator('.hp-value').inner_text()=='40%'
                    assert transitions.locator('.evidence-counts').inner_text()=='8/20 correct · 5 hints'
                    page.screenshot(path=str(OUT/f'transitions-both-expansions-{width}.png'),full_page=True)
                    page.get_by_role('button',name='Hide Transitions evidence across the class',exact=True).click()
                page.locator('[data-class-mode=heatmap]').click()
                assert page.locator('.heat-cell').count()==36
                page.locator('[data-class-mode=bars]').click()
                page.screenshot(path=str(OUT/f'class-{domain}-{width}.png'),full_page=True)
            page.locator('#class-tab-vocabulary').focus();page.keyboard.press('Home')
            page.wait_for_function('document.querySelector("#class-tab-overall").getAttribute("aria-selected")==="true"')
            assert page.locator('#class-tab-overall').evaluate('el=>el===document.activeElement')
            page.locator('tr[data-student=alex] .score-cell[data-profile-domain=reading]').click()
            page.wait_for_selector('#tab-reading[aria-selected="true"]')
            page.locator('[data-back-class]').click();page.wait_for_selector('#class-tab-overall')
            assert page.locator('#class-tab-overall').get_attribute('aria-selected')=='true'
            page.locator('#class-tab-reading').click()
            page.wait_for_function('document.querySelector("#class-tab-reading").getAttribute("aria-selected")==="true"')
            page.locator('.name-button[data-expand-student=alex]').click()
            page.evaluate('scrollTo(0,0)')
            page.screenshot(path=str(OUT/f'class-header-{width}.png'))
            assert page.locator('.demo-banner').count()==0
            assert page.locator('.toolbar #portrait-style').count()==1
            assert page.locator('tr[data-student] .row-number').all_text_contents()==['1','2','3','4','5','6']
            def check_number_column():
                expected=28 if width<=640 else 32
                dimensions=page.locator('.row-number-heading').evaluate('(el)=>({header:el.getBoundingClientRect().width,row:document.querySelector(".row-number").getBoundingClientRect().width,numberRight:el.getBoundingClientRect().right,studentLeft:document.querySelector(".student-heading").getBoundingClientRect().left})')
                assert abs(dimensions['header']-expected)<1,dimensions
                assert abs(dimensions['row']-expected)<1,dimensions
                assert abs(dimensions['studentLeft']-dimensions['numberRight'])<1,dimensions
            check_number_column()
            page.locator('.student-name-cell').first.screenshot(path=str(OUT/f'learner-actions-{width}.png'))
            actions=page.locator('.student-name-cell').first.evaluate('''(cell)=>{
                const evidence=cell.querySelector('.learner-evidence-toggle'),profile=cell.querySelector('.profile-link'),style=getComputedStyle(evidence);
                const range=document.createRange();range.selectNodeContents(evidence.lastElementChild);
                return {size:parseFloat(style.fontSize),colour:style.color,profileColour:getComputedStyle(profile).color,alignment:style.textAlign,gap:evidence.getBoundingClientRect().top-profile.getBoundingClientRect().bottom,border:parseFloat(style.borderTopWidth),height:evidence.getBoundingClientRect().height,lines:range.getClientRects().length,rowHeight:cell.parentElement.getBoundingClientRect().height,name:profile.querySelector('.learner-name').textContent,cue:profile.querySelector('.profile-cue').textContent};
            }''')
            assert actions['size']>=12 and actions['alignment']=='center',actions
            assert actions['colour']==actions['profileColour'],actions
            assert actions['gap']>=4,actions
            assert actions['border']>=1 and actions['height']>=36 and actions['lines']==1,actions
            assert actions['name']=='Alex Chen' and actions['cue']=='(Click to view profile)',actions
            assert 'Open full profile' not in page.locator('.class-table').inner_text()
            if width>=768:
                assert actions['rowHeight']<=100,actions
            assert page.locator('.skill-heading .heading-evidence-action').all_text_contents()==['+Show evidence']*4
            for heading in page.locator('.skill-heading').all():
                assert heading.is_visible()
                assert heading.evaluate('el=>parseFloat(getComputedStyle(el).borderTopWidth)')>=1
            assert page.locator('#search-students').get_attribute('placeholder')=='Search students'
            assert '4 of 6 learners below 70%' in page.locator('.plan-basis').inner_text()
            assert '61% (73/120 correct responses)' in page.locator('.plan-basis').inner_text()
            page.locator('.class-next-steps').screenshot(path=str(OUT/f'next-steps-{width}.png'))
            page.locator('.individual-intervention[data-individual=ella] button').click()
            assert 'Ella Brown' in page.locator('#evidence-content').inner_text()
            assert '35%' in page.locator('#evidence-content').inner_text()
            page.keyboard.press('Escape')
            skill=page.evaluate('EDUCADE_DEMO.reading[0]')
            page.locator(f'[data-expand-skill="{skill}"]').first.click()
            assert page.get_by_role('button',name='Hide Inference evidence across the class',exact=True).is_visible()
            assert page.locator('.expanded-skill-cell .student-skill-evidence:visible').count()==6
            check_number_column()
            page.locator('.table-scroll').evaluate('(el)=>el.scrollLeft=200')
            check_number_column()
            page.locator('.table-scroll').evaluate('(el)=>el.scrollLeft=0')
            page.get_by_role('button',name='Show skill evidence for Alex Chen',exact=True).click()
            assert page.locator('tr[data-student=alex] .student-skill-evidence').first.is_visible()
            assert page.locator('tr[data-student=alex] .student-skill-evidence').count()==4
            assert page.locator('.compact-evidence .hp-track').count()==0
            page.locator('tr[data-student=alex] .student-skill-evidence .latest-response span').first.click()
            assert page.locator('.name-button[data-expand-student=alex]').get_attribute('aria-expanded')=='true'
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'Expanded class overflow at {width}'
            page.screenshot(path=str(OUT/f'expanded-evidence-{width}.png'),full_page=True)
            page.locator('.name-button[data-expand-student=alex]').click()
            page.locator(f'[data-expand-skill="{skill}"]').first.click()
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
            page.locator('#search-students').fill('Alex');assert page.locator('#student-rows tr[data-student]').count()==1
            page.locator('.profile-link').focus();page.keyboard.press('Enter');page.wait_for_selector('.category-tabs')
            assert page.locator('h1').inner_text()=='Alex Chen'
            def check_profile_order():
                domain=page.locator('[role=tab][aria-selected=true]').get_attribute('data-domain')
                progress=page.locator('.profile-grid .progress-card').bounding_box()
                next_steps=page.locator('.profile-next-card').bounding_box()
                assert progress['y']+progress['height']<=next_steps['y'],f'Progress must be above next steps: {domain}, {width}px'
                assert abs(progress['x']-next_steps['x'])<1,f'Profile widgets must share a column: {domain}, {width}px'
            assert page.locator('[role=tab]').all_text_contents()==['Overall','Reading','Writing','Grammar','Vocabulary']
            assert page.locator('#tab-overall').get_attribute('aria-selected')=='true'
            assert page.locator('[data-mode=radar]').get_attribute('aria-pressed')=='true'
            assert page.locator('.radar-target').count()==4
            assert page.locator('.profile-next-card h2').inner_text()=='Glows & Grows'
            assert page.locator('.glow').get_attribute('data-focus')=='vocabulary'
            assert page.locator('.grow').get_attribute('data-focus')=='writing'
            assert page.locator('.grow .growth-icon svg').is_visible()
            assert page.locator('.radar-skills button').all_text_contents()==page.evaluate("Object.keys(EDUCADE_DEMO.domains).map(domain=>EDUCADE_DEMO.domains[domain].name+EDUCADE_DEMO.domainStats(EDUCADE_DEMO.students[0],domain).score+'%')")
            totals=page.evaluate('EDUCADE_DEMO.summarize(EDUCADE_DEMO.students[0].evidence)')
            for key in ['independent','supported','hints']:
                assert page.locator('[data-count='+key+']').inner_text()==str(totals[key])
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'Overall overflow at {width}'
            check_profile_order()
            page.locator('.profile-grid').screenshot(path=str(OUT/f'overall-radar-{width}.png'))
            page.evaluate('scrollTo(0,0)')
            page.screenshot(path=str(OUT/f'overall-header-{width}.png'))
            page.locator('.radar-target[data-domain=writing] .radar-point').click()
            page.wait_for_function('document.querySelector("#tab-writing").getAttribute("aria-selected")==="true"')
            page.locator('#tab-overall').click();page.wait_for_selector('.radar-target[data-domain=reading]')
            page.locator('.radar-target[data-domain=reading]').focus();page.keyboard.press('Enter')
            page.wait_for_function('document.querySelector("#tab-reading").getAttribute("aria-selected")==="true"')
            page.locator('#tab-overall').click();page.wait_for_selector('.radar-target[data-domain=reading]')
            page.locator('[data-mode=bars]').click()
            assert page.locator('#skill-chart .skill-row').count()==4
            check_profile_order()
            page.reload(wait_until='networkidle')
            assert page.locator('#tab-overall').get_attribute('aria-selected')=='true'
            assert page.locator('[data-mode=bars]').get_attribute('aria-pressed')=='true'
            page.locator('[data-mode=radar]').click()
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
                check_profile_order()
                page.locator('[data-mode=radar]').click();assert page.locator('.radar-area').is_visible()
                check_profile_order()
                assert page.locator('.radar-skills button').count()==(8 if domain=='reading' else 6)
                assert page.locator('.radar-portrait .avatar').count()==1
                if domain=='vocabulary':
                    assert page.locator('.glow h3').inner_text()=='Idioms and adages'
                    assert page.locator('.grow h3').inner_text()=='Prefixes and suffixes'
                    assert '40% correct' in page.locator('.grow .growth-result').inner_text()
                    page.locator('.grow button').click()
                    assert page.locator('#group-affixes').get_attribute('open') is not None
                    assert page.locator('#group-affixes .individual-skill').first.evaluate('el=>el===document.activeElement')
                    page.locator('#group-affixes summary').click()
                    page.evaluate('scrollTo(0,0)')
                page.screenshot(path=str(OUT/f'{domain}-radar-{width}.png'),full_page=True)
                page.locator('[data-mode=bars]').click();assert page.locator('#skill-chart .hp').count()>0
                check_profile_order()
                if domain=='reading' and width in [1440,390]:
                    page.locator('.profile-grid').screenshot(path=str(OUT/f'profile-bars-{width}.png'))
                page.locator('.skill-group').filter(has=page.locator('.group-score:not(.unassessed)')).first.locator('summary').click()
                open_group=page.locator('.skill-group[open]').get_attribute('id')
                page.locator('[data-mode=radar]').click()
                assert page.locator('#'+open_group).get_attribute('open') is not None
                page.locator('[data-mode=bars]').click()
                page.locator('.skill-group[open] .individual-skill').filter(has=page.locator('.hp')).first.click()
                assert page.locator('#evidence-dialog').is_visible()
                assert 'EDU.G5.' in page.locator('.evidence-id').inner_text()
                assert page.locator('.attempt').count()>0
                assert any(text in page.locator('.standard').inner_text() for text in ['CCSS reference text checked','CCSS mapping not reviewed yet'])
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
            assert 'Noah' in page.locator('#student-rows tr[data-student]').first.inner_text()
            page.locator('[data-class-mode=bars]').click()
            assert page.locator('#sort-students').input_value()=='support'
            assert 'Noah' in page.locator('#student-rows tr[data-student]').first.inner_text()
            page.locator('#search-students').fill('Ella')
            page.locator('[data-class-mode=heatmap]').click()
            assert page.locator('#search-students').input_value()=='Ella'
            assert page.locator('#student-rows tr[data-student]').count()==1
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
            page.locator('.profile-link[data-student=maya]').click();page.wait_for_selector('.category-tabs')
            page.locator('#tab-vocabulary').click();page.wait_for_function('location.hash.includes("/vocabulary/")')
            page.locator('[data-mode=radar]').click()
            page.locator('.skill-group summary').first.click()
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
            assert page.locator('.profile-heading .profile-avatar').inner_text()=='MP'
            assert page.locator('h1').inner_text()=='Maya Patel'
            assert page.locator('#tab-vocabulary').get_attribute('aria-selected')=='true'
            assert page.locator('.radar-area').is_visible()
            assert page.locator('.skill-group[open]').count()==1
            page.locator('[data-mode=bars]').click()
            assert page.locator(f'.individual-skill[data-evidence="{skill}"]').get_attribute('aria-pressed')=='true'
            page.locator('#portrait-style').select_option('vikings')
            page.reload(wait_until='networkidle')
            assert page.locator('#portrait-style').input_value()=='vikings'
            assert page.locator('.profile-heading .profile-avatar .portrait-image').count()==1
            assert page.locator('[data-mode=bars]').get_attribute('aria-pressed')=='true'
            assert page.locator('h1').inner_text()=='Maya Patel'
            assert page.evaluate('JSON.stringify(EDUCADE_DEMO.students)')==original_data
            for style in ['photos','vikings']:
                page.locator('#portrait-style').select_option(style)
                for learner in ['alex','maya','leo','sofia','noah','ella']:
                    page.locator('#switch-student').select_option(learner)
                    page.wait_for_function('(id)=>location.hash.includes("student/"+id+"/")',arg=learner)
                    assert page.locator('.profile-heading .profile-avatar').get_attribute('data-avatar-student')==learner
                    assert page.locator('.profile-heading .profile-avatar .portrait-image image').get_attribute('href')==('assets/portraits/sample-students.png' if style=='photos' else 'assets/portraits/viking-adventurers.png')
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
            assert page.locator('#student-rows tr[data-student]').count()==6
            page.locator('[data-class-mode=heatmap]').click()
            assert page.locator('.heat-cell').count()==24
            if storage=='unavailable':assert 'for this visit' in page.locator('#preference-status').inner_text()
            page.close()
        print('PASS: malformed or blocked browser storage does not break the dashboard',flush=True)
        browser.close()
finally:
    server.shutdown();server.server_close()
