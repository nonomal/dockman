package cmd

import "flag"

func LoadArgs() (*string, *string) {
	uiPath := flag.String(
		"ui",
		"dist",
		"define the frontend file path, -ui",
	)

	composeRoot := flag.String(
		"cr",
		"dockman",
		"where dockman will look for your compose files, -compose",
	)

	flag.Parse()
	return uiPath, composeRoot
}
