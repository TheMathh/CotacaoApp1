import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import TelaCotacoes from './TelaCotacoes';
import TelaPerfil from './TelaPerfil';
import TelaPagamento from './TelaPagamento';
import styles from './styles';

const Tab = createBottomTabNavigator();

export default function App() {
  const [location, setLocation] = useState(null);
  const [currency, setCurrency] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    (async () => {
      // Solicitar permissões de localização
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permissão para acessar a localização foi negada');
        return;
      }

      const loc = await getLocation();
      setLocation(loc);
      await fetchCurrency(loc.latitude, loc.longitude);

      // Solicitar permissões para notificações
      const notificationStatus = await Notifications.requestPermissionsAsync();
      if (notificationStatus.status !== 'granted') {
        setErrorMsg('Permissão para notificações foi negada');
        return;
      }

      // Agendar a notificação
      console.log("Scheduling notification...");
      await scheduleNotification();
    })();
  }, []);

  const getLocation = async () => {
    let { coords } = await Location.getCurrentPositionAsync({});
    return coords;
  };

  const fetchCurrency = async (latitude, longitude) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
      const data = await response.json();
      const country = data.address.country;

      const countryResponse = await fetch(`https://restcountries.com/v3.1/name/${country}`);
      const countryData = await countryResponse.json();
      const currencyCode = Object.keys(countryData[0].currencies)[0];

      setCurrency(currencyCode);
    } catch (error) {
      console.error(error);
      setCurrency('Erro ao obter moeda');
    }
  };

  const scheduleNotification = async () => {
  console.log("Inside scheduleNotification function");
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Bem-vindo ao App de Cotações!",
      body: "Você pode agora acompanhar as cotações de moedas e gerenciar seus pagamentos.",
    },
    trigger: {
      seconds: 30, // A notificação será enviada após 30 segundos
      repeats: true, // Repetir a notificação a cada 30 segundos
    },
  });
  console.log("Notification scheduled!");
};

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;

            if (route.name === 'Cotações') {
              iconName = 'bar-chart'; // Mudei para um ícone de gráfico
            } else if (route.name === 'Perfil') {
              iconName = 'person-circle'; // Mudei para um ícone de perfil
            } else if (route.name === 'Pagamento') {
              iconName = 'card'; // Mudei para um ícone de cartão
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
        tabBarOptions={{
          activeTintColor: '#00796b',
          inactiveTintColor: 'gray',
          style: styles.navBar,
        }}
      >
        <Tab.Screen name="Cotações" children={() => <TelaCotacoes currency={currency} />} />
        <Tab.Screen name="Perfil" component={TelaPerfil} />
        <Tab.Screen name="Pagamento" component={TelaPagamento} />
      </Tab.Navigator>

      <View style={{ padding: 10 }}>
        {errorMsg ? (
          <Text>{errorMsg}</Text>
        ) : location ? (
          <Text>
            Localização: Latitude: {location.latitude}, Longitude: {location.longitude}
            {'\n'}Moeda: {currency ? currency : 'Carregando...'}
          </Text>
        ) : (
          <Text>Obtendo localização...</Text>
        )}
      </View>
    </NavigationContainer>
  );
}
