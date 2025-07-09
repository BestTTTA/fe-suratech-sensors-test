import { SENSOR_CONSTANTS } from './sensorCalculations'
import { getAxisTopPeakStats } from './sensorCalculations'
import type { Sensor } from '@/lib/types'

// Types for vibration levels and color schemes
export type VibrationLevel = 'normal' | 'warning' | 'concern' | 'critical'
export type ColorScheme = 'dark' | 'light' | 'card'

// Interface for threshold configuration
export interface VibrationThresholds {
  min?: number
  medium?: number
  max?: number
}

// Interface for sensor configuration
export interface SensorConfig {
  thresholdMin?: string | number
  thresholdMedium?: string | number
  thresholdMax?: string | number
  machineClass?: string
}

/**
 * Get vibration level based on velocity value and thresholds
 * @param velocityValue - Velocity value in mm/s
 * @param thresholds - Optional custom thresholds, uses defaults if not provided
 * @returns Vibration level string
 */
export function getVibrationLevel(
  velocityValue: number, 
  thresholds?: VibrationThresholds
): VibrationLevel {
  const minThreshold = thresholds?.min ?? SENSOR_CONSTANTS.MIN_TRASH_HOLE
  const mediumThreshold = thresholds?.medium ?? (minThreshold + (SENSOR_CONSTANTS.MAX_TRASH_HOLE - SENSOR_CONSTANTS.MIN_TRASH_HOLE) / 2)
  const maxThreshold = thresholds?.max ?? SENSOR_CONSTANTS.MAX_TRASH_HOLE

  if (velocityValue < minThreshold) {
    return 'normal'
  } else if (velocityValue >= minThreshold && velocityValue < mediumThreshold) {
    return 'warning'
  } else if (velocityValue >= mediumThreshold && velocityValue < maxThreshold) {
    return 'concern'
  } else {
    return 'critical'
  }
}

/**
 * Get vibration level from sensor config (for sensor detail page)
 * @param velocityValue - Velocity value in mm/s
 * @param config - Sensor configuration from API
 * @returns Vibration level string
 */
export function getVibrationLevelFromConfig(
  velocityValue: number,
  config: SensorConfig
): VibrationLevel {
  const thresholds: VibrationThresholds = {
    min: config.thresholdMin ? Number(config.thresholdMin) : undefined,
    medium: config.thresholdMedium ? Number(config.thresholdMedium) : undefined,
    max: config.thresholdMax ? Number(config.thresholdMax) : undefined
  }
  
  return getVibrationLevel(velocityValue, thresholds)
}

/**
 * Get CSS color class for vibration level
 * @param level - Vibration level
 * @param scheme - Color scheme (dark, light, or card)
 * @param isOffline - Whether sensor is offline
 * @returns CSS class string
 */
export function getVibrationColor(
  level: VibrationLevel,
  scheme: ColorScheme = 'light',
  isOffline: boolean = false
): string {
  // If sensor is offline, return gray color
  if (isOffline) {
    return 'bg-gray-400'
  }

  const colorMap = {
    dark: {
      normal: 'bg-green-900',
      warning: 'bg-yellow-900',
      concern: 'bg-orange-900',
      critical: 'bg-red-900'
    },
    light: {
      normal: 'bg-green-500',
      warning: 'bg-yellow-500',
      concern: 'bg-orange-500',
      critical: 'bg-red-500'
    },
    card: {
      normal: 'bg-green-900',
      warning: 'bg-yellow-900',
      concern: 'bg-orange-900',
      critical: 'bg-red-900'
    }
  }

  return colorMap[scheme][level] || colorMap[scheme].normal
}

/**
 * Get vibration color directly from velocity value and config
 * @param velocityValue - Velocity value in mm/s
 * @param config - Sensor configuration
 * @param scheme - Color scheme
 * @param isOffline - Whether sensor is offline
 * @returns CSS class string
 */
export function getVibrationColorFromVelocity(
  velocityValue: number,
  config?: SensorConfig,
  scheme: ColorScheme = 'light',
  isOffline: boolean = false
): string {
  const level = config 
    ? getVibrationLevelFromConfig(velocityValue, config)
    : getVibrationLevel(velocityValue)
  
  return getVibrationColor(level, scheme, isOffline)
}

