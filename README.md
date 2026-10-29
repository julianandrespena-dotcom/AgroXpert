# 🌱 AgroXpert

**Plataforma web de apoyo a la gestión agrícola de Incauca**

## 🌾 1. Descripción del proyecto

AgroXpert es una aplicación web desarrollada para apoyar la gestión agrícola de Incauca mediante herramientas digitales que facilitan el acceso a información, la administración de usuarios y el control de permisos dentro de la operación agrícola.

La aplicación centraliza funcionalidades orientadas a la gestión de usuarios, la consulta de información asociada a zonas, haciendas y suertes, el registro de labores agrícolas y el acceso a herramientas de asistencia.

El sistema está construido con una arquitectura frontend/backend y utiliza Microsoft Fabric como base de datos para gestionar la información de usuarios, roles y asignaciones de acceso.

## 🎯 2. Objetivos y funcionalidades

### Objetivos

- 🌱 Facilitar el acceso a información relacionada con la operación agrícola.
- 👥 Gestionar usuarios y permisos según los roles definidos.
- 🗺️ Controlar el acceso a zonas, haciendas y suertes asignadas.
- 📋 Apoyar el registro de actividades agrícolas.
- 🤖 Incorporar herramientas de asistencia mediante inteligencia artificial.

### Funcionalidades principales

- **🔐 Autenticación:** permite el ingreso mediante el mecanismo habilitado para cada usuario.
- **👤 Gestión de usuarios:** permite administrar y consultar usuarios, roles y asignaciones.
- **🗺️ Control de acceso territorial:** relaciona usuarios con zonas, haciendas y suertes.
- **📋 Registro de labores:** módulo destinado al registro de actividades agrícolas.
- **🤖 Chatbot:** interfaz de asistencia mediante inteligencia artificial, prevista para integrarse con Microsoft Fabric Data Agents según la implementación del backend.
- **🧭 Navegación por módulos:** presenta las funcionalidades disponibles según los permisos del usuario.

### Roles de usuario

AgroXpert contempla cuatro roles principales:

- 👔 **Gerente**
- 🧑‍💼 **Director**
- 🌱 **Supervisor**
- 🚜 **Mayordomo**

Los permisos disponibles dependen del rol y de las asignaciones registradas para cada usuario.

## 🏗️ 3. Arquitectura y tecnologías utilizadas

### Arquitectura

La aplicación se divide en los siguientes componentes:

- **🖥️ Frontend:** presenta la interfaz gráfica y permite la interacción con los módulos.
- **⚙️ Backend:** procesa las solicitudes, ejecuta la lógica de negocio y expone la API.
- **🗄️ Base de datos:** almacena y permite consultar la información gestionada por la aplicación.
- **🔐 Autenticación:** gestiona la identidad y el acceso según los mecanismos configurados.

### Tecnologías

| Componente | Tecnologías y dependencias |
|---|---|
| 🖥️ Frontend | React, React DOM, Vite y CSS |
| 🔐 Autenticación del frontend | `@azure/msal-browser`, `@azure/msal-react` |
| ⚙️ Backend | Node.js y Express |
| 🗄️ Conexión con Fabric | `mssql` |
| 🔑 Identidad y autenticación del backend | `@azure/identity`, `@azure/identity-vscode` |
| 🔒 Contraseñas | `bcrypt`, `bcryptjs` |
| 🌐 Comunicación y configuración | `cors`, `cookie-parser`, `dotenv` |
| 🤖 Inteligencia artificial | Microsoft Fabric Data Agents |
| 📊 Procesamiento de Excel | `xlsx` |

### Servicios integrados

- **Microsoft Fabric:** base de datos para la gestión de usuarios, roles y asignaciones.
- **Microsoft Entra ID:** autenticación corporativa mediante los flujos configurados.
- **Microsoft Fabric Data Agents:** integración prevista para habilitar consultas y asistencia mediante inteligencia artificial sobre los datos autorizados.

## 📋 4. Requisitos previos

Antes de ejecutar AgroXpert localmente, debes disponer de:

- **Git:** para clonar el repositorio.
- **Node.js:** entorno de ejecución del frontend y backend.
- **npm:** para instalar las dependencias.
- **Acceso al repositorio:** permisos para clonar el proyecto.
- **Microsoft Fabric:** acceso autorizado al workspace y a la base de datos `AgroXpert_Usuarios`.
- **Identidad de Microsoft:** una sesión autenticada y autorizada cuando el backend utilice el proveedor de identidad de VS Code.


Comprueba las versiones instaladas desde PowerShell:

```powershell
node --version
npm --version
git --version
```

Se recomienda utilizar una versión LTS de Node.js compatible con las dependencias del proyecto.

## 📥 5. Clonar el repositorio

Clona el repositorio oficial desde PowerShell:

```powershell
git clone https://github.com/julianandrespena-dotcom/AgroXpert.git
```

Accede a la carpeta del proyecto:

```powershell
cd AgroXpert
```

Si ya tienes el repositorio clonado, entra en su directorio y selecciona la rama correspondiente al trabajo que vas a realizar.

### 📁 Estructura general del proyecto

```text
AgroXpert/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── .env
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── database/
│   │   ├── routes/
│   │   └── server.js
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md
```

Esta estructura representa los directorios principales; pueden existir archivos y carpetas adicionales según la rama del repositorio.

## 📦 6. Instalar las dependencias

El frontend y el backend tienen archivos `package.json` independientes. Por ello, las dependencias deben instalarse por separado.

### 🖥️ 6.1. Instalar dependencias del frontend

