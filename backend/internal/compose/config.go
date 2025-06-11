package compose

import (
	"fmt"
	"github.com/RA341/dockman/pkg"
)

type FileAssociations struct {
	files *pkg.Map[string, string]
}

func (fa *FileAssociations) GetVal(name string) (string, bool) {
	return fa.files.Load(name)
}

func (fa *FileAssociations) Exists(name string) bool {
	_, ok := fa.files.Load(name)
	return ok
}

func (fa *FileAssociations) ToMap() map[string]string {
	result := map[string]string{}

	fa.files.Range(func(key, value string) bool {
		result[key] = value
		return true
	})

	return result
}

func (fa *FileAssociations) Insert(name, parent string) error {
	_, ok := fa.files.Load(name)
	if ok {
		return fmt.Errorf("exists")
	}

	if parent != "" {
		if name == parent {
			return fmt.Errorf("child and parent must be different")
		}

		_, ok = fa.files.Load(parent)
		if !ok {
			return fmt.Errorf("parent not found")
		}
	}

	fa.files.Store(name, parent)
	return nil
}

func (fa *FileAssociations) List() map[string][]string {
	result := make(map[string][]string)

	fa.files.Range(func(key string, value string) bool {
		if value == "" {
			// parent detected
			result[key] = []string{}
		}
		return true
	})

	fa.files.Range(func(key string, value string) bool {
		if value == "" {
			return true
		}

		// key is a child
		val, ok := result[value]
		if ok {
			result[value] = append(val, key)
		}
		return true
	})

	return result
}

func (fa *FileAssociations) Delete(deleteKey string) {
	fa.files.Delete(deleteKey)

	fa.files.Range(func(key string, value string) bool {
		if value == deleteKey {
			fa.files.Store(key, "")
		}
		return true
	})
}

func (fa *FileAssociations) Rename(oldName, newname string) error {
	val, ok := fa.files.Load(oldName)
	if !ok {
		return fmt.Errorf("not found")
	}

	fa.files.Delete(oldName)
	fa.files.Store(newname, val)

	// replace children if any
	fa.files.Range(func(key string, value string) bool {
		if value == oldName {
			fa.files.Store(key, newname)
		}
		return true
	})

	return nil
}

func (fa *FileAssociations) LoadMap(input map[string]string) {
	for key, val := range input {
		fa.files.Store(key, val)
	}
}
