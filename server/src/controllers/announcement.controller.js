import Announcement from '../models/Announcement.js';

const isTopMgmt = (u) => u.department === 'top_management';

export const listAnnouncements = async (req, res) => {
  const announcements = await Announcement.find()
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ announcements });
};

export const createAnnouncement = async (req, res) => {
  if (!isTopMgmt(req.user)) {
    return res.status(403).json({ message: 'Само топ менаџментот може да објавува соопштенија' });
  }
  const { content } = req.body;
  if (!content?.trim()) {
    return res.status(400).json({ message: 'Содржината е задолжителна' });
  }
  const announcement = await Announcement.create({
    content: content.trim(),
    createdBy: req.user._id,
  });
  await announcement.populate('createdBy', 'name');
  res.status(201).json({ announcement });
};

export const deleteAnnouncement = async (req, res) => {
  if (!isTopMgmt(req.user)) {
    return res.status(403).json({ message: 'Немате дозвола' });
  }
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ message: 'Not found' });
  await announcement.deleteOne();
  res.json({ message: 'Соопштението е избришано' });
};
