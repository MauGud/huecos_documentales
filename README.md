# 🚗 Analizador de Secuencia de Propiedad Vehicular

Sistema completo de análisis de cadena de propiedad vehicular basado en RFCs y facturas. Este proyecto analiza expedientes vehiculares obtenidos de la API Nexcar para detectar huecos en la secuencia de propiedad.

## 📋 Características

- ✅ **Autenticación automática** con la API Nexcar
- 🔍 **Análisis inteligente** de secuencia de propiedad
- 🚨 **Detección de huecos** en la cadena de transferencias
- 📊 **Interfaz web moderna** y responsive
- 🔗 **API REST completa** para integración
- 📄 **Visualización detallada** de la cadena de propiedad

## 🏗️ Arquitectura del Sistema

```
vehicle-chain-analyzer/
├── src/
│   ├── api/
│   │   ├── nexcarClient.js      # Cliente para API Nexcar
│   │   ├── sequenceAnalyzer.js  # Motor de análisis de secuencia
│   │   └── routes.js            # Rutas de la API
│   └── server.js                # Servidor Express principal
├── public/
│   ├── index.html               # Interfaz web
│   ├── app.js                   # Lógica del frontend
│   └── styles.css               # Estilos modernos
├── package.json
└── README.md
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 14+ 
- npm o yarn
- Credenciales de acceso a la API Nexcar

### Pasos de Instalación

1. **Clonar/Descargar el proyecto**
   ```bash
   cd huecos_v3
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar el servidor**
   ```bash
   # Modo producción
   npm start
   
   # Modo desarrollo (con auto-reload)
   npm run dev
   ```

4. **Acceder a la aplicación**
   ```
   http://localhost:3000
   ```

## 🔧 Uso del Sistema

### Interfaz Web

1. **Abrir** `http://localhost:3000` en tu navegador
2. **Ingresar credenciales** de Nexcar (email y contraseña)
3. **Proporcionar VIN** del vehículo a analizar
4. **Hacer clic** en "Analizar Secuencia"
5. **Revisar resultados** de la cadena de propiedad

### API REST

#### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

#### 2. Autenticación
```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-email@nexcar.mx",
    "password": "tu-password"
  }'
```

#### 3. Análisis de Secuencia (Principal)
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-email@nexcar.mx",
    "password": "tu-password",
    "vin": "3GCPY9EH8LG352317"
  }'
```

#### 4. Obtener Expediente Completo
```bash
curl http://localhost:3000/api/expediente/3GCPY9EH8LG352317
```

## 🧠 Lógica de Análisis

### Algoritmo de Detección de Huecos

1. **Filtrado Inicial**
   - Solo documentos con `document_type: "invoice"`
   - Validación de datos OCR presentes

2. **Validación de VIN**
   - Verificación de consistencia entre documentos
   - Campos verificados: `vin` o `niv_vin_numero_serie`

3. **Identificación de Origen**
   - Búsqueda de factura con `usado_nuevo: "NUEVO"`
   - Esta es la primera transferencia (concesionaria → primer dueño)

4. **Construcción de Cadena**
   - Inicio con factura de origen (posición 1)
   - RFC receptor de N debe ser RFC emisor de N+1
   - Continuación hasta agotar coincidencias

5. **Detección de Huecos**
   - Si RFC receptor de N ≠ RFC emisor de N+1 = **HUECO**
   - Facturas no conectadas = **HUÉRFANAS**
   - Reporte detallado de todos los huecos

### Tipos de Huecos Detectados

- **Huecos de Secuencia**: RFC receptor no coincide con siguiente emisor
- **Facturas Huérfanas**: Documentos sin conexión con la secuencia principal
- **VIN Inconsistente**: Diferentes VINs en el mismo expediente

## 📊 Estructura de Respuesta

```json
{
  "success": true,
  "vin": "3GCPY9EH8LG352317",
  "totalInvoices": 5,
  "originInvoice": {
    "fileId": "...",
    "fecha": "25/06/2020",
    "rfcEmisor": "COA030402N59",
    "nombreEmisor": "Car One Americana",
    "rfcReceptor": "LFC1106205B4",
    "nombreReceptor": "Lumo Financiera Del Centro"
  },
  "ownershipChain": [
    {
      "position": 1,
      "type": "origin",
      "fecha": "25/06/2020",
      "rfcEmisor": "COA030402N59",
      "nombreEmisor": "Car One Americana",
      "rfcReceptor": "LFC1106205B4",
      "nombreReceptor": "Lumo Financiera Del Centro",
      "vehiculo": {
        "marca": "CHEVROLET",
        "modelo": "SILVERADO DOBLE",
        "ano": "2020",
        "vin": "3GCPY9EH8LG352317"
      }
    }
  ],
  "sequenceAnalysis": {
    "hasGaps": false,
    "totalGaps": 0,
    "gaps": [],
    "isComplete": true
  },
  "metadata": {
    "analyzedAt": "2025-10-18T...",
    "vehicleActive": true,
    "createdAt": "2025-09-26T..."
  }
}
```

## 🔒 Seguridad

- **Autenticación**: Credenciales enviadas en cada request
- **Token Management**: Renovación automática de tokens JWT
- **CORS**: Configurado para desarrollo local
- **Validación**: Validación de entrada en todos los endpoints

## 🐛 Manejo de Errores

### Códigos de Respuesta
- `200`: Éxito
- `400`: Datos de entrada inválidos
- `401`: Error de autenticación
- `404`: Recurso no encontrado
- `422`: Error en el análisis
- `500`: Error interno del servidor

### Ejemplo de Error
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "El recurso solicitado no fue encontrado",
    "details": {...}
  }
}
```

