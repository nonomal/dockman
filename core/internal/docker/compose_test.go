package docker

import (
	"github.com/compose-spec/compose-go/v2/types"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestTrimDockman(t *testing.T) {
	proj := types.Project{
		Services: map[string]types.ServiceConfig{
			"dockman": {
				Image: "ghcr.io/ra341/dockman",
			},
			"alpine": {
				Image: "alpine",
			},
			"alpine2": {
				Image: "ghcr.io/ra341/alpine",
			},
		},
	}

	trimDockman(&proj)

	_, ok := proj.Services["dockman"]
	assert.Equal(t, false, ok)

	_, ok = proj.Services["alpine"]
	assert.Equal(t, true, ok)

	_, ok = proj.Services["alpine2"]
	assert.Equal(t, true, ok)

}
