package updater

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"github.com/google/go-github/v73/github"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const (
	owner        = "youruser" // Change this to your GitHub username/org
	repo         = "yourrepo" // Change this to your repository name
	binaryName   = "myapp"    // Change this to your binary name
	tempSuffix   = ".tmp"
	backupSuffix = ".backup"
)

type Updater struct {
	client         *github.Client
	ctx            context.Context
	currentVersion string
	executablePath string
	owner          string
	repo           string
}

func NewUpdater(version string, githubToken string) (*Updater, error) {
	execPath, err := os.Executable()
	if err != nil {
		return nil, fmt.Errorf("failed to get executable path: %w", err)
	}

	ctx := context.Background()
	var client *github.Client

	if githubToken != "" {
		// Authenticated client for higher rate limits and private repos
		client = github.NewClient(nil).WithAuthToken(githubToken)
	} else {
		// Unauthenticated client for public repos
		client = github.NewClient(nil)
	}

	return &Updater{
		client:         client,
		ctx:            ctx,
		currentVersion: version,
		executablePath: execPath,
		owner:          owner,
		repo:           repo,
	}, nil
}

func (u *Updater) CheckForUpdate() (*github.RepositoryRelease, error) {
	fmt.Println("Checking for updates...")

	// Get the latest release
	release, _, err := u.client.Repositories.GetLatestRelease(u.ctx, u.owner, u.repo)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch latest release: %w", err)
	}

	if release.TagName == nil {
		return nil, fmt.Errorf("release has no tag name")
	}

	latestVersion := *release.TagName
	if latestVersion == u.currentVersion {
		fmt.Printf("Already on latest version: %s\n", u.currentVersion)
		return nil, nil
	}

	fmt.Printf("New version available: %s (current: %s)\n", latestVersion, u.currentVersion)
	return release, nil
}

func (u *Updater) findAssets(release *github.RepositoryRelease) (*github.ReleaseAsset, *github.ReleaseAsset, error) {
	var binaryAsset, checksumAsset *github.ReleaseAsset

	osArch := fmt.Sprintf("%s_%s", runtime.GOOS, runtime.GOARCH)

	for _, asset := range release.Assets {
		if asset.Name == nil {
			continue
		}

		name := strings.ToLower(*asset.Name)

		// Find binary asset
		if strings.Contains(name, binaryName) && strings.Contains(name, osArch) {
			if runtime.GOOS == "windows" && strings.HasSuffix(name, ".exe") {
				binaryAsset = asset
			} else if runtime.GOOS != "windows" && !strings.HasSuffix(name, ".exe") {
				binaryAsset = asset
			}
		}

		// Find checksum asset
		if strings.Contains(name, "checksums") || strings.Contains(name, "sha256") {
			checksumAsset = asset
		}
	}

	if binaryAsset == nil {
		return nil, nil, fmt.Errorf("no binary found for %s", osArch)
	}

	return binaryAsset, checksumAsset, nil
}

