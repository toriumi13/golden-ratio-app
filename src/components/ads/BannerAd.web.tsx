import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const AdBanner = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Web AdSense Placeholder</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 50, // Standard banner height
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
  },
  text: {
    color: '#666',
    fontSize: 12,
  },
});
