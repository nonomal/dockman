package cmd

import "flag"

func LoadArgs() *string {
	uiPath := flag.String("ui", "dist", "define the frontend file path, -ui")
	flag.Parse()
	return uiPath
}
