import os


def database_url() -> str:
    explicit_url = os.getenv('DATABASE_URL')
    if explicit_url:
        return explicit_url

    driver = os.getenv('DB_DRIVER', 'mysql+pymysql')
    host = os.getenv('DB_HOST', '127.0.0.1')
    port = os.getenv('DB_PORT', '3306')
    database = os.getenv('DB_DATABASE', 'laravel')
    username = os.getenv('DB_USERNAME', 'root')
    password = os.getenv('DB_PASSWORD', '')
    return f'{driver}://{username}:{password}@{host}:{port}/{database}'
