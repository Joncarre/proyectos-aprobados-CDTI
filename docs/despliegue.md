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

## 1. Llevar los datos a producción

`data/cdti.duckdb` (8,6 MB) está **gitignored**, así que no llega a Render por
git. Elige una vía y haz **commit**:

- **A) Subir la base ya construida** (lo más simple, `render.yaml` ya lo asume):
  ```bash
  git add -f data/cdti.duckdb
  git commit -m "chore: publish DuckDB snapshot for deploy"
  ```
- **B) Subir los JSON crudos y construirla en Render** (sin binario en git):
  ```bash
  git add -f data/raw/*.json
  git commit -m "chore: publish raw sources for deploy"
  ```
  y en `render.yaml` cambia `buildCommand` a `npm ci && npm run ingest`.

Para **actualizar datos** más adelante: regenera con `npm run ingest` y vuelve a
hacer commit (vía A), o reemplaza los JSON y haz commit (vía B). Render
redesplegará solo.

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

## Notas

- **Mismo dominio (opcional, más limpio):** si en el futuro sirves la API bajo el
  mismo dominio que la SPA (p. ej. proxy `/api/*` → Render), pon
  `VITE_API_BASE_URL` vacío y `connect-src 'self'`, y CORS deja de hacer falta.
- **Costes:** Netlify (free) y Render (free) bastan para una demo. Para evitar el
  cold start de Render, su plan de pago mantiene el servicio activo.
- **Railway** en vez de Render: el procedimiento es análogo (build `npm ci`,
  start `npm run start --workspace backend`, variables `CORS_ORIGIN`,
  `API_HOST=0.0.0.0`); ajusta `connect-src` al dominio `*.up.railway.app`.
