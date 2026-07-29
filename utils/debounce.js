export function debounce(func, delay) {
  let timeout;

  const debounced = (...args) => {
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      func(...args);
    }, delay);
  };

  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
  };

  return debounced;
}
