package docker

import "gorm.io/gorm"

type ImageUpdate struct {
	gorm.Model
	ImageID   string `gorm:"not null"`
	UpdateRef string `gorm:"default:''"`
	Host      string `gorm:"not null"`
}

type Store interface {
	GetUpdateAvailable(host string, imageIds ...string) (map[string]ImageUpdate, error)
	Save(image *ImageUpdate) error
	Delete(imageIds ...string) error
}
