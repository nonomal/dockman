package compose

import (
	"github.com/RA341/dockman/pkg"
	"github.com/stretchr/testify/require"
	"testing"
)

func setupConfig() *FileAssociations {
	c := &FileAssociations{
		files: &pkg.Map[string, string]{},
	}
	c.files.Store("parent1", "")
	c.files.Store("child1_1", "parent1")
	c.files.Store("child1_2", "parent1")
	c.files.Store("parent2", "")
	c.files.Store("child2_1", "parent2")
	return c
}

func TestConfig_Insert(t *testing.T) {
	t.Run("should insert a new file successfully", func(t *testing.T) {
		c := &FileAssociations{
			files: &pkg.Map[string, string]{},
		}
		err := c.Insert("newFile", "parent")
		if err != nil {
			t.Errorf("Insert() error = %v, wantErr %v", err, false)
		}

		val, ok := c.files.Load("newFile")
		if !ok || val != "parent" {
			t.Errorf("File was not inserted correctly")
		}
	})

	t.Run("should return error when file already exists", func(t *testing.T) {
		c := setupConfig()
		err := c.Insert("parent1", "")
		if err == nil {
			t.Errorf("Insert() error = %v, wantErr %v", err, true)
		}
	})
}

func TestConfig_List(t *testing.T) {
	c := setupConfig()
	err := c.Insert("orphan", "")
	require.NoError(t, err)

	got := c.List()

	want := map[string][]string{
		"parent1": {"child1_1", "child1_2"},
		"parent2": {"child2_1"},
		"orphan":  {},
	}

	require.Equal(t, want, got)
}

func TestConfig_Delete(t *testing.T) {
	t.Run("should delete a file and update its children", func(t *testing.T) {
		c := setupConfig()

		// Delete parent1
		c.Delete("parent1")

		// Verify parent1 is deleted
		if _, ok := c.files.Load("parent1"); ok {
			t.Errorf("Delete() failed to remove the key 'parent1'")
		}

		// Verify children of parent1 are now parentless
		child1_1_parent, _ := c.files.Load("child1_1")
		if child1_1_parent != "" {
			t.Errorf("Child 'child1_1' parent = %v, want empty string", child1_1_parent)
		}

		child1_2_parent, _ := c.files.Load("child1_2")
		if child1_2_parent != "" {
			t.Errorf("Child 'child1_2' parent = %v, want empty string", child1_2_parent)
		}
	})

	t.Run("should delete a child file without affecting others", func(t *testing.T) {
		c := setupConfig()
		c.Delete("child1_1")

		if _, ok := c.files.Load("child1_1"); ok {
			t.Errorf("Delete() failed to remove the key 'child1_1'")
		}

		if _, ok := c.files.Load("parent1"); !ok {
			t.Errorf("'parent1' was deleted when it should not have been")
		}
	})
}

func TestConfig_Rename(t *testing.T) {
	t.Run("should return error if file to rename does not exist", func(t *testing.T) {
		c := setupConfig()
		err := c.Rename("nonexistent", "newName")
		if err == nil {
			t.Errorf("Rename() error = %v, wantErr %v", err, true)
		}
	})

	t.Run("should rename a file and update its children", func(t *testing.T) {
		c := setupConfig()
		err := c.Rename("parent1", "renamedParent")
		if err != nil {
			t.Errorf("Rename() error = %v, wantErr %v", err, false)
		}

		// Verify old name is gone
		if _, ok := c.files.Load("parent1"); ok {
			t.Errorf("Rename() did not delete the old key 'parent1'")
		}

		// Verify new name exists
		if _, ok := c.files.Load("renamedParent"); !ok {
			t.Errorf("Rename() did not create the new key 'renamedParent'")
		}

		// Verify children are updated
		child1_1_parent, _ := c.files.Load("child1_1")
		if child1_1_parent != "renamedParent" {
			t.Errorf("Child 'child1_1' parent = %v, want 'renamedParent'", child1_1_parent)
		}

		child1_2_parent, _ := c.files.Load("child1_2")
		if child1_2_parent != "renamedParent" {
			t.Errorf("Child 'child1_2' parent = %v, want 'renamedParent'", child1_2_parent)
		}
	})
}
