package files

const dockmanYamlFileYml = ".dockman.yml"
const dockmanYamlFileYaml = ".dockman.yaml"

type DockmanYaml struct {
	// define a custom sort to pin certain files when displaying
	PinnedFiles map[string]int `yaml:"pinnedFiles"`
	// use compose folders https://dockman.radn.dev/docs/file-layout/customize#compose-folders
	UseComposeFolders bool `yaml:"useComposeFolders"`

	// configure volumes page
	VolumesPage VolumesConfig `yaml:"volumes"`

	// configure network page
	NetworkPage NetworkConfig `yaml:"network"`

	// configure image page
	ImagePage ImageConfig `yaml:"image"`

	ContainerPage ContainerConfig `yaml:"container"`
}

type VolumesConfig struct {
	Sort Sort `yaml:"sort"`
}

type ContainerConfig struct {
	Sort Sort `yaml:"sort"`
}

type NetworkConfig struct {
	Sort Sort `yaml:"sort"`
}

type ImageConfig struct {
	Sort Sort `yaml:"sort"`
}

type Sort struct {
	Order string `yaml:"order"`
	Field string `yaml:"field"`
}
