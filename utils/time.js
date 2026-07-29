import { showToast } from './Toaster';

export const getFormattedTime = (timestamp, utcOffset = null) => {
  try {
    let date = new Date(timestamp);

    // Apply UTC offset if provided (in minutes)
    if (utcOffset !== null) {
      date = new Date(date.getTime() + utcOffset * 60000);
    }

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    showToast({
      type: 'error',
      title: 'Error formatting time',
      desc: error.message,
    });
    return '';
  }
};
