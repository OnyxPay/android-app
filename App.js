import React, {Component} from 'react';
import {BackHandler, Linking, Platform, Alert} from 'react-native';
import {WebView} from 'react-native-webview';
import {uri} from './constants';
import {PermissionsAndroid} from 'react-native';
import RNFS from 'react-native-fs';

class App extends Component {
  state = {};

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.backHandler);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.backHandler);
  }

  backHandler = () => {
    if (this.state.backButtonEnabled) {
      this.webview.goBack();
      return true;
    }
  };

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

  onMessageHandler = event => {
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
  };

  onNavigationStateChangeHandler = event => {
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
  };

  render() {
    const injected = `
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

    return (
      <WebView
        source={{uri}}
        ref={ref => {
          this.webview = ref;
        }}
        onNavigationStateChange={this.onNavigationStateChangeHandler}
        injectedJavaScript={injected}
        onMessage={this.onMessageHandler}
      />
    );
  }
}
export default App;

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