Desde la raíz del proyecto:

```powershell
cd frontend
npm install
```

Este comando instala las dependencias necesarias para ejecutar la interfaz web, incluidas React, Vite y las librerías de autenticación utilizadas.

### ⚙️ 6.2. Instalar dependencias del backend

Regresa a la raíz del proyecto y accede al backend:

```powershell
cd ..
cd backend
npm install
```

Esto instala las dependencias necesarias para el servidor, la API, la conexión con Microsoft Fabric y las integraciones configuradas.

Si las dependencias ya están instaladas, no es necesario repetir este proceso en cada ejecución, salvo que cambien los archivos de dependencias.

## 🔧 7. Configurar las variables de entorno

Los archivos `.env` contienen la configuración necesaria para ejecutar los servicios localmente. No deben publicarse con contraseñas, tokens ni claves de API.

### 🖥️ 7.1. Configuración del frontend

En el archivo `frontend/.env`, configura la URL del backend:

```dotenv
VITE_API_URL=http://localhost:3000/api
```

Esta variable indica al frontend la dirección base de la API.

La autenticación mediante Microsoft Entra ID utiliza las librerías MSAL instaladas en el proyecto. Los parámetros necesarios, como el identificador de cliente, la autoridad y la URI de redirección, deben corresponder al registro de aplicación y a las variables que realmente utilice el código.

No incluyas secretos en variables `VITE_*`, ya que pueden quedar expuestos en el navegador.

### ⚙️ 7.2. Configuración del backend

El backend utiliza `dotenv` para cargar variables de entorno.

El puerto local previsto es `3000`. Verifica que `backend/src/server.js` utilice `process.env.PORT`, porque el puerto puede estar definido directamente en el código.

Si se integra Microsoft Fabric Data Agents, configura las variables de entorno y los permisos que requiera la implementación. Utiliza únicamente los parámetros definidos en el código.

### ☁️ 7.3. Conexión con Microsoft Fabric

La conexión con Fabric se encuentra en:

```text
backend/src/database/fabric.js
```

El backend utiliza `mssql` para ejecutar consultas SQL y las librerías de identidad de Azure para obtener las credenciales necesarias para conectarse al servicio.

La configuración actual utiliza:

- **Base de datos:** `AgroXpert_Usuarios`.
- **Servidor:** servidor SQL autorizado de Microsoft Fabric.
- **Alcance del token:** `https://database.windows.net/.default`.
- **Cifrado de conexión:** habilitado.

Para ejecutar el proyecto, verifica que la cuenta utilizada por el backend esté autenticada y tenga los permisos necesarios sobre la base de datos.

### 🗄️ 7.4. Preparación de la base de datos

AgroXpert utiliza Microsoft Fabric como base de datos. La versión actual no requiere restaurar SQLite para funcionar.

La base de datos utilizada es:

`AgroXpert_Usuarios`

El esquema contempla las siguientes tablas:

| Tabla | Propósito |
|---|---|
| `Roles` | Roles disponibles en la aplicación. |
| `Usuarios` | Información y configuración de los usuarios. |
| `Zonas` | Información de las zonas agrícolas. |
| `Haciendas` | Haciendas asociadas a las zonas. |
| `Suertes` | Información de las suertes agrícolas. |
| `Usuario_Zona` | Asignaciones de usuarios a zonas. |
| `Usuario_Hacienda` | Asignaciones de usuarios a haciendas. |
| `Usuario_Suerte` | Asignaciones de usuarios a suertes. |

Para verificar la conexión, ejecuta en el editor SQL de Microsoft Fabric:

```sql
SELECT DB_NAME() AS BaseDeDatosActual;
```

El resultado esperado es:

```text
AgroXpert_Usuarios
```

Comprueba también las tablas disponibles:

```sql
SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```

No es necesario recrear las tablas si ya existen. Antes de ejecutar cambios en la base de datos, verifica los permisos y el estado actual del entorno.

## ▶️ 8. Ejecutar la aplicación localmente

Para utilizar AgroXpert, debes iniciar el backend y el frontend en terminales separadas.

### ⚙️ 8.1. Iniciar el backend

Abre una terminal de PowerShell desde la raíz del proyecto:

```powershell
cd backend
npm run dev
```

El servidor se ejecutará mediante el script de desarrollo configurado en `backend/package.json`.

La dirección local prevista es:

**http://localhost:3000**

Para verificar que el servidor responde, abre:

http://localhost:3000/

La respuesta esperada es:

```text
Backend de AgroXpert funcionando correctamente
```

Mantén la terminal abierta mientras utilizas la aplicación.

### 🖥️ 8.2. Iniciar el frontend

Abre una segunda terminal de PowerShell desde la raíz del proyecto:

```powershell
cd frontend
npm run dev
```

Vite mostrará la dirección local de la aplicación. Normalmente será:

**http://localhost:5173**

Abre esa dirección en el navegador para acceder a AgroXpert.

### 🌐 8.3. URLs locales

| Servicio | Dirección |
|---|---|
| 🖥️ Aplicación web | `http://localhost:5173` |
| ⚙️ Backend | `http://localhost:3000` |
| ✅ Verificación del backend | `http://localhost:3000/` |
| 🔌 API | `http://localhost:3000/api` |

La disponibilidad de los endpoints depende de las rutas implementadas en el backend.

**Importante:** antes de ingresar, verifica que el backend esté funcionando, que las variables de entorno estén configuradas y que exista acceso autorizado a Microsoft Fabric.

---

### 🌱 AgroXpert
*Tecnología para apoyar la gestión agrícola de Incauca.*
