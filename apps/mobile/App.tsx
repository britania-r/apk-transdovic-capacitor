import './config/services';
import { View, Text, LogBox, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { MenuProvider } from 'react-native-popup-menu';
import Colors from './constants/Colors';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// ⭐ SUPRIMIR WARNINGS CONOCIDOS DE REACT NAVIGATION
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  'new NativeEventEmitter',
]);

// NOTA: Esta app está optimizada SOLO para Android
if (Platform.OS === 'ios') {
  console.warn('Esta aplicación está diseñada solo para Android');
}

// Importar todas las pantallas
import { LoginScreen } from './app/LoginScreen';
import { HomeScreen } from './app/HomeScreen';
import { RoutesScreen } from './app/RoutesScreen';
import { FarmsScreen } from './app/FarmsScreen';
import { SettingsScreen } from './app/SettingsScreen';
import { HeaderMenu } from './components/HeaderMenu';
import { UsersScreen } from './app/UsersScreen';

const PlaceholderScreen = ({ route }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Pantalla: {route.params.screenName}</Text>
  </View>
);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const colors = Colors.light;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.card },
        tabBarActiveTintColor: colors.tint,
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <HeaderMenu />
          </View>
        ),
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'alert-circle-outline';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Rutas') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'Granjas') iconName = focused ? 'storefront' : 'storefront-outline';
          else if (route.name === 'Config') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Rutas" component={RoutesScreen} />
      <Tab.Screen name="Granjas" component={FarmsScreen} />
      <Tab.Screen name="Config" component={SettingsScreen} options={{ title: 'Configuración' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { session } = useAuth();
  return (
    <Stack.Navigator>
      {session && session.user ? (
        <Stack.Group>
          <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'Usuarios' }} />
          <Stack.Screen name="Suppliers" component={PlaceholderScreen} initialParams={{ screenName: 'Proveedores' }} options={{ title: 'Proveedores' }} />
          <Stack.Screen name="Products" component={PlaceholderScreen} initialParams={{ screenName: 'Productos' }} options={{ title: 'Productos' }} />
          <Stack.Screen name="Purchases" component={PlaceholderScreen} initialParams={{ screenName: 'Compras' }} options={{ title: 'Compras' }} />
          <Stack.Screen name="PettyCash" component={PlaceholderScreen} initialParams={{ screenName: 'Caja Chica' }} options={{ title: 'Caja Chica' }} />
        </Stack.Group>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

function AppContent() {
  return (
    <NavigationContainer theme={DefaultTheme}>
      <AppNavigator />
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MenuProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </MenuProvider>
    </SafeAreaProvider>
  );
}