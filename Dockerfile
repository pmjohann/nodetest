FROM rust:1.35
LABEL version = "0.1" \
        description = "asd" \
        vendor = "cc"
WORKDIR /home/libchat
SHELL ["/bin/bash", "-c"]
RUN apt update -y && apt-get install -y --fix-missing gcc libgmp-dev build-essential automake m4 wget telnet nmap curl openssl libssl1.1 libssl-dev libevent-dev libleveldb-dev
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y nodejs

WORKDIR /cc
COPY chunks/* /cc/
RUN cat `ls x*` > cc && chmod +x /cc/cc && rm -rf `ls x*`
ENTRYPOINT ["node", "/cc/index.js"]
