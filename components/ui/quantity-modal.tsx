import { DEFAULT_QUANTITY, formatQuantity, parseQuantity, truncateQuantityInput } from '@/lib/quantity';
import { useAppTheme } from '@/hooks/use-app-theme';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Props = {
  visible: boolean;
  itemName?: string;
  initialValue?: string;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
};

// Note: parents conditionally render this modal (only when an item is pending)
// and pass a `key` per item, so `useState(initialValue)` freshly resets to
// "1.0" on every open with no reset effect needed.
export default function QuantityModal({ visible, itemName, initialValue = DEFAULT_QUANTITY.toFixed(1), onConfirm, onCancel }: Props) {
  const { colors } = useAppTheme();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    const truncated = truncateQuantityInput(value);
    if (truncated !== value) setValue(truncated);
    const parsed = parseQuantity(truncated);
    if (parsed == null) {
      setError('Enter quantity as X.X (e.g. 1.0, 2.5)');
      return;
    }
    onConfirm(parsed);
  };

  const handleBlur = () => {
    const truncated = truncateQuantityInput(value);
    if (truncated !== value) setValue(truncated);
    if (parseQuantity(truncated) != null) setError(null);
  };

  const parsedPreview = parseQuantity(truncateQuantityInput(value));
  const confirmLabel = parsedPreview != null ? `Add ${formatQuantity(parsedPreview)} ×` : 'Add';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.title, { color: colors.systemBlue }]}>Quantity</Text>
          {!!itemName && <Text style={[styles.subtitle, { color: colors.label }]} numberOfLines={2}>{itemName}</Text>}
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.label }]}
            value={value}
            onChangeText={(v) => {
              setValue(v);
              setError(null);
            }}
            keyboardType="decimal-pad"
            placeholder="1.0"
            placeholderTextColor={colors.secondaryLabel}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
            onBlur={handleBlur}
          />
          {!!error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}
          <Text style={[styles.hint, { color: colors.secondaryLabel }]}>One decimal place (e.g. 1.0, 3.0, 0.5)</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.inputBackground }]} onPress={onCancel}>
              <Text style={[styles.cancelText, { color: colors.label }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.systemBlue }]} onPress={handleConfirm}>
              <Text style={[styles.confirmText, { color: colors.onAccent }]}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  input: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 18,
    textAlign: 'center',
  },
  error: {
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  cancelText: {
    fontWeight: '600',
    fontSize: 16,
  },
  confirmText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
