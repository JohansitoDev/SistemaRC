import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parent.parent / '.env')


def database_url() -> str:
    driver = os.getenv('DB_DRIVER')
    if not driver:
        explicit_url = os.getenv('DATABASE_URL')
        if explicit_url:
            return explicit_url
        driver = 'postgresql+psycopg2'

    host = os.getenv('DB_HOST', '127.0.0.1')
    port = os.getenv('DB_PORT', '5432')
    database = os.getenv('DB_DATABASE', 'alpr_db')
    username = os.getenv('DB_USERNAME', 'postgres')
    password = os.getenv('DB_PASSWORD', '')
    return f'{driver}://{username}:{password}@{host}:{port}/{database}'
