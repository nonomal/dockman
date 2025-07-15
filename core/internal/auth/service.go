package auth

import (
	"fmt"
	"github.com/rs/zerolog/log"
	"time"
)

type Service struct {
	authDb DB
}

func NewService(user, pass string) *Service {
	adb := &MemAuthDB{make(map[string]*User)}

	if _, err := adb.NewUser(user, pass); err != nil {
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
	user.Expires = time.Now().Add(time.Hour * 4)

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
	hashedToken := hashString(token)
	user, err := auth.authDb.VerifyAuthToken(hashedToken)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	val := now.Compare(user.Expires)
	if val == 1 {
		return nil, fmt.Errorf("token expired at %s, current time: %s", user.Expires, now)
	}

	return user, nil
}
