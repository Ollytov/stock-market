'use strict';

var _ = require('lodash');
var Stocks = require('./stocks.model');

// Get list of stockss
exports.index = function(req, res) {
  Stocks.find(function (err, stocks) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(stocks);
  });
};

// Get a single stocks
exports.show = function(req, res) {
  Stocks.findById(req.params.id, function (err, stocks) {
    if(err) { return handleError(res, err); }
    if(!stocks) { return res.status(404).send('Not Found'); }
    return res.json(stocks);
  });
};

// Creates a new stocks in the DB.
exports.create = function(req, res) {
  Stocks.create(req.body, function(err, stocks) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(stocks);
  });
};

// Updates an existing stocks in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Stocks.findById(req.params.id, function (err, stocks) {
    if (err) { return handleError(res, err); }
    if(!stocks) { return res.status(404).send('Not Found'); }
    var updated = _.merge(stocks, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(stocks);
    });
  });
};

// Deletes a stocks from the DB.
exports.destroy = function(req, res) {
  Stocks.findById(req.params.id, function (err, stocks) {
    if(err) { return handleError(res, err); }
    if(!stocks) { return res.status(404).send('Not Found'); }
    stocks.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}