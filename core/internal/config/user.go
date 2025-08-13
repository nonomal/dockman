package config

import "gorm.io/gorm"

type UserConfig struct {
	gorm.Model
	UseComposeFolders bool `gorm:"not null;default:false"`
}

type Store interface {
	SetConfig(config *UserConfig) error
	GetConfig() (*UserConfig, error)
}
