# 🏡 Sistema de Lotes de Terreno — Vercel + MySQL

Sistema web completo para gestión de ventas de lotes de terreno: registro de clientes, control de compras, seguimiento de pagos con generación de PDF, PQRS y panel de administración.

---

## 🛠 Stack

| Capa        | Tecnología                                         |
|-------------|-----------------------------------------------------|
| Frontend    | HTML5, CSS3, JavaScript Vanilla                     |
| Backend     | Node.js (Vercel Serverless Functions)               |
| Base datos  | MySQL (PlanetScale / Railway / Aiven / Clever Cloud)|
| Auth        | JWT (jsonwebtoken)                                  |
| PDF         | PDFKit                                              |
| Email       | Nodemailer + Gmail                                  |

---

## 📁 Estructura

```
/
├── api/                    ← Funciones serverless (backend)
│   ├── auth/               ← register, login, profile, forgot/reset-password
│   ├── lots/               ← CRUD lotes + stats + status
│   ├── purchases/          ← Compras (index, my, all, account, [id])
│   ├── payments/           ← Pagos + comprobante PDF
│   ├── pqrs/               ← Peticiones, Quejas, Reclamos, Sugerencias
│   ├── users/              ← Gestión de usuarios (admin)
│   ├── stages/             ← Etapas del proyecto
│   └── health.js           ← Verificación de conexión DB
├── lib/                    ← Utilidades compartidas
│   ├── db.js               ← Conexión MySQL para serverless
│   ├── auth.js             ← JWT helpers + wrapper de funciones
│   ├── email.js            ← Nodemailer (Gmail)
│   └── pdf.js              ← Generador de comprobantes PDF
├── public/                 ← Frontend estático
│   ├── index.html
│   ├── css/style.css
│   ├── js/api.js
│   └── pages/              ← login, register, dashboard, admin, etc.
├── database/
│   ├── schema.sql          ← Esquema completo con triggers y datos iniciales
│   └── initDB.js           ← Script de inicialización (ejecutar una vez)
├── vercel.json             ← Configuración de rutas y headers
└── package.json
```

---

## 🚀 Despliegue paso a paso

### Paso 1 — Base de datos MySQL en la nube

Elige **una** de estas opciones gratuitas:

| Servicio             | Gratis           | Enlace                             |
|----------------------|------------------|------------------------------------|
| **PlanetScale**      | 5 GB, sin límite | https://planetscale.com            |
| **Clever Cloud**     | 256 MB MySQL     | https://clever-cloud.com           |
| **Railway**          | $5/mes crédito   | https://railway.app                |
| **Aiven**            | 1 servicio free  | https://aiven.io                   |
| **Freesqldatabase**  | 5 MB free        | https://www.freesqldatabase.com    |

> **Recomendación**: PlanetScale o Clever Cloud para producción.

### Paso 2 — Subir a GitHub

```bash
git init
git add .
git commit -m "feat: sistema lotes vercel"
git remote add origin https://github.com/TU_USUARIO/lotes-sistema.git
git push -u origin main
```

### Paso 3 — Crear proyecto en Vercel

1. Ir a [vercel.com](https://vercel.com) → **New Project**
2. Importar el repositorio de GitHub
3. **Framework Preset**: `Other`
4. Hacer clic en **Deploy**

### Paso 4 — Configurar variables de entorno en Vercel

En Vercel → Settings → **Environment Variables**, agregar:

| Variable       | Valor                                              |
|----------------|----------------------------------------------------|
| `DATABASE_URL` | `mysql://user:pass@host:3306/dbname` (o variables separadas) |
| `JWT_SECRET`   | Clave aleatoria de mínimo 32 caracteres            |
| `JWT_EXPIRES_IN` | `24h`                                            |
| `EMAIL_USER`   | tu_correo@gmail.com                               |
| `EMAIL_PASS`   | Contraseña de aplicación de Gmail (16 chars)      |
| `FRONTEND_URL` | `https://tu-proyecto.vercel.app`                  |
| `NODE_ENV`     | `production`                                      |

> Si tu proveedor de DB entrega variables separadas, usa:
> `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`

### Paso 5 — Inicializar la base de datos

Solo se ejecuta **una vez**. Desde tu máquina local con las variables configuradas en `.env.local`:

```bash
node database/initDB.js
```

O desde la consola de Vercel (Functions → Terminal si está disponible).

---

## 💻 Desarrollo local

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo de entorno local
cp .env.local.example .env.local
# Editar .env.local con tus datos de DB local

# 3. Inicializar DB local
node database/initDB.js

# 4. Iniciar servidor de desarrollo
npm run dev
# → http://localhost:3000
```

---

## 🔑 Credenciales por defecto

| Campo    | Valor                     |
|----------|---------------------------|
| Email    | admin@lotesystem.com      |
| Password | Admin123!                 |
| Rol      | Administrador             |

> ⚠️ **Cambiar la contraseña del admin inmediatamente en producción.**

---

## 📬 Configurar Gmail (Email)

1. Activar **Verificación en 2 pasos** en tu cuenta Google
2. Ir a: Cuenta Google → Seguridad → **Contraseñas de aplicaciones**
3. Crear contraseña para "Correo" → copiar los 16 caracteres
4. Usar esos 16 caracteres como valor de `EMAIL_PASS`

---

## 🌐 Endpoints API

```
GET  /api/health                   Verificar estado DB

POST /api/auth/register            Registrar usuario
POST /api/auth/login               Iniciar sesión
GET  /api/auth/profile             Ver perfil
PUT  /api/auth/profile             Actualizar perfil
POST /api/auth/forgot-password     Solicitar reset
POST /api/auth/reset-password      Resetear contraseña

GET  /api/lots                     Listar lotes (público)
POST /api/lots                     Crear lote (admin)
GET  /api/lots/stats               Estadísticas (admin)
GET  /api/lots/:id                 Detalle lote
PUT  /api/lots/:id                 Actualizar lote (admin)
DELETE /api/lots/:id               Eliminar lote (admin)
PATCH /api/lots/:id/status         Cambiar estado (admin)

POST /api/purchases                Comprar lote
GET  /api/purchases/my             Mis compras
GET  /api/purchases/all            Todas (admin)
GET  /api/purchases/account        Estado de cuenta
GET  /api/purchases/:id            Detalle compra

POST /api/payments                 Registrar pago
GET  /api/payments/my              Mis pagos
GET  /api/payments/all             Todos (admin)
GET  /api/payments/:id/receipt     Descargar PDF

POST /api/pqrs                     Crear PQRS
GET  /api/pqrs/my                  Mis PQRS
GET  /api/pqrs/all                 Todas (admin)
GET  /api/pqrs/stats               Estadísticas (admin)
GET  /api/pqrs/:id                 Detalle PQRS
PUT  /api/pqrs/:id                 Gestionar PQRS (admin)

GET  /api/users                    Listar usuarios (admin)
POST /api/users                    Crear usuario (admin)
GET  /api/users/dashboard          Stats dashboard (admin)
GET  /api/users/:id                Detalle usuario (admin)
PUT  /api/users/:id                Actualizar usuario (admin)
PATCH /api/users/:id/toggle        Activar/desactivar (admin)

GET  /api/stages                   Listar etapas (público)
POST /api/stages                   Crear etapa (admin)
PUT  /api/stages/:id               Actualizar etapa (admin)
```
