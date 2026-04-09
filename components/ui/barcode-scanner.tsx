import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (barcode: string) => void;
};

const BarcodeDetector = (typeof window !== 'undefined' && 'BarcodeDetector' in window)
  ? window.BarcodeDetector as { new (options?: { formats: string[] }): { detect: (image: HTMLVideoElement | HTMLCanvasElement | ImageBitmap) => Promise<{ rawValue: string }[]> } }
  : null;

export default function BarcodeScanner({ visible, onClose, onBarcodeScanned }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const hasScannedRef = useRef(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [hasDetector, setHasDetector] = useState(!!BarcodeDetector);
  const [manualBarcode, setManualBarcode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    hasScannedRef.current = false;
  }, []);

  const startScanning = useCallback(async () => {
    if (!videoRef.current || !BarcodeDetector) return;

    const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
    const video = videoRef.current;

    const scanFrame = async () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA && !hasScannedRef.current) {
        try {
          const barcodes = await detector.detect(video);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            hasScannedRef.current = true;
            stopCamera();
            onClose();
            setTimeout(() => {
              onBarcodeScanned(barcodes[0].rawValue);
            }, 100);
            return;
          }
        } catch {
          // Detection failed for this frame, continue
        }
      }
      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [onBarcodeScanned, onClose, stopCamera]);

  const startCamera = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera API not available in this browser');
      setHasPermission(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setHasPermission(true);
        if (BarcodeDetector) {
          startScanning();
        }
      }
    } catch {
      setError('Camera access denied. Please enable camera permissions in your browser settings.');
      setHasPermission(false);
    }
  }, [startScanning]);

  useEffect(() => {
    if (visible) {
      if (BarcodeDetector) {
        startCamera();
      } else {
        setHasPermission(true);
      }
    } else {
      stopCamera();
      setManualBarcode('');
      setError(null);
    }

    return () => {
      stopCamera();
    };
  }, [visible, startCamera, stopCamera]);

  const handleManualSubmit = () => {
    const trimmed = manualBarcode.trim();
    if (trimmed) {
      onClose();
      onBarcodeScanned(trimmed);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {!BarcodeDetector || !hasDetector ? (
          <View style={styles.content}>
            <Text style={styles.title}>Scan Barcode</Text>
            <Text style={styles.subtitle}>
              Your browser doesn't support automatic barcode detection. Please enter the barcode number manually.
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Barcode Number</Text>
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                placeholder="Enter barcode number"
                style={styles.nativeInput}
                autoFocus
              />
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={handleManualSubmit}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : error ? (
          <View style={styles.content}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : !hasPermission ? (
          <View style={styles.content}>
            <Text style={styles.errorText}>Requesting camera permission...</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              style={styles.video}
            />
            <View style={styles.overlay}>
              <View style={styles.topOverlay} />
              <View style={styles.middleRow}>
                <View style={styles.sideOverlay} />
                <View style={styles.scanArea} />
                <View style={styles.sideOverlay} />
              </View>
              <View style={styles.bottomOverlay}>
                <Text style={styles.instructionText}>Point camera at a barcode</Text>
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                  <Text style={styles.closeButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  video: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  middleRow: {
    flexDirection: 'row',
    height: 250,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanArea: {
    width: 250,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  instructionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 30,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#034ea6',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nativeInput: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
});
