"""
Wallet labelling tool — tag wallets as algo, human, vault, unknown, watch, or stress_watch.

Usage:
    python3 scripts/label_wallets.py list
    python3 scripts/label_wallets.py tag <address> <label> [name] [notes]
    python3 scripts/label_wallets.py untag <address>
    python3 scripts/label_wallets.py scan

Labels: algo | human | vault | unknown | watch | stress_watch

Examples:
    python3 scripts/label_wallets.py tag 0xabc... algo "#9" "149 coins traded"
    python3 scripts/label_wallets.py tag 0xdef... human "James Wynn" "Known CT trader"
    python3 scripts/label_wallets.py list
    python3 scripts/label_wallets.py scan   # auto-tag likely algos by coin count
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from data.database import init_db, set_wallet_label, get_wallet_label, get_all_labels, get_conn

ALGO_COIN_THRESHOLD = 30  # wallets trading 30+ coins are likely algos


def cmd_list():
    labels = get_all_labels()
    if not labels:
        print("No labels set.")
        return
    print(f"\n{'Label':<10} {'Name':<10} {'Address':<44} {'Notes'}")
    print("-" * 100)
    for r in labels:
        name  = r["name"] or ""
        notes = r["notes"] or ""
        print(f"{r['label']:<10} {name:<10} {r['address']:<44} {notes}")
    print(f"\nTotal: {len(labels)}")


def cmd_tag(address, label, name=None, notes=None):
    valid = {"algo", "human", "vault", "unknown", "watch", "stress_watch"}
    if label not in valid:
        print(f"Invalid label '{label}'. Must be one of: {', '.join(valid)}")
        sys.exit(1)
    set_wallet_label(address, label, name, notes)
    print(f"Tagged {address[:10]}... as [{label}]" + (f" — {name}" if name else ""))


def cmd_untag(address):
    with get_conn() as conn:
        conn.execute("DELETE FROM wallet_labels WHERE address = ?", (address.lower(),))
    print(f"Removed label for {address[:10]}...")


def cmd_scan():
    """Auto-tag likely algos based on coin count."""
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT ps.address, COUNT(DISTINCT ps.coin) as coins, MAX(ps.notional_usd) as peak,
                   ls.rank
            FROM position_snapshots ps
            LEFT JOIN (SELECT address, MIN(rank) as rank FROM leaderboard_snapshots GROUP BY address) ls
            ON ps.address = ls.address
            GROUP BY ps.address
            ORDER BY coins DESC
        """).fetchall()

    print(f"\nAuto-scan results (threshold: {ALGO_COIN_THRESHOLD}+ coins = likely algo)\n")
    print(f"{'Rank':<6} {'Address':<44} {'Coins':<7} {'Peak':>16}  {'Current Label'}")
    print("-" * 95)

    for r in rows:
        existing = get_wallet_label(r["address"])
        current_label = existing["label"] if existing else "—"
        flag = " ← LIKELY ALGO" if r["coins"] >= ALGO_COIN_THRESHOLD and current_label != "algo" else ""
        rank = f"#{r['rank']}" if r["rank"] else "?"
        print(f"{rank:<6} {r['address']:<44} {r['coins']:<7} ${r['peak']:>14,.0f}  [{current_label}]{flag}")


if __name__ == "__main__":
    init_db()
    args = sys.argv[1:]

    if not args or args[0] == "list":
        cmd_list()
    elif args[0] == "tag" and len(args) >= 3:
        cmd_tag(args[1], args[2], args[3] if len(args) > 3 else None, args[4] if len(args) > 4 else None)
    elif args[0] == "untag" and len(args) >= 2:
        cmd_untag(args[1])
    elif args[0] == "scan":
        cmd_scan()
    else:
        print(__doc__)
