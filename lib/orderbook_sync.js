const WebsocketClient = require('./clients/websocket.js');
const PublicClient = require('./clients/public.js');
const Orderbook = require('./orderbook.js');

// Orderbook syncing
class OrderbookSync extends WebsocketClient {
  constructor(
    productIDs,
    apiURI = 'https://api.gdax.com',
    websocketURI = 'wss://ws-feed.gdax.com',
    authenticatedClient = null,
    { channels = ['level2', 'heartbeat'] } = {}
  ) {
    let auth = null;
    if (authenticatedClient) {
      auth = {
        key: authenticatedClient.key,
        secret: authenticatedClient.b64secret,
        passphrase: authenticatedClient.passphrase,
      };
    }

    super(productIDs, websocketURI, auth, { channels });
    this.apiURI = apiURI;
    this.authenticatedClient = authenticatedClient;

    this.books = {};

    this.productIDs.forEach(productID => {
      this.books[productID] = new Orderbook();
    });
  }

  onMessage(data) {
    data = JSON.parse(data);
    this.emit('message', data);

    this.processMessage(data);
  }

  processMessage(data) {
    const { product_id, type } = data;

    const book = this.books[product_id];

    switch (data.type) {
      case 'snapshot':
        book.snapshot(data);
        break;

      case 'l2update':
        book.update(data);
        break;
    }

    this.emit('process', data);
  }
}

module.exports = exports = OrderbookSync;
