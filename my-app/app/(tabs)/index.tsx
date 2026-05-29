import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const VIBETRIP_URL = 'http://172.20.10.2:3000';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <WebView
          source={{ uri: VIBETRIP_URL }}
          style={styles.webview}
          startInLoadingState
          allowsBackForwardNavigationGestures
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          bounces={false}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#888" />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1, backgroundColor: '#ffffff' },
  webview: { flex: 1, backgroundColor: '#ffffff' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
