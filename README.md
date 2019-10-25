To build image of android sdk:

## docker build -t android-sdk .

then

Put files google-services.json and keystore.jks to onyxpay/android/app/
Create onyxpay/android/keystore.properties file like following:
storePassword=pass1
keyPassword=pass2
keyAlias=keyalias
storeFile=keystore.jks

To build & sign release boundle:

## docker run --rm -v ${PWD}:/onyxpay android-sdk
