# NutriCoach AI — Nutrición, calorías y entrenamiento con IA

App web (Next.js) lista para desplegar en Vercel con base de datos Postgres gratuita en Neon.
Funciona como app instalable en iOS y Android (PWA) sin pasar por App Store / Play Store.

## Qué incluye

- Login con correo y contraseña — tus datos quedan ligados a tu cuenta, no al navegador. Puedes entrar desde cualquier dispositivo.
- Onboarding que calcula TMB, TDEE, calorías y macros (Mifflin-St Jeor)
- Escaneo de comida con IA real (Claude Haiku vía API, corre en el servidor — tu API key nunca se expone)
- Dashboard con anillo de calorías, macros y agua
- Entrenamiento por grupo muscular
- Progreso de peso, IMC y gráfica
- Todo se guarda en Postgres (Neon), no en el navegador — tus datos persisten entre dispositivos y sesiones

---

## Paso 1 — Crear la base de datos en Neon (gratis)

1. Ve a https://neon.tech y crea una cuenta gratis (con GitHub o correo).
2. Crea un proyecto nuevo (cualquier nombre, por ejemplo "nutricoach").
3. En el dashboard del proyecto, busca **Connection string** y cópiala completa. Se ve así:
   `postgresql://usuario:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Abre el **SQL Editor** de Neon (menú lateral) y pega todo el contenido del archivo `schema.sql` de este proyecto. Ejecútalo una vez. Esto crea las tablas necesarias, incluyendo `users` para el login.
   - **Si ya tenías una base de datos de una versión anterior de esta app (sin login)**: en vez de `schema.sql`, ejecuta `migration_auth.sql`. Ese archivo agrega la tabla `users` y conecta los perfiles con las cuentas, sin borrar lo que ya tienes (a menos que ya hayas creado perfiles de prueba, en cuyo caso el propio archivo te explica qué hacer).

## Paso 2 — Conseguir tu API key GRATIS de Gemini

1. Ve a https://aistudio.google.com/apikey
2. Entra con tu cuenta de Google y clic en **Create API key**. No pide tarjeta de crédito.
3. Copia la key generada.
4. Esto es 100% gratis con un límite generoso (~1,500 fotos analizadas por día). Si algún día lo superas, la API simplemente te avisa que esperes un minuto — no te cobra nada.

## Paso 3 — Subir el código a GitHub

1. Crea un repositorio nuevo en https://github.com/new (puede ser privado).
2. Desde la carpeta del proyecto en tu computadora:
   ```bash
   cd nutricoach-ai
   git init
   git add .
   git commit -m "NutriCoach AI"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   git push -u origin main
   ```
   (Si no tienes `git` instalado o prefieres no usar terminal, en GitHub también puedes arrastrar los archivos directamente desde la interfaz web con "Add file → Upload files".)

## Paso 4 — Desplegar en Vercel (gratis)

1. Ve a https://vercel.com y entra con tu cuenta de GitHub.
2. Clic en **Add New → Project**, elige el repositorio que acabas de subir.
3. Antes de darle a "Deploy", abre la sección **Environment Variables** y agrega:
   | Nombre | Valor |
   |---|---|
   | `DATABASE_URL` | la cadena de conexión de Neon del Paso 1 |
   | `GEMINI_API_KEY` | tu API key gratis de Gemini del Paso 2 |
   | `SESSION_SECRET` | cualquier texto largo y aleatorio (por ejemplo, generado con `openssl rand -hex 32` en tu terminal) |
4. Clic en **Deploy**. En 1-2 minutos tendrás una URL pública tipo `https://nutricoach-ai.vercel.app`.

Listo — tu app ya está en línea, con base de datos real y análisis de fotos con IA funcionando.

## Paso 5 — Instalarla como app en el celular

- **iPhone (Safari)**: abre la URL → botón compartir (cuadrado con flecha) → "Agregar a inicio".
- **Android (Chrome)**: abre la URL → menú (⋮) → "Instalar app" o "Agregar a pantalla de inicio".

Quedará con ícono propio y pantalla completa, como una app nativa.

---

## Desarrollo local (opcional, para hacer cambios antes de subir)

```bash
npm install
cp .env.example .env.local   # y pega ahí tus mismas variables (DATABASE_URL, GEMINI_API_KEY)
npm run dev
```
Abre http://localhost:3000

Cada vez que hagas cambios y quieras publicarlos, solo necesitas:
```bash
git add .
git commit -m "cambios"
git push
```
Vercel vuelve a desplegar automáticamente en cada push a `main`.

## Notas importantes

- **Sesión de usuario**: ya tienes login real con correo y contraseña, ligado a tu base de datos — no depende del navegador. Si quieres además "Entrar con Google" u otros métodos, se puede agregar más adelante.
- **Costo**: con Neon, Vercel y Gemini en sus planes gratuitos, este proyecto puede correr sin gastar un peso mientras el uso sea personal o de bajo volumen. Si más adelante creces mucho y superas el límite gratuito de Gemini (~1,500 fotos/día), puedes activar facturación en Google o volver a cambiar a otro proveedor.
- **Privacidad**: en el nivel gratuito de Gemini, Google puede usar las imágenes/respuestas para mejorar sus modelos. Para un proyecto personal normalmente no es un problema, pero tenlo presente.
- **Íconos de la app**: el archivo `public/manifest.json` referencia `icon-192.png` e `icon-512.png`. Agrega tus propios íconos en `public/` con esos nombres para que se vean bien al instalarla; sin ellos, igual funciona pero con un ícono genérico.
