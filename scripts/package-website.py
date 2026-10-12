"""Package a committed static website with versioned styles and teacher assets."""
import argparse
import hashlib
from pathlib import Path
import shutil
import subprocess
import tempfile
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, required=True, help='Destination ZIP file')
args = parser.parse_args()
revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
if subprocess.check_output(['git', 'status', '--porcelain', '--', 'public'], cwd=ROOT, text=True).strip():
    parser.error('Commit the public website changes before packaging a release.')

with tempfile.TemporaryDirectory(prefix='educade-website-') as temporary:
    website = Path(temporary) / 'website'
    shutil.copytree(PUBLIC, website)
    stylesheet = website / 'style.css'
    digest = hashlib.sha256(stylesheet.read_bytes()).hexdigest()[:12]
    versioned_style = f'style.{digest}.css'
    shutil.copyfile(stylesheet, website / versioned_style)
    for page_name in ['index.html', 'signup.html']:
        page = website / page_name
        markup = page.read_text()
        if markup.count('href="style.css"') != 1:
            parser.error(f'Expected one shared stylesheet reference in {page_name}.')
        page.write_text(markup.replace('href="style.css"', f'href="{versioned_style}"'))
    html = (website / 'teacher.html').read_text()
    for filename, attribute in [('teacher.css', 'href'), ('teacher-data.js', 'src'),
                                ('teacher-portraits.js', 'src'), ('teacher-standards.js', 'src'), ('teacher.js', 'src')]:
        asset = website / filename
        digest = hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
        versioned = f'{asset.stem}.{digest}{asset.suffix}'
        shutil.copyfile(asset, website / versioned)
        reference = f'{attribute}="{filename}"'
        if html.count(reference) != 1:
            parser.error(f'Expected one teacher reference to {filename}.')
        html = html.replace(reference, f'{attribute}="{versioned}"')
    html = html.replace('<head>', f'<head>\n  <meta name="educade-revision" content="{revision}">', 1)
    entry = f'teacher-{revision[:7]}.html'
    (website / 'teacher.html').write_text(html)
    (website / entry).write_text(html)
    index = website / 'index.html'
    landing = index.read_text()
    if 'href="teacher.html#class"' not in landing:
        parser.error('Expected a Sign In link to the dashboard.')
    index.write_text(landing.replace('href="teacher.html#class"', f'href="{entry}#class"'))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    files = sorted(file for file in website.rglob('*') if file.is_file())
    with ZipFile(args.output, 'w', ZIP_DEFLATED) as archive:
        for file in files:
            archive.write(file, file.relative_to(website).as_posix())
    with ZipFile(args.output) as archive:
        if archive.testzip() is not None:
            raise RuntimeError('Archive integrity check failed.')
        if any('wrangler' in name.lower() or Path(name).name in {'package.json', 'package-lock.json'}
               for name in archive.namelist()):
            raise RuntimeError('Upload archive contains development configuration.')
        for file in files:
            if archive.read(file.relative_to(website).as_posix()) != file.read_bytes():
                raise RuntimeError(f'Archive bytes differ for {file.name}.')
    print(f'Website revision: {revision}')
    print(f'Dashboard entry: {entry}')
    print(f'Archive: {args.output} ({len(files)} static files)')
    print('SHA256:', hashlib.sha256(args.output.read_bytes()).hexdigest())
