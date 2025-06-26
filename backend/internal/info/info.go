package info

import (
	"fmt"
	"math/rand/v2"
	"os"
	"path/filepath"
	"strings"
)

const (
	width      = 90
	colorReset = "\033[0m"
	// Nord color palette ANSI equivalents
	nord4  = "\033[38;5;188m" // Snow Storm (darkest) - main text color
	nord8  = "\033[38;5;110m" // Frost - light blue
	nord9  = "\033[38;5;111m" // Frost - blue
	nord10 = "\033[38;5;111m" // Frost - deep blue
	nord15 = "\033[38;5;139m" // Aurora - purple
)

// build args to modify vars
//
// -X github.com/RA341/dockman/internal/info.Version=${VERSION} \
// -X github.com/RA341/dockman/internal/info.CommitInfo=${COMMIT_INFO} \
// -X github.com/RA341/dockman/internal/info.BuildDate=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
// -X github.com/RA341/dockman/internal/info.Branch=${BRANCH}" \
// cmd/server.go

// headers
// generated from https://patorjk.com/software/taag/#p=testall&f=Graffiti&t=dockman%0A
var headers = []string{
	// contains some characters that mess with multiline strings leave this alone
	" \n         8I                         ,dPYb,                                                 \n         8I                         IP'`Yb\n\t8I                         I8  8I\n\t8I                         I8  8bgg,\n\t,gggg,8I    ,ggggg,      ,gggg,  I8 dP\" \"8   ,ggg,,ggg,,ggg,     ,gggg,gg   ,ggg,,ggg,\n\tdP\"  \"Y8I   dP\"  \"Y8ggg  dP\"  \"Yb I8d8bggP\"  ,8\" \"8P\" \"8P\" \"8,   dP\"  \"Y8I  ,8\" \"8P\" \"8, \n\ti8'    ,8I  i8'    ,8I   i8'       I8P' \"Yb,  I8   8I   8I   8I  i8'    ,8I  I8   8I   8I \n\t,d8,   ,d8b,,d8,   ,d8'  ,d8,_    _,d8    `Yb,,dP   8I   8I   Yb,,d8,   ,d8b,,dP   8I   Yb,\n\tP\"Y8888P\"`Y8P\"Y8888P\"    P\"\"Y8888PP88P      Y88P'   8I   8I   `Y8P\"Y8888P\"`Y88P'   8I   `Y8\n",
	`
       /$$                     /$$                                        
      | $$                    | $$                                        
  /$$$$$$$  /$$$$$$   /$$$$$$$| $$   /$$ /$$$$$$/$$$$   /$$$$$$  /$$$$$$$ 
 /$$__  $$ /$$__  $$ /$$_____/| $$  /$$/| $$_  $$_  $$ |____  $$| $$__  $$
| $$  | $$| $$  \ $$| $$      | $$$$$$/ | $$ \ $$ \ $$  /$$$$$$$| $$  \ $$
| $$  | $$| $$  | $$| $$      | $$_  $$ | $$ | $$ | $$ /$$__  $$| $$  | $$
|  $$$$$$$|  $$$$$$/|  $$$$$$$| $$ \  $$| $$ | $$ | $$|  $$$$$$$| $$  | $$
 \_______/ \______/  \_______/|__/  \__/|__/ |__/ |__/ \_______/|__/  |__/`,
	`
 ________      ______    ______   __   ___  ___      ___       __      _____  ___   
|"      "\    /    " \  /" _  "\ |/"| /  ")|"  \    /"  |     /""\    (\"   \|"  \  
(.  ___  :)  // ____  \(: ( \___)(: |/   /  \   \  //   |    /    \   |.\\   \    | 
|: \   ) || /  /    ) :)\/ \     |    __/   /\\  \/.    |   /' /\  \  |: \.   \\  | 
(| (___\ ||(: (____/ // //  \ _  (// _  \  |: \.        |  //  __'  \ |.  \    \. | 
|:       :) \        / (:   _) \ |: | \  \ |.  \    /:  | /   /  \\  \|    \    \ | 
(________/   \"_____/   \_______)(__|  \__)|___|\__/|___|(___/    \___)\___|\____\)
`,
	`
██████╗  ██████╗  ██████╗██╗  ██╗███╗   ███╗ █████╗ ███╗   ██╗
██╔══██╗██╔═══██╗██╔════╝██║ ██╔╝████╗ ████║██╔══██╗████╗  ██║
██║  ██║██║   ██║██║     █████╔╝ ██╔████╔██║███████║██╔██╗ ██║
██║  ██║██║   ██║██║     ██╔═██╗ ██║╚██╔╝██║██╔══██║██║╚██╗██║
██████╔╝╚██████╔╝╚██████╗██║  ██╗██║ ╚═╝ ██║██║  ██║██║ ╚████║
╚═════╝  ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
`,
	`
      :::::::::   ::::::::   ::::::::  :::    :::   :::   :::       :::     ::::    ::: 
     :+:    :+: :+:    :+: :+:    :+: :+:   :+:   :+:+: :+:+:    :+: :+:   :+:+:   :+:  
    +:+    +:+ +:+    +:+ +:+        +:+  +:+   +:+ +:+:+ +:+  +:+   +:+  :+:+:+  +:+   
   +#+    +:+ +#+    +:+ +#+        +#++:++    +#+  +:+  +#+ +#++:++#++: +#+ +:+ +#+    
  +#+    +#+ +#+    +#+ +#+        +#+  +#+   +#+       +#+ +#+     +#+ +#+  +#+#+#     
 #+#    #+# #+#    #+# #+#    #+# #+#   #+#  #+#       #+# #+#     #+# #+#   #+#+#      
#########   ########   ########  ###    ### ###       ### ###     ### ###    ####
`,
	`
      ___           ___           ___           ___           ___           ___           ___     
     /\  \         /\  \         /\  \         /\__\         /\__\         /\  \         /\__\    
    /::\  \       /::\  \       /::\  \       /:/  /        /::|  |       /::\  \       /::|  |   
   /:/\:\  \     /:/\:\  \     /:/\:\  \     /:/__/        /:|:|  |      /:/\:\  \     /:|:|  |   
  /:/  \:\__\   /:/  \:\  \   /:/  \:\  \   /::\__\____   /:/|:|__|__   /::\~\:\  \   /:/|:|  |__ 
 /:/__/ \:|__| /:/__/ \:\__\ /:/__/ \:\__\ /:/\:::::\__\ /:/ |::::\__\ /:/\:\ \:\__\ /:/ |:| /\__\
 \:\  \ /:/  / \:\  \ /:/  / \:\  \  \/__/ \/_|:|~~|~    \/__/~~/:/  / \/__\:\/:/  / \/__|:|/:/  /
  \:\  /:/  /   \:\  /:/  /   \:\  \          |:|  |           /:/  /       \::/  /      |:/:/  / 
   \:\/:/  /     \:\/:/  /     \:\  \         |:|  |          /:/  /        /:/  /       |::/  /  
    \::/__/       \::/  /       \:\__\        |:|  |         /:/  /        /:/  /        /:/  /   
     ~~            \/__/         \/__/         \|__|         \/__/         \/__/         \/__/
`,
}

