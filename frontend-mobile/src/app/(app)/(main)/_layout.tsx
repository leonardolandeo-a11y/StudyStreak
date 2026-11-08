import { NavigationPressable } from '../../../components/navigation/NavigationPressable';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { Drawer, type DrawerNavigationProp } from 'expo-router/drawer';
import type { ParamListBase } from 'expo-router/react-navigation';
import { BackHandler, Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useAppearance } from '../../../hooks/useAppearance';
import { StudyDrawerContent } from '../../../components/navigation/StudyDrawerContent';
import { primaryBackTarget } from '../../../features/navigation/menu';
export const unstable_settings = { initialRouteName: '(menu)' };

export default function MainLayout() {
  const { theme, reduceMotion } = useAppearance();
  const { width } = useWindowDimensions();
  const trigger = useRef<ComponentRef<typeof Pressable>>(null);
  const [reducedMenu, setReducedMenu] = useState<DrawerNavigationProp<ParamListBase> | null>(null);
  const close = () => { setReducedMenu(null); trigger.current?.focus(); };
  return <View style={{ flex: 1 }}>
    <Drawer backBehavior="history" drawerContent={props =>
      <StudyDrawerContent active={props.state.routes[props.state.index].name}
        close={() => props.navigation.closeDrawer()} navigate={name => props.navigation.navigate(name)} />}
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text,
        headerShadowVisible: false, drawerStyle: { width: Math.min(320, width * .88), backgroundColor: theme.colors.surface },
        swipeEnabled: !reduceMotion,
        headerLeft: () => <PrimaryMenuButton navigation={navigation}><NavigationPressable ref={trigger} accessibilityRole="button" accessibilityLabel="Open menu"
          onPress={() => reduceMotion ? setReducedMenu(navigation) : navigation.openDrawer()}
          style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Text accessible={false} style={{ color: theme.colors.text, fontSize: 24 }}>☰</Text>
        </NavigationPressable></PrimaryMenuButton>,
      })}>
      <Drawer.Screen name="(menu)" options={{ title: 'Menu' }} />
      <Drawer.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Drawer.Screen name="focus-studio" options={{ title: 'Focus Studio' }} />
      <Drawer.Screen name="resources/index" options={{ title: 'Resources' }} />
      <Drawer.Screen name="notifications/index" options={{ title: 'Notifications' }} />
    </Drawer>
    {/* The installed native drawer forces spring animation. The same content
        uses an unanimated native Modal when reduced motion is requested. */}
    <Modal visible={reduceMotion && reducedMenu !== null} transparent animationType="none" onRequestClose={close} onDismiss={() => trigger.current?.focus()}>
      <View accessibilityViewIsModal style={{ flex: 1, flexDirection: 'row', backgroundColor: '#00000066' }}>
        <View style={{ width: Math.min(320, width * .88) }}>
          {reducedMenu ? <StudyDrawerContent active={reducedMenu.getState().routes[reducedMenu.getState().index].name}
            close={close} navigate={name => reducedMenu.navigate(name)} /> : null}
        </View>
        <NavigationPressable accessibilityRole="button" accessibilityLabel="Dismiss menu" style={{ flex: 1 }} onPress={close} />
      </View>
    </Modal>
  </View>;
}
function PrimaryMenuButton({ navigation, children }: { navigation: DrawerNavigationProp<ParamListBase>; children: React.ReactNode }) {
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const state = navigation.getState();
      const route = state.routes[state.index];
      const nested = route.state;
      const tab = nested?.routes[nested.index ?? 0]?.name;
      const target = primaryBackTarget(navigation.canGoBack(), route.name, tab);
      if (!target) return false;
      navigation.navigate('(menu)', target === 'goals' ? { screen: 'goals/index' } : undefined);
      return true;
    });
    return () => subscription.remove();
  }, [navigation]));
  return children;
}
