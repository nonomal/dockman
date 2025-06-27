package config

import (
	"flag"
	"fmt"
	"os"
	"reflect"
	"strconv"
	"strings"
)

const envPrefix = "DOCKMAN"

// Load creates a new AppConfig, populates it from defaults, environment
// variables, and command-line flags, and then parses the flags.
// The order of precedence is:
// 1. Command-line flags (e.g., -port 9000)
// 2. Environment variables (e.g., DOCKMAN_PORT=9000)
// 3. Default values specified in struct tags.
func Load() (*AppConfig, error) {
	conf := &AppConfig{}
	if err := processStruct(conf); err != nil {
		return nil, err
	}
	flag.Parse()
	return conf, nil
}

// processStruct uses reflection to iterate over the fields of a struct,
// read the 'config' tags, and set up the corresponding flags.
func processStruct(s interface{}) error {

	// Ensure we have a pointer to a struct
	val := reflect.ValueOf(s)
	if val.Kind() != reflect.Ptr || val.Elem().Kind() != reflect.Struct {
		return fmt.Errorf("expected a pointer to a struct")
	}

	// Get the struct element that the pointer points to
	structVal := val.Elem()
	structType := structVal.Type()

	// Iterate over each field of the struct
	for i := 0; i < structVal.NumField(); i++ {
		fieldVal := structVal.Field(i)
		fieldType := structType.Field(i)

		// Skip unexported fields
		if !fieldVal.CanSet() {
			continue
		}

		// Parse the 'config' tag
		tag := fieldType.Tag.Get("config")
		if tag == "" {
			continue // Skip fields without the config tag
		}
		tags := parseTag(tag)

		// Get values from tags
		flagName := tags["flag"]
		envName := fmt.Sprintf("%s_%s", envPrefix, tags["env"])
		defaultValue := tags["default"]
		usage := tags["usage"]

		if flagName == "" || envName == "" {
			return fmt.Errorf("field %s is missing 'flag' or 'env' in its tag", fieldType.Name)
		}

		// Determine the effective default value (environment variable overrides tag default)
		envValue, isSet := os.LookupEnv(envName)
		if !isSet {
			envValue = defaultValue
		}

		// Set the flag based on the field's type
		fieldPtr := fieldVal.Addr().Interface()
		switch fieldVal.Kind() {
		case reflect.String:
			flag.StringVar(fieldPtr.(*string), flagName, envValue, usage)
		case reflect.Int:
			defaultInt, err := strconv.Atoi(envValue)
			if err != nil {
				return fmt.Errorf("invalid integer default for %s: %w", fieldType.Name, err)
			}
			flag.IntVar(fieldPtr.(*int), flagName, defaultInt, usage)
		case reflect.Bool:
			defaultBool, err := strconv.ParseBool(envValue)
			if err != nil {
				return fmt.Errorf("invalid boolean default for %s: %w", fieldType.Name, err)
			}
			flag.BoolVar(fieldPtr.(*bool), flagName, defaultBool, usage)
		default:
			return fmt.Errorf("unsupported field type for configuration: %s", fieldVal.Kind())
		}
	}
	return nil
}

// parseTag splits a struct tag into a key-value map.
// e.g., `flag=port,env=PORT` becomes `map[string]string{"flag": "port", "env": "PORT"}`
func parseTag(tag string) map[string]string {
	result := make(map[string]string)
	parts := strings.Split(tag, ",")
	for _, part := range parts {
		kv := strings.SplitN(part, "=", 2)
		if len(kv) == 2 {
			result[strings.TrimSpace(kv[0])] = strings.TrimSpace(kv[1])
		}
	}
	return result
}
