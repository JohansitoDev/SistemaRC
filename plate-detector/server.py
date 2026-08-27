import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from alpr_backend.api import router
from alpr_backend.database import init_database


logger = logging.getLogger(__name__)

app = FastAPI(title='ALPR backend')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)
app.include_router(router)


@app.on_event('startup')
def startup() -> None:
    try:
        init_database()
    except Exception:
        logger.exception('No se pudo inicializar la base de datos PostgreSQL.')
        raise
