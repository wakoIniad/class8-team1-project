const getCookie = (name) => {
  if (document.cookie && document.cookie !== '') {
    for (const cookie of document.cookie.split(';')) {
      const [key, value] = cookie.trim().split('=')
      if (key === name) {
        return decodeURIComponent(value);
      }
    }
  }
  console.warn('cookieが無効です')
  return '';
}

const setCookie = (key, value)=> {
    if (document.cookie && document.cookie !== '') {
      document.cookie = `${key}=${value}`;
    }
    console.warn('cookieが無効です')
    return '';
}