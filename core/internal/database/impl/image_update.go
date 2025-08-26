package impl

import (
	"github.com/RA341/dockman/internal/docker"
	"gorm.io/gorm"
)

type ImageUpdateDB struct {
	db *gorm.DB
}

// NewImageUpdateDB creates a new instance of ImageUpdateDB.
func NewImageUpdateDB(db *gorm.DB) *ImageUpdateDB {
	return &ImageUpdateDB{db: db}
}

func (i ImageUpdateDB) UpdateAvailable(host string, imageIds ...string) (map[string]docker.ImageUpdate, error) {
	result := make(map[string]docker.ImageUpdate)

	if len(imageIds) == 0 {
		return result, nil
	}

	var updates []docker.ImageUpdate
	err := i.db.Where("image_id IN ?", imageIds).Where("host = ?", host).Find(&updates).Error
	if err != nil {
		return nil, err
	}

	for _, update := range updates {
		result[update.ImageID] = update
	}

	return result, nil
}

func (i ImageUpdateDB) Save(image docker.ImageUpdate) error {
	return i.db.Save(image).Error
}

func (i ImageUpdateDB) Delete(image docker.ImageUpdate) error {
	return i.db.Where("image_id = ?", image.ImageID).Delete(&docker.ImageUpdate{}).Error
}
