# App-escaner 
Esta es una aplicacion en si version  web para escanear placas de vehiculos de forma inteligente.

Como correr este proyecto:
Clona el repo

Frontend:
cd app-escaner-plata/alpr-astro-app
npm install
npm run dev


Backend y Modelo Inteligente de Placa

cd app-escaner-placa/plate-detector
python -m pip install -r requirements.txt
 $env:DATABASE_URL=$null
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload

http://localhost:8001/api/plates
http://localhost:8001/api/plates/stats
http://localhost:8001/
http://localhost:8001/health
