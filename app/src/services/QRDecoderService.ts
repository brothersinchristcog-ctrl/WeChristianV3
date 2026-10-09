import jsQR from 'jsqr';
import jpeg from 'jpeg-js';
import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system/legacy';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const UPNG = require('upng-js');

class QRDecoderService {
  /**
   * Decodes a QR code from a base64-encoded image string in pure JavaScript.
   * Supports both JPEG and PNG image formats without any Node standard library dependencies.
   */
  public decodeBase64(base64Data: string): string | null {
    if (!base64Data) return null;

    try {
      const buffer = Buffer.from(base64Data, 'base64');

      // 1. Try JPEG decoding (standard camera photo output)
      try {
        const jpegData = jpeg.decode(buffer, { useTArray: true, maxMemoryUsageInMB: 128 });
        if (jpegData && jpegData.data && jpegData.width && jpegData.height) {
          const clamped = new Uint8ClampedArray(jpegData.data);
          const code = jsQR(clamped, jpegData.width, jpegData.height, {
            inversionAttempts: 'attemptBoth',
          });
          if (code && code.data) {
            return code.data;
          }
        }
      } catch (jpegErr) {
        // Not a JPEG or JPEG decode failed, continue to PNG
      }

      // 2. Try PNG decoding using pure JS UPNG (no Node stream dependency)
      try {
        if (UPNG && typeof UPNG.decode === 'function' && typeof UPNG.toRGBA8 === 'function') {
          const pngImg = UPNG.decode(buffer);
          if (pngImg && pngImg.width && pngImg.height) {
            const rgbaFrames = UPNG.toRGBA8(pngImg);
            if (rgbaFrames && rgbaFrames.length > 0) {
              const clamped = new Uint8ClampedArray(rgbaFrames[0]);
              const code = jsQR(clamped, pngImg.width, pngImg.height, {
                inversionAttempts: 'attemptBoth',
              });
              if (code && code.data) {
                return code.data;
              }
            }
          }
        }
      } catch (pngErr) {
        // Not a PNG either
      }

      return null;
    } catch (err) {
      console.warn('[QRDecoderService] Error decoding base64 QR:', err);
      return null;
    }
  }

  /**
   * Reads a local file URI (from ImagePicker) and decodes any QR code contained inside.
   */
  public async decodeFromUri(uri: string): Promise<string | null> {
    if (!uri) return null;

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType?.Base64 || 'base64',
      });
      return this.decodeBase64(base64);
    } catch (err) {
      console.warn('[QRDecoderService] Error reading file for QR decode:', err);
      return null;
    }
  }
}

export default new QRDecoderService();
