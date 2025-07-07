FROM node:24-alpine AS front

WORKDIR /frontend

COPY ui/package.json ui/package-lock.json ./

RUN npm i

COPY ui .

RUN npm run build

FROM golang:1.24-alpine AS back

WORKDIR /core

COPY core/go.mod core/go.sum ./

RUN go mod download

COPY core/ .

# These ARGs are automatically populated by Docker Buildx for each platform.
# e.g., for 'linux/arm64', TARGETOS becomes 'linux' and TARGETARCH becomes 'arm64'.
ARG TARGETPLATFORM
ARG TARGETOS
ARG TARGETARCH

ARG VERSION=dev
ARG COMMIT_INFO=unknown
ARG BRANCH=unknown

# We run the build on the native amd64 runner, but use GOOS and GOARCH
# to tell the Go compiler to create a binary for the *target* platform.
# This avoids slow emulation for the compilation step.
RUN GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -ldflags "-s -w \
             -X github.com/RA341/dockman/internal/info.Flavour=Docker \
             -X github.com/RA341/dockman/internal/info.Version=${VERSION} \
             -X github.com/RA341/dockman/internal/info.CommitInfo=${COMMIT_INFO} \
             -X github.com/RA341/dockman/internal/info.BuildDate=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
             -X github.com/RA341/dockman/internal/info.Branch=${BRANCH}" \
    -o dockman "./cmd/server/main.go"

FROM scratch

# if app need to make making HTTPS requests we need to add CA certificates
# base image will need to be changed as well
#RUN apk add --no-cache ca-certificates
#or copy from back
#COPY --from=back /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

WORKDIR /app

COPY --from=back /core/dockman dockman

COPY --from=front /frontend/dist/ ./dist

EXPOSE 8866

ENTRYPOINT ["./dockman"]
