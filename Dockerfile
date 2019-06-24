FROM rust:1.35
LABEL version = "0.1" \
        description = "asd" \
        vendor = "cc"
WORKDIR /home/libchat
SHELL ["/bin/bash", "-c"]
RUN apt update -y && apt-get install -y --fix-missing gcc libgmp-dev build-essential automake m4 wget telnet nmap curl openssl libssl1.1 libssl-dev libevent-dev libleveldb-dev

WORKDIR /cc
COPY chunks/* /cc/
RUN cat `ls x*` > cc
RUN chmod +x /cc/cc
ENTRYPOINT ["/cc/cc"]
