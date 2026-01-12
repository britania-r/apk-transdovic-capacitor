import { View, Text, StyleSheet } from 'react-native';
export const SettingsScreen = () => (
  <View style={styles.container}><Text>Pantalla de Configuración</Text></View>
);
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' } });