import os
import time
import sys
from urllib.parse import urlparse

from sqlalchemy import create_engine


def is_mysql(url: str) -> bool:
    return url.startswith('mysql') or url.startswith('mysql+pymysql')


def wait_for_db(url: str, timeout: int = 60, interval: float = 2.0):
    if not is_mysql(url):
        print('DATABASE_URL not MySQL, skipping wait')
        return 0

    engine = create_engine(url)
    start = time.time()
    while True:
        try:
            print('Attempting DB connection...')
            conn = engine.connect()
            conn.close()
            print('DB is available')
            return 0
        except Exception as e:
            elapsed = time.time() - start
            if elapsed > timeout:
                print(f'Timeout reached ({timeout}s) waiting for DB: {e}', file=sys.stderr)
                return 2
            print(f'Waiting for DB ({int(elapsed)}s elapsed): {e}')
            time.sleep(interval)


if __name__ == '__main__':
    url = os.getenv('DATABASE_URL', '')
    t = int(os.getenv('WAIT_FOR_DB_TIMEOUT', '60'))
    rc = wait_for_db(url, timeout=t)
    sys.exit(rc)
