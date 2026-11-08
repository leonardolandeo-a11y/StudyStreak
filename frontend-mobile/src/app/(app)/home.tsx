import { Redirect } from 'expo-router';

// Keep the existing Home deep link as the entry to Menu.
export default function Home() { return <Redirect href="/goals" />; }
