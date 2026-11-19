# NutriCoach AI — Nutrición, calorías y entrenamiento con IA

App web (Next.js) lista para desplegar en Vercel con base de datos Postgres gratuita en Neon.
Funciona como app instalable en iOS y Android (PWA) sin pasar por App Store / Play Store.

## Qué incluye

- Login con correo y contraseña — tus datos quedan ligados a tu cuenta, no al navegador. Puedes entrar desde cualquier dispositivo.
- **Tu día se reinicia cuando TÚ te levantas, no a medianoche**: en el onboarding (o en Ajustes) dices a qué hora te levantas, y las calorías/agua/entrenamiento del día siguen contando hasta esa hora del día siguiente.
- **Entrenamiento guiado**: botón "Iniciar entrenamiento" que te lleva ejercicio por ejercicio, con diagrama visual del movimiento, pasos de cómo hacerlo, errores comunes, contador de series y temporizador de descanso automático.
- Pantalla de **Ajustes** para editar tu perfil, objetivo y hora de despertar después del onboarding.
- **Racha real** de días consecutivos con actividad registrada (ya no es un número fijo).
- Onboarding que calcula TMB, TDEE, calorías y macros (Mifflin-St Jeor)
- Escaneo de comida con IA real (Gemini, corre en el servidor — tu API key nunca se expone), con reintento automático a un modelo de respaldo si el principal tarda o falla
- Campo para escribir alimentos que la foto no captó bien, y opción de agregar un alimento manualmente después del análisis
- Consejo del "coach IA" en el dashboard, que usa la hora real del día para recomendar comer algo o tomar agua
- Escaneo de cuerpo: foto de cuerpo completo con estimación aproximada de altura y peso (referencia, no reemplaza báscula/cinta métrica)
- **Calendario/historial**: toca cualquier día pasado y ve exactamente qué registraste
- Dashboard con anillo de calorías, macros y agua, con la fecha de hoy real
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
   - **Si ya tenías login pero no el reinicio del día por hora de despertar**: ejecuta también `migration_daycycle.sql`. Agrega la hora de despertar al perfil y las columnas necesarias para agrupar tus registros por "tu día" en vez del calendario UTC del servidor.

## Paso 2 — Configurar la API de Gemini

1. Ve a https://aistudio.google.com/apikey
2. Entra con tu cuenta de Google y crea una clave en el proyecto que usará la aplicación.
3. Copia la key generada.
4. Consulta los modelos y límites de ese proyecto en [Google AI Studio](https://aistudio.google.com/). La facturación de la API se configura por proyecto, independientemente de la suscripción de Google AI. Si quieres un modelo distinto de Flash, configura su identificador en `GEMINI_MODEL`.

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
   | `GEMINI_API_KEY` | tu clave de API de Gemini del Paso 2 |
   | `SESSION_SECRET` | cualquier texto largo y aleatorio (por ejemplo, generado con `openssl rand -hex 32` en tu terminal) |
4. Clic en **Deploy**. Usa el dominio que Vercel indica en el proyecto.

Listo — tu app ya está en línea, con base de datos real y análisis de fotos con IA funcionando.

## Paso 5 — Instalarla como app en el celular

Pulsa **Instalar app** debajo del inicio de sesión o en la barra superior del panel.

- **Android (Chrome)**: si aparece el aviso, confirma **Instalar**. También puedes abrir el menú **⋮**, elegir **Instalar aplicación** o **Instalar y crear acceso directo**, y seleccionar **Instalar**.
- **iPhone (Safari)**: toca **Compartir**, elige **Agregar a pantalla de inicio**, activa **Abrir como app web** si aparece y toca **Agregar**.

Abre NutriCoach desde su ícono. La app se abre en su propia ventana y usa internet para acceder a la cuenta, los registros y Gemini.

---

## Desarrollo local (opcional, para hacer cambios antes de subir)

```bash
npm install
cp .env.example .env.local   # y pega ahí tus mismas variables (DATABASE_URL, SESSION_SECRET, GEMINI_API_KEY)
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
- **Costo**: revisa los límites y precios vigentes de Neon, Vercel y la API de Gemini. El costo de IA depende del modelo elegido y del uso de tu proyecto.
- **Privacidad**: en el nivel gratuito de Gemini, Google puede usar las imágenes/respuestas para mejorar sus modelos. Para un proyecto personal normalmente no es un problema, pero tenlo presente.
- **Íconos de la app**: el archivo `public/manifest.json` referencia `icon-192.png` e `icon-512.png`. Puedes reemplazar los íconos en `public/` manteniendo esos nombres.

## Comunidad

La pestaña **Comunidad** usa la sesión de NutriCoach y pide crear un perfil social. La búsqueda muestra solamente el nombre, el usuario y la biografía. El chat y las publicaciones se comparten con amistades aceptadas. El bloqueo retira el acceso a ambos, y los reportes se registran en la base de datos y ocultan la publicación para quien reporta.

El código social vive en `components/community`, `lib/community` y `app/api/community`. Los adjuntos se sirven desde una ruta autenticada y se guardan en Neon. El editor muestra una vista previa y admite hasta cuatro fotos JPG, PNG o WebP, o un MP4, con un máximo de 3 MB por publicación. Cada usuario puede guardar hasta 200 publicaciones propias y 24 MB de adjuntos. El muro incluye comentarios, me gusta y guardados. Buscar encuentra personas y publicaciones visibles. Mensajes muestra conversaciones y mensajes sin leer.

Vercel aplica `migrations/community.sql` y `migrations/community-engagement.sql` antes de compilar en producción. Son migraciones aditivas e idempotentes. Para una base local o de pruebas, configura `DATABASE_URL` y ejecuta `npm run migrate:community` después de crear las tablas base.