/**
 * Get vibration color for sensor axis (for list/dot views)
 * @param sensor - Sensor object
 * @param axis - Axis ('h', 'v', 'a')
 * @param scheme - Color scheme
 * @returns CSS class string
 */
export function getSensorAxisVibrationColor(
  sensor: Sensor,
  axis: 'h' | 'v' | 'a',
  scheme: ColorScheme = 'light'
): string {
  // If sensor is offline, return gray color
  if (sensor.connectivity === "offline") {
    return 'bg-gray-400'
  }
  
  // Calculate velocity-based vibration status using real data
  if (sensor.connectivity === "online" && sensor.last_data) {
    const timeInterval = 1 / SENSOR_CONSTANTS.SAMPLING_RATE

    // Get the correct data arrays based on axis
    let axisData: number[] = []
    if (axis === 'h' && sensor.last_data.h) {
      axisData = Array.isArray(sensor.last_data.h) ? sensor.last_data.h : []
    } else if (axis === 'v' && sensor.last_data.v) {
      axisData = Array.isArray(sensor.last_data.v) ? sensor.last_data.v : []
    } else if (axis === 'a' && sensor.last_data.a) {
      axisData = Array.isArray(sensor.last_data.a) ? sensor.last_data.a : []
    }
    
    if (axisData && axisData.length > 0) {
      const stats = getAxisTopPeakStats(axisData, timeInterval)
      const velocityValue = parseFloat(stats.velocityTopPeak)
      
      // Use sensor's own threshold configuration if available
      const sensorConfig: SensorConfig = {
        thresholdMin: sensor.threshold_min,
        thresholdMedium: sensor.threshold_medium,
        thresholdMax: sensor.threshold_max,
        machineClass: sensor.machine_class || undefined
      }
      
      return getVibrationColorFromVelocity(velocityValue, sensorConfig, scheme, false)
    }
  }
  
  // Fallback to sensor's stored vibration level
  const level = axis === 'h' ? sensor.vibrationH : 
               axis === 'v' ? sensor.vibrationV : 
               sensor.vibrationA
  
  // Map stored levels to new levels
  const levelMap: Record<string, VibrationLevel> = {
    'normal': 'normal',
    'warning': 'warning',
    'concern': 'concern',
    'critical': 'critical'
  }
  
  const mappedLevel = levelMap[level] || 'normal'
  return getVibrationColor(mappedLevel, scheme, false)
}

/**
 * Get vibration level for sensor axis (for card view)
 * @param sensor - Sensor object
 * @param axis - Axis ('h', 'v', 'a')
 * @returns Vibration level string
 */
export function getSensorAxisVibrationLevel(
  sensor: Sensor,
  axis: 'h' | 'v' | 'a'
): VibrationLevel {
  if (sensor.connectivity === "online" && sensor.last_data) {
    const timeInterval = 1 / SENSOR_CONSTANTS.SAMPLING_RATE

    // Get the correct data arrays based on axis
    let axisData: number[] = []
    if (axis === 'h' && sensor.last_data.h) {
      axisData = Array.isArray(sensor.last_data.h) ? sensor.last_data.h : []
    } else if (axis === 'v' && sensor.last_data.v) {
      axisData = Array.isArray(sensor.last_data.v) ? sensor.last_data.v : []
    } else if (axis === 'a' && sensor.last_data.a) {
      axisData = Array.isArray(sensor.last_data.a) ? sensor.last_data.a : []
    }
    
    // If no vibration arrays available, try to use readings data (main page)
    if ((!axisData || axisData.length === 0) && sensor.readings && sensor.readings.length > 0) {
      const latestReading = sensor.readings[sensor.readings.length - 1]
      if (latestReading) {
        // Convert single values to arrays for calculation
        if (axis === 'h') {
          axisData = [latestReading.vibrationX]
        } else if (axis === 'v') {
          axisData = [latestReading.vibrationY]
        } else if (axis === 'a') {
          axisData = [latestReading.vibrationZ]
        }
      }
    }
    
    if (axisData && axisData.length > 0) {
      const stats = getAxisTopPeakStats(axisData, timeInterval)
      const velocityValue = parseFloat(stats.velocityTopPeak)
      
      // Use sensor's own threshold configuration if available
      const thresholds: VibrationThresholds = {
        min: sensor.threshold_min ? Number(sensor.threshold_min) : undefined,
        medium: sensor.threshold_medium ? Number(sensor.threshold_medium) : undefined,
        max: sensor.threshold_max ? Number(sensor.threshold_max) : undefined
      }
      
      return getVibrationLevel(velocityValue, thresholds)
    }
  }
  
  // Fallback to sensor's stored vibration level
  const level = axis === 'h' ? sensor.vibrationH : 
               axis === 'v' ? sensor.vibrationV : 
               sensor.vibrationA
  
  const levelMap: Record<string, VibrationLevel> = {
    'normal': 'normal',
    'warning': 'warning',
    'concern': 'concern',
    'critical': 'critical'
  }
  
  return levelMap[level] || 'normal'
}

