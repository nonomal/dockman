package config

import (
	"errors"
	"fmt"
	"strings"
)

var ErrGroupExists = errors.New("group already exists use a different name")
var ErrGroupNotExists = errors.New("group does not exist")
var ErrFileAddrDecode = errors.New("invalid path format, use 'parentFile/subFile' or 'parentFile'")
var ErrChildNotFound = errors.New("child not found in parent")
var ErrInvalidRename = errors.New("invalid rename new location must have a common child or parent")

func wrapError(err error, format string, a ...any) error {
	return fmt.Errorf("%q: %w", fmt.Sprintf(format, a...), err)
}

const delimiter = "/"

type FileGroup struct {
	SubFiles map[string]interface{}
}

type FileManager struct {
	// group name mapped to the FileGroup struct
	Files map[string]*FileGroup
}

func NewFileManager() *FileManager {
	return &FileManager{make(map[string]*FileGroup)}
}

func (fm *FileManager) Insert(fileAddr string) error {
	parent, child, err := decodeFileNames(fileAddr)
	if err != nil {
		return err
	}

	var subFile = make(map[string]interface{})
	if child != "" {
		subFile[child] = nil
	}

	fm.Files[parent] = &FileGroup{SubFiles: subFile}
	return nil
}

func (fm *FileManager) GetParent(fileAddr string) (*FileGroup, error) {
	parent, _, err := decodeFileNames(fileAddr)
	if err != nil {
		return nil, err
	}

	parentGroup, ok := fm.Files[parent]
	if !ok {
		return nil, wrapError(ErrGroupNotExists, "%s", parent)
	}

	return parentGroup, nil
}
func (fm *FileManager) GetChild(fileAddr string) (string, error) {
	parent, child, err := decodeFileNames(fileAddr)
	if err != nil {
		return "", err
	}

	parentGroup, ok := fm.Files[parent]
	if !ok {
		return "", wrapError(ErrGroupNotExists, "%s", parent)
	}

	if _, ok = parentGroup.SubFiles[child]; !ok {
		return "", wrapError(
			ErrChildNotFound,
			"parent: %s !! child: %s", parent, child,
		)
	}

	return child, nil
}

func (fm *FileManager) Rename(oldName, newName string) error {
	oldParent, oldChild, err := decodeFileNames(oldName)
	if err != nil {
		return fmt.Errorf("failed to decode old name: %w", err)
	}

	newParent, newChild, err := decodeFileNames(newName)
	if err != nil {
		return fmt.Errorf("failed to decode new name: %w", err)
	}

	isRename := oldChild != newChild
	isMove := oldParent != newParent

	// A valid operation is a rename OR a move, but not both simultaneously.
	if isRename && isMove {
		return wrapError(ErrInvalidRename, oldName, newName)
	}

	if !isRename && !isMove {
		// Names are identical
		return nil
	}

	if isRename {
		// child changes, parent is the same
		// Verify the child exists.
		if _, err := fm.GetChild(oldName); err != nil {
			return wrapError(err, "failed to find original item %s", oldName)
		}

		if err := fm.Insert(newName); err != nil {
			return wrapError(err, "failed to insert new item %s", newName)
		}

		if err := fm.Delete(oldName); err != nil {
			return wrapError(err, "failed to delete old item %s", oldName)
		}
	}

	if isMove {
		// parent changes, child is same
		oldParentGroup, err := fm.GetParent(oldParent)
		if err != nil {
			return fmt.Errorf("failed to get parent %s: %w", oldParent, err)
		}

		fm.Files[newParent] = oldParentGroup
		delete(fm.Files, oldParent)
	}

	return nil
}

func (fm *FileManager) Delete(fileAddr string) error {
	parent, child, err := decodeFileNames(fileAddr)
	if err != nil {
		return fmt.Errorf("error decoding oldname: %v", err)
	}

	if child != "" {
		// remove only child
		parentGroup, err := fm.GetParent(parent)
		if err != nil {
			return err
		}

		delete(parentGroup.SubFiles, child)
		return nil
	}

	// remove parent
	delete(fm.Files, parent)
	return nil
}

func decodeFileNames(input string) (root string, subfile string, err error) {
	val := strings.Split(input, delimiter)

	if val[0] == "" {
		return "", "", wrapError(
			ErrFileAddrDecode,
			"parent was empty %s", val,
		)
	}

	if len(val) == 1 {
		return val[0], "", err
	}

	if len(val) == 2 {
		return val[0], val[1], err
	}

	return "", "", wrapError(ErrFileAddrDecode, "%s %s", input, val)
}
