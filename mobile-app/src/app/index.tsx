import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '../session';

export default function IndexRoute() {
  const { booting, student } = useSession();
  if (booting) {
    return <SafeAreaView style={styles.loading}><ActivityIndicator color="#E9B949" size="large" /></SafeAreaView>;
  }
  return <Redirect href={student ? '/(student)' : '/login'} />;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#123B34' } });