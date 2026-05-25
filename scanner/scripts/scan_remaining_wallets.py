"""
Scans remaining unlabeled wallets and writes results to assets/wallets/remaining_scan.md
Run: python3 scripts/scan_remaining_wallets.py
"""
import urllib.request, json, sys, time
sys.path.insert(0, '/Users/corbinpaulson/hl-intel')
from collections import Counter
from pathlib import Path
from data.database import get_conn, get_wallet_label, init_db

URL = 'https://api.hyperliquid.xyz/info'
OUT = Path('/Users/corbinpaulson/hl-intel/assets/wallets/remaining_scan.md')

REMAINING = [
    ('0x7839e2f2c375dd2935193f2736167514efff9916', '#4'),
    ('0x399965e15d4e61ec3529cc98b7f7ebb93b733336', '#6'),
    ('0x162cc7c861ebd0c06b3d72319201150482518185', '#7'),
    ('0xff4cd3826ecee12acd4329aada4a2d3419fc463c', '#8'),
    ('0x7b7f72a28fe109fa703eeed7984f2a8a68fedee2', '#13'),
    ('0xe357fa9fecb084f0303ff341b0bc55c89f2bb5ce', '#14'),
    ('0xe4c6ae25959d7fc66cf2dd5965fb78c5e09c4048', '#15b'),
    ('0xeeb56331b6a250fe2dbc123f08bdb87aa9840464', '#17'),
    ('0x049bdc370620beab340b01072fa580fd57745e7d', '#18b'),
    ('0x01d734e9e7847248864c2c7bbab16c4d5e04a990', '#19'),
    ('0xad8be12a452b5b8f9ad9883f6e8e67536627db4b', '#21b'),
    ('0x3bcae23e8c380dab4732e9a159c0456f12d866f3', '#22'),
    ('0x95ccaf0846757c74b33b146db85e757249b99c8a', '#23'),
    ('0x6355f7cf36b24044cd5b089a845113327d0ee58e', '#26a'),
    ('0xe4baa9cd51176265ef709a81307f9971030009e6', '#26b'),
    ('0xefd3ab65915e35105caa462442c9ecc1346728df', '#28'),
    ('0xa6ee1ed1ae80b8352603654b39f5e7b9bedd5078', '#29'),
    ('0x31dea2516beee92135b96f464eeec3cf292a13f2', '#30'),
    ('0xfe0589b070c1095b75dc5891d7408cc3cf3b3e8a', '#31'),
    ('0x1c1c270b573d55b68b3d14722b5d5d401511bed0', '#33a'),
    ('0x6ba889db7f923622d3548f621ecc2054b80c1817', '#33b'),
    ('0xcab59c7a92b8f7c4d5cde72bb7669ee7d75b6e6e', '#35c'),
    ('0x32008fcb6bbd16532afc83ca8b6c920dde22c407', '#36'),
    ('0xdcac85ecae7148886029c20e661d848a4de99ce2', '#37'),
    ('0x687feda45b6847763f5bf5c01a2f6c1a3d727f5c', '#39b'),
    ('0x5986347c1d0133d02d307f08bb1efd44c2eb89d9', '#40'),
    ('0x53babe76166eae33c861aeddf9ce89af20311cd0', '#44a'),
    ('0x862dd8e68f30693e3d3c9daa42a440bc6d2a1f0c', '#44b'),
    ('0xc5ed4501500fcbfb2b88fb7f0aa52f834ed44346', '#47b'),
    ('0xe84fbad5e9ae5f2111d0608dab25dfba8004f964', '#48'),
]


def api_call(payload, retries=5):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(URL,
                data=json.dumps(payload).encode(),
                headers={'Content-Type': 'application/json'})
            return json.loads(urllib.request.urlopen(req, timeout=10).read())
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 15 * (attempt + 1)
                print(f'  429 — waiting {wait}s...')
                time.sleep(wait)
            else:
                raise
    return None


