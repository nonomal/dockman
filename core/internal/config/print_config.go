package config

import (
	"fmt"
	"reflect"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"
)

// --- ANSI Color Constants ---
const (
	ColorReset     = "\033[0m"
	ColorBold      = "\033[1m"
	ColorUnderline = "\033[4m"

	ColorRed     = "\033[31m"
	ColorGreen   = "\033[32m" // For string values
	ColorYellow  = "\033[33m" // For bools
	ColorBlue    = "\033[34m" // For keys
	ColorMagenta = "\033[35m" // For numbers
	ColorCyan    = "\033[36m"
)

// KeyValue A simple struct to hold our flattened key-value pairs before formatting.
type KeyValue struct {
	Key         string
	Value       string
	HelpMessage string
	EnvName     string
}

// flattenStruct recursively traverses a struct and returns a flat list of KeyValue pairs.
func flattenStruct(v reflect.Value, prefix string) []KeyValue {
	// If it's a pointer, dereference it.
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}

	var pairs []KeyValue

	t := v.Type()
	for i := 0; i < v.NumField(); i++ {
		fieldT := t.Field(i)
		fieldV := v.Field(i)

		// Get the json tag and skip if marked with "-"
		jsonTag := fieldT.Tag.Get("json")
		if jsonTag == "-" {
			continue
		}

		keyName := strings.Split(jsonTag, ",")[0]
		if keyName == "" {
			keyName = fieldT.Name // Fallback to field name
		}

		configTag := fieldT.Tag.Get("config")
		if configTag == "" {
			continue // Skip fields without the config tag
		}
		configTags := parseTag(configTag)
		usage := configTags["usage"]
		hide := configTags["hide"]
		envName := colorize(fmt.Sprintf("%s_%s", envPrefix, configTags["env"]), ColorCyan)
		message := fmt.Sprintf("%s", colorize(usage, ColorBlue))

		// Create the full key path (e.g., "database.host")
		fullKey := keyName
		if prefix != "" {
			fullKey = prefix + "." + keyName
		}

		var val KeyValue

		switch fieldV.Kind() {
		case reflect.Struct:
			// Recurse into nested structs
			nestedPairs := flattenStruct(fieldV, fullKey)
			pairs = append(pairs, nestedPairs...)
		case reflect.Slice:
			// Format slices as comma-separated strings
			var sliceItems []string
			for j := 0; j < fieldV.Len(); j++ {
				sliceItems = append(sliceItems, formatSimpleValue(fieldV.Index(j)))
			}
			val = KeyValue{
				Key:         fullKey,
				Value:       strings.Join(sliceItems, ", "),
				HelpMessage: message,
				EnvName:     envName,
			}
		default:
			// Handle simple types
			val = KeyValue{
				Key:         fullKey,
				Value:       formatSimpleValue(fieldV),
				HelpMessage: message,
				EnvName:     envName,
			}
		}

		if hide != "" {
			val.Value = colorize("*REDACTED* ^_^", ColorRed)
		}
		pairs = append(pairs, val)
	}
	return pairs
}

// formatSimpleValue converts a reflect.Value of a simple type to a colored string.
func formatSimpleValue(v reflect.Value) string {
	switch v.Kind() {
	case reflect.String:
		return colorize(v.String(), ColorGreen)
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return colorize(strconv.FormatInt(v.Int(), 10), ColorMagenta)
	case reflect.Bool:
		return colorize(strconv.FormatBool(v.Bool()), ColorYellow)
	default:
		if v.IsValid() {
			return v.String()
		}
		return colorize("null", "red") // Should not happen with valid structs
	}
}

// A simple helper to wrap a string in a color and reset it.
func colorize(s, color string) string {
	return color + s + ColorReset
}

const (
	topLeft     = "╭"
	topRight    = "╮"
	bottomLeft  = "╰"
	bottomRight = "╯"
	horizontal  = "─"
	vertical    = "│"
	space       = " "
	hPadding    = 2 // Horizontal padding on each side
	vPadding    = 1 // Vertical padding (empty lines top/bottom)
)

// --- Box Drawing Code (Unchanged) ---
var ansiRegex = regexp.MustCompile(`\x1b\[[0-9;]*[mK]`)

func printInBox(title, content string) {
	lines := strings.Split(content, "\n")
	maxWidth := utf8.RuneCountInString(title)
	for _, line := range lines {
		cleanLine := ansiRegex.ReplaceAllString(line, "")
		if width := utf8.RuneCountInString(cleanLine); width > maxWidth {
			maxWidth = width
		}
	}
	innerWidth := maxWidth + (hPadding * 2)

	titleBar := buildTitleBar(title, innerWidth, horizontal, space)
	fmt.Println(topLeft + titleBar + topRight)

	printPaddedLine(innerWidth, vertical, space)

	for _, line := range lines {
		cleanLine := ansiRegex.ReplaceAllString(line, "")
		visibleWidth := utf8.RuneCountInString(cleanLine)
		paddingNeeded := innerWidth - visibleWidth

		fmt.Printf("%s%s%s%s%s\n",
			vertical,
			strings.Repeat(space, hPadding),
			line,
			strings.Repeat(space, paddingNeeded-hPadding),
			vertical,
		)
	}

	printPaddedLine(innerWidth, vertical, space)
	fmt.Println(bottomLeft + strings.Repeat(horizontal, innerWidth) + bottomRight)
}

func buildTitleBar(title string, innerWidth int, char, space string) string {
	titleText := space + title + space
	titleWidth := utf8.RuneCountInString(titleText)
	if titleWidth >= innerWidth {
		return titleText[:innerWidth]
	}
	padding := innerWidth - titleWidth
	return strings.Repeat(char, padding/2) + titleText + strings.Repeat(char, padding-(padding/2))
}

func printPaddedLine(innerWidth int, vertical, space string) {
	fmt.Println(vertical + strings.Repeat(space, innerWidth) + vertical)
}
