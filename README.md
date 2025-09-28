# Nova Class Calendar

Sistema de generación automática de horarios para gimnasio Nova con rotación inteligente de coaches.

## 🚀 Características

- **Gestión de Coaches**: Agregar, editar y eliminar coaches con sus especialidades (Power/Cycling)
- **Restricciones**: Configurar restricciones por coach (días, horarios específicos)
- **Generación Automática**: Algoritmo inteligente que garantiza rotación equitativa
- **Drag & Drop**: Modificaciones manuales mediante arrastrar y soltar
- **Historial**: Tracking de últimas 6 semanas para optimizar rotación
- **Validaciones**: Máximo 2 clases por día por coach, no dos Power simultáneas

## 🛠️ Tecnologías

### Backend

- Node.js + Express
- SQLite (base de datos local)
- Algoritmo de rotación personalizado

### Frontend

- React 18
- Tailwind CSS
- @dnd-kit (drag & drop)
- Axios (comunicación API)

## 📦 Instalación

### Prerrequisitos

- Node.js 16+
- npm

### Instalación Rápida

```bash
# Clonar el repositorio
git clone <your-repo>
cd class-calendar

# Instalar todas las dependencias (root, backend y frontend)
npm run install-all
```

### Instalación Manual

```bash
# Instalar dependencias del proyecto principal
npm install

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

## 🚀 Ejecutar el Proyecto

### Setup Rápido con Datos de Demo

```bash
# 1. Instalar dependencias
npm run install-all

# 2. Iniciar backend (en una terminal)
npm run server

# 3. Configurar datos de demo (en otra terminal)
npm run setup-demo

# 4. Iniciar frontend (en otra terminal)
npm run client
```

### Desarrollo (Ambos servidores)

```bash
# Desde la raíz del proyecto
npm run dev
```

Esto ejecutará:

- Backend en `http://localhost:3001`
- Frontend en `http://localhost:3000`

### Ejecución Individual

#### Solo Backend

```bash
npm run server
# o
cd backend && npm start
```

#### Solo Frontend

```bash
npm run client
# o
cd frontend && npm start
```

## 📋 Uso del Sistema

### 1. Gestión de Coaches

1. Ve a la pestaña "Coaches"
2. Agrega coaches con sus especialidades:
   - **Power**: Para clases Nova Power
   - **Cycling**: Para clases Nova Cycling
   - **Ambas**: Coaches que dan ambos tipos
3. Configura restricciones si es necesario:
   - **Día**: No disponible ciertos días
   - **Horario**: No disponible en horarios específicos

### 2. Configuración Semanal

1. Ve a la pestaña "Configuración"
2. Selecciona la semana deseada
3. Agrega horarios disponibles:
   - **Día de la semana**
   - **Horario** (formato 24h)
   - **Tipo**: Ambas, solo Power, o solo Cycling
4. Guarda los cambios
5. Haz clic en "Generar Horario"

### 3. Modificaciones Manuales

1. Ve a la pestaña "Calendario"
2. Arrastra y suelta las clases para reorganizar
3. Los cambios se guardan automáticamente

## 🔧 API Endpoints

### Coaches

- `GET /api/coaches` - Obtener todos los coaches
- `POST /api/coaches` - Crear nuevo coach
- `PUT /api/coaches/:id` - Actualizar coach
- `DELETE /api/coaches/:id` - Eliminar coach

### Restricciones

- `GET /api/coaches/:id/restrictions` - Obtener restricciones
- `POST /api/coaches/:id/restrictions` - Agregar restricción
- `DELETE /api/restrictions/:id` - Eliminar restricción

### Horarios

- `GET /api/schedules/:weekStart` - Obtener horarios disponibles
- `POST /api/schedules/:weekStart` - Configurar horarios
- `POST /api/generate/:weekStart` - Generar horario automático
- `GET /api/generated/:weekStart` - Obtener horario generado
- `PUT /api/generated/:weekStart` - Actualizar horario generado

### Utilidades

- `GET /api/current-week` - Obtener lunes de semana actual
- `GET /api/history` - Obtener historial de asignaciones
- `GET /api/health` - Health check

## 📊 Base de Datos

El sistema usa SQLite con las siguientes tablas:

- `coaches` - Información de coaches y especialidades
- `coach_restrictions` - Restricciones por coach
- `available_schedules` - Horarios disponibles por semana
- `schedule_assignments` - Historial de asignaciones
- `weekly_configs` - Configuraciones y horarios generados

## 🔍 Algoritmo de Rotación

El sistema implementa un algoritmo inteligente que:

1. **Analiza el historial** de las últimas 6 semanas
2. **Calcula scores de rotación** por coach/horario/tipo
3. **Aplica restricciones** configuradas
4. **Balancea la carga** (máx 2 clases/día por coach)
5. **Garantiza variedad** para los miembros del gym

## 🐛 Solución de Problemas

### Backend no inicia

```bash
cd backend
npm install
node server.js
```

### Frontend no inicia

```bash
cd frontend
npm install
npm start
```

### Base de datos corrupta

Elimina el archivo `backend/nova_calendar.db` y reinicia el backend.

### Errores de CORS

Verifica que el proxy en `frontend/package.json` apunte a `http://localhost:3001`

## 📝 Desarrollo

### Estructura del Proyecto

```
class-calendar/
├── backend/
│   ├── server.js           # Servidor principal
│   ├── database.js         # Gestión de base de datos
│   ├── scheduleGenerator.js # Algoritmo de generación
│   └── nova_calendar.db    # Base de datos SQLite
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── hooks/          # Hooks personalizados
│   │   ├── services/       # API y servicios
│   │   └── App.js          # Componente principal
│   └── public/
└── package.json           # Scripts principales
```

### Próximas Mejoras

- [ ] Exportar horarios a PDF
- [ ] Notificaciones por email
- [ ] Modo oscuro
- [ ] Analytics de coaches más activos
- [ ] Integración con calendario externo

## 📧 Soporte

Para reportar bugs o sugerir mejoras, crea un issue en el repositorio.

---

Desarrollado con ❤️ para optimizar los horarios de Nova Gym
