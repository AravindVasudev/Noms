import { useState } from "react";
import { StyleSheet } from 'react-native';
import DropDownPicker from "react-native-dropdown-picker";
import { SafeAreaView } from 'react-native-safe-area-context';


export default function Settings() {
const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    { label: "USA", value: "us" },
    { label: "India", value: "in" },
    { label: "France", value: "fr" },
  ]);

  return (
    <SafeAreaView>
    <DropDownPicker
      open={open}
      value={value}
      items={items}
      setOpen={setOpen}
      setValue={setValue}
      setItems={setItems}
    />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
});
