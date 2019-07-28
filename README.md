# run

```docker run --rm -it \
    -v $(pwd)/app:/app \
    --entrypoint=ash \
    -e MASTER_IP=192.168.65.2 \
    pmjohann/nodetest```