func PrintInfo() {
	equalDivider := nord9 + strings.Repeat("=", width) + colorReset
	dashDivider := nord10 + strings.Repeat("-", width) + colorReset

	fmt.Println(equalDivider)
	fmt.Printf("%s%s %s %s\n", nord15, strings.Repeat(" ", (width-24)/2), (headers[rand.IntN(len(headers))]), colorReset)
	fmt.Println(equalDivider)

	// Print app info with aligned values
	printField := func(name, value string) {
		fmt.Printf("%s%-15s: %s%s%s\n", nord4, name, nord8, value, colorReset)
	}

	printField("Version", Version)
	printField("Flavour", string(Flavour))
	printField("BinaryPath", filepath.Base(os.Args[0]))
	printField("BuildDate", formatTime(BuildDate))

	fmt.Println(equalDivider)

	printField("Branch", Branch)
	printField("CommitInfo", CommitInfo)
	printField("Source Hash", SourceHash)
	printField("GoVersion", GoVersion)

	// ignore the warning this will be set when compiling
	if Branch != "unknown" && CommitInfo != "unknown" {
		fmt.Println(dashDivider)
		var baseRepo = fmt.Sprintf("https://github.com/RA341/gouda")
		branchURL := fmt.Sprintf("%s/tree/%s", baseRepo, Branch)
		commitURL := fmt.Sprintf("%s/commit/%s", baseRepo, CommitInfo)

		printField("Repo", baseRepo)
		printField("Branch", branchURL)
		printField("Commit", commitURL)
	}

	fmt.Println(equalDivider)
}
