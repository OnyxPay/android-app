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
} from 'react-native';
import {WebView} from 'react-native-webview';
import {uri, externalLinks} from './constants';
import {PermissionsAndroid} from 'react-native';
import RNFS from 'react-native-fs';

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
      externalLinks.includes(event.title) ||
      event.title.startsWith('https://t.me/') ||
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

  render() {
    const {isPullToRefreshEnabled} = this.state;

    return (
      <ScrollView
        style={styles.scrollview_container}
        refreshControl={
          <RefreshControl
            refreshing={false}
            enabled={isPullToRefreshEnabled}
            onRefresh={this.onRefreshHandler}
          />
        }>
        <WebView
          style={styles.webview}
          source={{uri}}
          ref={ref => {
            this.webview = ref;
          }}
          onNavigationStateChange={this.onNavigationStateChangeHandler}
          injectedJavaScript={INJECTED}
          onMessage={this.onMessageHandler}
          onScroll={this.onScrollHandler}
        />
      </ScrollView>
    );
  }
}
export default App;

const styles = StyleSheet.create({
  scrollview_container: {
    flex: 1,
    height: '100%',
  },
  webview: {
    width: '100%',
    height: Dimensions.get('window').height - StatusBar.currentHeight,
  },
});

/* onError={event => {
  console.log('onError message: ', JSON.stringify(event.nativeEvent));
}} */
/* onLoadStart={event => {
  console.log('onLoadStart message: ', JSON.stringify(event.nativeEvent));
}}
onLoad={event => {
  console.log('onLoad message: ', JSON.stringify(event.nativeEvent));
}}
onLoadEnd={event => {
  console.log('onLoadEnd message: ', JSON.stringify(event.nativeEvent));
}}
onLoadProgress={event => {
  console.log('onLoadProgress message: ', JSON.stringify(event.nativeEvent));
}}
onHttpError={event => {
  console.log('onHttpError message: ', JSON.stringify(event.nativeEvent));
}}
onContentProcessDidTerminate={event => {
  console.log('onContentProcessDidTerminate message: ', JSON.stringify(event.nativeEvent));
}} */
