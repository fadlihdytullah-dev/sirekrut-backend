const actionType = {
  RETRIEVING: "retrieving",
  ADDING: "adding",
  UPDATING: "updating",
  DELETING: "deleting"
};

const buildErrorMessage = (action, domain) =>
  `Something went wrong ${action} ${domain}`;

const buildResponseData = (success, message, data) => ({
  success,
  message,
  data
});

module.exports = { buildErrorMessage, buildResponseData, actionType };
