# Nova Class Calendar - Next.js

Sistema de generación automática de horarios para gimnasio Nova con rotación inteligente de coaches.

## 🚀 Stack Tecnológico

- **Next.js 15** - Framework React con App Router
- **TypeScript** - Type safety
- **MongoDB Atlas** - Base de datos en la nube (free tier)
- **Tailwind CSS** - Estilos
- **@dnd-kit** - Drag & drop
- **Vercel** - Deployment (free)

## 📋 Prerequisitos

- Node.js 20+ (usa `nvm use 20`)
- Cuenta en MongoDB Atlas (gratis)

## 🛠️ Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar MongoDB Atlas

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea una cuenta gratuita
3. Crea un cluster (free tier M0)
4. En "Database Access", crea un usuario con password
5. En "Network Access", agrega tu IP (o 0.0.0.0/0 para desarrollo)
6. Click en "Connect" > "Drivers" para obtener tu connection string

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nova_calendar?retryWrites=true&w=majority
```

Reemplaza `username`, `password`, y `cluster` con tus credenciales.

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🚀 Deployment a Vercel

### Deploy automático:

1. Push tu código a GitHub
2. Ve a [Vercel](https://vercel.com)
3. Importa tu repositorio
4. Agrega la variable de entorno `MONGODB_URI` en Settings > Environment Variables
5. Deploy!

Vercel te dará una URL gratis: `https://tu-app.vercel.app`

### Deploy manual:

```bash
npm install -g vercel
vercel
```

## 📁 Estructura del Proyecto

```
class-calendar/
├── app/
│   ├── api/              # API Routes (backend)
│   ├── layout.tsx        # Layout principal
│   ├── page.tsx          # Página principal
│   └── globals.css       # Estilos globales
├── components/           # Componentes React
├── hooks/               # Custom hooks
├── lib/
│   ├── db/              # Operaciones de base de datos
│   ├── mongodb.ts       # Conexión MongoDB
│   ├── scheduleGenerator.ts  # Algoritmo de generación
│   ├── api-client.ts    # Cliente API frontend
│   └── utils.ts         # Utilidades
└── .env.local          # Variables de entorno (no commiteado)
```

## 🔧 API Endpoints

Todos los endpoints están en `/api`:

- `GET/POST /api/coaches` - Gestión de coaches
- `GET/PUT/DELETE /api/coaches/[id]` - Coach individual
- `GET/POST/DELETE /api/coaches/[id]/restrictions` - Restricciones
- `GET/POST /api/schedules/[weekStart]` - Horarios disponibles
- `POST /api/generate/[weekStart]` - Generar horario automático
- `GET/PUT /api/generated/[weekStart]` - Horario generado
- `GET /api/history` - Historial de asignaciones
- `GET /api/current-week` - Semana actual
- `GET /api/health` - Health check

## 🎯 Uso

1. **Coaches**: Agrega coaches con sus especialidades (Power/Cycling)
2. **Configuración**: Define horarios disponibles para la semana
3. **Generar**: Click en "Generar Horario" para asignación automática
4. **Calendario**: Visualiza y ajusta manualmente con drag & drop

## 🔥 Características

- ✅ Rotación inteligente basada en historial (últimas 6 semanas)
- ✅ Restricciones por coach (días, horarios)
- ✅ Máximo 2 clases por día por coach
- ✅ Drag & drop para ajustes manuales
- ✅ Sin backend separado (todo en Next.js)
- ✅ Deploy gratis a Vercel
- ✅ Base de datos gratis en MongoDB Atlas

## 🐛 Troubleshooting

### Error de conexión a MongoDB

- Verifica que tu IP esté en la whitelist de MongoDB Atlas
- Confirma que el MONGODB_URI es correcto
- Revisa que el usuario tenga permisos de lectura/escritura

### Errores de TypeScript

```bash
npm run build
```

Esto mostrará cualquier error de tipos.

### Limpiar cache

```bash
rm -rf .next
npm run dev
```

## 📝 Notas de Desarrollo

- Usa `'use client'` en componentes que usan hooks o estado
- Las API routes son Server Components por defecto
- MongoDB queries son async, siempre usa `await`
- Next.js hace caching agresivo, usa `revalidate` si necesitas

## 🌟 Mejoras Futuras

- [ ] Exportar a PDF
- [ ] Notificaciones por email
- [ ] Modo oscuro
- [ ] Analytics de coaches
- [ ] Autenticación (si se necesita multi-usuario)

---

¿Preguntas? Revisa la [documentación de Next.js](https://nextjs.org/docs)
