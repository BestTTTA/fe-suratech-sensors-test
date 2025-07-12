import type {
  Sensor,
  SensorFilters,
  SensorReading,
  SensorSummary,
  SensorApiData,
} from "@/lib/types";
import { generateMockSensors, generateMockReadings } from "./mockData";
// Add the import for getRegisteredDevices at the top of the file
import { getRegisteredDevices } from "./register";
// Import calculation functions for H, V, A data
import {
  getAxisTopPeakStats,
  SENSOR_CONSTANTS,
} from "@/lib/utils/sensorCalculations";

// Cache the generated sensors to avoid regenerating on each request
let mockSensors: Sensor[] | null = null;
let realSensorsCache: Sensor[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

// Function to fetch real sensors from API
async function fetchRealSensors(): Promise<Sensor[]> {
  // Check cache first
  const now = Date.now();
  if (realSensorsCache && now - lastFetchTime < CACHE_DURATION) {
    return realSensorsCache;
  }

  try {
    const response = await fetch(
      "https://sc.promptlabai.com/suratech/sensors/with-last-data",
      {
        cache: "no-store", // Disable caching for real-time data
        headers: {
          "Cache-Control": "no-cache",
        },
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const apiData = await response.json();

    // Transform API data to match our Sensor interface
    const result = apiData.map((apiSensor: SensorApiData) => {
      const now = Date.now();

      // Create readings from data if available
      const readings: SensorReading[] = [];
      if (apiSensor.last_data) {
        // Use the new simplified data structure
        const temperature = apiSensor.last_data.temperature || 0;

        // Extract H, V, A data from separate arrays
        let hData: number[] = [];
        let vData: number[] = [];
        let aData: number[] = [];

        // Use the correct separate arrays from API
        if (
          apiSensor.last_data.last_32_h &&
          Array.isArray(apiSensor.last_data.last_32_h)
        ) {
          hData = apiSensor.last_data.last_32_h[0];
        }
        if (
          apiSensor.last_data.last_32_v &&
          Array.isArray(apiSensor.last_data.last_32_v)
        ) {
          vData = apiSensor.last_data.last_32_v[0];
        }
        if (
          apiSensor.last_data.last_32_a &&
          Array.isArray(apiSensor.last_data.last_32_a)
        ) {
          aData = apiSensor.last_data.last_32_a[0];
        }

        // Generate mock vibration data for readings if no real data available
        const baseValue = 0.05 + Math.random() * 0.2; // Range: 0.05 to 0.25
        const vibrationX = baseValue + Math.random() * 0.1; // Add some variation
        const vibrationY = baseValue + Math.random() * 0.1; // Add some variation
        const vibrationZ = baseValue + Math.random() * 0.1; // Add some variation

        readings.push({
          timestamp: new Date(apiSensor.last_data.datetime).getTime(),
          temperature,
          vibrationX,
          vibrationY,
          vibrationZ,
        });
      }

      // Extract H, V, A data from separate arrays
      let hData: number[] = [];
      let vData: number[] = [];
      let aData: number[] = [];

      // Use the correct separate arrays from API
      if (
        apiSensor.last_data?.last_32_h &&
        Array.isArray(apiSensor.last_data.last_32_h)
      ) {
        hData = apiSensor.last_data.last_32_h[0];
      }
      if (
        apiSensor.last_data?.last_32_v &&
        Array.isArray(apiSensor.last_data.last_32_v)
      ) {
        vData = apiSensor.last_data.last_32_v[0];
      }
      if (
        apiSensor.last_data?.last_32_a &&
        Array.isArray(apiSensor.last_data.last_32_a)
      ) {
        aData = apiSensor.last_data.last_32_a[0];
      }

      // Calculate H, V, A statistics using the same logic as sensor detail page
      const lor = apiSensor.lor || 6400; // Use API value or default
      const fmax = apiSensor.fmax || 400; // Use API value or default
      const totalTime = lor / fmax;
      const timeInterval =
        totalTime / (hData.length > 0 ? hData.length - 1 : 1);
      let hStats = {
        accelTopPeak: "0.000",
        velocityTopPeak: "0.000",
        dominantFreq: "0.000",
      };
      let vStats = {
        accelTopPeak: "0.000",
        velocityTopPeak: "0.000",
        dominantFreq: "0.000",
      };
      let aStats = {
        accelTopPeak: "0.000",
        velocityTopPeak: "0.000",
        dominantFreq: "0.000",
      };

      // Calculate statistics for each axis
      if (hData.length > 0) {
        hStats = getAxisTopPeakStats(
          hData,
          timeInterval,
          apiSensor.g_scale,
          apiSensor.fmax
        );
      }
      if (vData.length > 0) {
        vStats = getAxisTopPeakStats(
          vData,
          timeInterval,
          apiSensor.g_scale,
          apiSensor.fmax
        );
      }
      if (aData.length > 0) {
        aStats = getAxisTopPeakStats(
          aData,
          timeInterval,
          apiSensor.g_scale,
          apiSensor.fmax
        );
      }

      // Determine status based on available data and alarm threshold
      let status: "ok" | "warning" | "critical" = "ok";
      if (apiSensor.last_data) {
        const alarmThreshold = apiSensor.alarm_ths || 5.0; // Default to 5.0 if not provided

        // Check temperature against alarm threshold
        if (apiSensor.last_data.temperature > alarmThreshold) {
          status = "critical";
        } else if (apiSensor.last_data.temperature > alarmThreshold * 0.7) {
          // 70% of threshold
          status = "warning";
        }

        // Check battery level
        if (apiSensor.last_data.battery < 20) {
          status = "critical";
        } else if (apiSensor.last_data.battery < 50) {
          status = status === "ok" ? "warning" : status;
        }
      }

      // Generate sensor number from name or use index

      const sensor: Sensor = {
        id: apiSensor.id,
        serialNumber: apiSensor.name, // Use name as serial number since it's the device identifier
        machineName: apiSensor.sensor_type || "Unknown Machine",
        location: apiSensor.installed_point || "API Location",
        installationDate: new Date(apiSensor.created_at).getTime(),
        lastUpdated: new Date(apiSensor.last_data?.datetime || now).getTime(),
        readings,
        status,
        maintenanceHistory: [],
        // New fields for card display
        name: apiSensor.sensor_name || apiSensor.name, // Use sensor_name if available, otherwise fallback to name
        model: `Model-${apiSensor.id.substring(0, 8)}`,
        operationalStatus: apiSensor.last_data ? "running" : "standby",
        batteryLevel: apiSensor.last_data?.battery || 0,
        connectivity: apiSensor.last_data ? "online" : "offline",
        signalStrength: apiSensor.last_data?.rssi || 0,
        vibrationH: "normal",
        vibrationV: "normal",
        vibrationA: "normal",
        // Store raw API data for access by components
        last_data: {
          ...apiSensor.last_data,
          h: hData,
          v: vData,
          a: aData,
        },
        // Store calculated H, V, A statistics
        h_stats: hStats,
        v_stats: vStats,
        a_stats: aStats,
        // New API configuration fields
        fmax: apiSensor.fmax,
        lor: apiSensor.lor,
        g_scale: apiSensor.g_scale,
        alarm_ths: apiSensor.alarm_ths,
        time_interval: apiSensor.time_interval,
        // Threshold configuration fields from API
        threshold_min: apiSensor.threshold_min,
        threshold_medium: apiSensor.threshold_medium,
        threshold_max: apiSensor.threshold_max,
        machine_class: apiSensor.machine_class,
        machine_number: apiSensor.machine_no,
        installation_point: apiSensor.installed_point,
        sensor_name: apiSensor.sensor_name,
      };

      return sensor;
    });

    // Cache the result
    realSensorsCache = result;
    lastFetchTime = now;

    return result;
  } catch (error) {
    return [];
  }
}

// Get all sensors with pagination and filtering
export async function getSensors(
  filters: SensorFilters = {}
): Promise<{ sensors: Sensor[]; total: number }> {
  // Fetch real sensors from API
  const realSensors = await fetchRealSensors();

  // Generate mock sensors to continue from API data
  if (!mockSensors) {
    mockSensors = generateMockSensors(200); // Set to 200 mock sensors
  }

  // Combine real and mock sensors seamlessly
  // short real sensro by sensor_name
  let allSensors = [
    ...realSensors.sort((a, b) =>
      a.sensor_name?.localeCompare(b.sensor_name || "") || 0
    ),
    ...mockSensors,
  ];

  // Apply filters
  if (filters.status && filters.status !== "all") {
    allSensors = allSensors.filter(
      (sensor) => sensor.status === filters.status
    );
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    allSensors = allSensors.filter(
      (sensor) =>
        sensor.serialNumber.toLowerCase().includes(searchLower) ||
        sensor.machineName.toLowerCase().includes(searchLower) ||
        sensor.name.toLowerCase().includes(searchLower)
    );
  }

  // Get total count before pagination
  const total = allSensors.length;

  // Apply pagination
  const page = filters.page || 1;
  const limit = filters.limit || 50; // Default to 50 per page
  const start = (page - 1) * limit;
  const end = start + limit;

  allSensors = allSensors.slice(start, end);

  return { sensors: allSensors, total };
}

// Get a single sensor by ID
export async function getSensorById(id: string): Promise<Sensor | null> {
  // First try to fetch from real API
  try {
    const realSensors = await fetchRealSensors();
    const realSensor = realSensors.find((s) => s.id === id);
    if (realSensor) return realSensor;
  } catch (error) {
    // Error fetching real sensor by ID
  }

  if (!mockSensors) {
    mockSensors = generateMockSensors(250);
  }

  // Check in mock sensors
  let sensor = mockSensors.find((s) => s.id === id);

  // If not found in mock sensors, check in registered sensors
  if (!sensor) {
    try {
      const { sensors: registeredSensors } = await getRegisteredDevices();
      sensor = registeredSensors.find((s) => s.id === id);
    } catch (error) {
      // Error fetching registered sensors
    }
  }

  // If still not found, try to generate a fallback sensor for testing
  if (!sensor && id) {
    // Create a fallback sensor for testing purposes
    sensor = {
      id: id,
      serialNumber: `S-${id.substring(0, 4).toUpperCase()}`,
      machineName: "Test Machine",
      location: "Test Location",
      installationDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
      lastUpdated: Date.now(),
      status: "ok",
      readings: generateMockReadings(10),
      maintenanceHistory: [],
      name: `Test Sensor ${id.substring(0, 3)}`,
      model: `Model-Test-${id.substring(0, 8)}`,
      operationalStatus: "standby",
      batteryLevel: 75,
      connectivity: "online",
      signalStrength: 85,
      vibrationH: "normal",
      vibrationV: "normal",
      vibrationA: "normal",
    };
  }

  return sensor || null;
}

// Get sensor readings for a specific sensor
export async function getSensorReadings(
  sensorId: string,
  historical = false
): Promise<SensorReading[]> {
  // First try to get from real API
  try {
    const realSensors = await fetchRealSensors();
    const realSensor = realSensors.find((s) => s.id === sensorId);
    if (realSensor && realSensor.readings.length > 0) {
      if (historical) {
        // Generate more historical data points for real sensors
        const baseReading = realSensor.readings[0];
        return generateMockReadings(100).map((reading) => ({
          ...reading,
          temperature: baseReading.temperature + (Math.random() * 4 - 2), // Vary around real temperature
        }));
      }
      return realSensor.readings;
    }
  } catch (error) {
    // Error fetching real sensor readings
  }

  if (!mockSensors) {
    mockSensors = generateMockSensors(200);
  }

  // Check in mock sensors
  let sensor = mockSensors.find((s) => s.id === sensorId);

  // If not found in mock sensors, check in registered sensors
  if (!sensor) {
    try {
      const { sensors: registeredSensors } = await getRegisteredDevices();
      sensor = registeredSensors.find((s) => s.id === sensorId);
    } catch (error) {
      // Error fetching registered sensors
    }
  }

  if (!sensor) {
    // If sensor not found, return empty array or generate mock data
    return historical ? generateMockReadings(100) : generateMockReadings(10);
  }

  if (historical) {
    // Generate more historical data points
    return generateMockReadings(100);
  }

  return sensor.readings;
}

// Get summary data for dashboard
export async function getSensorSummary(
  period: "daily" | "weekly" | "monthly"
): Promise<SensorSummary> {
  // Fetch real sensors
  const realSensors = await fetchRealSensors();

  if (!mockSensors) {
    mockSensors = generateMockSensors(200);
  }

  // Combine real and mock sensors for summary
  const allSensors = [...realSensors, ...mockSensors];

  // Count sensors by status
  const criticalCount = allSensors.filter(
    (s) => s.status === "critical"
  ).length;
  const warningCount = allSensors.filter((s) => s.status === "warning").length;

  // Calculate temperature stats from all sensors
  const allTemps: number[] = [];
  const allVibX: number[] = [];
  const allVibY: number[] = [];
  const allVibZ: number[] = [];

  allSensors.forEach((sensor) => {
    sensor.readings.forEach((reading) => {
      allTemps.push(reading.temperature);
      allVibX.push(reading.vibrationX);
      allVibY.push(reading.vibrationY);
      allVibZ.push(reading.vibrationZ);
    });
  });

  const avgTemp =
    allTemps.length > 0
      ? allTemps.reduce((sum, temp) => sum + temp, 0) / allTemps.length
      : 0;
  const minTemp = allTemps.length > 0 ? Math.min(...allTemps) : 0;
  const maxTemp = allTemps.length > 0 ? Math.max(...allTemps) : 0;

  const avgVibX =
    allVibX.length > 0
      ? allVibX.reduce((sum, vib) => sum + vib, 0) / allVibX.length
      : 0;
  const avgVibY =
    allVibY.length > 0
      ? allVibY.reduce((sum, vib) => sum + vib, 0) / allVibY.length
      : 0;
  const avgVibZ =
    allVibZ.length > 0
      ? allVibZ.reduce((sum, vib) => sum + vib, 0) / allVibZ.length
      : 0;

  // Generate mock chart data based on the period
  const dataPoints = period === "daily" ? 24 : period === "weekly" ? 7 : 30;

  const temperatureData = Array.from({ length: dataPoints }).map((_, i) => {
    const pointName =
      period === "daily"
        ? `${i}:00`
        : period === "weekly"
        ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i % 7]
        : `Day ${i + 1}`;

    const avg = avgTemp + (Math.random() * 4 - 2);
    const min = avg - (Math.random() * 3 + 1);
    const max = avg + (Math.random() * 3 + 1);

    return {
      name: pointName,
      min: Number.parseFloat(min.toFixed(1)),
      avg: Number.parseFloat(avg.toFixed(1)),
      max: Number.parseFloat(max.toFixed(1)),
    };
  });

  const vibrationData = Array.from({ length: dataPoints }).map((_, i) => {
    const pointName =
      period === "daily"
        ? `${i}:00`
        : period === "weekly"
        ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i % 7]
        : `Day ${i + 1}`;

    return {
      name: pointName,
      x: Number.parseFloat((avgVibX + Math.random() * 0.3 - 0.15).toFixed(2)),
      y: Number.parseFloat((avgVibY + Math.random() * 0.3 - 0.15).toFixed(2)),
      z: Number.parseFloat((avgVibZ + Math.random() * 0.3 - 0.15).toFixed(2)),
    };
  });

  return {
    totalSensors: allSensors.length,
    activeSensors: allSensors.filter((s) => s.status !== "critical").length,
    criticalAlerts: criticalCount,
    criticalAlertsChange: Math.floor(Math.random() * 20) - 10,
    warningAlerts: warningCount,
    warningAlertsChange: Math.floor(Math.random() * 20) - 5,
    avgTemperature: Number.parseFloat(avgTemp.toFixed(1)),
    minTemperature: Number.parseFloat(minTemp.toFixed(1)),
    maxTemperature: Number.parseFloat(maxTemp.toFixed(1)),
    avgVibration: {
      x: Number.parseFloat(avgVibX.toFixed(2)),
      y: Number.parseFloat(avgVibY.toFixed(2)),
      z: Number.parseFloat(avgVibZ.toFixed(2)),
    },
    temperatureData,
    vibrationData,
  };
}
