const Answer = require('../models/answer');
const Doubt = require('../models/doubt');

// @desc    Post an answer to a doubt
// @route   POST /api/doubts/:id/answers
// @access  Private
exports.createAnswer = async (req, res) => {
  try {
    const { content, codeSnippet } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Answer content is required' });
    }

    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });

    const answer = await Answer.create({
      doubt: doubt._id,
      content,
      codeSnippet,
      author: req.result._id,
    });

    const populated = await answer.populate('author', 'name username avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to post answer', error: err.message });
  }
};

// @desc    Toggle upvote on an answer
// @route   PATCH /api/answers/:id/upvote
// @access  Private
exports.toggleUpvote = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    const userId = req.result._id.toString();
    const alreadyUpvoted = answer.upvotes.some((id) => id.toString() === userId);

    if (alreadyUpvoted) {
      answer.upvotes = answer.upvotes.filter((id) => id.toString() !== userId);
    } else {
      answer.upvotes.push(req.result._id);
    }

    await answer.save();
    res.json({ upvoteCount: answer.upvotes.length, upvoted: !alreadyUpvoted });
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle upvote', error: err.message });
  }
};

// @desc    Mark an answer as accepted (only doubt's author can do this)
// @route   PATCH /api/answers/:id/accept
// @access  Private (doubt author only)
exports.acceptAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    const doubt = await Doubt.findById(answer.doubt);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });

    if (doubt.author.toString() !== req.result._id.toString()) {
      return res.status(403).json({ message: 'Only the doubt author can accept an answer' });
    }

    // unset any previously accepted answer for this doubt
    await Answer.updateMany({ doubt: doubt._id }, { $set: { isAccepted: false } });

    answer.isAccepted = true;
    await answer.save();

    doubt.acceptedAnswer = answer._id;
    doubt.status = 'resolved';
    await doubt.save();

    res.json({ message: 'Answer marked as accepted', answer });
  } catch (err) {
    res.status(500).json({ message: 'Failed to accept answer', error: err.message });
  }
};

// @desc    Delete own answer (or admin)
// @route   DELETE /api/answers/:id
// @access  Private (author or admin)
exports.deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    const isAuthor = answer.author.toString() === req.result._id.toString();
    const isAdmin = req.result.role === 'admin';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this answer' });
    }

    // if this was the accepted answer, reopen the doubt
    if (answer.isAccepted) {
      await Doubt.findByIdAndUpdate(answer.doubt, {
        $set: { status: 'open', acceptedAnswer: null },
      });
    }

    await answer.deleteOne();
    res.json({ message: 'Answer deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete answer', error: err.message });
  }
};