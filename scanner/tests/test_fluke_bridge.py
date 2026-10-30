import importlib.util
import json
import sqlite3
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

PATH = Path(__file__).resolve().parent.parent / "integrations" / "fluke_bridge.py"
spec = importlib.util.spec_from_file_location("fluke_bridge", PATH)
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)
A, B = "0x" + "a"*40, "0x" + "b"*40
NOW = datetime(2026, 10, 29, 23, 0, tzinfo=timezone.utc)


class BridgeTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        self.db = self.root/"db.sqlite"
        with sqlite3.connect(self.db) as db:
            db.execute("CREATE TABLE wallet_performance_snapshots (id INTEGER PRIMARY KEY, address TEXT, account_value REAL, exposure_total REAL, open_upnl REAL, open_positions INTEGER, book_leverage REAL, state TEXT, snapshot_at TEXT)")

    def add(self, addr, at, state="stable", leverage=1, pnl=10):
        with sqlite3.connect(self.db) as db:
            db.execute("INSERT INTO wallet_performance_snapshots (address,account_value,exposure_total,open_upnl,open_positions,book_leverage,state,snapshot_at) VALUES (?,10000,3000,?,2,?,?,?)",
                       (addr,pnl,leverage,state,at.isoformat()))

    def mapping(self, rows):
        path = self.root/"markets.json"
        path.write_text(json.dumps({"markets":rows}))
        return bridge.load_registry(path)

    def test_exact_join_latest_and_missing(self):
        self.add(A, NOW-timedelta(minutes=12), "cooling_off")
        self.add(A, NOW-timedelta(minutes=2), "hot_streak")
        markets=self.mapping([{"market_id":"manual-1","wallet_address":A},
                              {"market_id":"manual-2","wallet_address":B}])
        snaps=bridge.read_snapshots(self.db,[A,B])
        rows=bridge.report(markets,snaps,NOW)["markets"]
        self.assertEqual(rows[0]["status"],"research_only")
        self.assertEqual(rows[0]["hl_observation"]["state"],"hot_streak")
        self.assertEqual(rows[1]["status"],"missing_hl_snapshot")

    def test_stale_risk_and_no_trade(self):
        self.add(A,NOW-timedelta(hours=1),"self_imploding",8,-25)
        mapping=self.mapping([{"market_id":"test","wallet_address":A}])
        result=bridge.report(mapping,bridge.read_snapshots(self.db,[A]),NOW)
        row=result["markets"][0]
        self.assertEqual(row["status"],"stale")
        self.assertIn("high_book_leverage",row["risk_flags"])
        self.assertIn("wallet_health_self_imploding",row["risk_flags"])
        self.assertIn("negative_open_upnl",row["risk_flags"])
        self.assertFalse(result["execution_enabled"])
        self.assertFalse(result["fluke_prices_included"])

    def test_reject_prefix_and_duplicate(self):
        for markets in [
            [{"market_id":"m","wallet_address":A[:10]}],
            [{"market_id":"m","wallet_address":A},
             {"market_id":"m","wallet_address":B}]
        ]:
            with self.subTest(markets=markets), self.assertRaises(ValueError):
                self.mapping(markets)

    def test_read_only_missing_database(self):
        path=self.root/"absent.sqlite"
        with self.assertRaises(FileNotFoundError):
            bridge.read_snapshots(path,[A])
        self.assertFalse(path.exists())

    def test_future_timestamp_stale(self):
        self.add(A,NOW+timedelta(minutes=1))
        markets=self.mapping([{"market_id":"m","wallet_address":A}])
        row=bridge.report(markets,bridge.read_snapshots(self.db,[A]),NOW)["markets"][0]
        self.assertEqual(row["status"],"stale")


if __name__ == "__main__":
    unittest.main()
