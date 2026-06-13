# Despliegue (Netlify + Render)

> La **SPA** se sirve estática en **Netlify**; la **API** (Fastify + DuckDB, un
> servidor Node persistente con módulo nativo) corre en **Render**. El frontend
> resuelve la URL de la API con `VITE_API_BASE_URL`, así que solo hay que
> conectarlas. Para la postura de seguridad, ver [seguridad.md](./seguridad.md).

```
  Navegador ──► Netlify (SPA estática)
                   │  fetch  VITE_API_BASE_URL/api/*
                   ▼
               Render (Fastify + DuckDB READ_ONLY)
```

Archivos ya preparados en el repo: [`render.yaml`](../render.yaml),
[`netlify.toml`](../netlify.toml) y [`frontend/public/_headers`](../frontend/public/_headers).

---

## 1. Publicar la base de datos

`data/cdti.duckdb` (8,6 MB) ahora **se versiona** en git (ver `.gitignore`), de
modo que Render la lee tal cual. Constrúyela y súbela:

```bash
npm run ingest                 # reconstruye data/cdti.duckdb desde data/raw/*
git add data/cdti.duckdb
git commit -m "chore: publish DuckDB snapshot"
git push
```

> Los JSON crudos siguen siendo **locales** (no se suben): la fuente de verdad en
> el repo es la BD construida. Alternativa sin binario en git: subir los JSON con
> `git add -f data/raw/*.json` y cambiar el `buildCommand` de `render.yaml` a
> `npm ci && npm run ingest`.

## 2. API en Render

1. Sube el repo a GitHub (con el commit de datos del paso 1).
2. Render → **New → Blueprint** → selecciona el repo. Detectará `render.yaml` y
   creará el servicio `cdti-api` (plan free, región Frankfurt).
3. Deja que despliegue. Anota la URL, p. ej. `https://cdti-api.onrender.com`.
   Comprueba `https://cdti-api.onrender.com/health` → `{"status":"ok"}`.
   (Aún no podrá consumirla la SPA hasta fijar `CORS_ORIGIN` en el paso 4.)

> Render inyecta `PORT` (la API ya lo escucha) y `API_HOST=0.0.0.0` viene en el
> blueprint. En el plan **free** el servicio se duerme tras ~15 min de
> inactividad; la primera petición tras dormir tarda ~30-60 s (cold start).

## 3. SPA en Netlify

1. Netlify → **Add new site → Import from Git** → el mismo repo.
2. Build y publish los toma de `netlify.toml` (no toques los campos).
3. **Site settings → Environment variables**, añade:
   ```
   VITE_API_BASE_URL = https://cdti-api.onrender.com
   ```
   (la URL de la API del paso 2, **sin** barra final). Vite la incrusta en build.
4. (Opcional, recomendado) Fija la CSP a tu host exacto en
   [`frontend/public/_headers`](../frontend/public/_headers): cambia
   `connect-src 'self' https://*.onrender.com` por
   `connect-src 'self' https://cdti-api.onrender.com`.
5. Lanza el deploy. Anota la URL del sitio, p. ej. `https://cdti.netlify.app`.

## 4. Conectar ambos (CORS)

1. En Render → servicio `cdti-api` → **Environment** → fija:
   ```
   CORS_ORIGIN = https://cdti.netlify.app
   ```
   (la URL de Netlify del paso 3, sin barra final). Guarda → Render reinicia.
2. Recarga la SPA: los paneles deben cargar datos.

## 5. Verificación

- DevTools → **Network**: las llamadas `/api/*` responden `200` desde la URL de
  Render (sin errores de CORS).
- DevTools → **Console**: sin violaciones de CSP.
- Exportar (CSV/JSON/XML/TOON) descarga el fichero.
- Comprobar cabeceras del sitio en <https://securityheaders.com>.

## 6. Mantener la API despierta (gratis)

El sitio de **Netlify está siempre disponible**; lo único que se suspende es la
API de Render free tras ~15 min sin peticiones (la primera visita tras dormir
tarda ~30-60 s en cargar **datos**, la página carga al instante). Para evitarlo
sin pagar, un servicio gratuito hace «ping» periódico a `/health`:

1. Crea una cuenta gratis en <https://cron-job.org> (o UptimeRobot).
2. Nuevo cron job: URL `https://cdti-api.onrender.com/health`, método `GET`,
   cada **10 minutos**.
3. Con eso la API no llega a dormirse y responde siempre rápido.

> El plan free de Render tiene un tope de horas/mes; mantenerlo despierto 24/7
> consume casi todas. Si algún mes se agotan, volverá a dormir hasta el
> siguiente (la web seguirá disponible, solo con el cold start puntual).

## 7. Actualizar los datos

Cuando cambien los JSON en `data/raw/`:

```bash
npm run ingest                 # reconstruye data/cdti.duckdb
git add data/cdti.duckdb
git commit -m "data: actualiza el dataset"
git push                       # Render redesplega solo con la BD nueva
```

La SPA de Netlify no necesita reconstruirse: los datos vienen de la API.

## Notas

- **Mismo dominio (opcional, más limpio):** si en el futuro sirves la API bajo el
  mismo dominio que la SPA (p. ej. proxy `/api/*` → Render), pon
  `VITE_API_BASE_URL` vacío y `connect-src 'self'`, y CORS deja de hacer falta.
- **Railway** en vez de Render: el procedimiento es análogo (build `npm ci`,
  start `npm run start --workspace backend`, variables `CORS_ORIGIN`,
  `API_HOST=0.0.0.0`); ajusta `connect-src` al dominio `*.up.railway.app`.
