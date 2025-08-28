import {
    Box,
    Button,
    CircularProgress,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField
} from "@mui/material"
import {Info} from '@mui/icons-material'
import {useConfig} from "../../hooks/config.ts";
import {type ChangeEvent, useEffect, useState} from "react";

export function TabContainerUpdater() {
    const {config, isLoading, updateSettings} = useConfig()
    const [localConfig, setLocalConfig] = useState(config)
    const [timeUnit, setTimeUnit] = useState('seconds')
    const [displayValue, setDisplayValue] = useState('0')

    const timeUnits = {
        seconds: 1,
        minutes: 60,
        hours: 3600,
        days: 86400
    }

    useEffect(() => {
        setLocalConfig(config)
        if (config?.updater?.IntervalInSeconds) {
            const seconds = Number(config.updater.IntervalInSeconds)
            // Auto-select appropriate unit
            if (seconds % 86400 === 0) {
                setTimeUnit('days')
                setDisplayValue((seconds / 86400).toString())
            } else if (seconds % 3600 === 0) {
                setTimeUnit('hours')
                setDisplayValue((seconds / 3600).toString())
            } else if (seconds % 60 === 0) {
                setTimeUnit('minutes')
                setDisplayValue((seconds / 60).toString())
            } else {
                setTimeUnit('seconds')
                setDisplayValue(seconds.toString())
            }
        }
    }, [config])

    if (isLoading) {
        return <Box sx={{display: 'flex', justifyContent: 'center', p: 4}}><CircularProgress/></Box>
    }

    const handleEnableChange = (event: ChangeEvent<HTMLInputElement>) => {
        localConfig!.updater!.Enable = event.target.checked
        setLocalConfig({...localConfig})
    }

    const handleIntervalChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value
        setDisplayValue(value)
        const seconds = Number(value || '0') * timeUnits[timeUnit as keyof typeof timeUnits]
        localConfig!.updater!.IntervalInSeconds = BigInt(seconds)
        setLocalConfig({...localConfig})
    }

    const handleUnitChange = (newUnit: string) => {
        setTimeUnit(newUnit)
        const seconds = Number(displayValue || '0') * timeUnits[newUnit as keyof typeof timeUnits]
        localConfig!.updater!.IntervalInSeconds = BigInt(seconds)
        setLocalConfig({...localConfig})
    }

    const handleSave = async () => {
        await updateSettings(localConfig)
    }

    return (
        <Box sx={{display: 'flex', justifyContent: 'center', p: 4}}>
            <Box sx={{
                maxWidth: 400,
                width: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 3,
                // backgroundColor: 'grey.50'
            }}>7
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 3, mb: 3}}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={localConfig?.updater?.Enable || false}
                                onChange={handleEnableChange}
                            />
                        }
                        label="Enable Updater"
                    />

                    <Box sx={{display: 'flex', gap: 2}}>
                        <TextField
                            label="Interval"
                            type="number"
                            value={displayValue}
                            onChange={handleIntervalChange}
                            sx={{flex: 1}}
                            slotProps={{
                                input: {
                                    inputProps: {min: 1}
                                }
                            }}
                        />

                        <FormControl sx={{minWidth: 100}}>
                            <InputLabel>Unit</InputLabel>
                            <Select
                                value={timeUnit}
                                label="Unit"
                                onChange={event => handleUnitChange(event.target.value)}
                            >
                                <MenuItem value="seconds">Seconds</MenuItem>
                                <MenuItem value="minutes">Minutes</MenuItem>
                                <MenuItem value="hours">Hours</MenuItem>
                                <MenuItem value="days">Days</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>

                <Box sx={{display: 'flex', justifyContent: 'center', mb: 2}}>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                    >
                        Save
                    </Button>
                </Box>

                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2}}>
                    <Info sx={{fontSize: 16, color: 'text.secondary'}}/>
                    <Box sx={{fontSize: '0.875rem', color: 'text.secondary'}}>
                        Requires restart to take effect
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}