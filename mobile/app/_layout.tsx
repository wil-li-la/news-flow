import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Home, Search, User } from 'lucide-react-native';
import { useEffect } from 'react';
import { configureAws } from '../lib/auth';
import { AWS_CONFIG } from '../lib/awsConfig';

export default function RootLayout() {
  useEffect(() => {
    if (AWS_CONFIG) configureAws(AWS_CONFIG);
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Tabs
          initialRouteName="swipepage"
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: {
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 16,
              height: 64,
              borderRadius: 22,
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderTopWidth: 0,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowOffset: { width: 0, height: 8 },
              shadowRadius: 16,
              elevation: 6,
            },
            tabBarItemStyle: { marginHorizontal: 8 },
          }}
        >
          {/* Hide the index route from the tab bar (we redirect it). */}
          <Tabs.Screen
            name="search"
            options={{
              tabBarIcon: ({ color, size, focused }) => (
                <IconPill focused={focused}><Search color={focused ? '#fff' : '#0f172a'} size={22} /></IconPill>
              ),
            }}
          />
          <Tabs.Screen
            name="swipepage"
            options={{
              tabBarIcon: ({ color, size, focused }) => (
                <IconPill focused={focused}><Home color={focused ? '#fff' : '#0f172a'} size={22} /></IconPill>
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              tabBarIcon: ({ color, size, focused }) => (
                <IconPill focused={focused}><User color={focused ? '#fff' : '#0f172a'} size={22} /></IconPill>
              ),
            }}
          />
        </Tabs>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function IconPill({ children, focused }: { children: React.ReactNode; focused?: boolean }) {
  return (
    <View style={{
      alignItems: 'center', justifyContent: 'center',
      width: 44, height: 36, borderRadius: 12,
      backgroundColor: focused ? '#0f172a' : 'transparent',
    }}>
      {children}
    </View>
  );
}
