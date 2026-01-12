// File: apps/mobile/components/HeaderMenu.tsx
import { View, Text, StyleSheet, useColorScheme, Alert } from 'react-native';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Colors from '../constants/Colors';

// Opciones del menú que no están en el TabBar
const menuOptions = [
  { name: 'Usuarios', icon: 'people-outline', screen: 'Users' },
  { name: 'Proveedores', icon: 'person-outline', screen: 'Suppliers' },
  { name: 'Productos', icon: 'cube-outline', screen: 'Products' },
  { name: 'Compras', icon: 'cart-outline', screen: 'Purchases' },
  { name: 'Caja Chica', icon: 'wallet-outline', screen: 'PettyCash' },
];

export const HeaderMenu = () => {
  const navigation = useNavigation<any>();
  const { signOut } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleSignOut = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", onPress: () => signOut() }
    ]);
  };

  return (
    <Menu>
      <MenuTrigger style={{ paddingHorizontal: 15 }}>
        <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
      </MenuTrigger>
      <MenuOptions
        customStyles={{
          optionsContainer: {
            backgroundColor: colors.card,
            borderRadius: 8,
            marginTop: 40,
          },
        }}
      >
        {menuOptions.map((option) => (
          <MenuOption key={option.name} onSelect={() => navigation.navigate(option.screen)}>
            <View style={styles.option}>
              <Ionicons name={option.icon as any} size={22} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>{option.name}</Text>
            </View>
          </MenuOption>
        ))}
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <MenuOption onSelect={handleSignOut}>
          <View style={styles.option}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text style={[styles.optionText, { color: '#ef4444' }]}>Cerrar Sesión</Text>
          </View>
        </MenuOption>
      </MenuOptions>
    </Menu>
  );
};

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionText: {
    marginLeft: 16,
    fontSize: 16,
  },
  separator: {
    height: 1,
    marginHorizontal: 10,
  },
});