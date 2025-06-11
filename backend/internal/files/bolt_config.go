package files

import (
	"fmt"
	"github.com/rs/zerolog/log"
	bolt "go.etcd.io/bbolt"
	"path/filepath"
)

type FileDB interface {
	Insert(string, string) error
	Delete(string) error
	Get(string) (string, bool, error)
	Exists(string) (bool, error)
	Rename(string, string) error
	Close() error
	List() (map[string][]string, error)
}

const boltFileDBName = ".dockman.db"

const fileBucket = "files"

type BoltFileDB struct {
	db *bolt.DB
}

func NewBoltConfig(composeRoot string) FileDB {
	db, err := initBoltDB(composeRoot)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to init bolt database")
	}

	return &BoltFileDB{db: db}
}

func initBoltDB(composeRoot string) (*bolt.DB, error) {
	if composeRoot == "" {
		composeRoot = "."
	}

	db, err := bolt.Open(filepath.Join(composeRoot, boltFileDBName), 0600, nil)
	if err != nil {
		return nil, err
	}

	err = db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte("files"))
		return err
	})
	if err != nil {
		return nil, err
	}

	return db, nil
}

func (b *BoltFileDB) Close() error {
	return b.db.Close()
}

// Get retrieves the parent of a given filename.
// It returns the parent, a boolean indicating if the file is a parent itself, and an error if any.
func (b *BoltFileDB) Get(filename string) (string, bool, error) {
	var parent string
	var isParent bool

	err := b.db.View(func(tx *bolt.Tx) error {
		bucket, err := b.getFileBucket(tx)
		if err != nil {
			return err
		}

		val := bucket.Get([]byte(filename))
		if val == nil {
			return fmt.Errorf("file not found")
		}

		parent = string(val)
		isParent = len(val) == 0
		return nil
	})

	return parent, isParent, err
}

func (b *BoltFileDB) List() (map[string][]string, error) {
	fileTree := make(map[string][]string)

	err := b.db.View(func(tx *bolt.Tx) error {
		bucket, err := b.getFileBucket(tx)
		if err != nil {
			return err
		}

		c := bucket.Cursor()
		for k, v := c.First(); k != nil; k, v = c.Next() {
			filename := string(k)
			parent := string(v)

			if parent == "" {
				// This is a parent file.
				// Ensure it has an entry in the map, even if it has no children.
				if _, ok := fileTree[filename]; !ok {
					fileTree[filename] = []string{}
				}
			} else {
				// This is a child file. Append it to its parent's list.
				fileTree[parent] = append(fileTree[parent], filename)
			}
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return fileTree, nil
}

// Insert adds a new file to the database.
// If parent is an empty string, the file is a parent.
// If parent is not empty, it must correspond to an existing parent file.
func (b *BoltFileDB) Insert(filename string, parent string) error {
	return b.db.Update(func(tx *bolt.Tx) error {
		bucket, err := b.getFileBucket(tx)
		if err != nil {
			return err
		}

		if bucket.Get([]byte(filename)) != nil {
			return fmt.Errorf("file already exists")
		}

		// If a parent is specified, ensure it exists and is a parent.
		if parent != "" {
			parentVal := bucket.Get([]byte(parent))
			if parentVal == nil {
				return fmt.Errorf("parent file does not exist")
			}
			if len(parentVal) != 0 {
				return fmt.Errorf("specified parent is not a top-level parent")
			}
		}

		return bucket.Put([]byte(filename), []byte(parent))
	})
}

// Delete removes a file from the database.
// If a parent with children is deleted, its children are promoted to parents.
func (b *BoltFileDB) Delete(filename string) error {
	return b.db.Update(func(tx *bolt.Tx) error {
		bucket, err := b.getFileBucket(tx)
		if err != nil {
			return err
		}

		val := bucket.Get([]byte(filename))
		if val == nil {
			return fmt.Errorf("file not found")
		}

		// If the file is a parent, promote its children.
		if len(val) == 0 {
			c := bucket.Cursor()
			for k, v := c.First(); k != nil; k, v = c.Next() {
				if string(v) == filename {
					if err := bucket.Put(k, []byte{}); err != nil {
						return err
					}
				}
			}
		}

		return bucket.Delete([]byte(filename))
	})
}

// Exists checks if a file is in the database.
func (b *BoltFileDB) Exists(filename string) (bool, error) {
	var exists bool
	err := b.db.View(func(tx *bolt.Tx) error {
		bucket, err := b.getFileBucket(tx)
		if err != nil {
			return err
		}

		exists = bucket.Get([]byte(filename)) != nil
		return nil
	})
	if err != nil {
		return false, err
	}
	return exists, nil
}

// Rename changes the name of a file.
// If a parent is renamed, all its children's parent references are updated.
func (b *BoltFileDB) Rename(oldName, newName string) error {
	return b.db.Update(func(tx *bolt.Tx) error {
		bucket, err := b.getFileBucket(tx)
		if err != nil {
			return err
		}

		val := bucket.Get([]byte(oldName))
		if val == nil {
			return fmt.Errorf("file to rename not found")
		}

		if bucket.Get([]byte(newName)) != nil {
			return fmt.Errorf("new filename already exists")
		}

		// If it's a parent, update all children.
		if len(val) == 0 {
			c := bucket.Cursor()
			for k, v := c.First(); k != nil; k, v = c.Next() {
				if string(v) == oldName {
					if err := bucket.Put(k, []byte(newName)); err != nil {
						return err
					}
				}
			}
		}

		if err := bucket.Put([]byte(newName), val); err != nil {
			return err
		}

		return bucket.Delete([]byte(oldName))
	})
}

func (b *BoltFileDB) getFileBucket(tx *bolt.Tx) (*bolt.Bucket, error) {
	bucket := tx.Bucket([]byte((fileBucket)))
	if bucket == nil {
		return nil, fmt.Errorf("bucket not found")
	}
	return bucket, nil
}
