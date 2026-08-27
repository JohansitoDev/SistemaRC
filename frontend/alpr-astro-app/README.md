# ALPR Vision

## Arranque del sistema

1. Copia `.env.example` a `.env` y ajusta las URLs si usas otros puertos.
2. El detector usa EasyOCR y no necesita pesos YOLO adicionales.
3. Configura la conexión a la base de datos y arranca el backend único desde la carpeta `plate-detector`:

```powershell
cd ..\..\plate-detector
python -m pip install -r requirements.txt
$env:DATABASE_URL="mysql+pymysql://root:@127.0.0.1:3306/laravel"
python -m uvicorn server:app --host 0.0.0.0 --port 8001
```

FastAPI reutiliza las tablas existentes (`plates` y `stolen_plates`), por lo que no necesitas migrar los datos.

El backend está separado por responsabilidad:

```text
plate-detector/
├── server.py                 # Punto de entrada FastAPI
└── alpr_backend/
	├── api.py                # Rutas HTTP
	├── ocr.py                # Preprocesamiento y EasyOCR
	├── database.py            # Motor SQLAlchemy
	├── models.py              # Tablas existentes
	├── schemas.py             # Validación de solicitudes
	└── config.py              # Configuración de base de datos
```

4. Inicia este frontend:

```powershell
npm install
npm run dev
```

Abre `https://localhost:4321`. FastAPI recibe la imagen, ejecuta EasyOCR, comprueba si la matrícula está reportada y guarda la captura.

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
