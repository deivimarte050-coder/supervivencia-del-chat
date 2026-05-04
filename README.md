# 🎮 Supervivencia del Chat — TikTok Live Game

Juego interactivo para TikTok Live. Los usuarios entran comentando **ENTRO**, los regalos eliminan jugadores, y el último sobreviviente gana.

---

## 🚀 Instalación Rápida

### 1. Instalar dependencias

```bash
# En la carpeta raíz del proyecto
npm install

# En la carpeta client
cd client
npm install
cd ..
```

### 2. Construir el cliente

```bash
cd client
npm run build
cd ..
```

### 3. Iniciar el servidor

```bash
npm start
```

Abre **http://localhost:3001** en el navegador.

---

## 🛠 Desarrollo (hot reload)

Abre **dos terminales**:

**Terminal 1 — Servidor:**
```bash
npm run dev
```

**Terminal 2 — Cliente (hot reload):**
```bash
cd client
npm run dev
```

Cliente en http://localhost:5173 | Servidor en http://localhost:3001

---

## 📡 Conectar a TikTok Live

1. Abre la app en el navegador
2. Haz click en **⚙️** (esquina superior derecha) para abrir el Panel Admin
3. Escribe el **@usuario de TikTok** que está en vivo
4. Haz click en **"🔗 Conectar"**

> ⚠️ La cuenta de TikTok debe estar en **LIVE** para que funcione la conexión.
> Si la conexión falla, usa el **Modo Demo** para probar.

---

## 🎭 Modo Demo

Para probar sin TikTok Live:
1. Abre el Panel Admin (⚙️)
2. Click en **"🎭 Iniciar Demo"**
3. Se añadirán 15 jugadores automáticamente con regalos simulados

---

## 🎥 Configuración OBS (Overlay)

1. En OBS, añade una fuente → **Navegador (Browser Source)**
2. URL: `http://localhost:3001`
3. Ancho: **400** | Alto: **900**
4. Marca "Controlar audio a través de OBS" si quieres
5. Fondo transparente: marca **"Página transparente"**

---

## 🎮 Reglas del Juego

| Evento | Efecto |
|--------|--------|
| Comentario "ENTRO" | Jugador entra al juego |
| Regalo pequeño (1-99💎) | Elimina 1 jugador |
| Regalo mediano (100-499💎) | Elimina 2 jugadores |
| Regalo grande (500+💎) | Elimina 3-5 jugadores |
| Regalo 500+💎 al donante | +1 vida extra |
| Jugador eliminado + regalo | Revive al jugador |

### 🛡 Protecciones (Top Donadores)
- 🥇 Top 1: **Inmunidad total** — no puede ser eliminado
- 🥈 Top 2: **50% menos** probabilidad de ser eliminado  
- 🥉 Top 3: **Bonus leve** de protección

### 🌪 Eventos Caos (automáticos cada ~1-2 min)
- ⚡ Doble Eliminación — elimina 2 al azar
- 💥 Eliminación Masiva — elimina 4 al azar
- ⏰ Reducción de Tiempo — quita 2 min al reloj
- 🔴 Zona de Peligro — elimina 3 al azar

---

## ⚙️ Panel Admin

| Acción | Descripción |
|--------|-------------|
| Conectar TikTok | Conecta al live de un usuario |
| Iniciar Demo | Simula 15 jugadores + regalos |
| Reiniciar Ronda | Borra todos los jugadores y reinicia |
| Forzar Caos | Activa un evento caos inmediatamente |
| Añadir Jugador | Añade jugador manualmente |
| Eliminar Jugador | Elimina jugador manualmente |
| Simular Regalo | Simula un regalo con diamantes |

---

## 📁 Estructura del Proyecto

```
supervivencia-del-chat/
├── server.js          # Servidor Express + Socket.io
├── gameManager.js     # Lógica del juego
├── package.json
└── client/
    ├── src/
    │   ├── App.jsx            # Componente principal
    │   ├── App.css            # Estilos globales
    │   └── components/
    │       ├── TopBar.jsx       # Barra superior (donador, tiempo, jugadores)
    │       ├── PlayerList.jsx   # Lista de jugadores + eliminados
    │       ├── BottomSection.jsx # "ENTRO" prompt + última eliminación
    │       ├── GiftPanel.jsx    # Panel de regalos
    │       ├── ChatFeed.jsx     # Feed de comentarios
    │       ├── AdminPanel.jsx   # Panel de administración
    │       └── WinnerScreen.jsx # Pantalla de ganador
    └── package.json
```

---

## 🔧 Variables de Entorno (Opcional)

Crea un archivo `.env` en la raíz:

```env
PORT=3001
```