func (u *Updater) downloadAsset(asset *github.ReleaseAsset, destPath string) error {
	if asset == nil || asset.Name == nil {
		return fmt.Errorf("invalid asset")
	}

	fmt.Printf("Downloading %s...\n", *asset.Name)

	// Get download URL
	reader, redirectURL, err := u.client.Repositories.DownloadReleaseAsset(u.ctx, u.owner, u.repo, *asset.ID, http.DefaultClient)
	if err != nil {
		return fmt.Errorf("failed to get download URL: %w", err)
	}

	var resp *http.Response
	if reader != nil {
		// Direct download
		defer reader.Close()

		out, err := os.Create(destPath)
		if err != nil {
			return fmt.Errorf("failed to create file: %w", err)
		}
		defer out.Close()

		_, err = io.Copy(out, reader)
		return err
	} else if redirectURL != "" {
		// Redirect URL
		resp, err = http.Get(redirectURL)
		if err != nil {
			return fmt.Errorf("failed to download from redirect URL: %w", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return fmt.Errorf("download failed with status: %d", resp.StatusCode)
		}

		out, err := os.Create(destPath)
		if err != nil {
			return fmt.Errorf("failed to create file: %w", err)
		}
		defer out.Close()

		_, err = io.Copy(out, resp.Body)
		return err
	}

	return fmt.Errorf("no download method available")
}

func (u *Updater) downloadBinary(release *github.RepositoryRelease) (string, string, error) {
	binaryAsset, checksumAsset, err := u.findAssets(release)
	if err != nil {
		return "", "", err
	}

	// Download binary
	binaryPath := filepath.Join(os.TempDir(), *binaryAsset.Name+tempSuffix)
	if err := u.downloadAsset(binaryAsset, binaryPath); err != nil {
		return "", "", fmt.Errorf("failed to download binary: %w", err)
	}

	// Download checksum file if available
	var checksumPath string
	if checksumAsset != nil {
		checksumPath = filepath.Join(os.TempDir(), *checksumAsset.Name)
		if err := u.downloadAsset(checksumAsset, checksumPath); err != nil {
			fmt.Printf("Warning: failed to download checksum file: %v\n", err)
			checksumPath = ""
		}
	}

	return binaryPath, checksumPath, nil
}

func (u *Updater) verifyChecksum(binaryPath, checksumPath string) error {
	if checksumPath == "" {
		fmt.Println("Warning: No checksum file available, skipping verification")
		return nil
	}

	fmt.Println("Verifying checksum...")

	// Calculate SHA256 of downloaded binary
	file, err := os.Open(binaryPath)
	if err != nil {
		return fmt.Errorf("failed to open binary for checksum: %w", err)
	}
	defer file.Close()

	hasher := sha256.New()
	if _, err := io.Copy(hasher, file); err != nil {
		return fmt.Errorf("failed to calculate checksum: %w", err)
	}
	calculatedChecksum := hex.EncodeToString(hasher.Sum(nil))

	// Read expected checksum
	checksumData, err := os.ReadFile(checksumPath)
	if err != nil {
		return fmt.Errorf("failed to read checksum file: %w", err)
	}

	// Parse checksum file (assumes format: "checksum filename")
	binaryFilename := filepath.Base(strings.TrimSuffix(binaryPath, tempSuffix))
	expectedChecksum := ""

	lines := strings.Split(string(checksumData), "\n")
	for _, line := range lines {
		if strings.Contains(line, binaryFilename) {
			parts := strings.Fields(line)
			if len(parts) >= 1 {
				expectedChecksum = parts[0]
				break
			}
		}
	}

	if expectedChecksum == "" {
		return fmt.Errorf("checksum not found for %s", binaryFilename)
	}

	if calculatedChecksum != expectedChecksum {
		return fmt.Errorf("checksum mismatch: expected %s, got %s", expectedChecksum, calculatedChecksum)
	}

	fmt.Println("Checksum verified successfully")
	return nil
}

func (u *Updater) replaceBinary(newBinaryPath string) error {
	fmt.Println("Replacing binary...")

	// Create backup of current binary
	backupPath := u.executablePath + backupSuffix
	if err := u.copyFile(u.executablePath, backupPath); err != nil {
		return fmt.Errorf("failed to create backup: %w", err)
	}

	// Make new binary executable
	if err := os.Chmod(newBinaryPath, 0755); err != nil {
		return fmt.Errorf("failed to make binary executable: %w", err)
	}

	// Replace current binary
	if err := u.copyFile(newBinaryPath, u.executablePath); err != nil {
		// Restore backup on failure
		u.copyFile(backupPath, u.executablePath)
		return fmt.Errorf("failed to replace binary: %w", err)
	}

	// Clean up
	os.Remove(newBinaryPath)
	os.Remove(backupPath)

	fmt.Println("Binary updated successfully")
	return nil
}

func (u *Updater) copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	if err != nil {
		return err
	}

	// Copy permissions
	sourceInfo, err := os.Stat(src)
	if err != nil {
		return err
	}
	return os.Chmod(dst, sourceInfo.Mode())
}

