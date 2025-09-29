import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Home, Search, User } from 'lucide-react-native';
import { useEffect } from 'react';
import { configureAws } from '../lib/auth';
import { colors, shadows, borderRadius } from '../lib/design';

export default function RootLayout() {
  useEffect(() => {
    try {
      configureAws();
    } catch (error) {
      console.error('AWS configuration failed:', error);
    }
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
              borderRadius: borderRadius.xl,
              backgroundColor: colors.white,
              borderTopWidth: 0,
              ...shadows.lg,
              alignItems: 'center',
              justifyContent: 'center',
            },
            tabBarItemStyle: {
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              href: null, // Hide from tab bar
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              tabBarIcon: ({ focused }) => (
                <IconPill focused={focused}><Search color={focused ? colors.white : colors.gray900} size={22} /></IconPill>
              ),
            }}
          />
          <Tabs.Screen
            name="swipepage"
            options={{
              tabBarIcon: ({ focused }) => (
                <IconPill focused={focused}><Home color={focused ? colors.white : colors.gray900} size={22} /></IconPill>
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              tabBarIcon: ({ focused }) => (
                <IconPill focused={focused}><User color={focused ? colors.white : colors.gray900} size={22} /></IconPill>
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
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 36,
      borderRadius: 12,
      backgroundColor: focused ? colors.gray900 : 'transparent',
    }}>
      {children}
    </View>
  );
}
