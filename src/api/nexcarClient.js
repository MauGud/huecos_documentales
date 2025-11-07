const axios = require('axios');

class NexcarClient {
  constructor() {
    this.baseURL = 'https://nexcar-api-770231222dff.herokuapp.com';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Autenticación con API Nexcar
   * POST /auth/token
   */
  async authenticate(email, password) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/token`, {
        email: email,
        password: password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ''
        }
      });

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
        
        return {
          success: true,
          data: response.data,
          message: 'Autenticación exitosa'
        };
      }
      
      // Si no hay access_token en la respuesta
      return {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'No se recibió access_token en la respuesta',
          details: response.data
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Verifica si el token actual es válido
   * Considera token válido si faltan más de 5 minutos para expirar
   */
  isTokenValid() {
    if (!this.accessToken || !this.tokenExpiry) return false;
    return Date.now() < (this.tokenExpiry - 300000); // 5 minutos de margen
  }

  /**
   * Obtiene el tiempo restante del token en segundos
   */
  getTokenTimeRemaining() {
    if (!this.tokenExpiry) return 0;
    return Math.max(0, Math.floor((this.tokenExpiry - Date.now()) / 1000));
  }

  /**
   * Obtener expediente completo por Vehicle ID
   * GET /expediente/{vehicleId}
   */
  async getExpediente(vehicleId) {
    try {
      if (!this.isTokenValid()) {
        throw new Error('Token inválido o expirado. Re-autentique primero.');
      }

      const response = await axios.get(`${this.baseURL}/expediente/${vehicleId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Manejo de errores según documentación Nexcar
   */
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Entrada inválida proporcionada',
              details: data
            }
          };
        
        case 401:
          return {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Token inválido, expirado o faltante',
              details: data
            }
          };
        
        case 404:
          return {
            success: false,
            error: {
              code: 'RESOURCE_NOT_FOUND',
              message: 'El documento no fue encontrado',
              details: data
            }
          };
        
        case 500:
          return {
            success: false,
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Error interno del servidor Nexcar',
              details: data
            }
          };
        
        default:
          return {
            success: false,
            error: {
              code: 'UNKNOWN_ERROR',
              message: `Error HTTP ${status}`,
              details: data
            }
          };
      }
    }
    
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message
      }
    };
  }
}

module.exports = NexcarClient;