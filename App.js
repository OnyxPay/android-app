import React, {Component} from 'react';
import {
  BackHandler,
  Linking,
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
import {uri, walletPath, externalLinks} from './constants';
import {PermissionsAndroid} from 'react-native';
import RNFS from 'react-native-fs';
import bgImg from './android/app/src/main/res/assets/img/login.jpg';
import SplashScreen from 'react-native-splash-screen';

const INJECTED = `
  if (!window.ReactNativeWebView.hasInjectedJS) {
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
    window.ReactNativeWebView.hasInjectedJS = true;
  }
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
    this.onLayoutHandler = this.onLayoutHandler.bind(this);
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.backHandler);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.backHandler);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextState.isPullToRefreshEnabled !== this.state.isPullToRefreshEnabled ||
      nextState.orientation !== this.state.orientation
    );
  }

  downloadWallet(wallet) {
    const now = new Date();
    const now_string = `_${now.getFullYear()}-${now.getMonth()}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getMilliseconds()}`;
    RNFS.mkdir(walletPath);
    const path = `${walletPath}/onyx_pay_wallet${now_string}.dat`;

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
      externalLinks.includes(event.title) ||
      event.title.startsWith('https://t.me/') ||
      event.title.startsWith('https://www.coinpayments.net/index.php') ||
      (event.title === 'https://www.onyxpay.co' && event.canGoBack === true)
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

  onLayoutHandler(e) {
    //to force update
    this.setState({
      orientation: this.orientation(),
    });
  }

  orientation() {
    return Dimensions.get('window').width < Dimensions.get('window').height
      ? 'portrait'
      : 'landscape';
  }

  render() {
    const {isPullToRefreshEnabled} = this.state;
    
    const errorView = (
      <ImageBackground
        style={{
          width: '100%',
          height: Dimensions.get('window').height - StatusBar.currentHeight,
          position: 'absolute',
          top: 0,
        }}
        source={bgImg}>
        <View style={styles.errorTextContainer}>
          <Text style={styles.errorText}>
            Please check your internet connection
          </Text>
        </View>
      </ImageBackground>
    );

    return (
      <ScrollView
        onLayout={this.onLayoutHandler}
        style={styles.scrollViewContainer}
        refreshControl={
          <RefreshControl
            refreshing={false}
            enabled={isPullToRefreshEnabled}
            onRefresh={this.onRefreshHandler}
          />
        }>
        <StatusBar barStyle="light-content" backgroundColor="#310D31" />
        <WebView
          style={{
            width: '100%',
            height: Dimensions.get('window').height - StatusBar.currentHeight,
          }}
          source={{uri}}
          ref={ref => {
            this.webview = ref;
          }}
          onNavigationStateChange={this.onNavigationStateChangeHandler}
          injectedJavaScript={INJECTED}
          onMessage={this.onMessageHandler}
          onScroll={this.onScrollHandler}
          renderError={() => errorView}
          onLoadEnd={() => SplashScreen.hide()}
        />
      </ScrollView>
    );
  }
}
export default App;

const styles = StyleSheet.create({
  scrollViewContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#310D31',
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
