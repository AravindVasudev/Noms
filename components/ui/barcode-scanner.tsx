import React, { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function BarcodeScanner({ visible, onClose }: Props) {
  const [hasPermission, setHasPermission] = useState(false);
  const device = useCameraDevice('back');

  useEffect(() => {
    const requestPermissions = async () => {
      const permission = await Camera.requestCameraPermission();
      setHasPermission(permission === 'granted');
      
      if (permission === 'denied') {
        Alert.alert(
          'Camera Permission',
          'Camera permission is required to scan barcodes. Please enable it in Settings.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    };

    if (visible) {
      requestPermissions();
    }
  }, [visible, onClose]);

  const codeScanner = useCodeScanner({
    codeTypes: [
      'upc-a',
      'upc-e',
    ],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && codes[0].value) {
        const barcode = codes[0].value;
        onClose();
        // Show alert after closing to avoid visual conflict
        setTimeout(() => {
          Alert.alert('Barcode Scanned', barcode);
        }, 100);
      }
    },
  });

  if (!device) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false}>
        <View style={styles.container}>
          <Text style={styles.errorText}>No camera device found</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (!hasPermission) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Requesting camera permission...</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <Camera
          style={styles.camera}
          device={device}
          isActive={visible}
          codeScanner={codeScanner}
        />
        <View style={styles.overlay}>
          <View style={styles.topOverlay} />
          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanArea} />
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay}>
            <Text style={styles.instructionText}>
              Point camera at a barcode
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
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
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});