/**
 * Get card background color for sensor detail page
 * @param velocityValue - Velocity value in mm/s
 * @param config - Sensor configuration
 * @returns CSS class string
 */
export function getCardBackgroundColor(
  velocityValue: number,
  config: SensorConfig
): string {
  return getVibrationColorFromVelocity(velocityValue, config, 'card', false)
}

/**
 * Get default thresholds for fallback scenarios
 * @returns Default threshold values
 */
export function getDefaultThresholds(): VibrationThresholds {
  return {
    min: SENSOR_CONSTANTS.MIN_TRASH_HOLE,
    medium: (SENSOR_CONSTANTS.MIN_TRASH_HOLE + SENSOR_CONSTANTS.MAX_TRASH_HOLE) / 2,
    max: SENSOR_CONSTANTS.MAX_TRASH_HOLE
  }
}

/*
USAGE EXAMPLES:

1. For sensor detail page (uses sensor's own threshold data):
```typescript
import { getCardBackgroundColor } from '@/lib/utils/vibrationUtils'

// In your component - sensor already has threshold data from API
const cardColor = getCardBackgroundColor(velocityValue, {
  thresholdMin: sensor.threshold_min,
  thresholdMedium: sensor.threshold_medium,
  thresholdMax: sensor.threshold_max
})
```

2. For list/dot views (automatically uses sensor's threshold data):
```typescript
import { getSensorAxisVibrationColor } from '@/lib/utils/vibrationUtils'

// In your component - no need to pass config, uses sensor's own data
const hAxisColor = getSensorAxisVibrationColor(sensor, 'h', 'light')
const vAxisColor = getSensorAxisVibrationColor(sensor, 'v', 'light')
const aAxisColor = getSensorAxisVibrationColor(sensor, 'a', 'light')
```

3. For card view with vibration levels (automatically uses sensor's threshold data):
```typescript
import { getSensorAxisVibrationLevel, getVibrationColor } from '@/lib/utils/vibrationUtils'

// In your component - no need to pass config, uses sensor's own data
const hLevel = getSensorAxisVibrationLevel(sensor, 'h')
const hColor = getVibrationColor(hLevel, 'light', sensor.connectivity === 'offline')
```

4. For custom thresholds (when you want to override sensor's thresholds):
```typescript
import { getVibrationLevel, getVibrationColor } from '@/lib/utils/vibrationUtils'

// In your component
const level = getVibrationLevel(velocityValue, {
  min: 0.3,
  medium: 0.8,
  max: 1.5
})
const color = getVibrationColor(level, 'dark')
```

5. For direct velocity to color with custom config:
```typescript
import { getVibrationColorFromVelocity } from '@/lib/utils/vibrationUtils'

// In your component
const color = getVibrationColorFromVelocity(velocityValue, config, 'light', isOffline)
```

6. For sensor detail page with sensor's own data:
```typescript
import { getCardBackgroundColor } from '@/lib/utils/vibrationUtils'

// In your component - uses sensor's threshold data automatically
const getCardBackgroundColorCallback = useCallback((velocityValue: number) => {
  const sensorConfig = {
    thresholdMin: sensor?.threshold_min,
    thresholdMedium: sensor?.threshold_medium,
    thresholdMax: sensor?.threshold_max,
    machineClass: sensor?.machine_class
  }
  return getCardBackgroundColor(velocityValue, sensorConfig)
}, [sensor])
```

NOTE: The sensor data from /sensors/with-last-data already includes:
- threshold_min
- threshold_medium  
- threshold_max
- machine_class

So no separate API call is needed for vibration color calculations!
*/ 