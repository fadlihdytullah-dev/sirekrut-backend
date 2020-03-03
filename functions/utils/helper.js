const buildErrorMessage = (action, context) =>
  `Something went wrong ${action} ${context}`;

const buildResponseData = (success, errors, data) => ({
  success,
  errors,
  data
});

const getErrorListFromValidator = errors => {
  if (!errors.isEmpty()) {
    const result = errors
      .array({ onlyFirstError: true })
      .map(({ msg: message, param: location }) => ({
        message,
        location
      }));

    return { errorList: result };
  }

  return false;
};

module.exports = {
  buildErrorMessage,
  buildResponseData,
  getErrorListFromValidator
};
