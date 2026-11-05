#!/usr/bin/env python3
"""Poor Dave publisher robot (runs in GitHub Actions).

Modes:
  publish.py run                     post every due item of queue.json (only if queue.enabled is true)
  publish.py auth tiktok <code>      exchange a TikTok authorization code and store the tokens
  publish.py auth youtube <code>     exchange a Google authorization code and store the tokens
  publish.py post '<json>'           post one video now (publisher page); writes status/tiktok_last_post.json
  publish.py profile                 refresh status/tiktok_account.json (creator info, no secrets)

Secrets (GitHub Actions secrets, never in the repo):
  TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
Tokens live in state/tokens.json, which the workflow decrypts from state/tokens.enc
(AES-256 with the TOKEN_KEY secret) before running and encrypts again afterwards.
Only the Python standard library is used.
"""
import json, os, sys, time, urllib.request, urllib.parse, urllib.error
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUEUE = os.path.join(ROOT, 'queue.json')
TOKENS = os.path.join(ROOT, 'state', 'tokens.json')
RAW = 'https://raw.githubusercontent.com/Vitrella/poor-dave-media/main/videos/'
REDIRECT = 'https://vitrella.github.io/poor-dave-media/callback.html'
TT = 'https://open.tiktokapis.com'
STATUS = os.path.join(ROOT, 'status')


def env(name):
    v = os.environ.get(name, '').strip()
    if not v:
        sys.exit(f'missing secret {name}')
    return v


def http(method, url, data=None, headers=None, raw=None):
    headers = dict(headers or {})
    body = raw
    if data is not None and raw is None:
        if headers.get('Content-Type', '').startswith('application/json'):
            body = json.dumps(data).encode()
        else:
            body = urllib.parse.urlencode(data).encode()
            headers.setdefault('Content-Type', 'application/x-www-form-urlencoded')
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            txt = r.read().decode() or '{}'
            return r.status, (json.loads(txt) if txt.strip().startswith('{') else {}), dict(r.headers)
    except urllib.error.HTTPError as e:
        txt = e.read().decode()
        try:
            return e.code, json.loads(txt), dict(e.headers)
        except Exception:
            return e.code, {'raw': txt[:500]}, dict(e.headers)


def load(path, default):
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        return default


