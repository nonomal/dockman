package info

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func TestGetGitHubChangelog(t *testing.T) {
	changelog, err := GetGitHubChangelog("https://github.com/RA341/dockman", "v1.1.0")
	require.NoError(t, err)

	t.Log(changelog)
}