def scan_wallet(addr, rank, lb_data, mids):
    print(f'Scanning {rank} {addr[:10]}...')

    data = api_call({'type': 'clearinghouseState', 'user': addr})
    if not data:
        return None
    time.sleep(6)

    positions = []
    for item in data.get('assetPositions', []):
        pos = item.get('position', {})
        if not pos or float(pos.get('szi', 0)) == 0: continue
        size = float(pos['szi'])
        entry_px = float(pos.get('entryPx', 0) or 0)
        liq_px = float(pos.get('liquidationPx', 0) or 0)
        notional = abs(size) * entry_px
        upnl = float(pos.get('unrealizedPnl', 0) or 0)
        curr_px = float(mids.get(pos['coin'], entry_px))
        dist = ((liq_px - curr_px) / curr_px * 100) if liq_px > 0 and curr_px > 0 else None
        positions.append({'coin': pos['coin'], 'side': 'LONG' if size > 0 else 'SHORT',
                          'notional': notional, 'entry_px': entry_px, 'liq_px': liq_px,
                          'upnl': upnl, 'roi': (upnl/notional*100) if notional > 0 else 0,
                          'dist': dist})
    positions.sort(key=lambda x: x['notional'], reverse=True)
    acct = float(data.get('marginSummary', {}).get('accountValue', 0))
    total_notional = sum(p['notional'] for p in positions)
    lev = total_notional / acct if acct > 0 else 0

    fills_data = api_call({'type': 'userFills', 'user': addr})
    time.sleep(6)
    top_coins = Counter(f['coin'] for f in (fills_data or [])[-200:]).most_common(5)

    row = lb_data.get(addr.lower(), {})
    perfs = dict(row.get('windowPerformances', []))
    at = perfs.get('allTime', {}); wk = perfs.get('week', {}); mo = perfs.get('month', {})

    return {
        'addr': addr, 'rank': rank, 'acct': acct, 'lev': lev,
        'positions': positions, 'top_coins': top_coins,
        'at_pnl': float(at.get('pnl', 0)), 'at_roi': float(at.get('roi', 0)) * 100,
        'at_vol': float(at.get('vlm', 0)),
        'mo_pnl': float(mo.get('pnl', 0)), 'mo_roi': float(mo.get('roi', 0)) * 100,
        'wk_pnl': float(wk.get('pnl', 0)), 'wk_roi': float(wk.get('roi', 0)) * 100,
    }


def format_result(w):
    lines = [f'\n## {w["rank"]} — `{w["addr"]}`']
    lines.append(f'**Acct:** ${w["acct"]:,.0f}  |  **Positions:** {len(w["positions"])}  |  **Leverage:** {w["lev"]:.1f}x')
    lines.append(f'**AllTime:** ${w["at_pnl"]:,.0f} ({w["at_roi"]:.1f}%)  Vol: ${w["at_vol"]:,.0f}')
    lines.append(f'**Month:** ${w["mo_pnl"]:,.0f} ({w["mo_roi"]:.1f}%)  |  **Week:** ${w["wk_pnl"]:,.0f} ({w["wk_roi"]:.1f}%)')
    if w['positions']:
        lines.append('\n| Coin | Side | Notional | UPnL | ROI | Liq Dist |')
        lines.append('|---|---|---|---|---|---|')
        for p in w['positions'][:8]:
            u = f'+${p["upnl"]:,.0f}' if p['upnl'] >= 0 else f'-${abs(p["upnl"]):,.0f}'
            d = f'{p["dist"]:+.1f}%' if p['dist'] is not None else '—'
            warn = ' ⚠️' if p['dist'] is not None and abs(p['dist']) < 10 else ''
            lines.append(f'| {p["coin"]} | {p["side"]} | ${p["notional"]:,.0f} | {u} | {p["roi"]:.1f}% | {d}{warn} |')
    else:
        lines.append('*No open positions*')
    fills_str = ', '.join(f'{c}({n})' for c,n in w['top_coins'])
    lines.append(f'\n**Top fills:** {fills_str or "none"}')
    return '\n'.join(lines)


if __name__ == '__main__':
    init_db()

    print('Fetching leaderboard and prices...')
    req = urllib.request.Request('https://stats-data.hyperliquid.xyz/Mainnet/leaderboard',
                                  headers={'User-Agent': 'Mozilla/5.0'})
    lb_data = {r['ethAddress'].lower(): r for r in
               json.loads(urllib.request.urlopen(req, timeout=15).read())['leaderboardRows']}
    mids = api_call({'type': 'allMids'})
    time.sleep(3)

    results = []
    for addr, rank in REMAINING:
        w = scan_wallet(addr, rank, lb_data, mids)
        if w:
            results.append(w)
            # Save progress after each wallet
            output = f'# Remaining Wallet Scan\n\nScanned {len(results)}/{len(REMAINING)} wallets\n'
            for r in results:
                output += format_result(r)
            OUT.write_text(output)
            print(f'  Saved. ({len(results)}/{len(REMAINING)})')

    print(f'\nComplete. Results at {OUT}')