def save(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write('\n')


def now():
    return datetime.now(timezone.utc)


# ---------------- TikTok ----------------
def tiktok_token(tokens, **params):
    params.update(client_key=env('TIKTOK_CLIENT_KEY'), client_secret=env('TIKTOK_CLIENT_SECRET'))
    st, j, _ = http('POST', TT + '/v2/oauth/token/', params)
    if 'access_token' not in j:
        sys.exit(f'TikTok token error: {j}')
    j['expires_at'] = time.time() + j['expires_in'] - 120
    tokens['tiktok'] = j
    return j['access_token']


def tiktok_access(tokens):
    t = tokens.get('tiktok')
    if not t:
        sys.exit('TikTok not connected (run auth tiktok)')
    if time.time() > t.get('expires_at', 0):
        return tiktok_token(tokens, grant_type='refresh_token', refresh_token=t['refresh_token'])
    return t['access_token']


def tiktok_api(tokens, path, payload):
    st, j, _ = http('POST', TT + path, payload, {'Authorization': 'Bearer ' + tiktok_access(tokens),
                                                'Content-Type': 'application/json; charset=UTF-8'})
    if j.get('error', {}).get('code', 'ok') != 'ok':
        raise RuntimeError(f"TikTok {path}: {j['error']}")
    return j.get('data', {})


def tiktok_get(tokens, path):
    st, j, _ = http('GET', TT + path, headers={'Authorization': 'Bearer ' + tiktok_access(tokens)})
    if j.get('error', {}).get('code', 'ok') != 'ok':
        raise RuntimeError(f"TikTok {path}: {j['error']}")
    return j.get('data', {})


def tiktok_profile(tokens):
    """Save the connected account and its creator info (no secrets) for the publisher page."""
    u = tiktok_get(tokens, '/v2/user/info/?fields=open_id,display_name,avatar_url').get('user', {})
    ci = tiktok_api(tokens, '/v2/post/publish/creator_info/query/', {})
    save(os.path.join(STATUS, 'tiktok_account.json'), {
        'display_name': u.get('display_name'), 'avatar_url': u.get('avatar_url'),
        'creator_nickname': ci.get('creator_nickname'), 'creator_username': ci.get('creator_username'),
        'creator_avatar_url': ci.get('creator_avatar_url'),
        'privacy_level_options': ci.get('privacy_level_options', []),
        'comment_disabled': ci.get('comment_disabled'), 'duet_disabled': ci.get('duet_disabled'),
        'stitch_disabled': ci.get('stitch_disabled'),
        'max_video_post_duration_sec': ci.get('max_video_post_duration_sec'),
        'updated': now().isoformat()})
    return ci


def tiktok_post(tokens, item, video, opts=None):
    """Direct post (or draft when opts['draft']) by FILE_UPLOAD. opts comes from the publisher page;
    the scheduled robot passes none and uses PUBLIC_TO_EVERYONE when allowed."""
    opts = opts or {}
    ci = tiktok_api(tokens, '/v2/post/publish/creator_info/query/', {})
    options = ci['privacy_level_options']
    privacy = opts.get('privacy') or ('PUBLIC_TO_EVERYONE' if 'PUBLIC_TO_EVERYONE' in options else options[0])
    if privacy not in options:
        raise RuntimeError(f'privacy {privacy} not allowed for this account: {options}')
    size = len(video)
    source = {'source': 'FILE_UPLOAD', 'video_size': size, 'chunk_size': size, 'total_chunk_count': 1}
    if opts.get('draft'):
        d = tiktok_api(tokens, '/v2/post/publish/inbox/video/init/', {'source_info': source})
    else:
        d = tiktok_api(tokens, '/v2/post/publish/video/init/', {
            'post_info': {'title': item['caption'], 'privacy_level': privacy,
                          'disable_comment': not opts.get('allow_comment', True),
                          'disable_duet': not opts.get('allow_duet', False),
                          'disable_stitch': not opts.get('allow_stitch', False),
                          'is_aigc': opts.get('aigc', True),
                          'brand_content_toggle': opts.get('commercial', False), 'brand_organic_toggle': False},
            'source_info': source})
    st, j, _ = http('PUT', d['upload_url'], raw=video, headers={
        'Content-Type': 'video/mp4', 'Content-Length': str(size), 'Content-Range': f'bytes 0-{size - 1}/{size}'})
    if st not in (200, 201):
        raise RuntimeError(f'TikTok upload HTTP {st}: {j}')
    last = {}
    for _ in range(60):
        time.sleep(10)
        last = tiktok_api(tokens, '/v2/post/publish/status/fetch/', {'publish_id': d['publish_id']})
        if last.get('status') in ('PUBLISH_COMPLETE', 'SEND_TO_USER_INBOX', 'FAILED'):
            break
    res = {'publish_id': d['publish_id'], 'privacy': privacy, 'status': last.get('status'),
           'fail_reason': last.get('fail_reason'), 'draft': bool(opts.get('draft'))}
    if last.get('status') == 'FAILED':
        raise RuntimeError(f"TikTok publish failed: {last.get('fail_reason')}")
    return res


# ---------------- YouTube ----------------
def google_token(tokens, **params):
    params.update(client_id=env('GOOGLE_CLIENT_ID'), client_secret=env('GOOGLE_CLIENT_SECRET'))
    st, j, _ = http('POST', 'https://oauth2.googleapis.com/token', params)
    if 'access_token' not in j:
        sys.exit(f'Google token error: {j}')
    old = tokens.get('youtube', {})
    if 'refresh_token' not in j and old.get('refresh_token'):
        j['refresh_token'] = old['refresh_token']
    j['expires_at'] = time.time() + j['expires_in'] - 120
    tokens['youtube'] = j
    return j['access_token']


def google_access(tokens):
    t = tokens.get('youtube')
    if not t:
        sys.exit('YouTube not connected (run auth youtube)')
    if time.time() > t.get('expires_at', 0):
        return google_token(tokens, grant_type='refresh_token', refresh_token=t['refresh_token'])
    return t['access_token']


def youtube_upload(tokens, item, video):
    meta = {'snippet': {'title': item['title'], 'description': item['caption'], 'categoryId': '28',
                        'defaultLanguage': 'en', 'defaultAudioLanguage': 'en'},
            'status': {'privacyStatus': 'private', 'publishAt': item['youtube_at'],
                       'selfDeclaredMadeForKids': False, 'containsSyntheticMedia': True}}
    auth = {'Authorization': 'Bearer ' + google_access(tokens)}
    st, j, h = http('POST', 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
                    raw=json.dumps(meta).encode(), headers={**auth, 'Content-Type': 'application/json; charset=UTF-8',
                                                            'X-Upload-Content-Type': 'video/mp4',
                                                            'X-Upload-Content-Length': str(len(video))})
    loc = h.get('Location') or h.get('location')
    if not loc:
        raise RuntimeError(f'YouTube init HTTP {st}: {j}')
    st, j, _ = http('PUT', loc, raw=video, headers={**auth, 'Content-Type': 'video/mp4'})
    if 'id' not in j:
        raise RuntimeError(f'YouTube upload HTTP {st}: {j}')
    return {'video_id': j['id'], 'url': 'https://youtube.com/shorts/' + j['id']}


# ---------------- main ----------------
def run():
    q = load(QUEUE, {'enabled': False, 'items': []})
    if not q.get('enabled'):
        print('queue disabled: nothing to do')
        return
    tokens = load(TOKENS, {})
    t = now()
    for item in q['items']:
        video = None
        try:
            if q.get('youtube', True) and not item.get('youtube_done') and item.get('youtube_at'):
                at = datetime.fromisoformat(item['youtube_at'])
                if t >= at - timedelta(days=3):
                    video = video or urllib.request.urlopen(RAW + item['file'], timeout=300).read()
                    item['youtube_done'] = youtube_upload(tokens, item, video)
                    print('YouTube scheduled', item['id'], item['youtube_done'])
            if q.get('tiktok', True) and not item.get('tiktok_done') and item.get('tiktok_at'):
                at = datetime.fromisoformat(item['tiktok_at'])
                if at <= t <= at + timedelta(hours=3):
                    video = video or urllib.request.urlopen(RAW + item['file'], timeout=300).read()
                    item['tiktok_done'] = tiktok_post(tokens, item, video)
                    print('TikTok posted', item['id'], item['tiktok_done'])
        except Exception as e:
            item['last_error'] = f'{t.isoformat()} {e}'
            print('ERROR', item['id'], e)
        save(QUEUE, q)
        save(TOKENS, tokens)


def auth(platform, code):
    tokens = load(TOKENS, {})
    if platform == 'tiktok':
        tiktok_token(tokens, code=code, grant_type='authorization_code', redirect_uri=REDIRECT)
        save(TOKENS, tokens)
        try:
            tiktok_profile(tokens)
        except Exception as e:
            save(os.path.join(STATUS, 'tiktok_account.json'), {'error': str(e), 'updated': now().isoformat()})
    elif platform == 'youtube':
        google_token(tokens, code=code, grant_type='authorization_code', redirect_uri=REDIRECT)
    else:
        sys.exit('platform must be tiktok or youtube')
    save(TOKENS, tokens)
    print(platform, 'connected')


def manual_post(payload):
    """Publisher page: post one video right now with the options the owner chose."""
    opts = json.loads(payload)
    tokens = load(TOKENS, {})
    result = {'requested': now().isoformat(), 'video': opts.get('video'), 'draft': bool(opts.get('draft'))}
    try:
        video = urllib.request.urlopen(RAW + opts['video'], timeout=300).read()
        result.update(tiktok_post(tokens, {'caption': opts.get('caption', '')}, video, opts))
    except Exception as e:
        result['error'] = str(e)
        print('ERROR', e)
    result['finished'] = now().isoformat()
    save(os.path.join(STATUS, 'tiktok_last_post.json'), result)
    save(TOKENS, tokens)


def refresh_profile():
    tokens = load(TOKENS, {})
    try:
        tiktok_profile(tokens)
    except Exception as e:
        save(os.path.join(STATUS, 'tiktok_account.json'), {'error': str(e), 'updated': now().isoformat()})
    save(TOKENS, tokens)


if __name__ == '__main__':
    if len(sys.argv) >= 2 and sys.argv[1] == 'run':
        run()
    elif len(sys.argv) == 4 and sys.argv[1] == 'auth':
        auth(sys.argv[2], sys.argv[3])
    elif len(sys.argv) == 3 and sys.argv[1] == 'post':
        manual_post(sys.argv[2])
    elif len(sys.argv) == 2 and sys.argv[1] == 'profile':
        refresh_profile()
    else:
        sys.exit(__doc__)
