import { StyleSheet, Text, View } from 'react-native';


export default function Settings() {
  return (
    <View><Text style={styles.text}>--- Settings ---</Text></View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
