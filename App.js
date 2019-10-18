import React, {Component} from 'react';
import {
  BackHandler,
  Linking,
  Platform,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
  View,
  Text,
  ImageBackground,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {uri} from './constants';
import {PermissionsAndroid} from 'react-native';
import RNFS from 'react-native-fs';
import bgImg from './android/app/src/main/res/assets/img/login.jpg';

const INJECTED = `
  window.addEventListener('download_wallet', function (event) {
    const message = 'download_wallet' + event.detail;
    window.ReactNativeWebView.postMessage(message);
  });
  (function () {
    function wrap(fn) {
      return function wrapper() {
        const res = fn.apply(this, arguments);
        window.ReactNativeWebView.postMessage('navigationStateChange');
        return res;
      }
    }
    history.pushState = wrap(history.pushState);
    history.replaceState = wrap(history.replaceState);
    window.addEventListener('popstate', function () {
      window.ReactNativeWebView.postMessage('navigationStateChange');
    });
  })();
  true;
`;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isPullToRefreshEnabled: true,
    };
    this.onNavigationStateChangeHandler = this.onNavigationStateChangeHandler.bind(
      this,
    );
    this.onMessageHandler = this.onMessageHandler.bind(this);
    this.backHandler = this.backHandler.bind(this);
    this.onRefreshHandler = this.onRefreshHandler.bind(this);
    this.onScrollHandler = this.onScrollHandler.bind(this);
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.backHandler);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.backHandler);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextState.isPullToRefreshEnabled !== this.state.isPullToRefreshEnabled
    );
  }

  downloadWallet(wallet) {
    const now = new Date();
    const now_string = `_${now.getFullYear()}-${now.getMonth()}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getMilliseconds()}`;
    RNFS.mkdir(`/storage/emulated/0/Onyxpay`);
    const path = `/storage/emulated/0/Onyxpay/onyx_pay_wallet${now_string}.dat`;

    RNFS.writeFile(path, wallet, 'utf8')
      .then(() => {
        Alert.alert(
          `Wallet file is succesfully saved as:`,
          `/storage/Onyxpay/onyx_pay_wallet${now_string}.dat`,
          [{text: 'OK'}],
        );
      })
      .catch(err => {
        console.log(err.message);
      });
  }

  async requestWriteExternalStoragePermission() {
    try {
      return await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
    } catch (err) {
      console.log(err.message);
    }
  }

  onMessageHandler(event) {
    if (event.nativeEvent.data.startsWith('download_wallet')) {
      const wallet = event.nativeEvent.data.slice('download_wallet'.length);
      this.requestWriteExternalStoragePermission()
        .then(result => {
          if (result === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Permission granted');
            this.downloadWallet(wallet);
          } else {
            console.log('Permission denied');
            Alert.alert(`Wallet file is not saved`, ``, [{text: 'OK'}]);
          }
        })
        .catch(err => {
          console.log(err.message);
        });
    }

    if (event.nativeEvent.data === 'navigationStateChange') {
      this.setState({
        backButtonEnabled: event.nativeEvent.canGoBack,
      });
    }
  }

  onNavigationStateChangeHandler(event) {
    if (
      (Platform.OS === 'android' &&
        event.title === 'https://www.coinpayments.net/index.php') ||
      (Platform.OS === 'ios' &&
        event.url === 'https://www.coinpayments.net/index.php' &&
        event.title !== 'OnyxPay')
    ) {
      this.webview.goBack();
      Linking.openURL(event.url);
    }
  }

  backHandler() {
    if (this.state.backButtonEnabled) {
      this.webview.goBack();
      return true;
    }
  }

  onRefreshHandler() {
    this.webview.reload();
  }

  onScrollHandler(event) {
    this.setState({
      isPullToRefreshEnabled: event.nativeEvent.contentOffset.y === 0,
    });
  }

  render() {
    const {isPullToRefreshEnabled} = this.state;

    const errorView = (
      <ImageBackground style={styles.errorImg} source={bgImg}>
        <View style={styles.errorTextContainer}>
          <Text style={styles.errorText}>
            Please check your internet connection
          </Text>
        </View>
      </ImageBackground>
    );

    return (
      <ScrollView
        style={styles.scrollViewContainer}
        refreshControl={
          <RefreshControl
            refreshing={false}
            enabled={isPullToRefreshEnabled}
            onRefresh={this.onRefreshHandler}
          />
        }>
        <WebView
          style={styles.webView}
          source={{uri}}
          ref={ref => {
            this.webview = ref;
          }}
          onNavigationStateChange={this.onNavigationStateChangeHandler}
          injectedJavaScript={INJECTED}
          onMessage={this.onMessageHandler}
          onScroll={this.onScrollHandler}
          renderError={() => errorView}
        />
      </ScrollView>
    );
  }
}
export default App;

const styles = StyleSheet.create({
  scrollViewContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  webView: {
    width: '100%',
    height: Dimensions.get('window').height - StatusBar.currentHeight,
  },
  errorImg: {
    width: '100%',
    height: Dimensions.get('window').height - StatusBar.currentHeight,
    position: 'absolute',
    top: 0,
  },
  errorTextContainer: {
    height: 50,
    backgroundColor: '#fff',
    top: '80%',
    alignSelf: 'center',
  },
  errorText: {
    color: 'rgba(0, 0, 0, 0.45)',
    fontSize: 16,
    marginTop: 'auto',
    marginBottom: 'auto',
    marginLeft: 20,
    marginRight: 20,
  },
});
