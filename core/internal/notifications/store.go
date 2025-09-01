package notifications

import (
	"database/sql/driver"
	"encoding/json"
	"errors"

	"gorm.io/gorm"
)

// Level type of notification to use this config for
// updates/backup notifs etc
type Level string

const (
	LevelUpdate Level = "update"
	LevelBackup Level = "backup"
)

type Store interface {
	Save(notif *Notification) error
	Get(id uint) (*Notification, error)
	GetAllByLevel(level Level) ([]Notification, error)
	Delete(id uint) error
}

type Notification struct {
	gorm.Model
	Level Level `gorm:"not null"`
	// config for the specific notifs
	// telegram/discord/slack etc
	Config Config `gorm:"type:json"`
}

type Config map[string]interface{}

func (c *Config) Value() (driver.Value, error) {
	return json.Marshal(c)
}

func (c *Config) Scan(value interface{}) error {
	if value == nil {
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	return json.Unmarshal(bytes, c)
}
