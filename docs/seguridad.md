# Seguridad

> Nivel básico pero serio, acorde a una API analítica pública de **solo lectura**.
> Para la arquitectura general, ver [arquitectura.md](./arquitectura.md).

## Modelo de amenaza

La aplicación no gestiona datos personales sensibles ni autenticación: expone
agregaciones y un detalle paginado de proyectos CDTI ya públicos. Los riesgos
relevantes son por tanto **inyección**, **abuso/DoS** y **exfiltración masiva**.
La superficie de escritura es nula: la base de datos se abre en `READ_ONLY` y la
ingesta solo corre por CLI en local.

## Backend (API Fastify)

| Control               | Implementación                                                                                                                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL parametrizado     | Toda entrada de usuario viaja en `params`; los nombres de columna están escritos a mano en [`where.ts`](../backend/src/where.ts). Cero concatenación.                                                          |
| Validación de entrada | Esquemas **zod** por endpoint ([`validation.ts`](../backend/src/validation.ts)); los valores categóricos se contrastan contra **listas blancas** cargadas al arrancar desde las vistas `dim_*`.                |
| `LIKE` seguro         | La búsqueda libre escapa `\ % _` y usa `ESCAPE '\'`.                                                                                                                                                           |
| Solo lectura          | DuckDB en `access_mode: READ_ONLY`; no existe ningún endpoint de escritura.                                                                                                                                    |
| CORS                  | Restringido al origen del frontend (`CORS_ORIGIN`), solo método `GET`.                                                                                                                                         |
| Rate limiting         | `@fastify/rate-limit`, `RATE_LIMIT_MAX`/minuto por IP (300 por defecto).                                                                                                                                       |
| Cabeceras             | `@fastify/helmet` (CSP por defecto, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, HSTS, etc.). Solo se relaja `Cross-Origin-Resource-Policy` a `cross-origin` para que la SPA pueda leer la API. |
| Errores               | Manejador central: los 5xx nunca filtran detalles internos (responden `Error interno`); los de validación devuelven 400 con el detalle del parámetro.                                                          |
| Autenticación         | Punto de extensión **desactivado** (`AUTH_ENABLED`): un hook `onRequest` listo para implementar verificación si el despliegue del CDTI lo exige.                                                               |

## Frontend (SPA estática)

Las cabeceras de seguridad de una SPA estática deben servirse como **cabeceras
HTTP del host** (un `<meta>` no puede fijar `X-Frame-Options`/`nosniff`, y un CSP
en `<meta>` rompería el HMR de Vite en desarrollo). Por eso se entregan como
artefacto de despliegue en [`frontend/public/_headers`](../frontend/public/_headers)
(formato Netlify / Cloudflare Pages, copiado a `dist/`). No afecta al servidor de
desarrollo.

CSP aplicada:

```
default-src 'self';
script-src 'self';                 # la build no genera scripts inline
style-src 'self' 'unsafe-inline';  # estilos inline de Motion
img-src 'self' data:;
font-src 'self' data:;             # fuentes empaquetadas; Vite incrusta subsets pequeños como data:
connect-src 'self';                # la API se sirve bajo el mismo origen (/api)
object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self';
upgrade-insecure-requests
```

Si la API se despliega en **otro origen**, añádelo a `connect-src`. Equivalente
para otros hosts:

```nginx
# nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## Secretos y dependencias

- Sin secretos en el código ni en el repositorio; la configuración va por entorno
  (`.env`, documentada en `.env.example`).
- Dependencias fijadas con lockfile (`package-lock.json`); auditar con `npm audit`
  antes de cada despliegue.

## Checklist de despliegue

- [ ] Servir API y SPA bajo el mismo dominio (API en `/api`) → `connect-src 'self'` y sin CORS entre orígenes.
- [ ] HTTPS con HSTS activo.
- [ ] `CORS_ORIGIN` apuntando al dominio real del frontend.
- [ ] Revisar `RATE_LIMIT_MAX` según tráfico esperado.
- [ ] `npm audit` sin vulnerabilidades altas.
- [ ] Verificar las cabeceras con las DevTools / securityheaders.com.
