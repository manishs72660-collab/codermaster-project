const Doubt = require('../models/Doubt');
const Answer = require('../models/Answer');

// @desc    Create a new doubt
// @route   POST /api/doubts
// @access  Private
exports.createDoubt = async (req, res) => {
  try {
    const { title, description, codeSnippet, tags, relatedProblem } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const doubt = await Doubt.create({
      title,
      description,
      codeSnippet,
      tags: Array.isArray(tags) ? tags.map((t) => t.toLowerCase().trim()) : [],
      relatedProblem: relatedProblem || null,
      author: req.result._id,
    });

    res.status(201).json(doubt);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create doubt', error: err.message });
  }
};

// @desc    Get list of doubts (filter by tag, status; sort by recent/views/unanswered)
// @route   GET /api/doubts?tag=dp&status=open&sort=recent&page=1&limit=10
// @access  Public
exports.getDoubts = async (req, res) => {
  try {
    const { tag, status, search, sort = 'recent', page = 1, limit = 10 } = req.query;

    const filter = {};
    if (tag) filter.tags = tag.toLowerCase();
    if (status) filter.status = status;
    if (search) filter.$text = { $search: search };

    let sortOption = { createdAt: -1 }; // recent
    if (sort === 'views') sortOption = { views: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    const skip = (Number(page) - 1) * Number(limit);

    let doubts = await Doubt.find(filter)
      .populate('author', 'name username avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // attach answer counts (single aggregate call, avoids N+1 queries)
    const doubtIds = doubts.map((d) => d._id);
    const counts = await Answer.aggregate([
      { $match: { doubt: { $in: doubtIds } } },
      { $group: { _id: '$doubt', count: { $sum: 1 } } },
    ]);
    const countMap = counts.reduce((acc, c) => {
      acc[c._id.toString()] = c.count;
      return acc;
    }, {});
    doubts = doubts.map((d) => ({ ...d, answerCount: countMap[d._id.toString()] || 0 }));

    // optional: unanswered-first sort has to happen in memory since it's derived
    if (sort === 'unanswered') {
      doubts.sort((a, b) => a.answerCount - b.answerCount);
    }

    const total = await Doubt.countDocuments(filter);

    res.json({
      doubts,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch doubts', error: err.message });
  }
};

// @desc    Get single doubt with its answers
// @route   GET /api/doubts/:id
// @access  Public
exports.getDoubtById = async (req, res) => {
  try {
    const doubt = await Doubt.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name username avatar');

    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found' });
    }

    const answers = await Answer.find({ doubt: doubt._id })
      .populate('author', 'name username avatar')
      .sort({ isAccepted: -1, createdAt: -1 })
      .lean();

    // sort by upvote count within non-accepted answers
    answers.sort((a, b) => {
      if (a.isAccepted !== b.isAccepted) return b.isAccepted - a.isAccepted;
      return (b.upvotes?.length || 0) - (a.upvotes?.length || 0);
    });

    res.json({ doubt, answers });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch doubt', error: err.message });
  }
};

// @desc    Update own doubt
// @route   PATCH /api/doubts/:id
// @access  Private (author only)
exports.updateDoubt = async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });

    if (doubt.author.toString() !== req.result._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this doubt' });
    }

    const { title, description, codeSnippet, tags } = req.body;
    if (title) doubt.title = title;
    if (description) doubt.description = description;
    if (codeSnippet !== undefined) doubt.codeSnippet = codeSnippet;
    if (tags) doubt.tags = tags.map((t) => t.toLowerCase().trim());

    await doubt.save();
    res.json(doubt);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update doubt', error: err.message });
  }
};

// @desc    Delete own doubt (or admin)
// @route   DELETE /api/doubts/:id
// @access  Private (author or admin)
exports.deleteDoubt = async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });

    const isAuthor = doubt.author.toString() === req.result._id.toString();
    const isAdmin = req.result.role === 'admin';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this doubt' });
    }

    await Answer.deleteMany({ doubt: doubt._id });
    await doubt.deleteOne();

    res.json({ message: 'Doubt deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete doubt', error: err.message });
  }
};