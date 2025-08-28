package config

import (
	"time"

	"gorm.io/gorm"
)

// UserConfig always set defaults when added new configs
type UserConfig struct {
	gorm.Model
	UseComposeFolders bool             `gorm:"not null;default:false"`
	ContainerUpdater  ContainerUpdater `gorm:"embedded"`
}

type ContainerUpdater struct {
	Enable   bool          `gorm:"not null;default:false"`
	Interval time.Duration `gorm:"not null;default:43200000000000"` // 12h in nanoseconds
}

type Store interface {
	SetConfig(config *UserConfig) error
	GetConfig() (*UserConfig, error)
}
