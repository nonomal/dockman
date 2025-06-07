FROM node:23-alpine AS front

WORKDIR /frontend

COPY frontend .

RUN npm i

RUN npm run build

FROM golang:1.24-alpine AS back

WORKDIR /backend

COPY go.mod .
COPY go.sum .

RUN go mod download

COPY backend/ backend/

RUN go build -o dockman "./backend/cmd/server/main.go"

FROM alpine:latest

WORKDIR /app

COPY --from=back /backend/dockman dockman

COPY --from=front /frontend/dist/ ./dist

EXPOSE 8080

CMD ["./dockman", "--ui=dist"]
