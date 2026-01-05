import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Totals = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
};

type Props = {
  totals: Totals;
  onAdd: () => void;
};

export default function Aggregates({ totals, onAdd }: Props) {
  return (
    <LinearGradient
      colors={['#e9f4ff', '#ffffff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.wrap}
    >
      <Text style={styles.title}>Aggregate</Text>
      <View style={styles.row}>
        <View style={styles.textWrap}>
          <Text style={styles.line}>
            <Text style={styles.label}>Cal: </Text>
            <Text style={styles.value}>{totals.calories} Cal</Text>
            {'   '}
            <Text style={styles.label}>P: </Text>
            <Text style={styles.value}>{totals.protein} g</Text>
          </Text>
          <Text style={styles.line}>
            <Text style={styles.label}>F: </Text>
            <Text style={styles.value}>{totals.fat} g</Text>
            {'   '}
            <Text style={styles.label}>C: </Text>
            <Text style={styles.value}>{totals.carbs} g</Text>
            {'   '}
            <Text style={styles.label}>Fi: </Text>
            <Text style={styles.value}>{totals.fiber} g</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.plus} onPress={onAdd}>
          <Text style={styles.plusText}>+</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 3,
    borderColor: '#007AFF',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    backgroundColor: 'rgba(0,122,255,0.06)',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    paddingHorizontal: 4,
  },
  textWrap: { flex: 1 },
  line: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#034ea6',
    marginBottom: 8,
  },
  label: {
    fontWeight: '700',
    color: '#034ea6',
  },
  value: {
    fontWeight: '600',
    color: '#034ea6',
  },
  plus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  plusText: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '600',
  },
});
