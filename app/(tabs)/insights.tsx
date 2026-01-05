import { StyleSheet, Text, View } from 'react-native';


export default function TabTwoScreen() {
  return (
    <View><Text style={styles.text}>Hello World!!!</Text></View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
