import { useDiary } from '@/app/diary-context';
import { useRouter } from 'expo-router';
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
  const router = useRouter();
  const { diary } = useDiary();

  return (
    <SafeAreaProvider style={styles.safeArea}>
      <View style={styles.container}>
        {/* Diary */}
        <FlatList
          data={diary}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => {
            const name = item.name?.trim() || 'Quick Add';
            const calories = item.calories?.trim() || '-';
            const fat = item.fat?.trim() || '-';
            const carbs = item.carbs?.trim() || '-';
            const protein = item.protein?.trim() || '-';
            const fiber = item.fiber?.trim() || '-';

            return (
              <View style={styles.todoItem}>
                <Text style={styles.diaryName}>{name}</Text>
                <Text style={styles.diaryCalories}>{calories} Cal</Text>
                <Text style={styles.diaryDetails}>
                  (F: {fat}  C: {carbs}  P: {protein}  Fi: {fiber})
                </Text>
              </View>
            );
          }}
        />

        {/* Floating + Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/add')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
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
  diaryName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  diaryCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  diaryDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
