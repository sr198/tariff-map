export interface PerformanceMetric {
  name: string;
  value: number;
  label: string;
  id: string;
}

export const measurePerformance = (metric: PerformanceMetric) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Performance Metric - ${metric.name}:`, metric.value);
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to your analytics service
    // analytics.track('performance_metric', {
    //   name: metric.name,
    //   value: metric.value,
    //   label: metric.label,
    //   id: metric.id
    // });
  }
};

export const measureComponentRender = (componentName: string) => {
  const start = performance.now();
  return () => {
    const end = performance.now();
    const duration = end - start;
    
    measurePerformance({
      name: 'component_render',
      value: duration,
      label: 'component',
      id: componentName
    });
  };
};

export const measureApiCall = async <T>(
  apiCall: Promise<T>,
  name: string
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await apiCall;
    const end = performance.now();
    const duration = end - start;
    
    measurePerformance({
      name: 'api_call',
      value: duration,
      label: 'api',
      id: name
    });
    
    return result;
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
    
    measurePerformance({
      name: 'api_call_error',
      value: duration,
      label: 'api',
      id: name
    });
    
    throw error;
  }
}; 