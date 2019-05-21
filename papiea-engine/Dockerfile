FROM ubuntu:18.04

RUN apt-get update && apt-get upgrade -y \
    && apt-get install -y locales \
    && echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen \
    && locale-gen \
    # For leiningen
    && apt-get install -y wget curl openjdk-11-jdk \
    # For nodejs
    && apt-get install -y gnupg \
    && curl -sL https://deb.nodesource.com/setup_10.x | bash - \
    && apt-get install -y nodejs \
    # Cleanup
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
ENV LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8 LC_CTYPE=en_US.UTF-8 LANGUAGE=en_US:en

ENV LEIN_ROOT true
RUN wget -q -O /usr/bin/lein \
    https://raw.githubusercontent.com/technomancy/leiningen/2.8.1/bin/lein \
    && chmod +x /usr/bin/lein
RUN lein

# Cache .m2
ADD papiea-lib-clj/project.clj /project.clj
RUN cd / && lein deps && lein cljsbuild once && rm project.clj

# Cache node_modules
ADD package.json /package.json
ADD package-lock.json /package-lock.json
RUN cd / && npm install && rm package.json && rm package-lock.json

# Declare the ports we use
EXPOSE 3000

WORKDIR /code

CMD /bin/bash ./start.sh