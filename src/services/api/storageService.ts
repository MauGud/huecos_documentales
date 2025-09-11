// Servicio para manejo de archivos y storage

export interface FileUploadResult {
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class StorageService {
  private maxFileSize = 10 * 1024 * 1024; // 10MB
  private allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf'
  ];

  /**
   * Valida un archivo antes de subirlo
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Verificar tamaño
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `El archivo es demasiado grande. Máximo ${this.maxFileSize / (1024 * 1024)}MB`
      };
    }

    // Verificar tipo MIME
    if (!this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no permitido. Solo se aceptan JPG, PNG y PDF'
      };
    }

    return { valid: true };
  }

  /**
   * Procesa un archivo real y crea URLs locales
   */
  async uploadFile(
    file: File, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileUploadResult> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Crear URL local para el archivo
        const fileUrl = URL.createObjectURL(file);
        
        // Crear thumbnail si es una imagen
        let thumbnailUrl: string | undefined;
        if (file.type.startsWith('image/')) {
          try {
            thumbnailUrl = await this.createThumbnail(file);
          } catch (error) {
            console.warn('No se pudo crear thumbnail:', error);
          }
        }

        // Simular progreso de procesamiento
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 30;
          if (progress > 100) progress = 100;

          if (onProgress) {
            onProgress({
              loaded: (progress / 100) * file.size,
              total: file.size,
              percentage: progress
            });
          }

          if (progress >= 100) {
            clearInterval(interval);
            
            const result: FileUploadResult = {
              url: fileUrl,
              fileName: file.name,
              size: file.size,
              mimeType: file.type,
              thumbnailUrl: thumbnailUrl
            };

            console.log('📄 Archivo procesado:', result);
            resolve(result);
          }
        }, 50);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Genera un ID único para el archivo
   */
  private generateFileId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Crea una miniatura de una imagen
   */
  async createThumbnail(file: File, maxWidth: number = 200): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('El archivo no es una imagen'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailUrl);
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Obtiene la URL de un archivo desde su ID
   */
  getFileUrl(fileId: string): string {
    return `https://storage.example.com/files/${fileId}`;
  }

  /**
   * Obtiene la URL de una miniatura desde su ID
   */
  getThumbnailUrl(fileId: string): string {
    return `https://storage.example.com/thumbnails/${fileId}`;
  }

  /**
   * Elimina un archivo del storage
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // En producción, hacer petición DELETE al servidor
      console.log(`Eliminando archivo: ${fileId}`);
      return true;
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      return false;
    }
  }

  /**
   * Obtiene información de un archivo
   */
  async getFileInfo(fileId: string): Promise<FileUploadResult | null> {
    try {
      // En producción, hacer petición GET al servidor
      return {
        url: this.getFileUrl(fileId),
        fileName: `archivo_${fileId}`,
        size: 0,
        mimeType: 'application/octet-stream'
      };
    } catch (error) {
      console.error('Error al obtener información del archivo:', error);
      return null;
    }
  }

  /**
   * Convierte un archivo a base64
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Descarga un archivo
   */
  downloadFile(url: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Obtiene el tamaño de archivo en formato legible
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Obtiene la extensión de un archivo
   */
  getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Verifica si un archivo es una imagen
   */
  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Verifica si un archivo es un PDF
   */
  isPDF(file: File): boolean {
    return file.type === 'application/pdf';
  }
}

export const storageService = new StorageService();
export default storageService;
