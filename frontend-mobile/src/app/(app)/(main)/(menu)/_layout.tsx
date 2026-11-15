import { Tabs } from 'expo-router';
import { MenuTabBar } from '../../../../components/navigation/MenuTabBar';
import { MenuActionProvider } from '../../../../contexts/MenuActionContext';
import { menuTabs } from '../../../../features/navigation/menu';
export const unstable_settings = { initialRouteName: 'goals/index' };

export default function MenuLayout() {
  return <MenuActionProvider>
    <Tabs backBehavior="history" screenOptions={{ headerShown: false, animation: 'none', lazy: true }}
      tabBar={props => <MenuTabBar {...props} />}>
      {menuTabs.map(tab => <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />)}
    </Tabs>
  </MenuActionProvider>;
}
