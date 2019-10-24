FROM openjdk:8

ENV SDK_URL="https://dl.google.com/android/repository/sdk-tools-linux-4333796.zip" \
    ANDROID_HOME="/usr/local/android-sdk" 

# Download Android SDK
RUN mkdir "$ANDROID_HOME" .android \
    && cd "$ANDROID_HOME" \
    && curl -o sdk.zip $SDK_URL \
    && unzip sdk.zip \
    && rm sdk.zip \
    && yes | $ANDROID_HOME/tools/bin/sdkmanager --licenses

# Install Android Build Tool and Libraries
RUN $ANDROID_HOME/tools/bin/sdkmanager --update

#Install gradle
RUN wget -q https://services.gradle.org/distributions/gradle-5.5-all.zip \
    && unzip gradle-5.5-all.zip -d /opt \
    && rm gradle-5.5-all.zip

ENV GRADLE_HOME /opt/gradle-5.5
ENV PATH=$PATH:/opt/gradle-5.5/bin

# Install Node
RUN apt-get update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get -y install nodejs

RUN mkdir /onyxpay
WORKDIR /onyxpay


