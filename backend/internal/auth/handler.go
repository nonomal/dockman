package auth

import (
	"connectrpc.com/connect"
	"context"
	"fmt"
	v1 "github.com/RA341/dockman/generated/auth/v1"
)

type Handler struct {
	auth *Service
}

func NewConnectHandler(auth *Service) *Handler {
	return &Handler{auth: auth}
}

func (a *Handler) Login(ctx context.Context, c *connect.Request[v1.User]) (*connect.Response[v1.Empty], error) {
	username, password := c.Msg.Username, c.Msg.Password
	if username != c.Msg.Username || password != c.Msg.Password {
		return nil, fmt.Errorf("empty username or password")
	}

	_, authToken, err := a.auth.Login(username, password)
	if err != nil {
		return nil, err
	}

	response := connect.NewResponse(&v1.Empty{})
	setCookie(authToken, response)

	return response, nil
}

func (a *Handler) Logout(ctx context.Context, req *connect.Request[v1.Empty]) (*connect.Response[v1.Empty], error) {
	//clientToken := req.Header().Get(HeaderAuth)
	//ctx, err := verifyAuthHeader(ctx, a.auth)
	//if err != nil {
	//	log.Warn().Err(err).Msg("Logout failed, user info not found in request")
	//	return connect.NewResponse(&v1.Empty{}), nil
	//}
	//
	//user, err := GetUserContext(ctx)
	//if err != nil {
	//	log.Warn().Err(err).Msg("Logout failed, user info not found in context")
	//	return connect.NewResponse(&v1.Empty{}), nil
	//}
	//
	//err = a.auth.Logout(user)
	//if err != nil {
	//	log.Warn().Err(err).Msg("Logout failed")
	//}

	return connect.NewResponse(&v1.Empty{}), nil
}
