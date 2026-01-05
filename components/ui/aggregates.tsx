import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
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
  const [goals, setGoals] = useState({
    calories: '',
    protein: '',
    fiber: '',
    fat: '',
    carbs: '',
  });

  useEffect(() => {
    const loadGoals = async () => {
      const calories = await AsyncStorage.getItem('goal-calories') || '';
      const protein = await AsyncStorage.getItem('goal-protein') || '';
      const fiber = await AsyncStorage.getItem('goal-fiber') || '';
      const fat = await AsyncStorage.getItem('goal-fat') || '';
      const carbs = await AsyncStorage.getItem('goal-carbs') || '';
      setGoals({ calories, protein, fiber, fat, carbs });
    };
    loadGoals();
  }, []);

  const renderValue = (value: number, goal: string, unit: string) => {
    const goalNum = parseFloat(goal);
    if (goal && !isNaN(goalNum) && goalNum > 0) {
      return `${value}/${goalNum} ${unit}`;
    }
    return `${value} ${unit}`;
  };

  const getValueStyle = (type: keyof Totals, value: number, goal: string) => {
    const goalNum = parseFloat(goal);
    if (!goal || isNaN(goalNum) || goalNum <= 0) return null;
    if (type === 'calories' || type === 'fat' || type === 'carbs') {
      return value > goalNum ? styles.red : null;
    } else if (type === 'protein' || type === 'fiber') {
      return styles.green;
    }
    return null;
  };

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
            <Text style={[styles.value, getValueStyle('calories', totals.calories, goals.calories)]}>{renderValue(totals.calories, goals.calories, 'Cal')}</Text>
            {'   '}
            <Text style={styles.label}>P: </Text>
            <Text style={[styles.value, getValueStyle('protein', totals.protein, goals.protein)]}>{renderValue(totals.protein, goals.protein, 'g')}</Text>
          </Text>
          <Text style={styles.line}>
            <Text style={styles.label}>F: </Text>
            <Text style={[styles.value, getValueStyle('fat', totals.fat, goals.fat)]}>{renderValue(totals.fat, goals.fat, 'g')}</Text>
            {'   '}
            <Text style={styles.label}>C: </Text>
            <Text style={[styles.value, getValueStyle('carbs', totals.carbs, goals.carbs)]}>{renderValue(totals.carbs, goals.carbs, 'g')}</Text>
            {'   '}
            <Text style={styles.label}>Fi: </Text>
            <Text style={[styles.value, getValueStyle('fiber', totals.fiber, goals.fiber)]}>{renderValue(totals.fiber, goals.fiber, 'g')}</Text>
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
  red: {
    color: '#ff3b30',
  },
  green: {
    color: '#34c759',
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
