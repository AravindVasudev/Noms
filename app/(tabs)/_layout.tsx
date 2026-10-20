import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import React from 'react';


export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Diary</Label>
        <Icon sf="book.fill" androidSrc={<VectorIcon family={MaterialIcons} name="book" />} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="insights">
        <Icon sf="graph.2d" androidSrc={<VectorIcon family={MaterialIcons} name="insights" />} />
        <Label>Insights</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon sf="gear" androidSrc={<VectorIcon family={MaterialIcons} name="settings" />} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
