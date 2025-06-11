package docker

import (
	"github.com/docker/docker/client"
	"github.com/rs/zerolog/log"
)

type Service struct {
	client *client.Client
}

func NewService() *Service {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to local client")
	}

	return &Service{client: cli}
}

//func (s *Service) StartStack(projectname, filename string) error {
//	options, err := cli.NewProjectOptions(
//		[]string{filename},
//		cli.WithOsEnv,
//		cli.WithDotEnv,
//		cli.WithName(projectname),
//	)
//	if err != nil {
//		return err
//	}
//
//	project, err := options.LoadProject(context.Background())
//	if err != nil {
//		return err
//	}
//	p, err := loader.LoadWithContext(context.Background(), configDetails, func(options *loader.Options) {
//		options.SetProjectName(projectName, true)
//	})
//	return nil
//}
//
//func createDockerService() (api.Service, error) {
//	var srv api.Service
//	dockerCli, err := command.NewDockerCli()
//	if err != nil {
//		return srv, err
//	}
//
//	dockerContext := "default"
//
//	//Magic line to fix error:
//	//Failed to initialize: unable to resolve docker endpoint: no context store initialized
//	myOpts := &flags.ClientOptions{Context: dockerContext, LogLevel: "error"}
//	err = dockerCli.Initialize(myOpts)
//	if err != nil {
//		return srv, err
//	}
//
//	srv = compose.NewComposeService(dockerCli)
//
//	return srv, nil
//}
