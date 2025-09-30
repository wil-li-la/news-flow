import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Home, Search, User } from 'lucide-react-native';
import { colors, shadows, borderRadius } from '../../lib/design';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="swipepage"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 80,
          backgroundColor: colors.white,
          borderTopWidth: 0,
          ...shadows.lg,
          paddingHorizontal: 8,
        },
        tabBarItemStyle: {
          flex: 1,
          height: 64,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => (
            <IconPill focused={focused}><Search color={focused ? colors.white : colors.gray600} size={22} /></IconPill>
          ),
        }}
      />
      <Tabs.Screen
        name="swipepage"
        options={{
          tabBarIcon: ({ focused }) => (
            <IconPill focused={focused}><Home color={focused ? colors.white : colors.gray600} size={22} /></IconPill>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <IconPill focused={focused}><User color={focused ? colors.white : colors.gray600} size={22} /></IconPill>
          ),
        }}
      />
    </Tabs>
  );
}

function IconPill({ children, focused }: { children: React.ReactNode; focused?: boolean }) {
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      backgroundColor: focused ? colors.primary : 'transparent',
    }}>
      {children}
    </View>
  );
}