import Client from '../models/Client.js';
import { pushEditVersion } from '../models/editVersion.js';

const isTopMgmt = (u) => u.department === 'top_management';
const isSales   = (u) => u.department === 'sales';
const isManager = (u) => u.isManager || isTopMgmt(u);
const hasAccess = (u) => isSales(u) || isTopMgmt(u);

const POPULATE = [
  { path: 'assignedTo', select: 'name department' },
  { path: 'createdBy',  select: 'name department' },
  { path: 'orders.createdBy',     select: 'name' },
  { path: 'orders.editHistory.editedBy', select: 'name' },
  { path: 'activities.createdBy', select: 'name' },
  { path: 'activities.editHistory.editedBy', select: 'name' },
];

// An author may edit their note until a newer activity by someone else exists.
const noteLockedForEdit = (activities, activity, userId) =>
  activities.some((a) =>
    String(a._id) !== String(activity._id) &&
    new Date(a.createdAt) > new Date(activity.createdAt) &&
    String(a.createdBy) !== String(userId)
  );

const ORDER_STATUSES  = ['forecast', 'confirmed', 'delivered', 'cancelled'];
const CLIENT_STATUSES = ['active', 'prospect', 'inactive'];

// GET /api/clients
export const listClients = async (req, res) => {
  try {
    const u = req.user;
    if (!hasAccess(u)) return res.status(403).json({ message: 'Немате пристап' });

    const clients = await Client.find({ department: 'sales' })
      .populate(POPULATE)
      .sort({ createdAt: -1 });

    res.json({ clients: clients.map((c) => c.toJSON()) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/clients
export const createClient = async (req, res) => {
  try {
    const u = req.user;
    if (!hasAccess(u)) return res.status(403).json({ message: 'Немате пристап' });

    const { companyName, contactName, email, phone, status, notes, assignedTo } = req.body;
    if (!companyName?.trim()) {
      return res.status(400).json({ message: 'Задолжително поле: компанија' });
    }

    // Non-managers can only assign to themselves
    const owner = isManager(u) ? (assignedTo || u._id) : u._id;

    const client = await Client.create({
      companyName: companyName.trim(),
      contactName: contactName || '',
      email: email || '',
      phone: phone || '',
      status: CLIENT_STATUSES.includes(status) ? status : 'active',
      notes: notes || '',
      assignedTo: owner,
      department: 'sales',
      createdBy: u._id,
    });

    await client.populate(POPULATE);
    res.status(201).json({ client: client.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/clients/:id
export const updateClient = async (req, res) => {
  try {
    const u = req.user;
    if (!hasAccess(u)) return res.status(403).json({ message: 'Немате пристап' });

    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Клиентот не е пронајден' });

    if (!isManager(u) && client.assignedTo.toString() !== u._id.toString()) {
      return res.status(403).json({ message: 'Можете да уредувате само свои клиенти' });
    }

    const oldStatus = client.status;

    const allowed = ['companyName', 'contactName', 'email', 'phone', 'status', 'notes'];
    if (isManager(u)) allowed.push('assignedTo');

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) client[key] = req.body[key];
    });

    // Record a status change in the activity log.
    if (req.body.status !== undefined && req.body.status !== oldStatus) {
      client.activities.push({
        type: 'status_change',
        text: `Статус: ${oldStatus} → ${client.status}`,
        createdBy: u._id,
      });
    }

    await client.save();
    await client.populate(POPULATE);
    res.json({ client: client.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/clients/:id
export const deleteClient = async (req, res) => {
  try {
    const u = req.user;
    if (!isManager(u)) {
      return res.status(403).json({ message: 'Само менаџери можат да бришат клиенти' });
    }

    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Клиентот не е пронајден' });

    await client.deleteOne();
    res.json({ message: 'Клиентот е избришан' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/clients/:id/orders
export const addOrder = async (req, res) => {
  try {
    const u = req.user;
    if (!hasAccess(u)) return res.status(403).json({ message: 'Немате пристап' });

    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Клиентот не е пронајден' });

    const { description, forecastEUR, itemCount, status, orderDate } = req.body;

    client.orders.push({
      description: description || '',
      forecastEUR: Number(forecastEUR) || 0,
      itemCount: Number(itemCount) || 0,
      status: ORDER_STATUSES.includes(status) ? status : 'forecast',
      orderDate: orderDate || Date.now(),
      createdBy: u._id,
    });

    await client.save();
    await client.populate(POPULATE);
    res.status(201).json({ client: client.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/clients/:id/orders/:orderId
export const updateOrder = async (req, res) => {
  try {
    const u = req.user;
    if (!hasAccess(u)) return res.status(403).json({ message: 'Немате пристап' });

    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Клиентот не е пронајден' });

    const order = client.orders.id(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Нарачката не е пронајдена' });

    // Editing the order's content (vs. just advancing its status) is author-only and
    // locked once the order is delivered; each content edit is recorded in history.
    const CONTENT_FIELDS = ['description', 'forecastEUR', 'itemCount', 'orderDate'];
    const isContentEdit = CONTENT_FIELDS.some((f) => req.body[f] !== undefined);
    if (isContentEdit) {
      if (String(order.createdBy) !== String(u._id)) {
        return res.status(403).json({ message: 'Можете да уредувате само свои нарачки' });
      }
      if (order.status === 'delivered') {
        return res.status(409).json({ message: 'Испорачана нарачка не може да се измени' });
      }
      pushEditVersion(order, {
        description: order.description,
        forecastEUR: order.forecastEUR,
        itemCount:   order.itemCount,
        status:      order.status,
      }, u._id);
    }

    if (req.body.description !== undefined) order.description = req.body.description;
    if (req.body.forecastEUR !== undefined) order.forecastEUR = Number(req.body.forecastEUR) || 0;
    if (req.body.itemCount   !== undefined) order.itemCount   = Number(req.body.itemCount) || 0;
    if (req.body.orderDate   !== undefined) order.orderDate   = req.body.orderDate || order.orderDate;
    if (req.body.status !== undefined && ORDER_STATUSES.includes(req.body.status)) {
      order.status = req.body.status;
    }

    await client.save();
    await client.populate(POPULATE);
    res.json({ client: client.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/clients/:id/orders/:orderId
export const deleteOrder = async (req, res) => {
  try {
    const u = req.user;
    if (!hasAccess(u)) return res.status(403).json({ message: 'Немате пристап' });

    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Клиентот не е пронајден' });

    const order = client.orders.id(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Нарачката не е пронајдена' });

    order.deleteOne();
    await client.save();
    await client.populate(POPULATE);
    res.json({ client: client.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/clients/:id/activities
export const addActivity = async (req, res) => {
  try {
    const u = req.user;
    if (!hasAccess(u)) return res.status(403).json({ message: 'Немате пристап' });

    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Клиентот не е пронајден' });

    const { type, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Текстот е задолжителен' });

    client.activities.push({ type: type || 'note', text: text.trim(), createdBy: u._id });
    await client.save();
    await client.populate(POPULATE);
    res.json({ client: client.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/clients/:id/activities/:activityId — author edits their own note
export const editActivity = async (req, res) => {
  try {
    const u = req.user;
    if (!hasAccess(u)) return res.status(403).json({ message: 'Немате пристап' });

    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Клиентот не е пронајден' });

    const activity = client.activities.id(req.params.activityId);
    if (!activity) return res.status(404).json({ message: 'Активноста не е пронајдена' });
    if (activity.type !== 'note') {
      return res.status(403).json({ message: 'Само белешки можат да се уредуваат' });
    }
    if (String(activity.createdBy) !== String(u._id)) {
      return res.status(403).json({ message: 'Можете да уредувате само свои белешки' });
    }
    if (noteLockedForEdit(client.activities, activity, u._id)) {
      return res.status(409).json({ message: 'Не може повеќе да се измени' });
    }

    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Текстот е задолжителен' });

    pushEditVersion(activity, { text: activity.text }, u._id);
    activity.text = text.trim();
    await client.save();
    await client.populate(POPULATE);
    res.json({ client: client.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
