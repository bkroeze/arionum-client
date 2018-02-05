module.exports = exports = {
  SEND_FEE_RATE: 0.0025,
  SEND_FEE_MAX: 10,
  SEND_FEE_MIN: 0.00000001,
  URLS: {
    API: '/api.php',
  },
  VERSION: '1',
  TIMEOUTS: {
    RESPONSE: 1000 * 15,  // Wait 15 seconds for the server to start sending
    DEADLINE: 1000 * 60 * 5, // but allow 5 minutes for the file to finish loading
    PEER_CACHE: 1000 * 60 * 5 // refresh cache every 5 minutes
  },
  ACTIONS: {
    BALANCE: 'getPendingBalance',
    BLOCK: 'currentBlock',
    TRANSACTION: 'getTransaction',
    TRANSACTIONS: 'getTransactions',
    SEND: 'send'
  }
}
