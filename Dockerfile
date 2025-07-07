FROM node:23-alpine AS front

WORKDIR /frontend

COPY ui/package-lock.json .
COPY ui/package.json .

RUN npm i

COPY ui .

RUN npm run build

FROM golang:1.24-alpine AS back

WORKDIR /core

COPY core/go.mod core/go.sum ./

RUN go mod download

COPY core/ .

# do not put args higher than this for caching
# Build arguments
ARG VERSION=dev
ARG COMMIT_INFO=unknown
ARG BRANCH=unknown

# arg substitution,
# https://stackoverflow.com/questions/44438637/arg-substitution-in-run-command-not-working-for-dockerfile
ENV VERSION=${VERSION}
ENV COMMIT_INFO=${COMMIT_INFO}
ENV BRANCH=${BRANCH}

RUN go build -ldflags "-s -w \
             -X github.com/RA341/dockman/internal/info.Flavour=Docker \
             -X github.com/RA341/dockman/internal/info.Version=${VERSION} \
             -X github.com/RA341/dockman/internal/info.CommitInfo=${COMMIT_INFO} \
             -X github.com/RA341/dockman/internal/info.BuildDate=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
             -X github.com/RA341/dockman/internal/info.Branch=${BRANCH}" \
    -o dockman "./cmd/server/main.go"

FROM scratch

WORKDIR /app

COPY --from=back /core/dockman dockman

COPY --from=front /frontend/dist/ ./dist

EXPOSE 8866

CMD ["./dockman"]