## 🧪 Testing

### VIN de Prueba
```
VIN: 3GCPY9EH8LG352317
```

Este expediente contiene:
- ✅ 1 factura de origen (`usado_nuevo: "NUEVO"`)
- 📄 Múltiples pólizas de seguro
- 💰 Pagos de tenencia
- 🔍 Verificaciones vehiculares

## 🔧 Troubleshooting

### Problemas Comunes

**Error: "Cannot find module 'express'"**
```bash
npm install express axios cors
```

**Error: "Port 3000 already in use"**
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill

# Windows
netstat -ano | findstr :3000
```

**Error: "CORS error"**
- Verificar que `cors()` esté configurado en `server.js`

**Error: "Token inválido"**
- Verificar credenciales de Nexcar API

**Error: "No se encontró factura de origen"**
- Verificar que exista una factura con `usado_nuevo: "NUEVO"`

## 📈 Próximas Mejoras

- [ ] **Análisis de otros documentos**: Endosos, refacturas, cambios de propietario
- [ ] **Persistencia de datos**: Base de datos para históricos
- [ ] **Autenticación mejorada**: JWT en frontend, refresh automático
- [ ] **Exportación de reportes**: PDF, Excel, JSON descargable
- [ ] **Notificaciones**: Alertas por email cuando se detecten huecos
- [ ] **Dashboard**: Múltiples vehículos simultáneos
- [ ] **Validaciones adicionales**: Fechas cronológicas, montos coherentes

## 📞 Soporte

Para reportar issues o solicitar mejoras:

1. ✅ Verificar que todos los archivos estén en su lugar
2. 📋 Revisar logs del servidor en la consola
3. 🔑 Verificar credenciales de Nexcar API
4. 🔍 Comprobar formato de respuesta de Nexcar

## 📄 Documentación API Nexcar

**Base URL**: `https://nexcar-api-770231222dff.herokuapp.com`

### Endpoints
- `POST /auth/token` - Autenticación
- `GET /expediente/{VIN}` - Obtener expediente

### Errores
- `400`: VALIDATION_ERROR - Entrada inválida
- `401`: JWT_INVALID | JWT_EXPIRED | AUTHORIZATION_HEADER_MISSING
- `404`: RESOURCE_NOT_FOUND - Expediente no encontrado
- `500`: INTERNAL_SERVER_ERROR - Error del servidor

---

**Desarrollado con ❤️ para análisis de propiedad vehicular**


