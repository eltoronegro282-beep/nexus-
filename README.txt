NEXUS — Asistente personal para PC
===================================

CONTENIDO
- public/index.html: estructura de la aplicación
- public/styles.css: diseño futurista
- public/app.js: chat, dictado por voz, voz sintetizada, tareas y recordatorios
- netlify/functions/chat.mjs: función de servidor que llama a OpenAI
- netlify.toml: configuración de Netlify

ANTES DE PUBLICAR
1. Una persona adulta responsable debe gestionar la cuenta/API y cualquier configuración de facturación necesaria.
2. La API de OpenAI puede tener costos separados de ChatGPT. Revisen los precios y límites antes de habilitarla.
3. No compartas la clave API en chats, capturas ni archivos públicos. No la pongas en app.js ni index.html.
4. La clave se agrega solo en Netlify como variable de entorno OPENAI_API_KEY.

PUBLICAR EN NETLIFY (RECOMENDADO: conectar Git)
1. Descomprime NEXUS.zip.
2. Crea un repositorio privado en GitHub y sube el contenido de la carpeta NEXUS.
3. Entra en https://app.netlify.com/ y elige Add new project / Import an existing project.
4. Conecta el repositorio.
5. Configura:
   Build command: (vacío)
   Publish directory: public
   Functions directory: netlify/functions
6. Antes de probar el chat, ve a Project configuration > Environment variables.
7. Crea OPENAI_API_KEY con la clave que gestione la persona adulta responsable. No la pegues en el código.
8. El modelo predeterminado es gpt-6-luna. Solo cambia OPENAI_MODEL si la cuenta tiene acceso a otro modelo compatible con Responses API.
9. Guarda y vuelve a desplegar el sitio para que la función tome las variables.
10. Abre la URL de Netlify. Prueba primero tareas y después el chat.

IMPORTANTE SOBRE DEPLOY MANUAL
Un simple arrastrar y soltar de la carpeta estática puede publicar la página, pero no es el flujo más fiable para desplegar también la función de servidor. Para este proyecto usa la conexión con Git o Netlify CLI, y verifica que la función chat esté desplegada. Los archivos públicos están en public/ y la función de servidor en netlify/functions/, fuera del directorio publicado.

VOZ
- El dictado usa Web Speech API y depende del navegador; Chrome/Edge suelen ofrecer mejor compatibilidad.
- La voz hablada usa la síntesis de voz del navegador. La selección de una voz masculina depende de las voces instaladas; no todos los equipos ofrecen una voz masculina en español.
- Para el micrófono, concede permiso al navegador. En producción, usa HTTPS (Netlify lo proporciona).

ALCANCE DE ESTA VERSIÓN
- Las tareas y recordatorios se guardan en localStorage de ese navegador/dispositivo.
- Los recordatorios avisan mientras la página está abierta; no son notificaciones push ni funcionan si el navegador está cerrado.
- La aplicación no tiene cuentas de usuario ni sincronización entre dispositivos.
- La función de IA no incluye autenticación de usuarios ni límites de uso por persona. No publiques la URL ampliamente sin añadir controles adicionales, porque terceros podrían consumir la cuota de API.

SOLUCIÓN DE PROBLEMAS
- Si aparece “Falta configurar OPENAI_API_KEY”: revisa la variable en Netlify y vuelve a desplegar.
- Si el chat devuelve error del servicio: revisa la clave, permisos, saldo/límites de API y el modelo configurado.
- Si no funciona el micrófono: abre el sitio con HTTPS, habilita el permiso y prueba Chrome o Edge.
