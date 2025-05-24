
---

# README: Frontend - Trazabilidad de Dispositivos

Guía para levantar y probar el frontend de trazabilidad (`trazabilidad-frontend-heroui`) basado en Next.js, conectado al backend en `http://localhost:3000/trazabilidad`. Este proyecto ofrece una interfaz para registrar, listar, editar y consultar el historial de dispositivos almacenados en Hyperledger Fabric.

---

## **Requisitos**
- **Sistema**: Linux (Ubuntu).  
- **Instalado**:  
  - Node.js/npm: `sudo apt install nodejs npm`  
  - Backend: Corriendo en `/home/deivi/TESIS/backend/trazabilidad-backend` (ver README del backend).  
- **Rutas**:  
  - Proyecto: `/home/deivi/TESIS/frontend/trazabilidad-frontend-heroui`

---

## **Paso 1: Configurar el Proyecto**

1. **Ir al directorio**:
   ```bash
   cd /home/deivi/TESIS/frontend/trazabilidad-frontend-heroui
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar `.env.local`**:
   ```bash
   echo "NEXT_PUBLIC_BACKEND_URL_DEV=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL_PROD=https://trazabilidad-backend-nestjs.onrender.com
NEXT_PUBLIC_IS_PROD=false" > .env.local
   ```
   - Usa `http://localhost:3000` para desarrollo local.

---

## **Paso 2: Levantar el Frontend**

1. **Iniciar el servidor**:
   ```bash
   npm run dev
   ```
   - Corre en `http://localhost:3001`. Abre el navegador en esa URL.

2. **Verificar Backend**:
   - Asegúrate de que el backend esté corriendo:
     ```bash
     cd /home/deivi/TESIS/backend/trazabilidad-backend
     npm run start:dev
     ```

---

## **Paso 3: Probar la Interfaz**

1. **Lista de Dispositivos**:
   - Al cargar `http://localhost:3001`, la tabla muestra los dispositivos registrados (ej. `cell001`, `cell002`) desde `/trazabilidad/listar`.

2. **Registrar Dispositivo**:
   - Rellena el formulario:
     ```
     ID: cell003
     Modelo: Teléfono móvil
     Marca: Genérica
     Característica: 369 kg
     Origen: Hong Kong
     ```
   - Clic en "Registrar". El dispositivo aparece en la tabla.

3. **Editar Dispositivo**:
   - En la tabla, clic en "Editar" para `cell003`.
   - Cambia "Característica" a "Aeropuerto Viru-Viru" y guarda.

4. **Consultar Historial**:
   - Ingresa `cell003` en "Consultar Historial" y clic en el botón. Muestra el historial en la tabla inferior.

5. **Consultar por Rango**:
   - Ingresa fechas (ej. `2025-03-17T00:00:00.000Z` y `2025-03-18T00:00:00.000Z`).  
   - **Nota**: No funciona aún (falta `consultarPorRangoDeTiempo` en el chaincode).

---

## **Estructura del Proyecto**
- **`app/page.tsx`**: Página principal con formularios, tablas y modal de edición.
- **`.env.local`**: Variables de entorno para la URL del backend.

---

## **Notas**
- **CORS**: El backend debe permitir `http://localhost:3001` (configurado en `.env` del backend con `CORS_ORIGIN_3`).
- **JSON**: El backend debe devolver JSON puro (ajustado en `FabricService` con `JSON.parse`).
- **Dependencias**: Usa `@heroui/*` para componentes UI y `axios` para peticiones HTTP.

---

## **Soluciones a Problemas Comunes**
1. **Error de CORS**:
   - Verifica `.env` del backend:
     ```
     CORS_ORIGIN_3=http://localhost:3001
     ```
   - Usa `@nestjs/config` en `app.module.ts` para cargar el `.env`:
     ```typescript
     import { ConfigModule } from '@nestjs/config';
     @Module({
       imports: [ConfigModule.forRoot({ envFilePath: '.env' }), TrazabilidadModule],
     })
     export class AppModule {}
     ```

2. **Tabla vacía**:
   - Asegúrate de que `FabricService` parsea JSON:
     ```typescript
     async query(functionName: string, ...args: string[]): Promise<any> {
       const result = await contract.evaluateTransaction(functionName, ...args);
       return JSON.parse(Buffer.from(result).toString('utf8'));
     }
     ```

---
