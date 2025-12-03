# DOCUMENTACIÓN COMPLETA: API de Análisis de Huecos Documentales

## 🔴 ⚠️ CAMBIOS REQUERIDOS ⚠️ 🔴

**IMPORTANTE:** Antes de comenzar, identifica y reemplaza los siguientes valores en TODOS los ejemplos de esta documentación:

### 📝 VALORES QUE DEBES REEMPLAZAR:

1. **`[TU-APP-HEROKU]`** → Reemplazar con el nombre real de tu aplicación en Heroku
   - Ejemplo: Si tu app se llama `mi-app-vehiculos`, reemplaza `[TU-APP-HEROKU]` con `mi-app-vehiculos`
   - La URL completa será: `https://mi-app-vehiculos.herokuapp.com`
   - **Dónde aparece:** En TODOS los ejemplos de código (cURL, JavaScript, Python, etc.)

2. **`a8d858eb-70e6-4aba-b940-1473211c2380`** → Reemplazar con un `vehicle_id` real para pruebas
   - Este es solo un ejemplo. Usa un `vehicle_id` válido de tu sistema Nexcar
   - **Dónde aparece:** En todos los ejemplos de request

3. **`/ruta/al/proyecto/huecos_v3`** → Reemplazar con la ruta real donde está el proyecto
   - Ejemplo: `/Users/desarrollo/huecos_v3` o `C:\proyectos\huecos_v3`
   - **Dónde aparece:** En los comandos de terminal

4. **`tu-app-nombre`** → Reemplazar con el nombre que quieras darle a tu app en Heroku
   - Ejemplo: `mi-api-vehiculos` o `huecos-doc-api`
   - **Dónde aparece:** En los comandos de creación de app en Heroku

### 🎯 CHECKLIST DE CAMBIOS:

- [ ] Reemplazar `[TU-APP-HEROKU]` en todos los ejemplos de código
- [ ] Reemplazar `a8d858eb-70e6-4aba-b940-1473211c2380` con un vehicle_id real
- [ ] Reemplazar `/ruta/al/proyecto/huecos_v3` con tu ruta real
- [ ] Reemplazar `tu-app-nombre` con el nombre de tu app
- [ ] Verificar que el endpoint funcione después de los cambios

### 📍 UBICACIONES ESPECÍFICAS DONDE HACER CAMBIOS:

1. **Sección "Despliegue en Heroku"** - Línea ~76: `heroku create tu-app-nombre`
2. **Sección "Despliegue en Heroku"** - Línea ~79: `heroku git:remote -a tu-app-nombre`
3. **Sección "Estructura del Endpoint"** - Línea ~XXX: URL base
4. **Sección "Ejemplos de Consumo"** - TODOS los ejemplos tienen `[TU-APP-HEROKU]`
5. **Sección "Ejemplos de Consumo"** - TODOS los ejemplos tienen el vehicle_id de ejemplo

---

