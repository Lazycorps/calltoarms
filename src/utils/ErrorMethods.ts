export const displayAxiosError = (error: any): string => {
  if (error.response) {
    // Request made and server responded
    if (error.response?.data?.Message) {
      return error.response.data.Message;
    } else if (typeof error.response.data === 'string' || error.response.data instanceof String)
      return `Error, ${error.response.status} ${error.response.data}`;
    else return `Error, ${error.response.status} ${error.response.statusText}`;
  } else {
    // The request was made but no response was received
    return `${error.message}`;
  }
};
