const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

let allItems = Array.from({ length: 1000000 }, (_, i) => i + 1);
let selectedItems = [];
let selectedOrder = [];

const addQueue = new Set();
const updateQueue = new Set();

setInterval(() => {
  if (addQueue.size > 0) {
    const toAdd = Array.from(addQueue);
    addQueue.clear();
    toAdd.forEach(id => {
      if (!allItems.includes(id)) {
        allItems.push(id);
      }
    });
  }
}, 10000);

setInterval(() => {
  if (updateQueue.size > 0) {
    updateQueue.clear();
  }
}, 1000);

app.get('/items', (req, res) => {
  const { filter } = req.query;
  const offset = Number(req.query.offset) || 0;
  const limit = Number(req.query.limit) || 20;

  console.debug(`[GET /items] offset=${offset} limit=${limit} filter=${filter || ''}`);

  let items = allItems.filter(id => !selectedItems.includes(id));
  if (filter) {
    items = items.filter(id => id.toString().includes(filter));
  }
  const paginated = items.slice(offset, offset + limit);
  res.json({ items: paginated, total: items.length });
});

app.get('/selected', (req, res) => {
  const { filter } = req.query;
  const offset = Number(req.query.offset) || 0;
  const limit = Number(req.query.limit) || 20;

  console.debug(`[GET /selected] offset=${offset} limit=${limit} filter=${filter || ''}`);

  let items = selectedOrder.map(id => ({ id, order: selectedOrder.indexOf(id) }));
  if (filter) {
    items = items.filter(item => item.id.toString().includes(filter));
  }
  const paginated = items.slice(offset, offset + limit);
  res.json({ items: paginated, total: items.length });
});

app.post('/add', (req, res) => {
  const { id } = req.body;
  if (id && !isNaN(id)) {
    addQueue.add(parseInt(id));
    res.json({ message: 'Added to queue' });
  } else {
    res.status(400).json({ error: 'Invalid ID' });
  }
});

app.post('/select', (req, res) => {
  const { id } = req.body;
  if (selectedItems.includes(id)) {
    selectedItems = selectedItems.filter(i => i !== id);
    selectedOrder = selectedOrder.filter(i => i !== id);
  } else {
    selectedItems.push(id);
    selectedOrder.push(id);
  }
  updateQueue.add('select');
  res.json({ selected: selectedItems, order: selectedOrder });
});

app.post('/reorder', (req, res) => {
  const { order } = req.body;
  selectedOrder = order;
  updateQueue.add('reorder');
  res.json({ order: selectedOrder });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));