FROM chevdor/substrate:alpine AS substrate

# ==========

FROM node:12-alpine

RUN apk add --no-cache ca-certificates \
    libstdc++ \
    openssl

COPY --from=substrate /usr/local/bin/substrate /usr/local/bin/substrate
COPY --from=substrate /usr/lib/* /usr/lib/
COPY --from=substrate /lib/* /lib/
COPY app /app

WORKDIR /app

ENTRYPOINT ["node"]
CMD ["/app/index.js"]
