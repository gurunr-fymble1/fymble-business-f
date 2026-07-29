

export const dateUtils = {
  // Returns current date in YYYY-MM-DD format
  getCurrentDateFormatted() {
    const date = new Date();
    return this.formatDate(date);
  },

  formatToDateOnly(datetime) {
    if (datetime) {
      return datetime.split(' ')[0];
    }
  },

  // Formats any Date object to YYYY-MM-DD
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  formatDate2(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  },

  // Returns current time in HH:MM:SS format
  getCurrentTimeFormatted() {
    const date = new Date();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  },

  // Adds days to a given date
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  // Subtracts days from a given date
  subtractDays(date, days) {
    return this.addDays(date, -days);
  },

  // Checks if a date is in the past
  isPast(date) {
    const now = new Date();
    return date < now;
  },

  // Checks if a date is today
  isToday(date) {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  },

  // Converts YYYY-MM-DD string to Date object
  parseDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  },
};
