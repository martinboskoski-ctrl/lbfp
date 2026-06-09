import Announcement from '../models/Announcement.js';
import { pushEditVersion } from '../models/editVersion.js';

const isTopMgmt = (u) => u.department === 'top_management';
const isManager = (u) => u.isManager || isTopMgmt(u);

const POPULATE = [
  { path: 'createdBy', select: 'name department' },
  { path: 'editHistory.editedBy', select: 'name' },
];

export const listAnnouncements = async (req, res) => {
  let filter = {};
  if (!isTopMgmt(req.user)) {
    filter = {
      $or: [
        { departments: { $size: 0 } },
        { departments: req.user.department },
      ],
    };
  }

  const announcements = await Announcement.find(filter)
    .populate(POPULATE)
    .sort({ pinned: -1, createdAt: -1 });

  res.json({ announcements });
};

export const createAnnouncement = async (req, res) => {
  if (!isManager(req.user)) {
    return res.status(403).json({ message: 'Само менаџери можат да објавуваат соопштенија' });
  }

  const { title, content, priority, pinned, departments } = req.body;
  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ message: 'Наслов и содржина се задолжителни' });
  }

  const announcement = await Announcement.create({
    title: title.trim(),
    content: content.trim(),
    priority: priority || 'info',
    pinned: !!pinned,
    departments: departments || [],
    createdBy: req.user._id,
  });
  await announcement.populate('createdBy', 'name department');
  res.status(201).json({ announcement });
};

export const markRead = async (req, res) => {
  const announcement = await Announcement.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { readBy: req.user._id } },
    { new: true }
  );
  if (!announcement) return res.status(404).json({ message: 'Not found' });
  res.json({ announcement });
};

export const togglePin = async (req, res) => {
  if (!isManager(req.user)) {
    return res.status(403).json({ message: 'Немате дозвола' });
  }
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ message: 'Not found' });
  announcement.pinned = !announcement.pinned;
  await announcement.save();
  await announcement.populate(POPULATE);
  res.json({ announcement });
};

// Author-only edit of title/content. Announcements are never locked (reading is not
// a blocking interaction) — each edit is recorded in editHistory.
export const editAnnouncement = async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ message: 'Not found' });

  if (String(announcement.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Можете да уредувате само свои соопштенија' });
  }

  const { title, content } = req.body;
  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ message: 'Наслов и содржина се задолжителни' });
  }

  pushEditVersion(announcement, { title: announcement.title, content: announcement.content }, req.user._id);
  announcement.title = title.trim();
  announcement.content = content.trim();
  await announcement.save();
  await announcement.populate(POPULATE);
  res.json({ announcement });
};

export const deleteAnnouncement = async (req, res) => {
  if (!isManager(req.user)) {
    return res.status(403).json({ message: 'Немате дозвола' });
  }
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ message: 'Not found' });
  await announcement.deleteOne();
  res.json({ message: 'Соопштението е избришано' });
};
