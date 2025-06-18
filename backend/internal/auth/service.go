package auth

import (
	"fmt"
	"github.com/rs/zerolog/log"
)

type Service struct {
	authDb DB
}

func NewService() *Service {
	adb := &MemAuthDB{make(map[string]*User)}
	_, err := adb.NewUser("admin", "admin")
	if err != nil {
		log.Fatal().Err(err).Msg("unable to create default user")
	}

	return &Service{adb}
}

func (auth *Service) Login(username, inputPassword string) (*User, string, error) {
	user, err := auth.authDb.GetUser(username, inputPassword)
	if err != nil {
		return nil, "", fmt.Errorf("failed retrive user: %w", err)
	}

	unHashedToken := CreateAuthToken(32)
	user.Token = hashString(unHashedToken)

	if err = auth.authDb.UpdateUser(user); err != nil {
		return nil, "", fmt.Errorf("error updating user, %w", err)
	}

	return user, unHashedToken, nil
}

func (auth *Service) Logout(user *User) error {
	user.Token = ""

	if err := auth.authDb.UpdateUser(user); err != nil {
		return err
	}

	return nil
}

func (auth *Service) VerifyToken(token string) (*User, error) {
	user, err := auth.authDb.VerifyAuthToken(token)
	if err != nil {
		return nil, err
	}
	return user, nil
}
