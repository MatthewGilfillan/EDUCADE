import functools
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path('/workspace/educade-validation/profile-widgets');out.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(Path(__file__).resolve().parents[1]/'public')));Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in [1440,390]:
  page=b.new_page(viewport={'width':width,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/teacher.html#student/alex/overall',wait_until='networkidle')
  assert page.locator('.radar-target').count()==5
  assert page.locator('.radar-skills button').all_text_contents()[0].startswith('Reading Foundations')
  page.locator('[data-teacher-action=comment]').click();assert 'supported' in page.locator('#report-draft').input_value()
  page.locator('#report-draft').fill('Teacher reviewed: Alex is developing his inference skills.')
  with page.expect_popup() as popup:page.locator('[data-teacher-action=pdf]').click()
  report=popup.value;report.wait_for_load_state();assert 'Teacher reviewed: Alex' in report.locator('body').inner_text();assert report.locator('.report-chart svg').count()==1;assert 'Glows & Grows' in report.locator('body').inner_text();assert 'Literacy' in report.locator('body').inner_text();report.pdf(path=str(out/f'learner-report-{width}.pdf'));report.close()
  page.locator('#report-include-chart').uncheck();page.locator('#report-include-growth').uncheck()
  with page.expect_popup() as popup:page.locator('[data-teacher-action=pdf]').click()
  report=popup.value;assert report.locator('.report-chart,.growth-item').count()==0;report.close()
  page.locator('[data-teacher-action=targets]').click();assert 'fresh task independently' in page.locator('#report-draft').input_value()
  page.locator('[data-teacher-action=groups]').click();assert page.locator('[data-move-member]').count()==6
  page.locator('[data-move-member=alex]').select_option('1');page.locator('[data-teacher-action=save-groups]').click()
  assert 'saved in this browser' in page.locator('#group-status').inner_text()
  page.reload(wait_until='networkidle');assert page.locator('[data-move-member=alex]').input_value()=='1';assert 'Learning target:' in page.locator('#report-draft').input_value()
  page.locator('#group-method').select_option('mixed');page.locator('#group-size').select_option('3');page.locator('[data-teacher-action=groups]').click();assert page.locator('.suggested-group').count()==2
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=str(out/f'profile-{width}.png'),full_page=True)
  page.locator('.teacher-actions').screenshot(path=str(out/f'actions-{width}.png'))
  page.locator('.partner-widget').screenshot(path=str(out/f'partners-{width}.png'))
  assert not errors,errors
  page.close()
 b.close()
server.shutdown();print('Profile widgets passed at 1440px and 390px, including real PDF rendering and saved group recovery.')
