/**
 * Crash Debugger Utility
 * Helps identify and log crash causes in React Native/Expo apps
 */

import React from "react";
import { Alert, View, Text } from "react-native";

// Global error tracking
let errorLog = [];

/**
 * Log an error with context
 */
export const logError = (source, error, context = {}) => {
  const errorEntry = {
    timestamp: new Date().toISOString(),
    source,
    message: error?.message || String(error),
    stack: error?.stack,
    context,
  };

  errorLog.push(errorEntry);
  console.error(`[CrashDebugger] ${source}:`, error, context);

  // Keep only last 50 errors
  if (errorLog.length > 50) {
    errorLog = errorLog.slice(-50);
  }

  return errorEntry;
};

/**
 * Get all logged errors
 */
export const getErrorLog = () => errorLog;

/**
 * Clear error log
 */
export const clearErrorLog = () => {
  errorLog = [];
};

/**
 * Safe JSON parse with error handling
 */
export const safeJSONParse = (jsonString, defaultValue = null, source = "unknown") => {
  if (!jsonString) return defaultValue;

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logError(`safeJSONParse:${source}`, error, { jsonString: jsonString?.substring?.(0, 100) });
    return defaultValue;
  }
};

/**
 * Safe JSON stringify with error handling
 */
export const safeJSONStringify = (obj, source = "unknown") => {
  if (obj === undefined || obj === null) return null;

  try {
    return JSON.stringify(obj);
  } catch (error) {
    logError(`safeJSONStringify:${source}`, error, { objType: typeof obj });
    return null;
  }
};

/**
 * Safe property access
 */
export const safeGet = (obj, path, defaultValue = undefined) => {
  if (!obj || !path) return defaultValue;

  try {
    const keys = path.split(".");
    let result = obj;

    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }

    return result === undefined ? defaultValue : result;
  } catch (error) {
    logError("safeGet", error, { path });
    return defaultValue;
  }
};

/**
 * Safe array map with error handling
 */
export const safeMap = (array, mapFn, source = "unknown") => {
  if (!Array.isArray(array)) {
    logError(`safeMap:${source}`, new Error("Input is not an array"), { type: typeof array });
    return [];
  }

  try {
    return array.map((item, index) => {
      try {
        return mapFn(item, index);
      } catch (itemError) {
        logError(`safeMap:${source}:item${index}`, itemError, { item });
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    logError(`safeMap:${source}`, error);
    return [];
  }
};

/**
 * Safe date parsing
 */
export const safeDateParse = (dateValue, source = "unknown") => {
  if (!dateValue) return null;

  try {
    // If already a Date object
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }

    // Try to parse string
    const parsed = new Date(dateValue);
    if (isNaN(parsed.getTime())) {
      logError(`safeDateParse:${source}`, new Error("Invalid date"), { dateValue });
      return null;
    }

    return parsed;
  } catch (error) {
    logError(`safeDateParse:${source}`, error, { dateValue });
    return null;
  }
};

/**
 * Safe number parsing
 */
export const safeNumberParse = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }

  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Wrap async function with error handling
 */
export const wrapAsync = (fn, source = "unknown") => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(`wrapAsync:${source}`, error, { args: args?.length });
      throw error;
    }
  };
};

/**
 * Default fallback component for error boundary
 */
const DefaultErrorFallback = ({ error }) => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
    <Text style={{ fontSize: 16, fontWeight: "600", color: "#EF4444", marginBottom: 8 }}>
      Something went wrong
    </Text>
    <Text style={{ fontSize: 14, color: "#6B7280", textAlign: "center" }}>
      {error?.message || "An unexpected error occurred"}
    </Text>
  </View>
);

/**
 * Create a safe component wrapper that catches render errors
 */
export const withErrorBoundary = (WrappedComponent, FallbackComponent = DefaultErrorFallback) => {
  return class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      logError("ErrorBoundary", error, { componentStack: errorInfo?.componentStack });
    }

    render() {
      if (this.state.hasError) {
        return <FallbackComponent error={this.state.error} />;
      }
      return <WrappedComponent {...this.props} />;
    }
  };
};

/**
 * Show error alert in development
 */
export const showErrorAlert = (title, error) => {
  if (__DEV__) {
    Alert.alert(
      `Debug: ${title}`,
      `${error?.message || String(error)}\n\nStack: ${error?.stack?.substring(0, 500) || "N/A"}`,
      [{ text: "OK" }]
    );
  }
};

/**
 * Validate client object has required fields
 */
export const validateClientObject = (client, source = "unknown") => {
  const issues = [];

  if (!client) {
    issues.push("Client object is null/undefined");
    return { valid: false, issues };
  }

  // Check for undefined that might cause crashes
  if (typeof client !== "object") {
    issues.push(`Client is not an object: ${typeof client}`);
    return { valid: false, issues };
  }

  // Check commonly accessed fields
  const fieldsToCheck = ["id", "name", "contact"];
  for (const field of fieldsToCheck) {
    if (client[field] === undefined) {
      issues.push(`Missing field: ${field}`);
    }
  }

  // Check for invalid dates
  if (client.expires_at) {
    const date = new Date(client.expires_at);
    if (isNaN(date.getTime())) {
      issues.push(`Invalid expires_at date: ${client.expires_at}`);
    }
  }

  if (client.starts_at) {
    const date = new Date(client.starts_at);
    if (isNaN(date.getTime())) {
      issues.push(`Invalid starts_at date: ${client.starts_at}`);
    }
  }

  if (issues.length > 0) {
    logError(`validateClientObject:${source}`, new Error("Client validation failed"), {
      issues,
      clientId: client.id,
      clientName: client.name
    });
  }

  return { valid: issues.length === 0, issues };
};

/**
 * Debug log with timestamp
 */
export const debugLog = (tag, message, data = null) => {
  if (__DEV__) {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    console.log(`[${timestamp}] [${tag}]`, message, data ? JSON.stringify(data, null, 2) : "");
  }
};

export default {
  logError,
  getErrorLog,
  clearErrorLog,
  safeJSONParse,
  safeJSONStringify,
  safeGet,
  safeMap,
  safeDateParse,
  safeNumberParse,
  wrapAsync,
  withErrorBoundary,
  showErrorAlert,
  validateClientObject,
  debugLog,
};