## 📋 TABLA DE CONTENIDOS
1. [🔴 Cambios Requeridos](#-cambios-requeridos---lee-primero-)
2. [Descripción General](#-descripción-general)
3. [Despliegue en Heroku](#-despliegue-en-heroku)
4. [Estructura del Endpoint](#-estructura-del-endpoint)
5. [Request y Response](#-request-y-response)
6. [Ejemplos de Consumo](#-ejemplos-de-consumo)
7. [Troubleshooting](#-troubleshooting)

---

## 📖 DESCRIPCIÓN GENERAL

Esta API permite analizar expedientes vehiculares y obtener un análisis completo de huecos documentales, cadena de propiedad, validaciones y más.

**Endpoint:** `POST /api/analyze-vehicle`

**Base URL:** `https://[TU-APP-HEROKU].herokuapp.com`
> 🔴 **CAMBIAR:** Reemplaza `[TU-APP-HEROKU]` con el nombre real de tu aplicación en Heroku

**Autenticación:** No requerida (usa credenciales internas)

---

## 🚀 DESPLIEGUE EN HEROKU

### PREREQUISITOS

1. Cuenta de Heroku activa
2. Heroku CLI instalado: https://devcenter.heroku.com/articles/heroku-cli
3. Git instalado y configurado
4. Node.js 22.x instalado localmente (para desarrollo)

### PASO 1: Instalar Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# Descargar desde: https://devcenter.heroku.com/articles/heroku-cli

# Verificar instalación
heroku --version
```

### PASO 2: Login en Heroku

```bash
heroku login
# Se abrirá el navegador para autenticación
```

### PASO 3: Navegar al Proyecto

```bash
# 🔴 CAMBIAR: Reemplaza esta ruta con la ruta real donde está tu proyecto
cd /ruta/al/proyecto/huecos_v3

# Ejemplo en macOS/Linux:
# cd /Users/tu-usuario/Desktop/Desarrollo/huecos_v3

# Ejemplo en Windows:
# cd C:\Users\tu-usuario\Desktop\Desarrollo\huecos_v3
```

### PASO 4: Inicializar Git (si no está inicializado)

```bash
# Verificar si ya es un repo git
git status

# Si no es un repo, inicializar:
git init
git add .
git commit -m "Initial commit"
```

### PASO 5: Crear Aplicación en Heroku

```bash
# 🔴 CAMBIAR: Reemplaza 'tu-app-nombre' con el nombre que quieras darle a tu app
# El nombre debe ser único en Heroku y solo puede contener letras, números y guiones
heroku create tu-app-nombre

# Ejemplo:
# heroku create mi-api-vehiculos-2025

# O si ya existe la app, conectar el repo:
# 🔴 CAMBIAR: Reemplaza 'tu-app-nombre' con el nombre real de tu app existente
heroku git:remote -a tu-app-nombre

# Ejemplo:
# heroku git:remote -a mi-api-vehiculos-2025
```

### PASO 6: Verificar Configuración

El proyecto ya tiene:
- ✅ `Procfile` configurado: `web: node src/server.js`
- ✅ `package.json` con script `start`
- ✅ Puerto configurado para Heroku: `process.env.PORT`

### PASO 7: Desplegar

```bash
# Agregar cambios
git add .

# Commit
git commit -m "Deploy API analyze-vehicle endpoint"

# Push a Heroku
git push heroku main

# Si tu rama principal es 'master' en lugar de 'main':
git push heroku master
```

### PASO 8: Verificar Despliegue

```bash
# Ver logs en tiempo real
heroku logs --tail

# Verificar que la app está corriendo
heroku ps

# Abrir la app en el navegador
heroku open
```

### PASO 9: Probar el Endpoint

```bash
# 🔴 CAMBIAR 1: Reemplaza [TU-APP-HEROKU] con el nombre real de tu app en Heroku
# 🔴 CAMBIAR 2: Reemplaza el vehicle_id con un ID real de tu sistema
curl -X POST https://[TU-APP-HEROKU].herokuapp.com/api/analyze-vehicle \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id": "a8d858eb-70e6-4aba-b940-1473211c2380"}'

# Ejemplo real (reemplaza con tus valores):
# curl -X POST https://mi-api-vehiculos-2025.herokuapp.com/api/analyze-vehicle \
#   -H "Content-Type: application/json" \
#   -d '{"vehicle_id": "12345678-1234-1234-1234-123456789012"}'
```

### COMANDOS ÚTILES DE HEROKU

```bash
# Ver logs
heroku logs --tail

# Ver variables de entorno
heroku config

# Reiniciar la app
heroku restart

# Ver información de la app
heroku info

# Abrir consola de Node.js
heroku run node

# Ver procesos corriendo
heroku ps
```

---

## 🔌 ESTRUCTURA DEL ENDPOINT

### URL Completa

```
POST https://[TU-APP-HEROKU].herokuapp.com/api/analyze-vehicle
```

> 🔴 **CAMBIAR:** Reemplaza `[TU-APP-HEROKU]` con el nombre real de tu aplicación en Heroku
> 
> **Ejemplo:** Si tu app se llama `mi-api-vehiculos`, la URL será:
> ```
> POST https://mi-api-vehiculos.herokuapp.com/api/analyze-vehicle
> ```

### Headers Requeridos

```
Content-Type: application/json
```

### Body (JSON)

```json
{
  "vehicle_id": "a8d858eb-70e6-4aba-b940-1473211c2380"
}
```

> 🔴 **CAMBIAR:** Reemplaza `a8d858eb-70e6-4aba-b940-1473211c2380` con un `vehicle_id` real de tu sistema

O alternativamente:

```json
{
  "internal_id": "a8d858eb-70e6-4aba-b940-1473211c2380"
}
```

> 🔴 **CAMBIAR:** Reemplaza `a8d858eb-70e6-4aba-b940-1473211c2380` con un `internal_id` real de tu sistema

**Nota:** `vehicle_id` e `internal_id` son equivalentes. Usa el que tengas disponible.

---

## 📥 REQUEST Y RESPONSE

### REQUEST EJEMPLO

```bash
POST /api/analyze-vehicle
Content-Type: application/json

{
  "vehicle_id": "a8d858eb-70e6-4aba-b940-1473211c2380"
}
```

> 🔴 **CAMBIAR:** 
> - Reemplaza la URL base con tu URL real de Heroku
> - Reemplaza el `vehicle_id` con un ID real de tu sistema

### RESPONSE EXITOSO (200)

```json
{
  "success": true,
  "vehicle_id": "a8d858eb-70e6-4aba-b940-1473211c2380",
  "vin": "1HGBH41JXMN109186",
  "totalDocuments": 8,
  "totalInvoices": 2,
  "totalReinvoices": 3,
  "totalEndorsements": 1,
  "totalTarjetasCirculacion": 2,
  "totalBajasVehiculares": 0,
  "originDocument": {
    "fileId": "file_abc123",
    "fecha": "2020-01-15",
    "rfcEmisor": "ABC123456789",
    "nombreEmisor": "Concesionario ABC S.A. de C.V.",
    "rfcReceptor": "XYZ987654321",
    "nombreReceptor": "Juan Pérez García",
    "documentType": "invoice"
  },
  "ownershipChain": [
    {
      "from": "Concesionario ABC S.A. de C.V.",
      "to": "Juan Pérez García",
      "transferDate": "2020-01-15",
      "documentId": "file_abc123",
      "documentType": "invoice"
    },
    {
      "from": "Juan Pérez García",
      "to": "María López Martínez",
      "transferDate": "2021-03-20",
      "documentId": "file_def456",
      "documentType": "reinvoice"
    }
  ],
  "sequenceAnalysis": {
    "hasGaps": false,
    "hasReturnos": false,
    "totalGaps": 0,
    "totalRetornos": 0,
    "gaps": [],
    "retornos": [],
    "isComplete": true
  },
  "propertyValidation": {
    "isValid": true,
    "issues": [],
    "ownershipChain": [
      {
        "from": "Concesionario ABC",
        "to": "Juan Pérez",
        "transferDate": "2020-01-15",
        "documentId": "file_abc123"
      }
    ],
    "missingTransfers": []
  },
  "vigenciaAnalysis": {
    "status": "valid",
    "details": {
      "tarjetasVigentes": 2,
      "tarjetasVencidas": 0,
      "ultimaVigencia": "2025-12-31"
    }
  },
  "metadata": {
    "analyzedAt": "2025-01-27T10:30:00.000Z",
    "vehicleActive": true,
    "createdAt": "2020-01-15T00:00:00.000Z"
  },
  "integrityAnalysis": {
    "isValid": true,
    "issues": []
  },
  "patternDetection": {
    "suspiciousPatterns": [],
    "riskLevel": "low"
  },
  "verificationAnalysis": {
    "totalVerifications": 4,
    "validVerifications": 4,
    "expiredVerifications": 0
  },
  "temporalAnalysis": {
    "isConsistent": true,
    "issues": []
  },
  "duplicateDetection": {
    "hasDuplicates": false,
    "duplicates": []
  },
  "tarjetasAnalysis": {
    "totalTarjetas": 2,
    "vigentes": 2,
    "vencidas": 0
  },
  "crossValidation": {
    "isValid": true,
    "issues": []
  },
  "executiveSummary": {
    "overallStatus": "complete",
    "riskLevel": "low",
    "recommendations": []
  }
}
```

### RESPONSE DE ERRORES

#### Error 400: MISSING_PARAMETER

```json
{
  "success": false,
  "error": "MISSING_PARAMETER",
  "message": "vehicle_id or internal_id required"
}
```

#### Error 404: VEHICLE_NOT_FOUND

```json
{
  "success": false,
  "error": "VEHICLE_NOT_FOUND",
  "message": "No se encontró expediente para vehicle_id: a8d858eb-70e6-4aba-b940-1473211c2380",
  "details": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "El documento no fue encontrado"
  }
}
```

#### Error 422: ANALYSIS_ERROR

```json
{
  "success": false,
  "error": "ANALYSIS_ERROR",
  "message": "Error en el análisis de secuencia",
  "details": {
    "error": "No se encontraron facturas ni endosos en el expediente"
  }
}
```

#### Error 401: AUTH_ERROR

```json
{
  "success": false,
  "error": "AUTH_ERROR",
  "message": "Error de autenticación con API Nexcar",
  "details": {
    "code": "UNAUTHORIZED",
    "message": "Token inválido, expirado o faltante"
  }
}
```

#### Error 400: EMPTY_EXPEDIENTE

```json
{
  "success": false,
  "error": "EMPTY_EXPEDIENTE",
  "message": "El expediente no contiene archivos"
}
```

#### Error 500: EXPEDIENTE_ERROR

```json
{
  "success": false,
  "error": "EXPEDIENTE_ERROR",
  "message": "Error al obtener expediente",
  "details": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Error interno del servidor Nexcar"
  }
}
```

---

## 💻 EJEMPLOS DE CONSUMO

### 1. cURL (Terminal/Command Line)

```bash
# 🔴 CAMBIAR 1: Reemplaza [TU-APP-HEROKU] con el nombre real de tu app en Heroku
# 🔴 CAMBIAR 2: Reemplaza el vehicle_id con un ID real de tu sistema
# Request básico
curl -X POST https://[TU-APP-HEROKU].herokuapp.com/api/analyze-vehicle \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id": "a8d858eb-70e6-4aba-b940-1473211c2380"}'

# Ejemplo real (reemplaza con tus valores):
# curl -X POST https://mi-api-vehiculos-2025.herokuapp.com/api/analyze-vehicle \
#   -H "Content-Type: application/json" \
#   -d '{"vehicle_id": "12345678-1234-1234-1234-123456789012"}'

# Guardar respuesta en archivo
# 🔴 CAMBIAR: Reemplaza [TU-APP-HEROKU] y el vehicle_id
curl -X POST https://[TU-APP-HEROKU].herokuapp.com/api/analyze-vehicle \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id": "a8d858eb-70e6-4aba-b940-1473211c2380}" \
  -o response.json

# Con verbose para debugging
# 🔴 CAMBIAR: Reemplaza [TU-APP-HEROKU] y el vehicle_id
curl -v -X POST https://[TU-APP-HEROKU].herokuapp.com/api/analyze-vehicle \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id": "a8d858eb-70e6-4aba-b940-1473211c2380"}'
```

### 2. JavaScript (Node.js con axios)

```javascript
const axios = require('axios');

// 🔴 CAMBIAR: Reemplaza [TU-APP-HEROKU] con el nombre real de tu app en Heroku
const API_BASE_URL = 'https://[TU-APP-HEROKU].herokuapp.com';
// Ejemplo: const API_BASE_URL = 'https://mi-api-vehiculos-2025.herokuapp.com';

async function analyzeVehicle(vehicleId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/analyze-vehicle`,
      {
        vehicle_id: vehicleId
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 segundos timeout
      }
    );

    console.log('Análisis exitoso:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      // El servidor respondió con un código de error
      console.error('Error del servidor:', error.response.data);
      console.error('Status:', error.response.status);
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      console.error('Sin respuesta del servidor:', error.request);
    } else {
      // Error al configurar la petición
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// 🔴 CAMBIAR: Reemplaza el vehicle_id con un ID real de tu sistema
// Uso
analyzeVehicle('a8d858eb-70e6-4aba-b940-1473211c2380')
  .then(data => {
    console.log('VIN:', data.vin);
    console.log('Total documentos:', data.totalDocuments);
    console.log('Cadena de propiedad:', data.ownershipChain);
  })
  .catch(error => {
    console.error('Error en análisis:', error);
  });

// Ejemplo real:
// analyzeVehicle('12345678-1234-1234-1234-123456789012')
```

### 3. JavaScript (Browser con fetch)

```javascript
// 🔴 CAMBIAR: Reemplaza [TU-APP-HEROKU] con el nombre real de tu app en Heroku
const API_BASE_URL = 'https://[TU-APP-HEROKU].herokuapp.com';
// Ejemplo: const API_BASE_URL = 'https://mi-api-vehiculos-2025.herokuapp.com';

async function analyzeVehicle(vehicleId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/analyze-vehicle`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vehicle_id: vehicleId
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${errorData.message}`);
    }

    const data = await response.json();
    console.log('Análisis exitoso:', data);
    return data;
  } catch (error) {
    console.error('Error en análisis:', error);
    throw error;
  }
}

// 🔴 CAMBIAR: Reemplaza el vehicle_id con un ID real de tu sistema
// Uso
analyzeVehicle('a8d858eb-70e6-4aba-b940-1473211c2380')
  .then(data => {
    console.log('VIN:', data.vin);
    console.log('Total documentos:', data.totalDocuments);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });

// Ejemplo real:
// analyzeVehicle('12345678-1234-1234-1234-123456789012')
```

### 4. Python (requests)

```python
import requests
import json

# 🔴 CAMBIAR: Reemplaza [TU-APP-HEROKU] con el nombre real de tu app en Heroku
API_BASE_URL = 'https://[TU-APP-HEROKU].herokuapp.com'
# Ejemplo: API_BASE_URL = 'https://mi-api-vehiculos-2025.herokuapp.com'

def analyze_vehicle(vehicle_id):
    """
    Analiza un vehículo y retorna el análisis completo
    
    Args:
        vehicle_id (str): ID del vehículo a analizar
    
    Returns:
        dict: Análisis completo del vehículo
    
    Raises:
        requests.exceptions.RequestException: Si hay error en la petición
    """
    url = f'{API_BASE_URL}/api/analyze-vehicle'
    
    payload = {
        'vehicle_id': vehicle_id
    }
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=60  # 60 segundos timeout
        )
        
        # Verificar si la respuesta es exitosa
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('success'):
            return data
        else:
            raise Exception(f"Error en análisis: {data.get('message', 'Error desconocido')}")
            
    except requests.exceptions.HTTPError as e:
        # Error HTTP (4xx, 5xx)
        if e.response.status_code == 404:
            error_data = e.response.json()
            raise Exception(f"Vehículo no encontrado: {error_data.get('message')}")
        else:
            error_data = e.response.json()
            raise Exception(f"Error HTTP {e.response.status_code}: {error_data.get('message')}")
    except requests.exceptions.RequestException as e:
        # Error de conexión, timeout, etc.
        raise Exception(f"Error de conexión: {str(e)}")

# 🔴 CAMBIAR: Reemplaza el vehicle_id con un ID real de tu sistema
# Uso
try:
    result = analyze_vehicle('a8d858eb-70e6-4aba-b940-1473211c2380')
    print(f"VIN: {result['vin']}")
    print(f"Total documentos: {result['totalDocuments']}")
    print(f"Cadena de propiedad: {json.dumps(result['ownershipChain'], indent=2)}")
except Exception as e:
    print(f"Error: {e}")

# Ejemplo real:
# result = analyze_vehicle('12345678-1234-1234-1234-123456789012')
```

### 5. Python (con manejo de errores completo)

```python
import requests
import json
from typing import Dict, Optional

# 🔴 CAMBIAR: Reemplaza [TU-APP-HEROKU] con el nombre real de tu app en Heroku
DEFAULT_BASE_URL = 'https://[TU-APP-HEROKU].herokuapp.com'
# Ejemplo: DEFAULT_BASE_URL = 'https://mi-api-vehiculos-2025.herokuapp.com'

class VehicleAnalyzer:
    def __init__(self, base_url: str = DEFAULT_BASE_URL):
        self.base_url = base_url
        self.endpoint = f"{base_url}/api/analyze-vehicle"
    
    def analyze(self, vehicle_id: str) -> Dict:
        """
        Analiza un vehículo
        
        Returns:
            Dict con el análisis completo
        """
        payload = {'vehicle_id': vehicle_id}
        headers = {'Content-Type': 'application/json'}
        
        try:
            response = requests.post(
                self.endpoint,
                json=payload,
                headers=headers,
                timeout=60
            )
            
            data = response.json()
            
            if response.status_code == 200 and data.get('success'):
                return data
            else:
                error_msg = data.get('message', 'Error desconocido')
                error_code = data.get('error', 'UNKNOWN_ERROR')
                raise Exception(f"{error_code}: {error_msg}")
                
        except requests.exceptions.Timeout:
            raise Exception("TIMEOUT: La petición tardó más de 60 segundos")
        except requests.exceptions.ConnectionError:
            raise Exception("CONNECTION_ERROR: No se pudo conectar al servidor")
        except requests.exceptions.RequestException as e:
            raise Exception(f"REQUEST_ERROR: {str(e)}")
        except json.JSONDecodeError:
            raise Exception("JSON_ERROR: Respuesta inválida del servidor")

# 🔴 CAMBIAR 1: Reemplaza [TU-APP-HEROKU] con el nombre real de tu app (o usa DEFAULT_BASE_URL)
# 🔴 CAMBIAR 2: Reemplaza el vehicle_id con un ID real de tu sistema
# Uso
analyzer = VehicleAnalyzer('https://[TU-APP-HEROKU].herokuapp.com')
# O simplemente: analyzer = VehicleAnalyzer()  # Usa DEFAULT_BASE_URL

try:
    result = analyzer.analyze('a8d858eb-70e6-4aba-b940-1473211c2380')
    print(json.dumps(result, indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")

# Ejemplo real:
# analyzer = VehicleAnalyzer()
# result = analyzer.analyze('12345678-1234-1234-1234-123456789012')
```

### 6. PHP

```php
<?php

// 🔴 CAMBIAR: Reemplaza [TU-APP-HEROKU] con el nombre real de tu app en Heroku
define('API_BASE_URL', 'https://[TU-APP-HEROKU].herokuapp.com');
// Ejemplo: define('API_BASE_URL', 'https://mi-api-vehiculos-2025.herokuapp.com');

function analyzeVehicle($vehicleId, $baseUrl = API_BASE_URL) {
    $url = $baseUrl . '/api/analyze-vehicle';
    
    $data = [
        'vehicle_id' => $vehicleId
    ];
    
    $options = [
        'http' => [
            'header' => "Content-Type: application/json\r\n",
            'method' => 'POST',
            'content' => json_encode($data),
            'timeout' => 60
        ]
    ];
    
    $context = stream_context_create($options);
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        throw new Exception('Error al conectar con el servidor');
    }
    
    $result = json_decode($response, true);
    
    if (!$result || !isset($result['success']) || !$result['success']) {
        $errorMsg = $result['message'] ?? 'Error desconocido';
        throw new Exception($errorMsg);
    }
    
    return $result;
}

// 🔴 CAMBIAR: Reemplaza el vehicle_id con un ID real de tu sistema
// Uso
try {
    $result = analyzeVehicle('a8d858eb-70e6-4aba-b940-1473211c2380');
    // O si quieres especificar la URL:
    // $result = analyzeVehicle('a8d858eb-70e6-4aba-b940-1473211c2380', 'https://[TU-APP-HEROKU].herokuapp.com');
    
    echo "VIN: " . $result['vin'] . "\n";
    echo "Total documentos: " . $result['totalDocuments'] . "\n";
    print_r($result['ownershipChain']);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
```

### 7. Java (OkHttp)

```java
import okhttp3.*;
import com.google.gson.Gson;
import java.io.IOException;

public class VehicleAnalyzer {
    // 🔴 CAMBIAR: Reemplaza [TU-APP-HEROKU] con el nombre real de tu app en Heroku
    private static final String BASE_URL = "https://[TU-APP-HEROKU].herokuapp.com";
    // Ejemplo: private static final String BASE_URL = "https://mi-api-vehiculos-2025.herokuapp.com";
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    private OkHttpClient client = new OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build();
    
    public AnalysisResult analyzeVehicle(String vehicleId) throws IOException {
        String url = BASE_URL + "/api/analyze-vehicle";
        
        Gson gson = new Gson();
        RequestBody body = RequestBody.create(
            gson.toJson(new RequestData(vehicleId)),
            JSON
        );
        
        Request request = new Request.Builder()
            .url(url)
            .post(body)
            .addHeader("Content-Type", "application/json")
            .build();
        
        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Error: " + response.code());
            }
            
            String responseBody = response.body().string();
            return gson.fromJson(responseBody, AnalysisResult.class);
        }
    }
    
    private static class RequestData {
        String vehicle_id;
        RequestData(String vehicleId) {
            this.vehicle_id = vehicleId;
        }
    }
}
```

### 8. C# (.NET)

```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

public class VehicleAnalyzer
{
    // 🔴 CAMBIAR: Reemplaza [TU-APP-HEROKU] con el nombre real de tu app en Heroku
    private const string DEFAULT_BASE_URL = "https://[TU-APP-HEROKU].herokuapp.com";
    // Ejemplo: private const string DEFAULT_BASE_URL = "https://mi-api-vehiculos-2025.herokuapp.com";
    
    private readonly string baseUrl;
    private readonly HttpClient httpClient;
    
    public VehicleAnalyzer(string baseUrl = DEFAULT_BASE_URL)
    {
        this.baseUrl = baseUrl;
        this.httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(60)
        };
    }
    
    public async Task<AnalysisResult> AnalyzeVehicleAsync(string vehicleId)
    {
        var url = $"{baseUrl}/api/analyze-vehicle";
        
        var payload = new
        {
            vehicle_id = vehicleId
        };
        
        var json = JsonConvert.SerializeObject(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        try
        {
            var response = await httpClient.PostAsync(url, content);
            var responseBody = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Error {response.StatusCode}: {responseBody}");
            }
            
            var result = JsonConvert.DeserializeObject<AnalysisResult>(responseBody);
            
            if (result == null || !result.Success)
            {
                throw new Exception($"Error en análisis: {result?.Message ?? "Error desconocido"}");
            }
            
            return result;
        }
        catch (TaskCanceledException)
        {
            throw new Exception("Timeout: La petición tardó más de 60 segundos");
        }
    }
}

// 🔴 CAMBIAR: Reemplaza el vehicle_id con un ID real de tu sistema
// Uso
var analyzer = new VehicleAnalyzer(); // Usa DEFAULT_BASE_URL
// O: var analyzer = new VehicleAnalyzer("https://[TU-APP-HEROKU].herokuapp.com");
var result = await analyzer.AnalyzeVehicleAsync("a8d858eb-70e6-4aba-b940-1473211c2380");
Console.WriteLine($"VIN: {result.Vin}");
Console.WriteLine($"Total documentos: {result.TotalDocuments}");

// Ejemplo real:
// var result = await analyzer.AnalyzeVehicleAsync("12345678-1234-1234-1234-123456789012");
```

### 9. Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
)

// 🔴 CAMBIAR: Reemplaza [TU-APP-HEROKU] con el nombre real de tu app en Heroku
const baseURL = "https://[TU-APP-HEROKU].herokuapp.com"
// Ejemplo: const baseURL = "https://mi-api-vehiculos-2025.herokuapp.com"

type RequestPayload struct {
    VehicleID string `json:"vehicle_id"`
}

type AnalysisResult struct {
    Success         bool   `json:"success"`
    VehicleID       string `json:"vehicle_id"`
    VIN             string `json:"vin"`
    TotalDocuments  int    `json:"totalDocuments"`
    // ... otros campos
}

func analyzeVehicle(vehicleID, baseURL string) (*AnalysisResult, error) {
    url := baseURL + "/api/analyze-vehicle"
    
    payload := RequestPayload{VehicleID: vehicleID}
    jsonData, err := json.Marshal(payload)
    if err != nil {
        return nil, err
    }
    
    client := &http.Client{
        Timeout: 60 * time.Second,
    }
    
    req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }
    
    req.Header.Set("Content-Type", "application/json")
    
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("error %d: %s", resp.StatusCode, string(body))
    }
    
    var result AnalysisResult
    if err := json.Unmarshal(body, &result); err != nil {
        return nil, err
    }
    
    if !result.Success {
        return nil, fmt.Errorf("error en análisis: %s", result.VIN)
    }
    
    return &result, nil
}

func main() {
    // 🔴 CAMBIAR: Reemplaza el vehicle_id con un ID real de tu sistema
    result, err := analyzeVehicle(
        "a8d858eb-70e6-4aba-b940-1473211c2380",
        baseURL, // Usa la constante baseURL definida arriba
    )
    if err != nil {
        fmt.Printf("Error: %v\n", err)
        return
    }
    
    fmt.Printf("VIN: %s\n", result.VIN)
    fmt.Printf("Total documentos: %d\n", result.TotalDocuments)
}
```

---

## 🔧 TROUBLESHOOTING

### Problema: Error 503 (Service Unavailable)

**Causa:** La app de Heroku está dormida o no está corriendo.

**Solución:**
```bash
# Verificar estado
heroku ps

# Si está dormida, despertarla con una petición
curl https://[TU-APP-HEROKU].herokuapp.com/api/health

# O reiniciar manualmente
heroku restart
```

### Problema: Error de Timeout

**Causa:** El análisis está tardando más de lo esperado.

**Solución:**
- Aumentar timeout en el cliente (60-120 segundos)
- Verificar logs de Heroku: `heroku logs --tail`
- El análisis puede tardar dependiendo del tamaño del expediente

### Problema: Error 401 (AUTH_ERROR)

**Causa:** Problemas con las credenciales de Nexcar API.

**Solución:**
- Verificar que las credenciales en `routes.js` sean correctas
- Verificar logs: `heroku logs --tail | grep AUTH`
- La autenticación se hace automáticamente, pero puede fallar si las credenciales son incorrectas

### Problema: Error 404 (VEHICLE_NOT_FOUND)

**Causa:** El vehicle_id no existe en Nexcar.

**Solución:**
- Verificar que el vehicle_id sea correcto
- Verificar que el expediente exista en Nexcar
- Usar un vehicle_id válido para pruebas

### Problema: Error 422 (ANALYSIS_ERROR)

**Causa:** El expediente no tiene los documentos necesarios para el análisis.

**Solución:**
- Verificar que el expediente tenga al menos una factura o endoso
- Revisar los detalles del error en `response.details`
- Algunos expedientes pueden no tener documentos suficientes

### Problema: La app no inicia en Heroku

**Causa:** Error en el código o configuración.

**Solución:**
```bash
# Ver logs detallados
heroku logs --tail

# Verificar que Procfile existe y es correcto
cat Procfile

# Verificar package.json
cat package.json | grep -A 5 "scripts"

# Verificar que todas las dependencias estén en package.json
```

### Problema: Variables de entorno faltantes

**Causa:** Heroku necesita configurar variables de entorno.

**Solución:**
```bash
# Ver variables actuales
heroku config

# Agregar variables si es necesario
heroku config:set NODE_ENV=production

# Reiniciar después de cambios
heroku restart
```

### Verificar que el Endpoint Funciona

```bash
# 🔴 CAMBIAR: Reemplaza [TU-APP-HEROKU] con el nombre real de tu app
# Health check
curl https://[TU-APP-HEROKU].herokuapp.com/api/health

# 🔴 CAMBIAR 1: Reemplaza [TU-APP-HEROKU] con el nombre real de tu app
# 🔴 CAMBIAR 2: Reemplaza el vehicle_id con un ID real de tu sistema
# Probar endpoint de análisis
curl -X POST https://[TU-APP-HEROKU].herokuapp.com/api/analyze-vehicle \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id": "a8d858eb-70e6-4aba-b940-1473211c2380"}'

# Ejemplo real:
# curl -X POST https://mi-api-vehiculos-2025.herokuapp.com/api/analyze-vehicle \
#   -H "Content-Type: application/json" \
#   -d '{"vehicle_id": "12345678-1234-1234-1234-123456789012"}'
```

---

## 📝 NOTAS IMPORTANTES

1. **Timeout:** El análisis puede tardar entre 5-60 segundos dependiendo del tamaño del expediente. Configura timeouts apropiados en tu cliente.

2. **Rate Limiting:** Actualmente no hay rate limiting, pero se recomienda no hacer más de 10 peticiones por segundo.

3. **Caché:** Los resultados no se cachean. Cada petición ejecuta un análisis completo.

4. **Logs:** Todos los logs están disponibles en Heroku: `heroku logs --tail`

5. **Credenciales:** Las credenciales de Nexcar están hardcodeadas en el código. No se requieren credenciales del cliente.

6. **CORS:** El endpoint tiene CORS habilitado, puede ser consumido desde cualquier origen.

7. **Formato de Fechas:** Todas las fechas están en formato ISO 8601 (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss.sssZ)

8. **Campos Opcionales:** Algunos campos en la respuesta pueden no estar presentes si no aplican (ej: `integrityAnalysis`, `patternDetection`, etc.)

---

## 📞 SOPORTE

Para problemas o preguntas:
1. Revisar logs: `heroku logs --tail`
2. Verificar estado: `heroku ps`
3. Revisar esta documentación
4. Verificar que el vehicle_id sea válido

---

---

## 📌 RESUMEN: TODOS LOS CAMBIOS REQUERIDOS

### 🔴 VALORES QUE DEBES REEMPLAZAR EN TODA LA DOCUMENTACIÓN:

| Valor a Reemplazar | Dónde Aparece | Ejemplo Real |
|-------------------|---------------|--------------|
| `[TU-APP-HEROKU]` | En TODOS los ejemplos de código (URLs) | `mi-api-vehiculos-2025` |
| `a8d858eb-70e6-4aba-b940-1473211c2380` | En TODOS los ejemplos de request (vehicle_id) | `12345678-1234-1234-1234-123456789012` |
| `/ruta/al/proyecto/huecos_v3` | En comandos de terminal (cd) | `/Users/juan/Desktop/huecos_v3` |
| `tu-app-nombre` | En comandos de Heroku (create) | `mi-api-vehiculos-2025` |

### 📍 UBICACIONES ESPECÍFICAS (Número de línea aproximado):

1. **Línea ~57** - Comando `cd`: Reemplazar ruta del proyecto
2. **Línea ~76** - Comando `heroku create`: Reemplazar `tu-app-nombre`
3. **Línea ~79** - Comando `heroku git:remote`: Reemplazar `tu-app-nombre`
4. **Línea ~110** - URL del endpoint: Reemplazar `[TU-APP-HEROKU]`
5. **Línea ~181** - Ejemplo cURL: Reemplazar `[TU-APP-HEROKU]` y `vehicle_id`
6. **Línea ~473-486** - Ejemplos cURL: Reemplazar `[TU-APP-HEROKU]` y `vehicle_id`
7. **Línea ~497** - JavaScript axios: Reemplazar `[TU-APP-HEROKU]`
8. **Línea ~530** - JavaScript axios: Reemplazar `vehicle_id`
9. **Línea ~550** - JavaScript fetch: Reemplazar `[TU-APP-HEROKU]`
10. **Línea ~580** - JavaScript fetch: Reemplazar `vehicle_id`
11. **Línea ~600** - Python requests: Reemplazar `[TU-APP-HEROKU]`
12. **Línea ~640** - Python requests: Reemplazar `vehicle_id`
13. **Línea ~660** - Python class: Reemplazar `[TU-APP-HEROKU]`
14. **Línea ~700** - Python class: Reemplazar `vehicle_id`
15. **Línea ~720** - PHP: Reemplazar `[TU-APP-HEROKU]`
16. **Línea ~750** - PHP: Reemplazar `vehicle_id`
17. **Línea ~770** - Java: Reemplazar `[TU-APP-HEROKU]`
18. **Línea ~810** - C#: Reemplazar `[TU-APP-HEROKU]`
19. **Línea ~830** - C#: Reemplazar `vehicle_id`
20. **Línea ~870** - Go: Reemplazar `[TU-APP-HEROKU]`
21. **Línea ~900** - Go: Reemplazar `vehicle_id`
22. **Línea ~1065** - Verificación: Reemplazar `[TU-APP-HEROKU]` y `vehicle_id`

### ✅ CHECKLIST FINAL ANTES DE USAR:

- [ ] He reemplazado `[TU-APP-HEROKU]` en TODOS los ejemplos con el nombre real de mi app
- [ ] He reemplazado `a8d858eb-70e6-4aba-b940-1473211c2380` con un `vehicle_id` real
- [ ] He reemplazado `/ruta/al/proyecto/huecos_v3` con mi ruta real
- [ ] He reemplazado `tu-app-nombre` con el nombre de mi app
- [ ] He probado el endpoint con un `vehicle_id` real
- [ ] He verificado que la respuesta sea correcta

### 🎯 BÚSQUEDA RÁPIDA:

Para encontrar rápidamente todos los lugares donde hacer cambios, busca en el documento:
- `[TU-APP-HEROKU]` → 22+ ocurrencias
- `a8d858eb-70e6-4aba-b940-1473211c2380` → 15+ ocurrencias
- `tu-app-nombre` → 3 ocurrencias
- `/ruta/al/proyecto/huecos_v3` → 1 ocurrencia

---

**Última actualización:** 2025-01-27
**Versión API:** 1.0.0

