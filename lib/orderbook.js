const { RBTree } = require('bintrees');
const num = require('num');
const assert = require('assert');

class Orderbook {
  constructor() {
    this.reset();
  }

  _getTree(side) {
    return side === 'buy' ? this._bids : this._asks;
  }

  reset() {
    this._bids = new RBTree((a, b) => a.price.cmp(b.price));
    this._asks = new RBTree((a, b) => a.price.cmp(b.price));
  }

  state() {
    const book = { asks: [], bids: [] };

    this._bids.reach(bid => book.bids.push(...bid));
    this._asks.each(ask => book.asks.push(...ask));

    return book;
  }

  snapshot(data) {
    this.reset();

    data.bids
      .map(order => ({
        price: num(order[0]),
        size: num(order[1])
      }))
      .forEach(order => this.add('buy', order));

    data.asks
      .map(order => ({
        price: num(order[0]),
        size: num(order[1])
      }))
      .forEach(order => this.add('sell', order));
  }

  update(data) {
    const { changes } = data;
    const side = changes[0];
    const price = num(changes[1]);
    const size = num(changes[2]);

    const tree = this._getTree(side);
    const node = tree.find({ price });

    if (size.eq(num(0))) {
      if (node) {
        tree.remove(node);
      }
    }
    else {
      tree.insert({
        price,
        size
      });
    }
  }

  add(side, order) {
    const tree = this._getTree(side);
    const node = tree.find({ price: order.price });

    if (!node) {
      tree.insert(order);
    }
    else {
      node.size = order.size;
    }
  }
}

module.exports = exports = Orderbook;
