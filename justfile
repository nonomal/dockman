set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]
list:
    just --list

# builds go
[working-directory('backend')]
gob:
    just ui
    go run cmd/server/main.go --ui ../ui/dist --port=8899

# build a gouda dev image
dkbd:
    docker build . -t dockman:dev

# prune docker containers
prune:
    docker image prune -f

# start a temprory gouda build using docker run
devr:
    just dkbd
    docker run --rm -v ./wow:/compose -p 8080:8866 dockman:dev

# docker compose up using the test compose in install
[working-directory('install')]
comp:
    docker compose pull
    docker compose up --build --force-recreate

# no cache docker build
dkc:
    docker build . -t dockman:local --no-cache

# build the latest web ui
[working-directory('ui')]
ui:
    npm run build
