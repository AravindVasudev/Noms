import React, { useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';

type Nutrition = {
  name: string;
  calories: string;
  fat: string;
  protein: string;
  carbs: string;
  fiber: string;
};

export default function HomeScreen() {
  const [nutrition, setNutrition] = useState<Nutrition>({
    name: '',
    calories: '',
    fat: '',
    protein: '',
    carbs: '',
    fiber: '',
  });
  const [diary, setDiary] = useState<Nutrition[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const addTodo = () => {
    const name = (nutrition.name || '').trim() || 'Quick Add';
    const calories = (nutrition.calories || '').trim();

    if (calories.length === 0) {
      Alert.alert('Validation', 'Calories is required');
      return;
    }
    const caloriesNum = Number(calories);
    if (!Number.isFinite(caloriesNum) || isNaN(caloriesNum)) {
      Alert.alert('Validation', 'Calories must be a valid number');
      return;
    }

    const payload: Nutrition = { ...nutrition, name, calories };
    setDiary((prev) => [...prev, payload]);
    setNutrition({ name: '', calories: '', fat: '', protein: '', carbs: '', fiber: '' });
    setModalVisible(false);
  };

  return (
    <SafeAreaProvider style={styles.safeArea}>
      <View style={styles.container}>
        {/* Diary */}
        <FlatList
          data={diary}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.todoItem}>
              <Text>{JSON.stringify(item)}</Text>
            </View>
          )}
        />

        {/* Floating + Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {/* Modal Popup */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <ScrollView
              contentContainerStyle={styles.modalContentContainer}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Todo</Text>

              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={nutrition.name}
                onChangeText={(val) => setNutrition((p) => ({ ...p, name: val }))}
              />

              <Text style={styles.fieldLabel}>Calories</Text>
              <TextInput
                style={styles.input}
                placeholder="Calories"
                value={nutrition.calories}
                onChangeText={(val) => setNutrition((p) => ({ ...p, calories: val }))}
                keyboardType="numeric"
                autoFocus
              />

              <Text style={styles.fieldLabel}>Fat (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="Fat (g)"
                value={nutrition.fat}
                onChangeText={(val) => setNutrition((p) => ({ ...p, fat: val }))}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="Protein (g)"
                value={nutrition.protein}
                onChangeText={(val) => setNutrition((p) => ({ ...p, protein: val }))}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Carbs (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="Carbs (g)"
                value={nutrition.carbs}
                onChangeText={(val) => setNutrition((p) => ({ ...p, carbs: val }))}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Fiber (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="Fiber (g)"
                value={nutrition.fiber}
                onChangeText={(val) => setNutrition((p) => ({ ...p, fiber: val }))}
                keyboardType="numeric"
              />

                <View style={styles.modalButtons}>
                  <Button title="Cancel" onPress={() => setModalVisible(false)} />
                  <Button title="Add" onPress={addTodo} />
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  todoItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  /* Floating Action Button */
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  fabText: {
    color: "#fff",
    fontSize: 32,
    lineHeight: 36,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  modalContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
