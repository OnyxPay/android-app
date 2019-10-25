FROM openjdk:8

ENV SDK_URL="https://dl.google.com/android/repository/sdk-tools-linux-4333796.zip" \
    ANDROID_HOME="/usr/local/android-sdk"  \
    BUILD_TOOLS_VERSION=28.0.3 \
    PLATFORM_VERSION=28

# Download Android SDK
RUN mkdir "$ANDROID_HOME" .android \
    && cd "$ANDROID_HOME" \
    && curl -o sdk.zip $SDK_URL \
    && unzip sdk.zip \
    && rm sdk.zip \
    && yes | $ANDROID_HOME/tools/bin/sdkmanager --licenses

#Install gradle
RUN wget -q https://services.gradle.org/distributions/gradle-5.5-all.zip \
    && unzip gradle-5.5-all.zip -d /opt \
    && rm gradle-5.5-all.zip

ENV GRADLE_HOME="/opt/gradle-5.5"
ENV GRADLE_USER_HOME="/opt/gradle-5.5"
ENV PATH "$PATH:/opt/gradle-5.5/bin"

#Install Android Build Tools
RUN $ANDROID_HOME/tools/bin/sdkmanager --update
RUN $ANDROID_HOME/tools/bin/sdkmanager "build-tools;${BUILD_TOOLS_VERSION}" \
    "platforms;android-${PLATFORM_VERSION}" \
    "platform-tools"

ENV PATH "$PATH:${ANDROID_HOME}/tools"
ENV PATH "$PATH:${ANDROID_HOME}/tools/bin"
ENV PATH "$PATH:${ANDROID_HOME}/platform-tools"

# Install Node
RUN apt-get update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get -y install nodejs

RUN mkdir /onyxpay
WORKDIR /onyxpay

CMD sh -c "cd android;gradle clean;gradle bundleRelease"