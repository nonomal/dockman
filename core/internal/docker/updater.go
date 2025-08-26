package docker

import "gorm.io/gorm"

type ImageUpdate struct {
	gorm.Model
	ImageID   string `gorm:"not null;unique"`
	UpdateRef string `gorm:"default:''"`
	Host      string `gorm:"not null;unique"`
}

type Store interface {
	UpdateAvailable(host string, imageIds ...string) (map[string]ImageUpdate, error)
	Save(image ImageUpdate) error
	Delete(image ImageUpdate) error
}
