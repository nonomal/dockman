package auth

import (
	"connectrpc.com/connect"
	"context"
	"fmt"
	v1 "github.com/RA341/dockman/generated/auth/v1"
	"github.com/rs/zerolog/log"
	"net/http"
)

type Handler struct {
	auth *Service
}

func NewConnectHandler(auth *Service) *Handler {
	return &Handler{auth: auth}
}

func (a *Handler) Login(_ context.Context, c *connect.Request[v1.User]) (*connect.Response[v1.Empty], error) {
	username, password := c.Msg.Username, c.Msg.Password
	if username != c.Msg.Username || password != c.Msg.Password {
		return nil, fmt.Errorf("empty username or password")
	}

	user, authToken, err := a.auth.Login(username, password)
	if err != nil {
		return nil, err
	}

	response := connect.NewResponse(&v1.Empty{})
	setCookie(response, authToken, user.Expires)

	return response, nil
}

func (a *Handler) Logout(_ context.Context, req *connect.Request[v1.Empty]) (*connect.Response[v1.Empty], error) {
	cookies, err := http.ParseCookie(req.Header().Get("Cookie"))
	if err != nil {
		return nil, err
	}

	user, err := verifyCookie(cookies, a.auth)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, err)
	}

	if err = a.auth.Logout(user); err != nil {
		log.Warn().Err(err).Msg("error while logging out")
	}

	return connect.NewResponse(&v1.Empty{}), nil
}
