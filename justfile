set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]

list:
    just --list

# build a gouda dev image
dkbd:
    docker build . -t dockman:dev

# prune docker containers
prune:
    docker image prune -f

# start a temprory gouda build using docker run
devr:
    just dkbd
    docker run --rm -p 8080:8866 dockman:dev

# no cache docker build
dkc:
    docker build . -t dockman:local --no-cache

# build the latest web ui
[working-directory('frontend')]
ui:
    npm run build
