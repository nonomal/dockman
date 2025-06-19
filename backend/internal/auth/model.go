package auth

import "fmt"

type User struct {
	Username string
	Password string
	Token    string
}

type DB interface {
	GetUser(username string, password string) (*User, error)
	UpdateUser(user *User) error
	VerifyAuthToken(token string) (*User, error)
	NewUser(username string, password string) (*User, error)
}

type MemAuthDB struct {
	mem map[string]*User
}

func (m *MemAuthDB) NewUser(username string, password string) (*User, error) {
	pass, err := encryptPassword(password)
	if err != nil {
		return nil, err
	}

	m.mem[username] = &User{
		Username: username,
		Password: pass,
		Token:    "",
	}

	return m.mem[username], nil
}

func (m *MemAuthDB) GetUser(username string, password string) (*User, error) {
	val, ok := m.mem[username]
	if !ok {
		return nil, fmt.Errorf("invalid user/password")
	}

	if ok = checkPassword(password, val.Password); !ok {
		return nil, fmt.Errorf("invalid user/password")
	}

	return val, nil
}

func (m *MemAuthDB) UpdateUser(user *User) error {
	m.mem[user.Username] = user
	return nil
}

func (m *MemAuthDB) VerifyAuthToken(token string) (*User, error) {
	hashedToken := hashString(token)
	for _, user := range m.mem {
		if hashedToken == user.Token {
			return user, nil
		}
	}

	return nil, fmt.Errorf("invalid token")
}
