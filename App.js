import React, { Component } from 'react';
import { BackHandler, Linking, Button, View, Platform, Alert} from 'react-native';
import { WebView } from 'react-native-webview';

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
  }

  render() {
    const uri = "http://10.100.5.28:3000";
    return (
      <WebView
        source={{ uri }}
        ref={(ref) => { this.webview = ref; }}

        onNavigationStateChange={(event) => {
          if (Platform.OS === 'android' && event.title === "https://www.coinpayments.net/index.php" ||
          Platform.OS === 'ios' && event.url === "https://www.coinpayments.net/index.php" && event.title !== "OnyxPay") {            
          this.webview.goBack();
          Linking.openURL(event.url);
          }
        }}
        injectedJavaScript={`
          (function() {
          function wrap(fn) {
          return function wrapper() {
          var res = fn.apply(this, arguments);
          window.ReactNativeWebView.postMessage('navigationStateChange');
          return res;
          }
          }
          history.pushState = wrap(history.pushState);
          history.replaceState = wrap(history.replaceState);
          window.addEventListener('popstate', function() {
          window.ReactNativeWebView.postMessage('navigationStateChange');
          });
          })();
          true;
        `}
        onMessage={({ nativeEvent: state }) => {
          if (state.data === 'navigationStateChange') {
            this.setState({
              backButtonEnabled: state.canGoBack,
            });
          }
        }}
      />

    );
  }
}
export default App;