func (u *Updater) restartProcess() error {
	fmt.Println("Restarting process...")

	// Get current process arguments
	args := os.Args

	// Start new process
	cmd := exec.Command(args[0], args[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start new process: %w", err)
	}

	// Exit current process
	os.Exit(0)
	return nil
}

func (u *Updater) Update() error {
	// Check for updates
	release, err := u.CheckForUpdate()
	if err != nil {
		return err
	}

	if release == nil {
		return nil // No update available
	}

	// Download new binary and checksum
	binaryPath, checksumPath, err := u.downloadBinary(release)
	if err != nil {
		return err
	}
	defer func() {
		os.Remove(binaryPath)
		if checksumPath != "" {
			os.Remove(checksumPath)
		}
	}()

	// Verify checksum
	if err := u.verifyChecksum(binaryPath, checksumPath); err != nil {
		return err
	}

	// Replace binary
	if err := u.replaceBinary(binaryPath); err != nil {
		return err
	}

	// Restart process
	return u.restartProcess()
}

func (u *Updater) GetReleaseInfo() (*github.RepositoryRelease, error) {
	release, _, err := u.client.Repositories.GetLatestRelease(u.ctx, u.owner, u.repo)
	return release, err
}

func (u *Updater) ListReleases(page, perPage int) ([]*github.RepositoryRelease, error) {
	opt := &github.ListOptions{
		Page:    page,
		PerPage: perPage,
	}
	releases, _, err := u.client.Repositories.ListReleases(u.ctx, u.owner, u.repo, opt)
	return releases, err
}

// Example usage in your main application
func main() {
	// Get GitHub token from environment (optional, for higher rate limits)
	githubToken := os.Getenv("GITHUB_TOKEN")

	// Check if this is an update command
	if len(os.Args) > 1 && os.Args[1] == "update" {
		updater, err := NewUpdater("v1.0.0", githubToken) // Your current version
		if err != nil {
			fmt.Printf("Failed to create updater: %v\n", err)
			os.Exit(1)
		}

		if err := updater.Update(); err != nil {
			fmt.Printf("Update failed: %v\n", err)
			os.Exit(1)
		}
		return
	}

	// Check if this is a version info command
	if len(os.Args) > 1 && os.Args[1] == "version" {
		updater, err := NewUpdater("v1.0.0", githubToken)
		if err != nil {
			fmt.Printf("Failed to create updater: %v\n", err)
			os.Exit(1)
		}

		release, err := updater.GetReleaseInfo()
		if err != nil {
			fmt.Printf("Failed to get release info: %v\n", err)
			os.Exit(1)
		}

		fmt.Printf("Current version: v1.0.0\n")
		if release.TagName != nil {
			fmt.Printf("Latest version: %s\n", *release.TagName)
		}
		if release.PublishedAt != nil {
			fmt.Printf("Published: %s\n", release.PublishedAt.Format(time.RFC3339))
		}
		if release.Body != nil && *release.Body != "" {
			fmt.Printf("Release notes:\n%s\n", *release.Body)
		}
		return
	}

	// Your normal application logic here
	fmt.Println("Application running...")
	fmt.Println("Commands:")
	fmt.Println("  update  - Check for and install updates")
	fmt.Println("  version - Show version information")

	// Example of checking for updates on startup (optional)
	go func() {
		time.Sleep(5 * time.Second) // Wait a bit before checking
		updater, err := NewUpdater("v1.0.0", githubToken)
		if err != nil {
			return
		}

		if release, err := updater.CheckForUpdate(); err == nil && release != nil {
			fmt.Printf("\nUpdate available: %s. Run '%s update' to update.\n",
				*release.TagName, os.Args[0])
		}
	}()

	// Keep the application running
	select {}
}
