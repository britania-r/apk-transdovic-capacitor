// File: apps/mobile/app/HomeScreen.tsx
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Colors from '../constants/Colors';

export const HomeScreen = () => {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>¡Bienvenido!</Text>
      <Text style={[styles.email, { color: colors.text }]}>{user?.email}</Text>
      
      <Pressable
        onPress={signOut}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: '#ef4444' }, // Color rojo para cerrar sesión
          pressed && { opacity: 0.8 }
        ]}
      >
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
    marginVertical: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});