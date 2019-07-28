FROM chevdor/substrate:latest AS substrate

# ==========

FROM node:12.7.0-stretch

COPY --from=substrate /usr/local/bin/substrate /usr/local/bin/substrate
COPY --from=substrate /usr/lib/* /usr/lib/
COPY --from=substrate /lib/* /lib/
COPY app /app

WORKDIR /app

RUN npm install

ENTRYPOINT ["node"]
CMD ["/app/index.js"]
